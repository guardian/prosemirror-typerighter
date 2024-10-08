import { omit } from "lodash";
import { Node } from "prosemirror-model";
import { IRange, IBlock, IBlockWithIgnoredRanges } from "../interfaces/IMatch";
import { mapRemovedRange } from "./range";

export type GetIgnoredRanges = (
  node: Node,
  from: number,
  to: number
) => IRange[] | undefined;
export const doNotIgnoreRanges: GetIgnoredRanges = () => undefined;

export const createBlock = (
  doc: Node,
  range: IRange,
  time = 0,
  getIgnoredRangesFromNode: GetIgnoredRanges
): IBlockWithIgnoredRanges => {
  // Carriage returns are removed by textBetween, but they're one character
  // long, so if we strip them any position beyond them will be incorrectly offset.
  // The final argument of 'textBetween' here adds a newline character to represent
  // a non-text leaf node.
  const text = doc.textBetween(range.from, range.to, undefined, "\n");
  const ignoreRanges =
    getIgnoredRangesFromNode(doc, range.from, range.to) || [];
  return {
    text,
    ...range,
    id: createBlockId(time, range.from, range.to),
    ignoreRanges: ignoreRanges
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
 * For a block, remove the text covered by the given ranges, adjusting
 * the block range accordingly.
 *
 * For example, with the block ```{
 *  from: 0,
 *  to: 2
 *  text: `ABC`,
 *  ignoreRanges: `[{ from: 1, to: 1 }]`
 * }```
 *
 * We produce a new block with `B` removed and the range reduced by 1:
 *
 * ```{
 *  from: 0,
 *  to: 1
 *  text: `AC`,
 * }```
 */
export const removeIgnoredRanges = (block: IBlockWithIgnoredRanges): IBlock => {
  const ignoreRanges = block.ignoreRanges || [];
  if (ignoreRanges.length === 0) {
    return block;
  }
  const [newBlock] = ignoreRanges.reduce(
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
        ...omit(accBlock, "ignoreRanges"),
        text: newText,
        to: accBlock.from + newText.length
      };

      return [mappedBlock, rangesAlreadyApplied.concat(mappedRange)];
    },
    [block as IBlock, [] as IRange[]]
  );
  return newBlock;
};
