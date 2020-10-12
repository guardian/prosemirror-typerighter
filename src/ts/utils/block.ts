import { Node } from "prosemirror-model";
import { IRange, IBlock } from "../interfaces/IMatch";

export type TGetIgnoredRanges = (node: Node) => Range[] | undefined;
export const doNotIgnoreRanges: TGetIgnoredRanges = () => undefined

export const createBlock = (doc: Node, range: IRange, time = 0, getIgnoredRangesFromNode: TGetIgnoredRanges): IBlock => {
  // Carriage returns are removed by textBetween, but they're one character
  // long, so if we strip them any position beyond them will be incorrectly offset.
  // The final argument of 'textBetween' here adds a newline character to represent
  // a non-text leaf node.
  const text = doc.textBetween(range.from, range.to, undefined, "\n");
  const ignoredRanges = getIgnoredRangesFromNode(doc)
  return {
    text,
    ...range,
    id: createBlockId(time, range.from, range.to),
    ignoredRanges
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
