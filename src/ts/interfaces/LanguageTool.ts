export interface LTResponse {
	language: unknown
	matches: LTMatch[]
	software: unknown
	warnings: unknown
}

export interface LTMatch {
	context: {
		text: string,
		offset: number,
		length: number
	},
	length: number,
	message: string,
	offset: number,
	replacements: LTReplacement[],
	rule: LTRule,
	sentence: string,
	shortMessage: string,
	type: LTType
}

export interface LTReplacement {
	value: string
}

export interface LTType {
	typeName: string
}

export interface LTRule {
	category: LTCategory,
	description: string,
	id: string,
	issueType: string
}

export interface LTCategory {
	id: string,
	name: string
}