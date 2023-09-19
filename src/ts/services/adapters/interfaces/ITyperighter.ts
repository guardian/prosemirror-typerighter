import { ISuggestion } from "../../../interfaces/IMatch";

export interface ITypeRighterResponse {
  blocks: ITypeRighterBlockResponse[];
  categoryIds: string[];
  matches: ITypeRighterMatch[];
  requestId: string;
  percentageRequestComplete?: number;
}

export interface ITypeRighterBlockResponse {
  id: string;
  text: string;
  from: number;
  to: number;
}

export interface ITypeRighterMatch {
  fromPos: number;
  toPos: number;
  matchedText: string;
  message: string;
  replacement?: ISuggestion;
  shortMessage: string;
  rule: ITypeRighterRule;
  suggestions: ISuggestion[];
  markAsCorrect: boolean;
  matchContext: string;
  precedingText: string;
  subsequentText: string;
  groupKey: string;
}

export interface ITypeRighterReplacement {
  value: string;
}

export interface ITypeRighterType {
  typeName: string;
}

export interface ITypeRighterRule {
  matcherType: string;
  category: ITypeRighterCategory;
  description: string;
  id: string;
  suggestions: ISuggestion[];
  replacement?: ISuggestion;
  issueType: string;
}

export interface ITypeRighterCategory {
  id: string;
  name: string;
  colour: string;
}
