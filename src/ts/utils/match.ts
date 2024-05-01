import { IBlockWithIgnoredRanges, IRange, Match, MatchFromTyperighter } from "../interfaces/IMatch";
import { removeIgnoredRange } from "./range";

/**
 * Map the range this match applies to through the given ranges, adjusting its range accordingly.
 */
export const mapThroughIgnoredRanges = (
  match: MatchFromTyperighter,
  ignoreRanges: IRange[]
): Match => {
  if (!ignoreRanges.length) {
    return matchToMappedMatch(match)
  }

  const initialMappedMatch = {
    ...match,
    ranges: [{ from: match.from, to: match.to }]
  }

  const [newMatch] = ignoreRanges.reduce(
    ([accMatch, rangesAlreadyApplied], ignoreRange) => {
      const newMatchRange = accMatch.ranges.flatMap(initialRange =>
        removeIgnoredRange(initialRange, ignoreRange)
      );

      const newRuleMatch = {
        ...accMatch,
        ranges: newMatchRange
      };

      return [newRuleMatch, rangesAlreadyApplied];
    },
    [initialMappedMatch, [] as Range[]]
  );

  return {
    ...newMatch,
    from: Math.min(...newMatch.ranges.map(_ => _.from)),
    to: Math.max(...newMatch.ranges.map(_ => _.to))
  };
};

/**
 * Map this match through the given blocks' ignored ranges.
 */
export const mapMatchThroughBlocks = (
  match: MatchFromTyperighter,
  blocks: IBlockWithIgnoredRanges[]
): Match => {
  const maybeBlockForThisMatch = blocks.find(
    block => match.from >= block.from && match.to <= block.to
  );
  if (!maybeBlockForThisMatch) {
    return matchToMappedMatch(match);
  }
  return mapThroughIgnoredRanges(match, maybeBlockForThisMatch.ignoreRanges);
};

const matchToMappedMatch = (match: MatchFromTyperighter): Match => ({
  ...match,
  ranges: [{ from: match.from, to: match.to }]
})
