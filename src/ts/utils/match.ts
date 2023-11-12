import { IBlockWithIgnoredRanges, IMatch, IRange } from "../interfaces/IMatch";
import { mapAddedRange } from "./range";

/**
 * Map the range this match applies to through the given ranges, adjusting its range accordingly.
 */
export const mapThroughIgnoredRanges = <TMatch extends IMatch>(
  match: TMatch,
  ignoreRanges: IRange[]
): TMatch => {
  if (!ignoreRanges.length) {
    return match;
  }

  const [newMatch] = ignoreRanges.reduce(
    ([accMatch, rangesAlreadyApplied], range) => {
      const initialRange = {
        from: accMatch.from,
        to: accMatch.to
      };
      const newMatchRange = mapAddedRange(initialRange, range);
      const newRuleMatch = {
        ...accMatch,
        from: newMatchRange.from,
        to: newMatchRange.to
      };

      return [newRuleMatch, rangesAlreadyApplied];
    },
    [match, [] as Range[]]
  );

  return newMatch;
};

/**
 * Map this match through the given blocks' ignored ranges.
 */
export const mapMatchThroughBlocks = <TMatch extends IMatch>(
  match: TMatch,
  blocks: IBlockWithIgnoredRanges[]
): TMatch => {
  const maybeBlockForThisMatch = blocks.find(
    block => match.from >= block.from && match.to <= block.to
  );
  if (!maybeBlockForThisMatch) {
    return match;
  }
  return mapThroughIgnoredRanges(match, maybeBlockForThisMatch.ignoreRanges);
};
