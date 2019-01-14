export interface ILTResponse {
  language: unknown;
  matches: ILTMatch[];
  software: unknown;
  warnings: unknown;
}

export interface ILTMatch {
  context: {
    text: string;
    offset: number;
    length: number;
  };
  length: number;
  message: string;
  offset: number;
  replacements: ILTReplacement[];
  rule: ILTRule;
  sentence: string;
  shortMessage: string;
  type: ILTType;
}

export interface ILTReplacement {
  value: string;
}

export interface ILTType {
  typeName: string;
}

export interface ILTRule {
  category: ILTCategory;
  description: string;
  id: string;
  issueType: string;
}

export interface ILTCategory {
  id: string;
  name: string;
}
