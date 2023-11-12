import { Node, Mark, Schema, MarkType } from "prosemirror-model";
import { Transaction } from "prosemirror-state";
import { Change, ChangeSet } from "prosemirror-changeset";
import * as jsDiff from "diff";

import { IBlockWithIgnoredRanges, IRange } from "../interfaces/IMatch";
import { createBlock, doNotIgnoreRanges, GetIgnoredRanges } from "./block";

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
  // Why a function? We must evaluate getMarks at the point at which the patch
  // is applied to the document, not when it's first created. This ensures that
  // positions stored in a patch correctly map to the document, even after previous
  // patches have altered it.
  getMarks: (tr: Transaction) => Array<Mark>;
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

      const prevFragment = currentFragments[currentFragments.length - 1];
      const isInsertionThatFollowsUnalteredRange =
        !!prevFragment && (prevFragment.to || 0) < newFrom;

      let getMarks;
      if (isInsertionThatFollowsUnalteredRange) {
        // If this patch is an insertion that follows an unaltered range, inherit the marks
        // from the character that precedes this patch. This ensures that text that expands
        // upon an existing range shares the existing range's style.
        getMarks = (localTr: Transaction) => {
          const $newFrom = localTr.doc.resolve(newFrom);
          const $lastCharFrom = localTr.doc.resolve(newFrom - 1);
          return $lastCharFrom.marksAcross($newFrom) || Mark.none;
        };
      } else {
        // If this patch is a replacement, find all of the marks
        // that span the text we're replacing, and copy them across.
        getMarks = (localTr: Transaction) => {
          const $newTo = localTr.doc.resolve(newTo);
          return localTr.doc.resolve(newFrom).marksAcross($newTo) || Mark.none;
        };
      }

      const newFragment: ISuggestionPatchInsert = {
        type: "INSERT",
        text: patch.value,
        getMarks,
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

/**
 * Apply a suggestion fragment to a transaction.
 *
 * Mutates the given transaction.
 */
export const applyPatchToTransaction = (
  tr: Transaction,
  schema: Schema<any>,
  patch: ISuggestionPatch
) => {
  if (patch.type === "INSERT") {
    const marks = patch.getMarks(tr);
    const node = schema.text(patch.text, marks);
    return tr.insert(patch.from, node);
  }
  tr.delete(patch.from, patch.to);
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
