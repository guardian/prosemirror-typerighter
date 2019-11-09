import { Transaction } from "prosemirror-state";
import { IRange } from "../interfaces/IValidation";

export const createValidationInput = (tr: Transaction, range: IRange) => {
  const inputString = tr.doc.textBetween(range.from, range.to);
  return {
    inputString,
    ...range,
    validationId: createValidationId(tr.time, range.from, range.to)
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
