import { IBlockWithSkippedRanges, IMatch, IRange } from "../interfaces/IMatch";
import { mapAddedRange } from "./range";

/**
 * Map the range this match applies to through the given ranges, adjusting its range accordingly.
 */
export const mapThroughSkippedRanges = <TMatch extends IMatch>(
  match: TMatch,
  skipRanges: IRange[]
): TMatch => {
  if (!skipRanges.length) {
    return match;
  }

  const [newMatch] = skipRanges.reduce(
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
 * Map this match through the given blocks' skipped ranges.
 */
export const mapMatchThroughBlocks = <TMatch extends IMatch>(
  match: TMatch,
  blocks: IBlockWithSkippedRanges[]
): TMatch => {
  const maybeBlockForThisMatch = blocks.find(
    block => match.from >= block.from && match.to <= block.to
  );
  if (!maybeBlockForThisMatch) {
    return match;
  }
  return mapThroughSkippedRanges(match, maybeBlockForThisMatch.skipRanges);
};
