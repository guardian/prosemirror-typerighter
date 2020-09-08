import { Node, Mark } from "prosemirror-model";
import { Transaction } from "prosemirror-state";
import { ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";
import * as jsDiff from "diff";

import { IBlock } from "../interfaces/IMatch";
import { createBlock } from "./block";

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
    result.push({ node: child, parent, pos });
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
export const getBlocksFromDocument = (doc: Node, time = 0): IBlock[] => {
  const ranges = [] as IBlock[];
  doc.descendants((descNode, pos) => {
    if (!findChildren(descNode, _ => _.type.isBlock, false).length) {
      ranges.push(
        createBlock(
          doc,
          {
            from: pos + 1,
            to: pos + descNode.nodeSize
          },
          time
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
export const getReplaceStepRangesFromTransaction = (tr: Transaction) =>
  getReplaceTransactions(tr).map((step: ReplaceStep | ReplaceAroundStep) => {
    return {
      from: (step as any).from,
      to: (step as any).to
    };
  });

/**
 * Get all of the ranges of any replace steps in the given transaction.
 */
export const getReplaceTransactions = (tr: Transaction) =>
  tr.steps.filter(
    step => step instanceof ReplaceStep || step instanceof ReplaceAroundStep
  );

interface ISuggestionFragment {
  text: string;
  marks: Array<Mark<any>>;
  from: number;
  to: number;
}

/**
 * Generates a minimal array of replacement nodes and ranges from two pieces of text.
 * This lets us make the smallest change to the document possible given a replacement,
 * which gives us a better chance of preserving marks sensibly.
 *
 * Preserves marks that span the entirety of the text to be replaced.
 */
export const getReplacementFragmentsFromReplacement = (
  tr: Transaction,
  from: number,
  to: number,
  replacement: string
): ISuggestionFragment[] => {
  const mappedFrom = tr.mapping.map(from);
  const mappedTo = tr.mapping.map(to);
  const currentText = tr.doc.textBetween(mappedFrom, mappedTo);
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
      const $from = tr.doc.resolve(mappedFrom + currentPos);
      const $to = tr.doc.resolve(Math.min($from.pos + patch.count, tr.doc.nodeSize - 2));

      // If this patch removes chars, create a fragment for
      // the range, and leave the cursor where it is.
      if (patch.removed) {
        return {
          fragments: currentFragments.concat({
            from: $from.pos,
            to: $to.pos,
            text: "",
            marks: []
          }),
          currentPos
        };
      }

      const prevFragment = currentFragments[currentFragments.length - 1];
      const isThisPatchNew =
        !!prevFragment && (prevFragment.to || 0) < $from.pos;

      let marks;
      if (isThisPatchNew) {
        // If this patch adds characters and the previous patch did not affect the
        // text, inherit the marks from the last character of that patch's range.
        // This ensures that text that expands upon an existing range shares the
        // existing range's style.
        const $lastCharFrom = tr.doc.resolve($from.pos - 1);
        marks = $lastCharFrom.marksAcross($from) || Mark.none;
      } else {
        // If this patch adds characters, find all of the marks
        // that span the text we're replacing, and copy them across.
        marks = $from.marksAcross($to) || Mark.none;
      }

      const newFragment = {
        text: patch.value,
        marks,
        from: $from.pos,
        to: $to.pos
      };

      return {
        fragments: currentFragments.concat(newFragment),
        currentPos: currentPos + patch.count
      };
    },
    {
      fragments: [] as ISuggestionFragment[],
      currentPos: 0
    }
  );

  return fragments;
};
