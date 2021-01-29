import { DecorationSet } from "prosemirror-view";
import { Mapping } from "prosemirror-transform";
import { EditorState, Transaction } from "prosemirror-state";
import { Node } from "prosemirror-model";
import {
  IPluginState,
  IIgnoreMatchPredicate,
  includeAllMatches
} from "./reducer";
import {
  createDebugDecorationFromRange,
  createDecorationsForMatch,
  createDecorationsForMatches,
  removeDecorationsFromRanges
} from "../utils/decoration";
import { TFilterMatches } from "../utils/plugin";
import { getDirtiedRangesFromTransaction } from "../utils/prosemirror";
import { findOverlappingRangeIndex, mapAndMergeRanges, mapRanges } from "../utils/range";
import { IMatch, IRange } from "../interfaces/IMatch";

export const addMatchesToState = <TPluginState extends IPluginState>(
  state: TPluginState,
  doc: any,
  matches: Array<TPluginState["currentMatches"][number]>,
  ignoreMatch: IIgnoreMatchPredicate = includeAllMatches
) => {
  const matchesToApply = matches.filter(match => !ignoreMatch(match) && isMatchValid(match));
  const decorations = matchesToApply.reduce(
    (set, output) => set.add(doc, createDecorationsForMatch(output)),
    DecorationSet.empty
  );
  return {
    ...state,
    currentMatches: matchesToApply,
    decorations
  };
};

export const isMatchValid = (match: IMatch) => match.from < match.to;

/**
 * Is the current filter state stale, given the incoming state?
 */
export const isFilterStateStale = <TPluginState extends IPluginState>(
  oldState: TPluginState,
  newState: TPluginState,
  filterMatches?: TFilterMatches<TPluginState["filterState"]>
): filterMatches is TFilterMatches<TPluginState["filterState"]> => {
  const matchesChanged = oldState.currentMatches !== newState.currentMatches;
  const filterStateChanged = oldState.filterState !== newState.filterState;
  const noFilterApplied = !oldState.filterState && !newState.filterState;

  return (
    !!filterMatches &&
    (filterStateChanged || (matchesChanged && !noFilterApplied))
  );
};


/**
 * Get a new plugin state from the incoming transaction.
 *
 * We need to respond to each transaction in our reducer, whether or not there's
 * an action present, in order to maintain mappings and respond to user input.
 */
export const getNewStateFromTransaction = <TPluginState extends IPluginState>(
  tr: Transaction,
  pluginState: TPluginState,
  oldState: EditorState
): TPluginState => {
  if (!tr.docChanged) {
    return pluginState;
  }

  const newDirtiedRanges = getDirtiedRangesFromTransaction(oldState.doc, tr);
  const newPluginState = newDirtiedRanges.length
    ? applyNewDirtyRanges(tr, pluginState, newDirtiedRanges)
    : pluginState;

  const mappedRequestsInFlight = Object.entries(
    newPluginState.requestsInFlight
  ).reduce((acc, [requestId, requestsInFlight]) => {
    // We create a new mapping here to preserve state immutability, as
    // appendMapping mutates an existing mapping.
    const mapping = new Mapping();
    mapping.appendMapping(requestsInFlight.mapping);
    mapping.appendMapping(tr.mapping);
    return {
      ...acc,
      [requestId]: {
        ...requestsInFlight,
        mapping
      }
    };
  }, {});

  return {
    ...newPluginState,
    decorations: newPluginState.decorations.map(tr.mapping, tr.doc),
    dirtiedRanges: mapAndMergeRanges(newPluginState.dirtiedRanges, tr.mapping),
    currentMatches: mapRanges(newPluginState.currentMatches, tr.mapping),
    requestsInFlight: mappedRequestsInFlight,
    docChangedSinceCheck: true
  };
};


const applyNewDirtyRanges = <TPluginState extends IPluginState>(
  tr: Transaction,
  state: TPluginState,
  dirtiedRanges: IRange[]
): TPluginState => {
  // Map our dirtied ranges through the current transaction, and append any new ranges it has dirtied.
  let newDecorations = state.config.debug
    ? state.decorations.add(
        tr.doc,
        dirtiedRanges.map(range => createDebugDecorationFromRange(range))
      )
    : state.decorations;

  // Remove any matches and associated decorations touched by the dirtied ranges from the doc
  newDecorations = removeDecorationsFromRanges(newDecorations, dirtiedRanges);
  const currentMatches = state.currentMatches.filter(
    match => findOverlappingRangeIndex(match, dirtiedRanges) === -1
      && isMatchValid(match)
  );

  return {
    ...state,
    currentMatches,
    decorations: newDecorations,
    // We only care about storing dirtied ranges if we're validating
    // in response to user edits.
    requestPending: state.config.requestMatchesOnDocModified ? true : false,
    dirtiedRanges: state.config.requestMatchesOnDocModified
      ? state.dirtiedRanges.concat(dirtiedRanges)
      : []
  };
};

export const deriveFilteredDecorations = <TPluginState extends IPluginState>(
  doc: Node,
  newState: TPluginState,
  filterMatches: TFilterMatches<
    TPluginState["filterState"],
    TPluginState["currentMatches"][number]
  >
): TPluginState => {
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
    matchesWithoutDecorations,
    newState.config.matchColours
  );

  const decorationsToRemove = newState.decorations.find(
    undefined,
    undefined,
    spec => !filteredMatchIds.includes(spec.id)
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
