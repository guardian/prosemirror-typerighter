import {
  IValidationLibrary,
  IValidationOutput,
  ISuggestion
} from "../../interfaces/IValidation";
import { createValidationId, createMatchId } from "../../utils/validation";

export const validationLibrary: IValidationLibrary = [
  [
    {
      regExp: new RegExp("first match", "g"),
      annotation: "Found 'first match'",
      operation: "ANNOTATE",
      type: "legal"
    }
  ],
  [
    {
      regExp: new RegExp("second match", "g"),
      annotation: "Found 'second match'",
      operation: "ANNOTATE",
      type: "legal"
    },
    {
      regExp: new RegExp("match", "g"),
      annotation: "Found 'match'",
      operation: "ANNOTATE",
      type: "legal"
    }
  ]
];

export const createValidationInput = (
  from: number,
  to: number,
  inputString = "str"
) => ({
  inputString,
  from,
  to,
  validationId: `0-from:${from}-to:${to}`
});

export const createValidationOutput = (
  from: number,
  to: number,
  inputString = "str",
  suggestions = [] as ISuggestion[]
): IValidationOutput => ({
  from,
  to,
  category: {
    id: "1",
    name: "Cat",
    colour: "eeeee"
  },
  annotation: "annotation",
  inputString,
  validationId: createValidationId(0, from, to),
  matchId: createMatchId(0, from, to, 0),
  suggestions
});
