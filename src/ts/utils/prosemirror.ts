import { Node } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';
import { ReplaceAroundStep, ReplaceStep } from 'prosemirror-transform';
import { IValidationInput } from '../interfaces/IValidation';

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

export const createValidationInputsForDocument = (node: Node): IValidationInput[] => {
  const ranges = [] as IValidationInput[];
  node.descendants((descNode, pos) => {
    if (!findChildren(descNode, _ => _.type.isBlock, false).length) {
      ranges.push({
        inputString: descNode.textContent,
        from: pos + 1,
        to: pos + descNode.nodeSize
      })
      return false;
    }
  });
  return ranges;
}

/**
 * Get all of the ranges of any replace steps in the given transaction.
 */
export const getReplaceStepRangesFromTransaction = (tr: Transaction) =>
  getReplaceTransactions(tr).map((step: ReplaceStep | ReplaceAroundStep) => ({
    from: (step as any).from,
    to: (step as any).to
  }));

/**
 * Get all of the ranges of any replace steps in the given transaction.
 */
export const getReplaceTransactions = (tr: Transaction) =>
  tr.steps.filter(
    step => step instanceof ReplaceStep || step instanceof ReplaceAroundStep
  );