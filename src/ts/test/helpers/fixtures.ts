import {
  IValidationLibrary,
  IMatches,
  ISuggestion,
  IBlockQuery,
  IValidationResponse
} from "../../interfaces/IValidation";
import { createValidationId, createMatchId } from "../../utils/validation";
import { IBlockQueriesInFlightState, IPluginState } from "../../state/reducer";
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

export const createBlockQuery = (
  from: number,
  to: number,
  text = "str"
): IBlockQuery => ({
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
  validationSetId: string = exampleValidationSetId,
): IValidationResponse => ({
  validationSetId,
  categoryIds: [category.id],
  blocks: [
    {
      id: createValidationId(0, from, to),
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

export const exampleValidationSetId = "set-id";

export const createBlockQueriesInFlight = (
  setId: string,
  blockQueries: IBlockQuery[],
  allCategoryIds: string[] = exampleCategoryIds,
  remainingCategoryIds: string[] = allCategoryIds,
  total?: number
): { [setId: string]: IBlockQueriesInFlightState } => ({
  [setId]: {
    total: total || blockQueries.length,
    current: blockQueries.map(input => ({
      blockQuery: input,
      mapping: new Mapping(),
      allCategoryIds,
      remainingCategoryIds
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
