import { Transaction } from "prosemirror-state";
import { IRange, IBlock } from "../interfaces/IMatch";

export const createBlock = (tr: Transaction, range: IRange): IBlock => {
  // Carriage returns are removed by textBetween, but they're one character
  // long, so if we strip them any position beyond them will be incorrectly offset.
  // The final argument of 'textBetween' here adds a newline character to represent
  // a non-text leaf node.
  const text = tr.doc.textBetween(range.from, range.to, undefined, "\n");
  return {
    text,
    ...range,
    id: createBlockId(tr.time, range.from, range.to)
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
