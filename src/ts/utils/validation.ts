import { Transaction } from "prosemirror-state";
import { IRange } from "../interfaces/IValidation";

export const createValidationInput = (tr: Transaction, range: IRange) => {
  const inputString = tr.doc.textBetween(range.from, range.to);
  return {
    inputString,
    ...range,
    id: `${tr.time}-from:${range.from}-to:${range.to}`
  };
};
