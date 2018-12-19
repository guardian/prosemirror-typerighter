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
  id: string | number;
  message: string;
}

export interface IValidationResponse {
  // The validation input that produced these outputs.
  validationInput: IValidationInput;
  // The validation outputs.
  validationOutputs: IValidationOutput[];
  // The ID of the validation request.
  id: string | number;
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
