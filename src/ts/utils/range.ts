import clamp from "lodash/clamp";
import compact from "lodash/compact";
import { Node } from "prosemirror-model";
import { Transaction, TextSelection } from "prosemirror-state";
import { findParentNode } from "prosemirror-utils";
import {
  IRange,
  IValidationOutput,
  IValidationResponse
} from "../interfaces/IValidation";
import { IValidationInput } from "../interfaces/IValidation";

export const findOverlappingRangeIndex = (range: IRange, ranges: IRange[]) => {
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

export const mapAndMergeRanges = (tr: Transaction, ranges: IRange[]) =>
  mergeRanges(mapRanges(tr, ranges));

export const mapRanges = <T extends IRange>(
  tr: Transaction,
  ranges: T[]
): T[] =>
  ranges.map(range => ({
    ...range,
    from: tr.mapping.map(range.from),
    to: tr.mapping.map(range.to)
  }));

/**
 * Return the first set of ranges with any members overlapping the second set removed.
 */
export const removeOverlappingRanges = <
  FirstRange extends IRange,
  SecondRange extends IRange
>(
  firstRanges: FirstRange[],
  secondRanges: SecondRange[]
) => {
  return firstRanges.reduce(
    (acc, range) => {
      return findOverlappingRangeIndex(range, secondRanges) === -1
        ? acc.concat(range)
        : acc;
    },
    [] as FirstRange[]
  );
};

export const mergeRange = (range1: IRange, range2: IRange): IRange => ({
  from: range1.from < range2.from ? range1.from : range2.from,
  to: range1.to > range2.to ? range1.to : range2.to
});

export const mergeRanges = (ranges: IRange[]): IRange[] =>
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
    [] as IRange[]
  );

/**
 * Return the first set of ranges with any overlaps removed.
 */
export const diffRanges = (
  firstRanges: IRange[],
  secondRanges: IRange[]
): IRange[] => {
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
    [] as IRange[]
  );
};

export const validationInputToRange = (input: IValidationInput): IRange => ({
  from: input.from,
  to: input.to
});

export const mergeOutputsFromValidationResponse = (
  response: IValidationResponse,
  currentOutputs: IValidationOutput[],
  trs: Transaction[]
): IValidationOutput[] => {
  const initialTransaction = trs.find(tr => tr.time === response.id);
  if (!initialTransaction && trs.length > 1) {
    return currentOutputs;
  }

  // Map _all_ the things.
  const mappedInputs = mapRangeThroughTransactions(
    [response.validationInput],
    response.id,
    trs
  );

  const newOutputs = mapRangeThroughTransactions(
    response.validationOutputs,
    response.id,
    trs
  );

  return removeOverlappingRanges(currentOutputs, mappedInputs).concat(
    newOutputs
  );
};

/**
 * Expand a range in a document to encompass the words adjacent to the range.
 */
export const expandRange = (range: IRange, doc: Node): IRange | undefined => {
  try {
    const $fromPos = doc.resolve(range.from);
    const $toPos = doc.resolve(range.to);
    const parentNode = findParentNode(node => node.isBlock)(
      new TextSelection($fromPos, $toPos)
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
export const getRangesOfParentBlockNodes = (ranges: IRange[], doc: Node) => {
  const validationRanges = ranges.reduce(
    (acc, range: IRange) => {
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
    [] as IRange[]
  );
  return mergeRanges(validationRanges);
};

export const mapRangeThroughTransactions = <T extends IRange>(
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

export const expandRangesToParentBlockNode = (ranges: IRange[], doc: Node) =>
  getRangesOfParentBlockNodes(ranges, doc);
