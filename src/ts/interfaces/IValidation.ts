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

export interface ICategory {
  id: string;
  name: string;
  colour: string;
}

export interface IValidationOutput<TSuggestion = ISuggestion>
  extends IValidationInput {
  id: string;
  annotation: string;
  category: ICategory;
  suggestions?: TSuggestion[];
}

export type ISuggestion = ITextSuggestion | IWikiSuggestion;

export interface ITextSuggestion {
  type: "TEXT_SUGGESTION";
  text: string;
}

export interface IWikiSuggestion {
  type: "WIKI_SUGGESTION";
  title: string;
  text: string;
  score: number;
}

export interface IValidationError {
  validationInput: IValidationInput;
  message: string;
}

export interface IValidationResponse<
  TValidationOutput extends IValidationOutput = IValidationOutput
> {
  validationOutputs: TValidationOutput[];
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
