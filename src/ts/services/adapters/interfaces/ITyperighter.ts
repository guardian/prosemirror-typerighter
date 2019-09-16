import { ISuggestion } from "../../../interfaces/IValidation";

export interface ITypeRighterResponse {
  blocks: ITypeRighterBlockResponse[];
  validationSetId: string;
}

export interface ITypeRighterBlockResponse {
  id: string,
  categoryIds: string[],
  matches: ITypeRighterMatch[],
  from: number;
  to: number;
  text: string;
}

export interface ITypeRighterMatch {
  fromPos: number;
  toPos: number;
  message: string;
  shortMessage: string;
  rule: ITypeRighterRule;
  suggestions: ISuggestion[];
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
  autoApplyFirstSuggestion: boolean;
  issueType: string;
}

export interface ITypeRighterCategory {
  id: string;
  name: string;
  colour: string;
}
