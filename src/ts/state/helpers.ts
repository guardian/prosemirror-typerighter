
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
import { TFilterMatches } from "../utils/plugin";
import { mapAndMergeRanges, mapRange, mapRanges } from "../utils/range";
import { nodeContainsText } from "../utils/prosemirror";

export const addMatchesToState = <TPluginState extends IPluginState>(
  state: TPluginState,
  doc: any,
  matches: Array<TPluginState["currentMatches"][number]>,
  ignoreMatch: IIgnoreMatchPredicate = includeAllMatches
) => {
  const matchesToApply = matches.filter(match => !ignoreMatch(match));
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


/**
 * Get a new plugin state from the incoming transaction.
 *
 * We need to respond to each transaction in our reducer, whether or not there's
 * an action present, in order to maintain mappings and respond to user input.
 */
export const getNewStateFromTransaction = <TPluginState extends IPluginState>(
  tr: Transaction,
  incomingState: TPluginState
): TPluginState => {
  const mappedRequestsInFlight = Object.entries(
    incomingState.requestsInFlight
  ).reduce((acc, [requestId, requestsInFlight]) => {
    // We create a new mapping here to preserve state immutability, as
    // appendMapping mutates an existing mapping.
    const mapping = new Mapping();
    mapping.appendMapping(requestsInFlight.mapping);
    mapping.appendMapping(tr.mapping);

    const mappedPendingBlocks = requestsInFlight.pendingBlocks.map(blockInFlight => ({
      pendingCategoryIds: blockInFlight.pendingCategoryIds,
      block: mapRange(blockInFlight.block, tr.mapping)
    }));

    return {
      ...acc,
      [requestId]: {
        ...requestsInFlight,
        pendingBlocks: mappedPendingBlocks,
        mapping
      }
    };
  }, {});
  return {
    ...incomingState,
    decorations: incomingState.decorations.map(tr.mapping, tr.doc),
    dirtiedRanges: mapAndMergeRanges(incomingState.dirtiedRanges, tr.mapping),
    currentMatches: mapRanges(incomingState.currentMatches, tr.mapping),
    requestsInFlight: mappedRequestsInFlight,
    docChangedSinceCheck: true,
    docIsEmpty: !nodeContainsText(tr.doc)
  };
};
