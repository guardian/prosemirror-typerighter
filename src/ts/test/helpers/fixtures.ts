import {
  IValidationLibrary,
  IMatches,
  ISuggestion,
  IBlock,
  IValidationResponse
} from "../../interfaces/IValidation";
import { createBlockId, createMatchId } from "../../utils/validation";
import { IInFlightValidationSetState, IPluginState } from "../../state/reducer";
import { Mapping } from "prosemirror-transform";
import { Transaction } from "prosemirror-state";
import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import { createDoc, p } from "./prosemirror";
import { createDecorationForValidationRange } from "../../utils/decoration";

export const validationLibrary: IValidationLibrary = [
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

export const createValidationResponse = (
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
  requestId: string = exampleRequestId
): IValidationResponse => ({
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
      annotation: "annotation",
      from: wordFrom,
      to: wordTo,
      matchId: createMatchId(0, wordFrom, wordTo, 0),
      suggestions
    }
  ]
});

export const createBlockMatches = (
  from: number,
  to: number = from + 3,
  suggestions = [] as ISuggestion[],
  category = {
    id: "1",
    name: "Cat",
    colour: "eeeee"
  }
): IMatches => ({
  category,
  annotation: "annotation",
  from,
  to,
  matchId: createMatchId(0, from, to, 0),
  suggestions
});

export const exampleCategoryIds = ["example-category"];

export const exampleRequestId = "set-id";

export const createBlockQueriesInFlight = (
  setId: string,
  blockQueries: IBlock[],
  categoryIds: string[] = exampleCategoryIds,
  pendingCategoryIds: string[] = categoryIds,
  total?: number
): { [setId: string]: IInFlightValidationSetState } => ({
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

export const defaultDoc = createDoc(p("Example text to validate"));

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
      validateOnModify: true,
      currentThrottle: 100,
      initialThrottle: 100,
      maxThrottle: 1000,
      decorations: DecorationSet.create(tr.doc, []),
      dirtiedRanges: [],
      currentValidations: [],
      selectedMatch: undefined,
      hoverId: undefined,
      hoverInfo: undefined,
      trHistory: [tr],
      blockQueriesInFlight: {},
      validationPending: false,
      error: undefined
    } as IPluginState
  };
};

export const addOutputsToState = (
  state: IPluginState<IMatches>,
  doc: any,
  outputs: IMatches[]
) => {
  const decorations = outputs.reduce(
    (set, output) => set.add(doc, createDecorationForValidationRange(output)),
    new DecorationSet()
  );
  return {
    ...state,
    currentValidations: outputs,
    decorations
  };
};
