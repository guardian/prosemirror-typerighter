import { Range, ValidationResponse, ValidationOutput } from "../interfaces/Validation";
import { ValidationInput } from "../interfaces/Validation";
import { Node } from "prosemirror-model";
import { findParentNode } from "prosemirror-utils";
import { Selection, Transaction } from "prosemirror-state";
import clamp from "lodash/clamp";
import compact from "lodash/compact";
import { getReplaceStepRangesFromTransaction } from "./prosemirror";

export const findOverlappingRangeIndex = (range: Range, ranges: Range[]) => {
  return ranges.findIndex(
    localRange =>
      // Overlaps to the left of the range
      (localRange.from <= range.from && localRange.to >= range.from) ||
      // Overlaps within the range
      (localRange.to >= range.to && localRange.from <= range.to) ||
      // Overlaps to the right of the range
      (localRange.from >= range.from && localRange.to <= range.to)
  );
};

export const getMergedDirtiedRanges = (tr: Transaction, oldRanges: Range[]) =>
  mergeRanges(
    oldRanges
      .map(range => ({
        from: tr.mapping.map(range.from),
        to: tr.mapping.map(range.to)
      }))
      .concat(getReplaceStepRangesFromTransaction(tr))
  );

/**
 * Return the first set of ranges with any members overlapping the second set removed.
 */
export const removeOverlappingRanges = <T extends Range>(
  firstRanges: T[],
  secondRanges: T[]
) => {
  return firstRanges.reduce(
    (acc, range) => {
      return findOverlappingRangeIndex(range, secondRanges) === -1
        ? acc.concat(range)
        : acc;
    },
    [] as T[]
  );
};

export const mergeRange = (range1: Range, range2: Range): Range => ({
  from: range1.from < range2.from ? range1.from : range2.from,
  to: range1.to > range2.to ? range1.to : range2.to
});

export const mergeRanges = (ranges: Range[]): Range[] =>
  ranges.reduce(
    (acc, range) => {
      const index = findOverlappingRangeIndex(range, acc);
      if (index === -1) {
        return acc.concat(range);
      }
      const newRange = acc.slice();
      newRange.splice(index, 1, mergeRange(range, acc[index]));
      return newRange;
    },
    [] as Range[]
  );

/**
 * Return the first set of ranges with any overlaps removed.
 */
export const diffRanges = (
  firstRanges: Range[],
  secondRanges: Range[]
): Range[] => {
  const firstRangesMerged = mergeRanges(firstRanges);
  const secondRangesMerged = mergeRanges(secondRanges);
  return firstRangesMerged.reduce(
    (acc, range) => {
      const overlap = findOverlappingRangeIndex(range, secondRangesMerged);
      if (overlap === -1) {
        return acc.concat(range);
      }
      const overlappingRange = secondRangesMerged[overlap];
      const firstShortenedRange = {
        from: range.from,
        to: secondRangesMerged[overlap].from
      };
      // If the compared range overlaps our range completely, chop the end off...
      if (overlappingRange.to >= range.to) {
        // (ranges of 0 aren't valid)
        return firstShortenedRange.from === firstShortenedRange.to
          ? acc
          : acc.concat(firstShortenedRange);
      }
      // ... else, split the range and diff the latter segment recursively.
      return acc.concat(
        firstShortenedRange,
        diffRanges(
          [
            {
              from: overlappingRange.to + 1,
              to: range.to
            }
          ],
          secondRangesMerged
        )
      );
    },
    [] as Range[]
  );
};

export const validationInputToRange = (input: ValidationInput): Range => ({
  from: input.from,
  to: input.to
});

export const mergeOutputsFromValidationResponse = (
  response: ValidationResponse,
  currentOutputs: ValidationOutput[],
  trs: Transaction[]
): ValidationOutput[] => {
  const initialTransaction = trs.find(tr => tr.time === parseInt(response.id));
  if (!initialTransaction && trs.length > 1) {
    return currentOutputs;
  }

  const newOutputs = mapRangeThroughTransactions(
    response.validationOutputs,
    parseInt(response.id),
    trs
  );

  return removeOverlappingRanges(currentOutputs, newOutputs).concat(newOutputs);
};

/**
 * Expand a range in a document to encompass the words adjacent to the range.
 */
export const expandRange = (range: Range, doc: Node): Range | undefined => {
  try {
    const $fromPos = doc.resolve(range.from);
    const $toPos = doc.resolve(range.to);
    const parentNode = findParentNode(node => node.isBlock)(
      new Selection($fromPos, $toPos)
    );
    if (!parentNode) {
      return undefined;
    }
    return {
      from: parentNode.start,
      to: parentNode.start + parentNode.node.textContent.length
    };
  } catch (e) {
    return undefined;
  }
};

/**
 * Expand the given ranges to include their parent block nodes.
 */
export const getRangesOfParentBlockNodes = (ranges: Range[], doc: Node) => {
  const validationRanges = ranges.reduce(
    (acc, range: Range) => {
      const expandedRange = expandRange(
        { from: range.from, to: range.to },
        doc
      );
      return acc.concat(
        expandedRange
          ? [
              {
                from: expandedRange.from,
                to: clamp(expandedRange.to, doc.content.size)
              }
            ]
          : []
      );
    },
    [] as Range[]
  );
  return mergeRanges(validationRanges);
};

export const mapRangeThroughTransactions = <T extends Range>(
  ranges: T[],
  time: number,
  trs: Transaction[]
): T[] =>
  compact(
    ranges.map(range => {
      const initialTransactionIndex = trs.findIndex(tr => tr.time === time);
      // If we only have a single transaction in the history, we're dealing with
      // an unaltered document, and so there's no mapping to do.
      if (trs.length === 1) {
        return range;
      }

      if (initialTransactionIndex === -1) {
        return undefined;
      }

      return Object.assign(range, {
        ...trs.slice(initialTransactionIndex).reduce(
          (acc, tr) => ({
            from: tr.mapping.map(acc.from),
            to: tr.mapping.map(acc.to)
          }),
          range
        )
      });
    })
  );
