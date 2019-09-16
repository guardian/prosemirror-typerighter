import clamp from "lodash/clamp";
import { Node } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import { findParentNode } from "prosemirror-utils";
import { IRange, IBlockMatches } from "../interfaces/IValidation";
import { IBlockQuery } from "../interfaces/IValidation";
import { Mapping } from "prosemirror-transform";

/**
 * Find the index of the first range in the given range array that overlaps with the given range.
 */
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

export const mapAndMergeRanges = <Range extends IRange>(
  ranges: Range[],
  mapping: Mapping
): Range[] => mergeRanges(mapRanges(ranges, mapping));

export const mapRanges = <Range extends IRange>(
  ranges: Range[],
  mapping: Mapping
): Range[] =>
  ranges.map(range => ({
    ...range,
    from: mapping.map(range.from),
    to: mapping.map(range.to)
  }));

/**
 * Return the first set of ranges with any members overlapping the second set removed.
 */
export const removeOverlappingRanges = <
  FirstRange extends IRange,
  SecondRange extends IRange
>(
  firstRanges: FirstRange[],
  secondRanges: SecondRange[],
  predicate?: (range: FirstRange) => boolean
) => {
  return firstRanges.reduce(
    (acc, range) =>
      (predicate && predicate(range)) ||
      findOverlappingRangeIndex(range, secondRanges) === -1
        ? acc.concat(range)
        : acc,
    [] as FirstRange[]
  );
};

export const mergeRange = <Range extends IRange>(
  range1: Range,
  range2: Range
): Range => ({
  ...range1,
  from: range1.from < range2.from ? range1.from : range2.from,
  to: range1.to > range2.to ? range1.to : range2.to
});

export const mergeRanges = <Range extends IRange>(ranges: Range[]): Range[] =>
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

export const validationInputToRange = (input: IBlockQuery): IRange => ({
  from: input.from,
  to: input.to
});

/**
 * Get the current set of validations for the given response.
 */
export const getCurrentValidationsFromValidationResponse = <
  TValidationOutput extends IBlockMatches
>(
  blockQueries: IBlockQuery,
  incomingOutputs: TValidationOutput[],
  currentOutputs: TValidationOutput[],
  mapping: Mapping
): TValidationOutput[] => {
  if (!incomingOutputs.length) {
    return currentOutputs;
  }

  // Map _all_ the things.
  const mappedInputs = mapRanges([blockQueries], mapping);

  const newOutputs = mapAndMergeRanges(incomingOutputs, mapping);

  return removeOverlappingRanges(currentOutputs, mappedInputs).concat(
    newOutputs
  );
};

/**
 * Expand a range in a document to encompass the nearest ancestor block node.
 */
export const expandRangeToParentBlockNode = (
  range: IRange,
  doc: Node
): IRange | undefined => {
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
 * Expand the given ranges to include their ancestor block nodes.
 */
export const getRangesOfParentBlockNodes = (ranges: IRange[], doc: Node) => {
  const validationRanges = ranges.reduce(
    (acc, range: IRange) => {
      const expandedRange = expandRangeToParentBlockNode(
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

export const expandRangesToParentBlockNode = (ranges: IRange[], doc: Node) =>
  getRangesOfParentBlockNodes(ranges, doc);
