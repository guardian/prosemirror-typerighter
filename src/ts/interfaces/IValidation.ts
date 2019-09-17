export interface IRange {
  from: number;
  to: number;
}

export interface ICategory {
  id: string;
  name: string;
  colour: string;
}

export interface IBlockQuery {
  id: string;
  text: string;
  from: number;
  to: number;
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


export interface IMatches<TSuggestion = ISuggestion> {
  matchId: string;
  from: number;
  to: number;
  annotation: string;
  category: ICategory;
  suggestions?: TSuggestion[];
  autoApplyFirstSuggestion?: boolean;
}

export interface IBlockResult {
  categoryIds: string[];
  id: string;
}

export interface IValidationResponse<
  TBlockMatches extends IMatches = IMatches
> {
  blocks: IBlockQuery[];
  categoryIds: string[];
  matches: TBlockMatches[];
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
