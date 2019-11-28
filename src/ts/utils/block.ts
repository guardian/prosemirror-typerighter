import { Transaction } from "prosemirror-state";
import { IRange, IBlock } from "../interfaces/IMatch";

export const createBlock = (tr: Transaction, range: IRange): IBlock => {
  const text = tr.doc.textBetween(range.from, range.to);
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
