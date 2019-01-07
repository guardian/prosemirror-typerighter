export interface IRange { from: number; to: number }

export interface IValidationInput { str: string; from: number; to: number }

export type IValidationOutput = IValidationInput & {
  annotation: string;
  suggestions?: string[];
  type: string;
  id: string;
};

export interface IValidationError {
  validationInput: IValidationInput;
  id: string;
  message: string;
}

export interface IValidationResponse {
  // The validation outputs.
  validationOutputs: IValidationOutput[];
  // The ID of the validation request.
  id: string;
}

export type IValidationLibrary = Array<Array<{
  regExp: RegExp;
  annotation: string;
  operation: "ANNOTATE" | "REPLACE";
  type: string;
}>>;

export const Operations: {
  [key: string]: "ANNOTATE" | "REPLACE";
} = {
  ANNOTATE: "ANNOTATE",
  REPLACE: "REPLACE"
};
