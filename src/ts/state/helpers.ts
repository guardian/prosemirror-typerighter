
import { Node } from "prosemirror-model";
import { Mapping } from "prosemirror-transform";
import { Transaction } from "prosemirror-state";
import {
  IPluginState,
  IIgnoreMatchPredicate,
  includeAllMatches
} from "./reducer";
import {
  createDecorationsForMatch,
  createDecorationsForMatches
} from "../utils/decoration";
import { DecorationSet } from "prosemirror-view";
import { IFilterMatches } from "../utils/plugin";
import { mapAndMergeRanges, mapRange, mapRanges } from "../utils/range";
import { nodeContainsText } from "../utils/prosemirror";
import { produce } from "immer";
import { Match } from "../interfaces/IMatch";

// Immutable(ish) empty defaults
export const emptyObject = Object.freeze({});
export const emptyArray = Object.freeze(Array());

export const addMatchesToState = (
  state: IPluginState,
  doc: any,
  matches: Array<IPluginState["currentMatches"][number]>,
  ignoreMatch: IIgnoreMatchPredicate = includeAllMatches
): IPluginState => {
  const currentMatches = matches.length
    ? matches.filter(match => !ignoreMatch(match))
    : (emptyArray as Match[]);
  const decorations = currentMatches.reduce(
    (set, output) => set.add(doc, createDecorationsForMatch(output)),
    DecorationSet.empty
  );
  return {
    ...state,
    currentMatches,
    decorations
  };
};

/**
 * Is the current filter state stale, given the incoming state?
 */
export const isFilterStateStale = (
  oldState: IPluginState,
  newState: IPluginState,
  filterMatches?: IFilterMatches
): filterMatches is IFilterMatches => {
  const matchesChanged = oldState.currentMatches !== newState.currentMatches;
  const filterStateChanged = oldState.filterState !== newState.filterState;
  const noFilterApplied = !oldState.filterState && !newState.filterState;

  return (
    !!filterMatches &&
    (filterStateChanged || (matchesChanged && !noFilterApplied))
  );
};

export const deriveFilteredDecorations = (
  doc: Node,
  newState: IPluginState,
  filterMatches: IFilterMatches
): IPluginState => {
  const filteredMatches = filterMatches(
    newState.filterState,
    newState.currentMatches
  );
  const filteredMatchIds = filteredMatches.map(_ => _.matchId);

  const matchIdsWithDecorations = newState.decorations
    .find()
    .map(_ => _.spec.id);

  const matchesWithoutDecorations = filteredMatches.filter(
    match => !matchIdsWithDecorations.includes(match.matchId)
  );

  const decorationsToAdd = createDecorationsForMatches(
    matchesWithoutDecorations
  );

  const decorationsToRemove = newState.decorations.find(
    undefined,
    undefined,
    spec => spec.id && !filteredMatchIds.includes(spec.id)
  );

  const decorations = newState.decorations
    .remove(decorationsToRemove)
    .add(doc, decorationsToAdd);

  return {
    ...newState,
    filteredMatches,
    decorations
  };
};


/**
 * Get a new plugin state from the incoming transaction.
 *
 * We need to respond to each transaction in our reducer, whether or not there's
 * an action present, in order to maintain mappings and respond to user input.
 *
 * This function takes care to preserve the object identity of its properties,
 * so consuming code can use a shallow identity comparison to determine whether
 * something has changed.
 */
export const getNewStateFromTransaction = (
  tr: Transaction,
  incomingState: IPluginState
): IPluginState => {
  const mappedRequestsInFlight = Object.entries(
    incomingState.requestsInFlight
  ).reduce((acc, [requestId, requestsInFlight]) => {
    // We create a new mapping here to preserve state immutability, as
    // appendMapping mutates an existing mapping.
    const mapping = new Mapping();
    mapping.appendMapping(requestsInFlight.mapping);
    mapping.appendMapping(tr.mapping);

    const mappedPendingBlocks = requestsInFlight.pendingBlocks.map(
      blockInFlight => ({
        pendingCategoryIds: blockInFlight.pendingCategoryIds,
        block: mapRange(blockInFlight.block, tr.mapping)
      })
    );

    return {
      ...acc,
      [requestId]: {
        ...requestsInFlight,
        pendingBlocks: mappedPendingBlocks,
        mapping
      }
    };
  }, emptyObject);

  return produce(incomingState, draftState => {
    draftState.decorations = draftState.decorations.map(tr.mapping, tr.doc);

    draftState.dirtiedRanges = mapAndMergeRanges(
      incomingState.dirtiedRanges,
      tr.mapping
    );

    draftState.currentMatches = draftState.currentMatches.map(match => ({
      ...match,
      from: tr.mapping.map(match.from),
      to: tr.mapping.map(match.to),
      ranges: mapRanges(match.ranges, tr.mapping)
    }));

    draftState.requestsInFlight = mappedRequestsInFlight;
    draftState.docChangedSinceCheck = true;
    draftState.docIsEmpty = !nodeContainsText(tr.doc);
  });
};
