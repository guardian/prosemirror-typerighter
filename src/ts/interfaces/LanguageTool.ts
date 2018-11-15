export interface LTResponse {
  input: string;
  results: LTMatch[];
}

export interface LTMatch {
  fromPos: number;
  toPos: number;
  message: string;
  shortMessage: string;
  rule: LTRule;
  suggestedReplacements: string[];
}

export interface LTReplacement {
  value: string;
}

export interface LTType {
  typeName: string;
}

export interface LTRule {
  category: LTCategory;
  description: string;
  id: string;
  issueType: string;
}

export interface LTCategory {
  id: string;
  name: string;
}
