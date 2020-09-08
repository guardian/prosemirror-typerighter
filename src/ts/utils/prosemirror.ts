import { Node, Mark, Schema } from "prosemirror-model";
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
  // Why a function? Evaluating getMarks is delayed because it must be invoked
  // after the previous fragments are applied to the transaction, to ensure that
  // it resolves its positions correctly.
  getMarks?: (tr: Transaction) => Array<Mark<any>>;
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
        const fragment = {
          from: newFrom,
          to: newTo,
          text: ""
        };

        return {
          fragments: currentFragments.concat(fragment),
          currentPos
        };
      }

      const prevFragment = currentFragments[currentFragments.length - 1];
      const isInsertion = !!prevFragment && (prevFragment.to || 0) < newFrom;

      let getMarks;
      if (isInsertion) {
        // If this patch is an insertion, inherit the marks from the last character
        // of that patch's range. This ensures that text that expands upon an existing
        // range shares the existing range's style.
        getMarks = (localTr: Transaction) => {
          const $newFrom = localTr.doc.resolve(newFrom)
          const $lastCharFrom = localTr.doc.resolve(newFrom - 1);
          return $lastCharFrom.marksAcross($newFrom) || Mark.none;
        };
      } else {
        // If this patch is a replacement, find all of the marks
        // that span the text we're replacing, and copy them across.
        getMarks = (localTr: Transaction) => {
          const $newTo = localTr.doc.resolve(newTo)
          return localTr.doc.resolve(newFrom).marksAcross($newTo) || Mark.none;
        }
      }

      const newFragment = {
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
      fragments: [] as ISuggestionFragment[],
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
export const applyFragmentToTransaction = (
  tr: Transaction,
  schema: Schema<any>,
  { text, from, to, getMarks }: ISuggestionFragment
) => {
  if (text) {
    const marks = getMarks ? getMarks(tr) : []
    const node = schema.text(text, marks);
    return tr.insert(from, node);
  }
  tr.delete(from, to);
};
