import { Node, Mark, Schema, MarkType } from "prosemirror-model";
import { Transaction } from "prosemirror-state";
import { Change, ChangeSet } from "prosemirror-changeset";
import * as jsDiff from "diff";

import { IBlockWithIgnoredRanges, IRange } from "../interfaces/IMatch";
import { createBlock, doNotIgnoreRanges, GetIgnoredRanges } from "./block";
import { isPosWithinRange } from "./range";

export const MarkTypes = {
  legal: "legal",
  warn: "warn"
};

/**
 * Flatten a node and its children into a single array of objects, containing
 * the node and the node's position in the document.
 */
export const flatten = (node: Node, descend = true) => {
  const result: Array<{ node: Node; parent: Node; pos: number }> = [];
  node.descendants((child, pos, parent) => {
    if (parent) {
      result.push({ node: child, parent, pos });
    }
    if (!descend) {
      return false;
    }
  });
  return result;
};

/**
 * Find all children in a node that satisfy the given predicate.
 */
export const findChildren = (
  node: Node,
  predicate: (node: Node) => boolean,
  descend: boolean
): Array<{ node: Node; parent: Node; pos: number }> => {
  return flatten(node, descend).filter(child => predicate(child.node));
};

/**
 * Create IBlock objects from the block leaf nodes of a given document.
 */
export const getBlocksFromDocument = (
  doc: Node,
  time = 0,
  getIgnoredRanges: GetIgnoredRanges = doNotIgnoreRanges
): IBlockWithIgnoredRanges[] => {
  const ranges = [] as IBlockWithIgnoredRanges[];
  doc.descendants((descNode, pos) => {
    if (!findChildren(descNode, _ => _.type.isBlock, false).length) {
      ranges.push(
        createBlock(
          doc,
          {
            from: pos + 1,
            to: pos + descNode.nodeSize
          },
          time,
          getIgnoredRanges
        )
      );
      return false;
    }
  });
  return ranges;
};

/**
 * Get all of the ranges of any replace steps in the given transaction.
 */
export const getDirtiedRangesFromTransaction = (
  oldDoc: Node,
  tr: Transaction
) => {
  const changeSet: ChangeSet = ChangeSet.create(oldDoc).addSteps(tr.doc, tr.mapping.maps, null);
  return changeSet.changes.map((change: Change) => ({
    from: change.fromB,
    to: change.toB
  }));
};

/**
 * A patch representing part, or all, of a suggestion, to apply to the document.
 *
 * Patches must be applied in order, as they represent a sequence of insertions
 * and deletions, and the positions indicated by a later patch will be dependent
 * on earlier patches.
 */
interface IBaseSuggestionPatch {
  from: number;
  to: number;
}

interface ISuggestionPatchDelete extends IBaseSuggestionPatch {
  type: "DELETE";
}

interface ISuggestionPatchInsert extends IBaseSuggestionPatch {
  type: "INSERT";
  text: string;
}

type ISuggestionPatch = ISuggestionPatchInsert | ISuggestionPatchDelete;

/**
 * Generates a minimal array of replacement nodes and ranges from two pieces of text.
 * This lets us make the smallest change to the document possible given a replacement,
 * which gives us a better chance of preserving marks sensibly.
 *
 * Preserves marks that span the entirety of the text to be replaced.
 */
export const getPatchesFromReplacementText = (
  tr: Transaction,
  from: number,
  to: number,
  replacement: string
): ISuggestionPatch[] => {
  const currentText = tr.doc.textBetween(from, to);
  const patches = jsDiff.diffChars(currentText, replacement, {
    ignoreCase: false
  });

  const { fragments } = patches.reduce(
    ({ fragments: currentFragments, currentPos }, patch) => {
      // If there are no chars, ignore.
      if (!patch.count) {
        return {
          fragments: currentFragments,
          currentPos
        };
      }

      // If this patch hasn't changed anything, ignore it and
      // increment the count.
      if (!patch.added && !patch.removed) {
        return {
          fragments: currentFragments,
          currentPos: currentPos + patch.count
        };
      }

      const newFrom = from + currentPos;
      const newTo = newFrom + patch.count;

      // If this patch removes chars, create a fragment for
      // the range, and leave the cursor where it is.
      if (patch.removed) {
        const fragment: ISuggestionPatchDelete = {
          from: newFrom,
          to: newTo,
          type: "DELETE"
        };

        return {
          fragments: currentFragments.concat(fragment),
          currentPos
        };
      }

      const newFragment: ISuggestionPatchInsert = {
        type: "INSERT",
        text: patch.value,
        from: newFrom,
        to: newTo
      };

      return {
        fragments: currentFragments.concat(newFragment),
        currentPos: currentPos + patch.count
      };
    },
    {
      fragments: [] as ISuggestionPatch[],
      currentPos: 0
    }
  );

  return fragments;
};

export const getFirstMatchingChar = (str1: string, str2: string) => {
  for (let i = 0; i < str1.length; i++) {
    if (str1[i] === str2[0]) return i;
  }

  return 0;
}

/**
 * Apply a suggestion fragment to a transaction.
 *
 * Mutates the given transaction.
 */
export const applyPatchesToTransaction = (
  patches: ISuggestionPatch[],
  _ranges: IRange[],
  tr: Transaction,
  schema: Schema<any>
) => {
  // We reference this when figuring out whether marks should be applied to new insertions.
  const docBeforeEdits = tr.doc;
  const rangesToIgnore = _ranges
    .flatMap((_, index) =>
      index < _ranges.length - 1
        ? [{ from: _ranges[index].to, to: _ranges[index + 1].from }]
        : [])

  patches.forEach((patch, index) => {
    if (patch.type === "DELETE") {
      tr.delete(patch.from, patch.to);
      return;
    }

    const node = schema.text(patch.text);
    tr.insert(patch.from, node);

    const mapToDocBeforeEdits = tr.mapping.invert();
    const prevFragment = patches[index - 1];
    const isInsertionThatFollowsUnalteredRange =
      !!prevFragment
      && (prevFragment.to || 0) < patch.from
      && !rangesToIgnore.some(range => isPosWithinRange(mapToDocBeforeEdits.map(patch.from, -1), range))


    const fromOffset = isInsertionThatFollowsUnalteredRange ? -1 : 0;
    const $beforeEditFrom = docBeforeEdits.resolve(mapToDocBeforeEdits.map(patch.from, -1) + fromOffset);
    const $beforeEditTo = docBeforeEdits.resolve(mapToDocBeforeEdits.map(patch.to, 1));

    const marks: Mark[] = $beforeEditFrom.marksAcross($beforeEditTo) || Mark.none;

    marks.forEach(mark => tr.addMark(patch.from, patch.to, mark));
  });
};

/**
 * Return the ranges covered by the given mark.
 */
export const findMarkPositions = (
  docNode: Node,
  from: number,
  to: number,
  mark: MarkType | Mark
): IRange[] => {
  const matched: Array<{
    from: number;
    to: number;
    step?: number;
    style?: Mark;
  }> = [];
  let step = 0;
  docNode.nodesBetween(from, to, (node, pos) => {
    if (!node.isInline) {
      return;
    }
    step++;
    let toRemove = null;
    if (mark instanceof MarkType) {
      const found = mark.isInSet(node.marks);
      if (found) {
        toRemove = [found];
      }
    } else if (mark) {
      if (mark.isInSet(node.marks)) {
        toRemove = [mark];
      }
    } else {
      toRemove = node.marks;
    }
    if (toRemove && toRemove.length) {
      const end = Math.min(pos + node.nodeSize, to);
      for (let i = 0; i < toRemove.length; i++) {
        const style = toRemove[i];
        let found;
        for (let j = 0; j < matched.length; j++) {
          const m = matched[j];
          if (
            m.step === step - 1 &&
            matched[j].style &&
            style.eq(matched[j].style!)
          ) {
            found = m;
          }
        }
        if (found) {
          found.to = end;
          found.step = step;
        } else {
          matched.push({ from: Math.max(pos, from), to: end - 1 });
        }
      }
    }
  });
  return matched.map(match => ({ from: match.from, to: match.to }));
};

/**
 * Does the given node contain any text content?
 *
 * Necessary to roll our own, as there's not a ProseMirror-native function that
 * will return early once text is found, and a complete traversal through a
 * large document would be inefficient.
 */
export const nodeContainsText = (node: Node): boolean => {
  if (node.isText) {
    return true;
  }

  let hasText = false;

  for (let i = 0; hasText === false && i < node.content.childCount; i++) {
    const child = node.content.maybeChild(i) as Node;
    hasText = nodeContainsText(child);
  }

  return hasText;
}
