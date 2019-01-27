export interface IRange {
  from: number;
  to: number;
}

export interface IValidationInput {
  id: string;
  str: string;
  from: number;
  to: number;
}

export type IValidationOutput = IValidationInput & {
  annotation: string;
  suggestions?: string[];
  type: string;
};

export interface IValidationError {
  validationInput: IValidationInput;
  message: string;
}

export interface IValidationResponse {
  validationOutputs: IValidationOutput[];
  validationInput: IValidationInput;
}

export type IValidationLibrary = Array<
  Array<{
    regExp: RegExp;
    annotation: string;
    operation: "ANNOTATE" | "REPLACE";
    type: string;
  }>
>;

export const Operations: {
  [key: string]: "ANNOTATE" | "REPLACE";
} = {
  ANNOTATE: "ANNOTATE",
  REPLACE: "REPLACE"
};
