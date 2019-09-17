import { Transaction } from "prosemirror-state";
import { IRange, IBlockQuery } from "../interfaces/IValidation";

export const createValidationBlock = (tr: Transaction, range: IRange): IBlockQuery => {
  const text = tr.doc.textBetween(range.from, range.to);
  return {
    text,
    ...range,
    id: createValidationId(tr.time, range.from, range.to)
  };
};

export const createValidationId = (time: number, from: number, to: number) =>
  `${time}-from:${from}-to:${to}`;

export const createMatchId = (
  time: number,
  from: number,
  to: number,
  index: number = 0
) => `${createValidationId(time, from, to)}--match-${index}`;
