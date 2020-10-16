import clamp from "lodash/clamp";
import { Node } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import { findParentNode } from "prosemirror-utils";
import { IRange } from "../interfaces/IMatch";
import { IBlock } from "../interfaces/IMatch";
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
  ranges.reduce((acc, range) => {
    const index = findOverlappingRangeIndex(range, acc);
    if (index === -1) {
      return acc.concat(range);
    }
    const newRange = acc.slice();
    newRange.splice(index, 1, mergeRange(range, acc[index]));
    return newRange;
  }, [] as Range[]);

/**
 * Return the first set of ranges with any overlaps removed.
 */
export const diffRanges = (
  firstRanges: IRange[],
  secondRanges: IRange[]
): IRange[] => {
  const firstRangesMerged = mergeRanges(firstRanges);
  const secondRangesMerged = mergeRanges(secondRanges);
  return firstRangesMerged.reduce((acc, range) => {
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
  }, [] as IRange[]);
};

export const blockToRange = (input: IBlock): IRange => ({
  from: input.from,
  to: input.to
});

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
  const matchRanges = ranges.reduce((acc, range: IRange) => {
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
  }, [] as IRange[]);
  return mergeRanges(matchRanges);
};

export const expandRangesToParentBlockNode = (ranges: IRange[], doc: Node) =>
  getRangesOfParentBlockNodes(ranges, doc);

const getCharsRemovedBeforeFrom = (
  incomingRange: IRange,
  removedRange: IRange
) => {
  if (removedRange.from >= incomingRange.from) {
    return 0;
  }

  const rangeBetweenRemovedStartAndIncomingStart = {
    from: removedRange.from,
    to: incomingRange.from
  };
  const intersection = getIntersection(
    rangeBetweenRemovedStartAndIncomingStart,
    removedRange
  );
  if (intersection) {
    return intersection.to - intersection.from + 1;
  }
  return 1; // If there's no intersection, this is range from (n,n)
};

/**
 * Map a from and to position through the given removed range.
 */
export const mapRemovedRange = (
  incomingRange: IRange,
  removedRange: IRange
): IRange => {
  const charsRemovedBeforeFrom = getCharsRemovedBeforeFrom(
    incomingRange,
    removedRange
  );

  const intersection = getIntersection(incomingRange, removedRange);
  const charsRemovedBeforeTo = intersection
    ? charsRemovedBeforeFrom + (intersection.to - intersection.from)
    : charsRemovedBeforeFrom;

  const from = incomingRange.from - charsRemovedBeforeFrom;
  const to = incomingRange.to - charsRemovedBeforeTo;

  return { from, to };
};

/**
 * Map a from and to position through the given added range.
 */
export const mapAddedRange = (
  incomingRange: IRange,
  addedRange: IRange
): IRange => {
  // We add one to our lengths here to ensure the to value
  // is placed beyond the last position the range occupies.
  const lengthOfAddedRange = addedRange.to - addedRange.from;
  const charsAddedBeforeFrom =
    addedRange.from <= incomingRange.from ? lengthOfAddedRange + 1 : 0;
  const intersection = getIntersection(incomingRange, addedRange);
  const charsAddedBeforeTo = intersection
    ? lengthOfAddedRange + 1
    : charsAddedBeforeFrom;

  const from = incomingRange.from + charsAddedBeforeFrom;
  const to = incomingRange.to + charsAddedBeforeTo;

  return { from, to };
};

export const getIntersection = (
  rangeA: IRange,
  rangeB: IRange
): IRange | undefined => {
  const range = {
    from: Math.max(rangeA.from, rangeB.from),
    to: Math.min(rangeA.to, rangeB.to)
  };
  return range.from < range.to ? range : undefined;
};
