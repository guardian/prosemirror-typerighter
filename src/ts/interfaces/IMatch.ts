export interface IRange {
  from: number;
  to: number;
}

export interface ICategory {
  id: string;
  name: string;
  colour: string;
}

export interface IBlock {
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

export interface IMatchRequestError {
  requestId: string;
  // If we have an id, we can link the error to a specific block.
  // If not, we treat the error as nonspecific.
  blockId?: string;
  message: string;
}

export interface IMatch<TSuggestion = ISuggestion> {
  matchId: string;
  from: number;
  to: number;
  matchedText: string;
  message: string;
  category: ICategory;
  suggestions?: TSuggestion[];
  replacement?: TSuggestion;
  markAsCorrect?: boolean;
  matchContext: string;
}

export interface IBlockResult {
  categoryIds: string[];
  id: string;
}

export interface IMatcherResponse<TBlockMatch extends IMatch = IMatch> {
  blocks: IBlock[];
  categoryIds: string[];
  matches: TBlockMatch[];
  requestId: string;
}

export type IMatchLibrary = Array<
  Array<{
    regExp: RegExp;
    annotation: string;
    operation: "ANNOTATE" | "REPLACE";
    type: string;
  }>
>;

