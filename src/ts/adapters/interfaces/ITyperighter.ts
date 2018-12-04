export interface ITypeRighterResponse {
  input: string;
  results: ITypeRighterMatch[];
}

export interface ITypeRighterMatch {
  fromPos: number;
  toPos: number;
  message: string;
  shortMessage: string;
  rule: ITypeRighterRule;
  suggestedReplacements: string[];
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
  issueType: string;
}

export interface ITypeRighterCategory {
  id: string;
  name: string;
}
