import { Node } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import { findParentNode } from "prosemirror-utils";
import { IRange } from "../interfaces/IMatch";
import { IBlock } from "../interfaces/IMatch";
import { Mapping } from "prosemirror-transform";

/**
 * Find the index of the first range in the given range array that overlaps/abuts with the given range.
 */
export const findOverlappingRangeIndex = (range: IRange, ranges: IRange[]) =>
  ranges.findIndex(
    localRange =>
      // Overlaps or abuts to the left of the range
      (localRange.from <= range.from && localRange.to >= range.from) ||
      // Overlaps within the range
      (localRange.to >= range.to && localRange.from <= range.to) ||
      // Overlaps or abuts to the right of the range
      (localRange.from >= range.from && localRange.to <= range.to)
  );

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

export const mapRange = <Range extends IRange>(
  range: Range,
  mapping: Mapping
): Range => ({
  ...range,
  from: mapping.map(range.from),
  to: mapping.map(range.to)
});

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
 * Given a range and a document, return the textblock nodes covered by this
 * range, expanding the start and end of the ranges to encompass the entirety of
 * each textblock.
 */
export const expandRangeToParentBlockNodes = (
  range: IRange,
  doc: Node
): IRange[] => {
  try {
        const $fromPos = doc.resolve(range.from);
        const $toPos = doc.resolve(range.to);
        const parentOfStart = findParentNode(node => node.isBlock)(
          new TextSelection($fromPos, $fromPos)
        );
        const parentOfEnd = findParentNode(node => node.isBlock)(
          new TextSelection($toPos, $toPos)
        );

        if (!parentOfStart || !parentOfEnd) {
          return [];
        }

        const from = parentOfStart.start;
        const to = parentOfEnd.start + parentOfEnd.node.textContent.length;

        const expandedBlockRanges: IRange[] = [];
        // We offset by one to offset into the document node.
        const docOffset = 1;
        doc.nodesBetween(from, to, (node, pos) => {
          // Make sure we're at a node that contains text as its child, as our
          // ranges need to refer to text nodes.
          if (node.isTextblock) {
            expandedBlockRanges.push({
              from: pos + docOffset,
              to: pos + node.textContent.length + docOffset
            })
            return false;
          }
        });

        return expandedBlockRanges;
      } catch (e) {
    return [];
  }
};

/**
 * Expand the given ranges to include the start and end of their textblock nodes.
 */
export const expandRangesToParentBlockNodes = (ranges: IRange[], doc: Node) => {
  const matchRanges = ranges.flatMap(range =>
    expandRangeToParentBlockNodes({ from: range.from, to: range.to }, doc)
  );
  return mergeRanges(matchRanges);
};

const getCharsRemovedBeforeFrom = (
  currentRange: IRange,
  removedRange: IRange
) => {
  if (removedRange.from >= currentRange.from) {
    return 0;
  }

  if (removedRange.to > currentRange.to) {
    return removedRange.to - removedRange.from;
  }

  const rangeBetweenRemovedStartAndIncomingStart = {
    from: removedRange.from,
    to: currentRange.from
  };
  const intersection = getIntersection(
    rangeBetweenRemovedStartAndIncomingStart,
    removedRange
  );
  if (intersection) {
    // The number of chars covered by the intersection is one larger than its length,
    // so for example (1, 2) will cover chars 1 and 2 – hence we add one to `from`.
    return intersection.to - intersection.from + 1;
  }
  return 1; // If there's no intersection, this is a range from (n, n), which is one char long
};

const getCharsRemovedBeforeTo = (
  currentRange: IRange,
  removedRange: IRange
) => {
  const charsRemovedBeforeFrom = getCharsRemovedBeforeFrom(currentRange, removedRange);
  const intersection = getIntersection(currentRange, removedRange);
  return intersection
    ? charsRemovedBeforeFrom + (intersection.to - intersection.from)
    : charsRemovedBeforeFrom;
}

/**
 * Map a from and to position through the given removed range.
 */
export const mapRemovedRange = (
  currentRange: IRange,
  removedRange: IRange
): IRange => {
  const charsRemovedBeforeFrom = getCharsRemovedBeforeFrom(
    currentRange,
    removedRange
  );
  const charsRemovedBeforeTo = getCharsRemovedBeforeTo(currentRange, removedRange);

  const from = currentRange.from - charsRemovedBeforeFrom;
  const to = currentRange.to - charsRemovedBeforeTo;

  return { from, to };
};

/**
 * Map a from and to position through the given added range.
 */
export const mapAddedRange = (
  currentRange: IRange,
  removedRange: IRange
): IRange => {
  const removedRangeLength = getRangeLength(removedRange);

  // The removed range occurs before the current range.
  // Push the current range rightwards to accommodate the removed range.
  if (removedRange.from < currentRange.from) {
    return {
      from: currentRange.from + removedRangeLength + 1,
      to: currentRange.to + removedRangeLength + 1
    }
  }

  // The removed range occurs after the current range.
  // It does not affect the current range.
  if (removedRange.from >= currentRange.to) {
    return currentRange;
  }

  // The removed range occurs in the middle of the current range.
  // It stretches rightwards to accommodate the removed range.
  return { from: currentRange.from, to: currentRange.to + removedRangeLength };
};

/**
 * Remove an ignored range from the given range, adjusting `from` and `to`,
 * and splitting the range into two if the ignored range intersects.
 */
export const removeIgnoredRange = (
  _currentRange: IRange,
  rangeToIgnore: IRange
): IRange[] => {
  // We add one to our lengths here to ensure the to value
  // is placed beyond the last position the range occupies.
  const currentRange = mapAddedRange(_currentRange, rangeToIgnore);
  const intersection = getIntersection(currentRange, rangeToIgnore);

  if (!intersection) {
    return [currentRange];
  }

  const rangeBeforeIntersection = {
    from: currentRange.from,
    to: intersection.from
  }

  const rangeAfterIntersection = {
    from: rangeToIgnore.to + 1,
    to: currentRange.to + 1
  }

  return [
    rangeBeforeIntersection,
    rangeAfterIntersection
  ].filter(rangeHasLength)
};

export const getIntersection = (
  rangeA: IRange,
  rangeB: IRange
): IRange | undefined => {
  const range = {
    from: Math.max(rangeA.from, rangeB.from),
    to: Math.min(rangeA.to, rangeB.to)
  };
  return range.from <= range.to ? range : undefined;
};

const getRangeLength = (range: IRange) => range.to - range.from;

export const rangeHasLength = (range: IRange) => range.from < range.to;
