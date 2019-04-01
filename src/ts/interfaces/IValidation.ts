export interface IRange {
  from: number;
  to: number;
}

export interface IValidationInput {
  id: string;
  inputString: string;
  from: number;
  to: number;
}

export interface IBaseValidationOutput {
  annotation: string;
  category: {
    id: string;
    name: string;
    colour: string
  };
}

export type IValidationOutput<
  IValidationMeta = IBaseValidationOutput
> = IValidationInput & {
  suggestions?: string[];
  id: string;
} & IValidationMeta;

export interface IValidationError {
  validationInput: IValidationInput;
  message: string;
}

export interface IValidationResponse<IValidationMeta = IBaseValidationOutput> {
  validationOutputs: Array<IValidationOutput<IValidationMeta>>;
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
