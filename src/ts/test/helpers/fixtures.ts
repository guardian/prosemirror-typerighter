import { IValidationLibrary } from "../../interfaces/IValidation";

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
  str = "str"
) => ({
  str,
  from,
  to,
  id: `0-from:${from}-to:${to}`
});

export const createValidationOutput = (
  from: number,
  to: number,
  str = "str",
  suggestions = [] as string[]
) => ({
  from,
  to,
  type: "type",
  annotation: "annotation",
  str,
  id: `0-from:${from}-to:${to}`,
  suggestions
});
