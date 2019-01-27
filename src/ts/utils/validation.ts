import { Transaction } from "prosemirror-state";
import { IRange } from "../interfaces/IValidation";

export const createValidationInput = (tr: Transaction, range: IRange) => {
  const str = tr.doc.textBetween(range.from, range.to);
  return {
    str,
    ...range,
    id: `${tr.time}-from:${range.from}-to:${range.to}`
  };
};
