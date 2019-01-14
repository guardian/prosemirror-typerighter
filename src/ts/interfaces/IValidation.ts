export interface IRange {
  from: number;
  to: number;
}

export interface IValidationInput {
  inputString: string;
  from: number;
  to: number;
}

export interface IDefaultValidationMeta {
  annotation: string;
  type: string;
}

export type IValidationOutput<
  IValidationMeta = IDefaultValidationMeta
> = IValidationInput & {
  suggestions?: string[];
  id: string;
} & IValidationMeta;

export interface IValidationError {
  validationInput: IValidationInput;
  id: string;
  message: string;
}

export interface IValidationResponse<IValidationMeta = IDefaultValidationMeta> {
  // The validation outputs.
  validationOutputs: Array<IValidationOutput<IValidationMeta>>;
  // The ID of the validation request.
  id: string;
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
