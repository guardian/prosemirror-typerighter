export interface TypeRighterResponse {
  input: string;
  results: TypeRighterMatch[];
}

export interface TypeRighterMatch {
  fromPos: number;
  toPos: number;
  message: string;
  shortMessage: string;
  rule: TypeRighterRule;
  suggestedReplacements: string[];
}

export interface TypeRighterReplacement {
  value: string;
}

export interface TypeRighterType {
  typeName: string;
}

export interface TypeRighterRule {
  category: TypeRighterCategory;
  description: string;
  id: string;
  issueType: string;
}

export interface TypeRighterCategory {
  id: string;
  name: string;
}
