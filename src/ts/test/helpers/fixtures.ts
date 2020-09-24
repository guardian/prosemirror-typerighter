import {
  IMatchLibrary,
  IMatch,
  ISuggestion,
  IBlock,
  IMatcherResponse,
  ICategory
} from "../../interfaces/IMatch";
import { createBlockId, createMatchId } from "../../utils/block";
import { IPluginState, IBlocksInFlightState } from "../../state/reducer";
import { Mapping } from "prosemirror-transform";
import { Transaction } from "prosemirror-state";
import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import { createDoc, p } from "./prosemirror";
import { defaultMatchColours } from "../../utils/decoration";

export const matchLibrary: IMatchLibrary = [
  [
    {
      regExp: new RegExp("first match", "g"),
      annotation: "Found 'first match'",
      operation: "ANNOTATE",
      type: "legal"
    }
  ],
  [
    {
      regExp: new RegExp("second match", "g"),
      annotation: "Found 'second match'",
      operation: "ANNOTATE",
      type: "legal"
    },
    {
      regExp: new RegExp("match", "g"),
      annotation: "Found 'match'",
      operation: "ANNOTATE",
      type: "legal"
    }
  ]
];

export const createBlock = (
  from: number,
  to: number,
  text = "str"
): IBlock => ({
  text,
  from,
  to,
  id: `0-from:${from}-to:${to}`
});

export interface ICreateMatcherResponseSpec {
  from: number;
  to: number;
  block?: IBlock;
  wordFrom?: number;
  wordTo?: number;
  category?: ICategory;
  suggestions?: ISuggestion[];
}

export const createMatcherResponse = (
  specs: ICreateMatcherResponseSpec[],
  requestId: string = exampleRequestId
): IMatcherResponse =>
  specs.reduce(
    (acc, spec) => {
      const {
        from,
        to,
        wordFrom = from,
        wordTo = from + 3,
        block,
        category = {
          id: "1",
          name: "Cat",
          colour: "eeeee"
        },
        suggestions = [] as ISuggestion[]
      } = spec;

      const newBlock = block || {
        id: createBlockId(0, from, to),
        from,
        to,
        text: "block text"
      };

      const newMatch = {
        matcherType: "regex",
        ruleId: "ruleId",
        category,
        matchedText: "block text",
        message: "annotation",
        from: wordFrom,
        to: wordTo,
        matchId: createMatchId(0, wordFrom, wordTo, 0),
        suggestions,
        matchContext: "here is a [block text] match"
      };

      return {
        ...acc,
        // Category ids should be unique
        categoryIds: Array.from(new Set(acc.categoryIds.concat(category.id))),
        blocks: acc.blocks.concat(newBlock),
        matches: acc.matches.concat(newMatch)
      };
    },
    {
      requestId,
      categoryIds: [],
      blocks: [],
      matches: []
    } as IMatcherResponse
  );

export const createMatch = (
  from: number,
  to: number = from + 3,
  suggestions = [] as ISuggestion[],
  category = {
    id: "1",
    name: "Cat",
    colour: "eeeee"
  }
): IMatch => ({
  matcherType: "regex",
  ruleId: "ruleId",
  category,
  matchedText: "block text",
  message: "annotation",
  from,
  to,
  matchId: createMatchId(0, from, to, 0),
  suggestions,
  matchContext: "here is a [block text] match"
});

export const exampleCategoryIds = ["example-category"];

export const exampleRequestId = "set-id";

export const createBlockQueriesInFlight = (
  blockQueries: IBlock[],
  setId = exampleRequestId,
  categoryIds: string[] = exampleCategoryIds,
  pendingCategoryIds: string[] = categoryIds,
  total?: number
): { [setId: string]: IBlocksInFlightState } => ({
  [setId]: {
    totalBlocks: total || blockQueries.length,
    mapping: new Mapping(),
    categoryIds,
    pendingBlocks: blockQueries.map(input => ({
      block: input,
      pendingCategoryIds
    }))
  }
});

export const defaultDoc = createDoc(p("Example text to check"));

export const createInitialTr = (doc: Node = defaultDoc) => {
  const tr = new Transaction(doc);
  tr.doc = doc;
  tr.time = 0;
  return tr;
};

export const createInitialData = (doc: Node = defaultDoc, time = 0) => {
  const tr = createInitialTr(doc);
  tr.doc = doc;
  tr.time = time;
  return {
    tr,
    state: {
      config: {
        debug: false,
        requestMatchesOnDocModified: true,
        isActive: true,
        matchColours: defaultMatchColours
      },
      currentThrottle: 100,
      initialThrottle: 100,
      maxThrottle: 1000,
      decorations: DecorationSet.create(tr.doc, []),
      dirtiedRanges: [],
      currentMatches: [],
      selectedMatch: undefined,
      hoverId: undefined,
      highlightId: undefined,
      hoverInfo: undefined,
      trHistory: [tr],
      requestsInFlight: {},
      requestPending: false,
      requestErrors: []
    } as IPluginState
  };
};
