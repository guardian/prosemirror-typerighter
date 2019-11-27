import { ISuggestion } from "../../../interfaces/IValidation";

export interface ITypeRighterResponse {
  blocks: ITypeRighterBlockResponse[];
  categoryIds: string[];
  matches: ITypeRighterMatch[];
  requestId: string;
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
  message: string;
  shortMessage: string;
  rule: ITypeRighterRule;
  suggestions: ISuggestion[];
  markAsCorrect: boolean;
}

export interface ITypeRighterReplacement {
  value: string;
}

export interface ITypeRighterType {
  typeName: string;
}

export interface ITypeRighterRule {
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
