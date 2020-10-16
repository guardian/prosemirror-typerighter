import { omit } from "lodash";
import { Node } from "prosemirror-model";
import { IRange, IBlock, IBlockWithSkippedRanges } from "../interfaces/IMatch";
import { mapRemovedRange } from "./range";

export type TGetSkippedRanges = (
  node: Node,
  from: number,
  to: number
) => IRange[] | undefined;
export const doNotSkipRanges: TGetSkippedRanges = () => undefined;

export const createBlock = (
  doc: Node,
  range: IRange,
  time = 0,
  getSkippedRangesFromNode: TGetSkippedRanges
): IBlockWithSkippedRanges => {
  // Carriage returns are removed by textBetween, but they're one character
  // long, so if we strip them any position beyond them will be incorrectly offset.
  // The final argument of 'textBetween' here adds a newline character to represent
  // a non-text leaf node.
  const text = doc.textBetween(range.from, range.to, undefined, "\n");
  const skipRanges = getSkippedRangesFromNode(doc, range.from, range.to) || [];
  return {
    text,
    ...range,
    id: createBlockId(time, range.from, range.to),
    skipRanges
  };
};

export const createBlockId = (time: number, from: number, to: number) =>
  `${time}-from:${from}-to:${to}`;

export const createMatchId = (
  time: number,
  from: number,
  to: number,
  index: number = 0
) => `${createBlockId(time, from, to)}--match-${index}`;

/**
 * Remove the given ranges from the block text, adjusting the block range accordingly.
 */
export const removeSkippedRanges = (block: IBlockWithSkippedRanges): IBlock => {
  const skipRanges = block.skipRanges || [];
  if (skipRanges.length === 0) {
    return block;
  }
  const [newBlock] = skipRanges.reduce(
    ([accBlock, rangesAlreadyApplied], range) => {
      const mappedRange = rangesAlreadyApplied.reduce(
        (acc, rangeToRemove) => mapRemovedRange(acc, rangeToRemove),
        range
      );
      const snipFrom = mappedRange.from - accBlock.from;
      const snipTo = snipFrom + (mappedRange.to - mappedRange.from);
      const snipRange = {
        from: Math.max(snipFrom, 0),
        to: Math.min(accBlock.to, snipTo + 1)
      };

      const newText =
        accBlock.text.slice(0, snipRange.from) +
        accBlock.text.slice(snipRange.to, accBlock.text.length);

      const mappedBlock = {
        ...omit(accBlock, 'skipRanges'),
        text: newText,
        to: accBlock.from + newText.length
      };

      return [mappedBlock, rangesAlreadyApplied.concat(mappedRange)];
    },
    [block as IBlock, [] as IRange[]]
  );
  return newBlock;
};
