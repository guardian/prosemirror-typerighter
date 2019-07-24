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

export interface IValidationOutput<TSuggestion = ISuggestion>
  extends IValidationInput {
  id: string;
  annotation: string;
  category: {
    id: string;
    name: string;
    colour: string;
  };
  suggestions?: TSuggestion;
}

export type ISuggestion = IBaseSuggestion | IWikiSuggestion;

export interface IBaseSuggestion {
  type: "BASE_SUGGESTION";
  replacements: string[];
}

export interface IWikiSuggestion {
  type: "WIKI_SUGGESTION";
  replacements: Array<{
    title: string;
    description: string;
    thumbnail: string;
    relevance: number;
  }>;
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
