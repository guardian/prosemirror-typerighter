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
  inputString: string;
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


export interface IBlockMatches<TSuggestion = ISuggestion> {
  matchId: string;
  from: number;
  to: number;
  annotation: string;
  category: ICategory;
  suggestions?: TSuggestion[];
  autoApplyFirstSuggestion?: boolean;
}

export interface IBlockResult<
  TBlockMatches extends IBlockMatches = IBlockMatches
> {
  blockMatches: TBlockMatches[];
  categoryIds: string[];
  validationId: string;
  from: number;
  to: number;
}

export interface IValidationResponse<
  TBlockMatches extends IBlockMatches = IBlockMatches
> {
  blockResults: Array<IBlockResult<TBlockMatches>>;
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
