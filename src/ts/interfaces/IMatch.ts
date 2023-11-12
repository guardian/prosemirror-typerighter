import { PartialBy } from "../utils/types";

export interface IRange {
  from: number;
  to: number;
}

export interface ICategory {
  id: string;
  name: string;
  colour: string;
}

/**
 * A block of contiguous text.
 */
export interface IBlock {
  id: string;
  text: string;
  from: number;
  to: number
}

/**
 * A block of contiguous text with some ranges marked as ignored.
 */
export interface IBlockWithIgnoredRanges extends IBlock {
  ignoreRanges: IRange[]
}

export interface ISuggestion {
  type: "TEXT_SUGGESTION";
  text: string;
}

export type TErrorType = "GENERAL_ERROR" | "AUTH_ERROR";

export interface IMatchRequestError {
  requestId: string;
  // If we have an id, we can link the error to a specific block.
  // If not, we treat the error as nonspecific.
  blockId?: string;
  message: string;
  categoryIds: string[];
  type: TErrorType;
}

export type TMatchRequestErrorWithDefault = PartialBy<
  IMatchRequestError,
  "type"
>;

export interface IMatch<TSuggestion = ISuggestion> {
  matcherType: string
  matchId: string;
  from: number;
  to: number;
  ruleId: string;
  matchedText: string;
  message: string;
  category: ICategory;
  suggestions?: TSuggestion[];
  replacement?: TSuggestion;
  markAsCorrect?: boolean;
  matchContext: string;
  precedingText: string;
  subsequentText: string;
  groupKey: string;
}

export interface IBlockResult {
  categoryIds: string[];
  id: string;
}

export interface IMatcherResponse<MatchesType extends IMatch[] = IMatch[]> {
  blocks: IBlock[];
  categoryIds: string[];
  matches: MatchesType;
  requestId: string;
  percentageRequestComplete?: number;
}

export type IMatchLibrary = Array<
  Array<{
    regExp: RegExp;
    annotation: string;
    operation: "ANNOTATE" | "REPLACE";
    type: string;
  }>
>;
