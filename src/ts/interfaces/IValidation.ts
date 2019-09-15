export interface IRange {
  from: number;
  to: number;
}

export interface IValidationInput {
  validationId: string;
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
  matchId: string;
  validationId: string;
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
  validationSetId: string;
  // If we have an id, we can link the error to a specific validation.
  // If not, we treat the error as nonspecific.
  validationId?: string;
  message: string;
}

export interface IValidationResponse<
  TValidationOutput extends IValidationOutput = IValidationOutput
> {
  validationOutputs: TValidationOutput[];
  validationId: string;
  validationSetId: string;
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
