import {
  IMatchLibrary,
  IMatch,
  ISuggestion,
  IBlock,
  IMatcherResponse
} from "../../interfaces/IMatch";
import { createBlockId, createMatchId } from "../../utils/block";
import { IPluginState, IBlocksInFlightState } from "../../state/reducer";
import { Mapping } from "prosemirror-transform";
import { Transaction } from "prosemirror-state";
import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import { createDoc, p } from "./prosemirror";
import { createDecorationsForMatch } from "../../utils/decoration";

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

export const createMatcherResponse = (
  from: number,
  to: number,
  wordFrom: number = from,
  wordTo: number = from + 3,
  category = {
    id: "1",
    name: "Cat",
    colour: "eeeee"
  },
  suggestions = [] as ISuggestion[],
  requestId = exampleRequestId
): IMatcherResponse => ({
  requestId,
  categoryIds: [category.id],
  blocks: [
    {
      id: createBlockId(0, from, to),
      from,
      to,
      text: "block text"
    }
  ],
  matches: [
    {
      category,
      matchedText: "block text",
      message: "annotation",
      from: wordFrom,
      to: wordTo,
      matchId: createMatchId(0, wordFrom, wordTo, 0),
      suggestions
    }
  ]
});

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
  category,
  matchedText: "block text",
  message: "annotation",
  from,
  to,
  matchId: createMatchId(0, from, to, 0),
  suggestions
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
      debug: false,
      requestMatchesOnDocModified: true,
      currentThrottle: 100,
      initialThrottle: 100,
      maxThrottle: 1000,
      decorations: DecorationSet.create(tr.doc, []),
      dirtiedRanges: [],
      currentMatches: [],
      selectedMatch: undefined,
      hoverId: undefined,
      hoverInfo: undefined,
      trHistory: [tr],
      requestsInFlight: {},
      requestPending: false,
      errorMessage: undefined
    } as IPluginState
  };
};

export const addMatchesToState = (
  state: IPluginState<IMatch>,
  doc: any,
  outputs: IMatch[]
) => {
  const decorations = outputs.reduce(
    (set, output) => set.add(doc, createDecorationsForMatch(output)),
    new DecorationSet()
  );
  return {
    ...state,
    currentMatches: outputs,
    decorations
  };
};
