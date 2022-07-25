import { AllSelection, Transaction } from "prosemirror-state";
import {
  ActionSetConfigValue,
  ActionRequestError,
  ActionRequestMatchesSuccess,
  ActionRequestMatchesForDocument,
  ActionRequestMatchesForDirtyRanges,
  ActionHandleNewDirtyRanges,
  ActionNewHoverIdReceived,
  ActionNewHighlightIdReceived,
  ActionSelectMatch,
  NEW_HOVER_ID,
  NEW_HIGHLIGHT_ID,
  REQUEST_FOR_DIRTY_RANGES,
  REQUEST_FOR_DOCUMENT,
  REQUEST_SUCCESS,
  REQUEST_ERROR,
  REQUEST_COMPLETE,
  SELECT_MATCH,
  REMOVE_MATCH,
  REMOVE_ALL_MATCHES,
  APPLY_NEW_DIRTY_RANGES,
  SET_CONFIG_VALUE,
  Action,
  ActionRequestComplete,
  ActionRemoveMatch,
  SET_FILTER_STATE,
  ActionSetFilterState
} from "./actions";
import {
  IMatch,
  IRange,
  IMatchRequestError,
  IBlockWithSkippedRanges
} from "../interfaces/IMatch";
import { DecorationSet, Decoration } from "prosemirror-view";
import omit from "lodash/omit";
import {
  createDebugDecorationFromRange,
  DECORATION_DIRTY,
  DECORATION_INFLIGHT,
  removeDecorationsFromRanges,
  DECORATION_MATCH,
  createDecorationsForMatch,
  createDecorationsForMatches,
  IMatchTypeToColourMap,
  defaultMatchColours
} from "../utils/decoration";
import {
  mergeRanges,
  blockToRange,
  mapRanges,
  findOverlappingRangeIndex,
  removeOverlappingRanges
} from "../utils/range";
import { ExpandRanges, IFilterOptions } from "../createTyperighterPlugin";
import { getBlocksFromDocument, nodeContainsText } from "../utils/prosemirror";
import { Node } from "prosemirror-model";
import {
  selectSingleBlockInRequestInFlightById,
  selectRequestInFlightById,
  selectMatchByMatchId,
  selectBlocksInFlightById
} from "./selectors";
import { Mapping } from "prosemirror-transform";
import {
  createBlock,
  doNotSkipRanges,
  TGetSkippedRanges
} from "../utils/block";
import {
  addMatchesToState,
  deriveFilteredDecorations,
  getNewStateFromTransaction,
  isFilterStateStale
} from "./helpers";
import { TFilterMatches } from "../utils/plugin";

export interface IBlockInFlight {
  // The categories that haven't yet reported for this block.
  pendingCategoryIds: string[];
  block: IBlockWithSkippedRanges;
}

/**
 * A consumer-supplied predicate that allows consumers to ignore matches.
 * Handy when, for example, consumers know that parts of the document are
 * exempt from checks.
 */
export type IIgnoreMatchPredicate = (match: IMatch) => boolean;
export const includeAllMatches: IIgnoreMatchPredicate = () => false;

export interface IRequestInFlight {
  totalBlocks: number;
  // The category ids that were sent with the request.
  categoryIds: string[];
  pendingBlocks: IBlockInFlight[];
  mapping: Mapping;
}

export interface IPluginConfig {
  // Should we trigger a request for matches when the document is modified (e.g.
  // real-time checking)?
  requestMatchesOnDocModified: boolean;
  // Make pending and inflight checks visible as decorations on the document.
  showPendingInflightChecks: boolean;
  // The colours to use when rendering matches
  matchColours: IMatchTypeToColourMap;
}

export interface IPluginState<
  TFilterState extends unknown = unknown,
  TMatches extends IMatch = IMatch
> {
  config: IPluginConfig;
  // The current decorations the plugin is applying to the document.
  decorations: DecorationSet;
  // The current matches for the document.
  currentMatches: TMatches[];
  // The current matches, filtered by the current filterState and the
  // supplied filter predicate. This is cached in the state and only
  // recomputed when necessary – filtering decorations in the plugin
  // decoration mapping on every transaction is not performant.
  filteredMatches: TMatches[];
  // The current ranges that are marked as dirty, that is, have been
  // changed since the last request.
  dirtiedRanges: IRange[];
  // The currently selected match.
  selectedMatch: string | undefined;
  // The id of the match the user is currently hovering over –
  // e.g. to display a tooltip.
  hoverId: string | undefined;
  // The index of the clientRect closest to the hover mouseover event.
  // Spans can contain multiple clientRects when they're broken across lines.
  // By indicating which clientRect we're closest to, we can position our match
  // popup next to the correct section of the span.
  // See https://developer.mozilla.org/en-US/docs/Web/API/Element/getClientRects.
  hoverRectIndex: number | undefined;
  // The id of the match the user is currently highlighting –
  // triggers a focus state on the match decoration.
  highlightId: string | undefined;
  // Are there requests pending: have ranges been dirtied but
  // not yet been expanded and sent in a request?
  requestPending: boolean;
  // The sets of blocks that have been sent to the matcher service
  // and have not yet completed processing.
  requestsInFlight: {
    [requestId: string]: IRequestInFlight;
  };
  // The current error message.
  requestErrors: IMatchRequestError[];
  // The current state of the filter
  filterState: TFilterState;
  // Has the document changed since the last document check?
  docChangedSinceCheck: boolean;
  docIsEmpty: boolean;
}

// The transaction meta key that namespaces our actions.
export const PROSEMIRROR_TYPERIGHTER_ACTION = "PROSEMIRROR_TYPERIGHTER_ACTION";

interface IInitialStateOpts<
  TFilterState extends unknown,
  TMatch extends IMatch
> {
  doc: Node;
  matches?: TMatch[];
  ignoreMatch?: IIgnoreMatchPredicate;
  matchColours?: IMatchTypeToColourMap;
  filterOptions?: IFilterOptions<TFilterState, TMatch>;
  requestMatchesOnDocModified?: boolean;
}

/**
 * Initial state.
 */
export const createInitialState = <
  TFilterState extends unknown,
  TMatch extends IMatch
>({
  doc,
  matches = [],
  ignoreMatch = includeAllMatches,
  matchColours = defaultMatchColours,
  requestMatchesOnDocModified = false,
  filterOptions
}: IInitialStateOpts<TFilterState, TMatch>): IPluginState<
  TFilterState,
  TMatch
> => {
  const initialState = {
    config: {
      showPendingInflightChecks: false,
      requestMatchesOnDocModified,
      matchColours,
    },
    decorations: DecorationSet.create(
      doc,
      createDecorationsForMatches(matches)
    ),
    dirtiedRanges: [],
    currentMatches: [] as TMatch[],
    filteredMatches: [] as TMatch[],
    selectedMatch: undefined,
    hoverId: undefined,
    hoverRectIndex: undefined,
    highlightId: undefined,
    requestsInFlight: {},
    requestPending: false,
    requestErrors: [],
    filterState: filterOptions?.initialFilterState as TFilterState,
    docChangedSinceCheck: false,
    docIsEmpty: !nodeContainsText(doc)
  };

  const stateWithMatches = addMatchesToState(
    initialState,
    doc,
    matches,
    ignoreMatch
  );

  if (!filterOptions) {
    return stateWithMatches;
  }

  return deriveFilteredDecorations(
    doc,
    stateWithMatches,
    filterOptions.filterMatches
  );
};

export const createReducer = <TPluginState extends IPluginState>(
  expandRanges: ExpandRanges,
  ignoreMatch: IIgnoreMatchPredicate = includeAllMatches,
  filterMatches?: TFilterMatches<
    TPluginState["filterState"],
    TPluginState["currentMatches"][0]
  >,
  getIgnoredRanges: TGetSkippedRanges = doNotSkipRanges
) => {
  const handleMatchesRequestForDirtyRanges = createHandleMatchesRequestForDirtyRanges(
    expandRanges,
    getIgnoredRanges
  );
  const handleMatchesRequestForDocument = createHandleMatchesRequestForDocument(
    getIgnoredRanges
  );
  const handleNewHoverId = createHandleNewFocusState<TPluginState>("hoverId");
  const handleNewHighlightId = createHandleNewFocusState<TPluginState>(
    "highlightId"
  );
  return (
    tr: Transaction,
    incomingState: TPluginState,
    action?: Action<TPluginState>
  ): TPluginState => {
    // There are certain things we need to do every time the document is changed, e.g. mapping ranges.
    const state = tr.docChanged
      ? getNewStateFromTransaction(tr, incomingState)
      : incomingState;

    if (!action) {
      return state;
    }

    const applyNewState = () => {
      switch (action.type) {
        case NEW_HOVER_ID:
          return handleNewHoverId(tr, state, action);
        case NEW_HIGHLIGHT_ID:
          return handleNewHighlightId(tr, state, action);
        case REQUEST_FOR_DIRTY_RANGES:
          return handleMatchesRequestForDirtyRanges(tr, state, action);
        case REQUEST_FOR_DOCUMENT:
          return handleMatchesRequestForDocument(tr, state, action);
        case REQUEST_SUCCESS:
          return handleMatchesRequestSuccess(ignoreMatch)(tr, state, action);
        case REQUEST_ERROR:
          return handleMatchesRequestError(tr, state, action);
        case REQUEST_COMPLETE:
          return handleRequestComplete(tr, state, action);
        case SELECT_MATCH:
          return handleSelectMatch(tr, state, action);
        case REMOVE_MATCH:
          return handleRemoveMatch(tr, state, action);
        case REMOVE_ALL_MATCHES:
          return handleRemoveAllMatches(tr, state);
        case APPLY_NEW_DIRTY_RANGES:
          return handleNewDirtyRanges(tr, state, action);
        case SET_CONFIG_VALUE:
          return handleSetConfigValue(tr, state, action);
        case SET_FILTER_STATE:
          return handleSetFilterState(tr, state, action);
        default:
          return state;
      }
    };

    const newState = applyNewState();

    if (!isFilterStateStale(state, newState, filterMatches)) {
      return newState;
    }

    return deriveFilteredDecorations(tr.doc, newState, filterMatches);
  };
};

/**
 * Action handlers.
 */

/**
 * Handle the selection of a hover id.
 */
const handleSelectMatch = <TPluginState extends IPluginState>(
  _: unknown,
  state: TPluginState,
  action: ActionSelectMatch
): TPluginState => {
  return {
    ...state,
    selectedMatch: action.payload.matchId
  };
};

/**
 * Remove a match and its decoration from the state.
 */
const handleRemoveMatch = <TPluginState extends IPluginState>(
  _: unknown,
  state: TPluginState,
  { payload: { id } }: ActionRemoveMatch
): TPluginState => {
  const decorationToRemove = state.decorations.find(
    undefined,
    undefined,
    spec => spec.id === id
  );
  const decorations = decorationToRemove
    ? state.decorations.remove(decorationToRemove)
    : state.decorations;
  const currentMatches = state.currentMatches.filter(
    match => match.matchId !== id
  );
  return {
    ...state,
    decorations,
    currentMatches
  };
};

/**
 * Remove all matches and their decoration from the state.
 */
const handleRemoveAllMatches = <TPluginState extends IPluginState>(
  _: unknown,
  state: TPluginState
): TPluginState => {
  const decorationToRemove = state.decorations.find();

  const decorations = decorationToRemove
    ? state.decorations.remove(decorationToRemove)
    : state.decorations;

  return {
    ...state,
    decorations,
    currentMatches: [],
    requestErrors: []
  };
};

/**
 * Handle the receipt of a new focus state.
 */
const createHandleNewFocusState = <TPluginState extends IPluginState>(
  focusState: "highlightId" | "hoverId"
) => (
  tr: Transaction,
  state: TPluginState,
  action: ActionNewHoverIdReceived | ActionNewHighlightIdReceived
): TPluginState => {
  let decorations = state.decorations;
  const incomingHoverId = action.payload.matchId;
  const currentHoverId = state[focusState];

  // The current hover decorations are no longer valid -- remove them.
  const currentHoverDecorations = decorations.find(
    undefined,
    undefined,
    spec =>
      (spec.id === currentHoverId || spec.id === incomingHoverId) &&
      spec.type === DECORATION_MATCH
  );

  decorations = decorations.remove(currentHoverDecorations);

  // Add the new decorations for the current and incoming matches.
  const decorationData = [{ id: incomingHoverId, isSelected: true }];
  if (incomingHoverId !== currentHoverId) {
    decorationData.push({ id: currentHoverId, isSelected: false });
  }
  decorations = decorationData.reduce((acc, hoverData) => {
    const output = selectMatchByMatchId(state, hoverData.id || "");
    if (!output) {
      return acc;
    }
    return decorations.add(
      tr.doc,
      createDecorationsForMatch(
        output,
        hoverData.isSelected
      )
    );
  }, decorations);

  const hoverRectIndex =
    action.type === "NEW_HOVER_ID"
      ? action.payload.rectIndex
      : state.hoverRectIndex;

  return {
    ...state,
    decorations,
    hoverRectIndex,
    [focusState]: action.payload.matchId
  };
};

const handleNewDirtyRanges = <TPluginState extends IPluginState>(
  tr: Transaction,
  state: TPluginState,
  { payload: { ranges: dirtiedRanges } }: ActionHandleNewDirtyRanges
): TPluginState => {
  // Map our dirtied ranges through the current transaction, and append any new ranges it has dirtied.
  let newDecorations = state.config.showPendingInflightChecks
    ? state.decorations.add(
        tr.doc,
        dirtiedRanges.map(range => createDebugDecorationFromRange(range))
      )
    : state.decorations;

  // Remove any matches and associated decorations touched by the dirtied ranges from the doc
  newDecorations = removeDecorationsFromRanges(newDecorations, dirtiedRanges);
  const currentMatches = state.currentMatches.filter(
    output => findOverlappingRangeIndex(output, dirtiedRanges) === -1
  );

  const shouldPersistNewDirtyRanges = state.config.requestMatchesOnDocModified
    || !!Object.keys(state.requestsInFlight).length;

  return {
    ...state,
    currentMatches,
    decorations: newDecorations,
    requestPending: state.config.requestMatchesOnDocModified ? true : false,
    dirtiedRanges: shouldPersistNewDirtyRanges
      ? state.dirtiedRanges.concat(dirtiedRanges)
      : []
  };
};

/**
 * Handle a matches request for the current set of dirty ranges.
 */
const createHandleMatchesRequestForDirtyRanges = (
  expandRanges: ExpandRanges,
  getIgnoredRanges: TGetSkippedRanges
) => <TPluginState extends IPluginState>(
  tr: Transaction,
  state: TPluginState,
  { payload: { requestId, categoryIds } }: ActionRequestMatchesForDirtyRanges
): TPluginState => {
  const ranges = expandRanges(state.dirtiedRanges, tr.doc);
  const blocks = ranges.map(range =>
    createBlock(tr.doc, range, tr.time, getIgnoredRanges)
  );
  return handleRequestStart(requestId, blocks, categoryIds)(tr, state);
};

/**
 * Handle a matches request for the entire document.
 */
const createHandleMatchesRequestForDocument = (
  getIgnoredRanges: TGetSkippedRanges
) => <TPluginState extends IPluginState>(
  tr: Transaction,
  state: TPluginState,
  { payload: { requestId, categoryIds } }: ActionRequestMatchesForDocument
): TPluginState => {
  return handleRequestStart(
    requestId,
    getBlocksFromDocument(tr.doc, tr.time, getIgnoredRanges),
    categoryIds
  )(tr, state);
};

/**
 * Handle a matches request for a given set of blocks.
 */
const handleRequestStart = (
  requestId: string,
  blocks: IBlockWithSkippedRanges[],
  categoryIds: string[]
) => <TPluginState extends IPluginState>(
  tr: Transaction,
  state: TPluginState
): TPluginState => {
  // Replace any debug decorations, if they exist.
  const decorations = state.config.showPendingInflightChecks
    ? removeDecorationsFromRanges(state.decorations, blocks, [
        DECORATION_DIRTY
      ]).add(
        tr.doc,
        blocks.map(range => createDebugDecorationFromRange(range, false))
      )
    : state.decorations;

  const newBlocksInFlight: IBlockInFlight[] = blocks
    .map(block => ({
      block,
      pendingCategoryIds: categoryIds
    }))
    .filter(({ block }) => block.text.length !== 0);

  const newRequestInFlight = newBlocksInFlight.length ?
    {
      [requestId]: {
        totalBlocks: newBlocksInFlight.length,
        pendingBlocks: newBlocksInFlight,
        mapping: tr.mapping,
        categoryIds
      }
    } : {}

  return {
    ...state,
    requestErrors: [],
    decorations,
    // We reset the dirty ranges, as they've been expanded and sent in a request.
    dirtiedRanges: [],
    requestPending: false,
    requestsInFlight: {
      ...state.requestsInFlight,
      ...newRequestInFlight
    },
    docChangedSinceCheck: false
  };
};

const amendRequestInFlight = (
  state: IPluginState,
  requestId: string,
  blockId: string,
  categoryIds: string[]
) => {
  const currentRequestInFlight = selectRequestInFlightById(
    state,
    requestId
  );
  if (!currentRequestInFlight) {
    return state.requestsInFlight;
  }
  const newRequestInFlight: IRequestInFlight = {
    ...currentRequestInFlight,
    pendingBlocks: currentRequestInFlight.pendingBlocks.reduce(
      (acc, blockInFlight) => {
        // Don't modify blocks that don't match
        if (blockInFlight.block.id !== blockId) {
          return acc.concat(blockInFlight);
        }
        const newBlockInFlight = {
          ...blockInFlight,
          pendingCategoryIds: blockInFlight.pendingCategoryIds.filter(
            id => !categoryIds.includes(id)
          )
        };
        return newBlockInFlight.pendingCategoryIds.length
          ? acc.concat(newBlockInFlight)
          : acc;
      },
      [] as IBlockInFlight[]
    )
  };
  if (!newRequestInFlight.pendingBlocks.length) {
    return omit(state.requestsInFlight, requestId);
  }
  return {
    ...state.requestsInFlight,
    [requestId]: newRequestInFlight
  };
};

/**
 * Handle a response, decorating the document with any matches we've received.
 */
const handleMatchesRequestSuccess = (ignoreMatch: IIgnoreMatchPredicate) => <
  TMatch extends IMatch,
  TPluginState extends IPluginState<unknown, TMatch>
>(
  tr: Transaction,
  state: TPluginState,
  { payload: { response } }: ActionRequestMatchesSuccess<TPluginState>
): TPluginState => {
  if (!response) {
    return state;
  }

  const blocksInFlight = selectBlocksInFlightById(
    state,
    response.requestId,
    response.blocks.map(_ => _.id)
  );

  if (!blocksInFlight.length) {
    return state;
  }

  // Remove matches superceded by the incoming matches.
  let currentMatches = removeOverlappingRanges(
    state.currentMatches,
    blocksInFlight.map(_ => _.block),
    match => !response.categoryIds.includes(match.category.id)
  );

  // Remove decorations superceded by the incoming matches.
  const decsToRemove = blocksInFlight.reduce(
    (acc, blockInFlight) =>
      acc.concat(
        state.decorations
          .find(blockInFlight.block.from, blockInFlight.block.to, spec =>
            response.categoryIds.includes(spec.categoryId)
          )
          .concat(
            state.config.showPendingInflightChecks
              ? // Ditch any decorations marking inflight matches.
                state.decorations.find(
                  undefined,
                  undefined,
                  _ => _.type === DECORATION_INFLIGHT
                )
              : []
          )
      ),
    [] as Decoration[]
  );

  const currentMapping = selectRequestInFlightById(
    state,
    response.requestId
  )!.mapping;

  // Map our matches across any changes, filtering out inapplicable matches
  const docSelection = new AllSelection(tr.doc);
  const mappedMatchesToAdd = mapRanges(response.matches, currentMapping).filter(match =>
    match.to <= docSelection.to // Match should be within document bounds
      && match.to !== match.from // Match should not be zero width (can happen as a result of mapping)
      && !ignoreMatch(match) // Match should not be marked as ignored by consumer
  );

  // Add the response to the current matches.
  currentMatches = currentMatches.concat(mappedMatchesToAdd);

  // We don't apply incoming matches to ranges that have
  // been dirtied since they were requested.
  currentMatches = removeOverlappingRanges(currentMatches, state.dirtiedRanges);

  // Create our decorations for the newly current matches.
  const newDecorations = createDecorationsForMatches(mappedMatchesToAdd);

  // Amend the block queries in flight to remove the returned blocks and categories
  const newBlocksInFlight = blocksInFlight.reduce(
    (acc, blockInFlight) =>
      amendRequestInFlight(
        { ...state, requestsInFlight: acc },
        response.requestId,
        blockInFlight.block.id,
        response.categoryIds
      ),
    state.requestsInFlight
  );

  const dirtiedRanges = (state.config.requestMatchesOnDocModified || Object.keys(newBlocksInFlight).length)
    ? state.dirtiedRanges
    : []

  return {
    ...state,
    requestsInFlight: newBlocksInFlight,
    currentMatches,
    decorations: state.decorations
      .remove(decsToRemove)
      .add(tr.doc, newDecorations),
    dirtiedRanges
  };
};

/**
 * Handle a matches request error.
 */
const handleMatchesRequestError = <TPluginState extends IPluginState>(
  tr: Transaction,
  state: TPluginState,
  { payload: { matchRequestError } }: ActionRequestError
): TPluginState => {
  const { requestId, blockId, categoryIds } = matchRequestError;

  if (!blockId) {
    return {
      ...state,
      requestErrors: state.requestErrors.concat(matchRequestError)
    };
  }

  const requestsInFlight = selectRequestInFlightById(state, requestId);

  if (!requestsInFlight) {
    return state;
  }

  const blockInFlight = selectSingleBlockInRequestInFlightById(
    state,
    requestId,
    blockId
  );

  if (!blockInFlight) {
    return {
      ...state,
      requestErrors: state.requestErrors.concat(matchRequestError)
    };
  }

  const dirtiedRanges = blockInFlight
    ? mapRanges([blockToRange(blockInFlight.block)], requestsInFlight.mapping)
    : [];

  const decsToRemove = dirtiedRanges.reduce(
    (acc, range) =>
      acc.concat(
        state.decorations.find(
          range.from,
          range.to,
          _ => _.type === DECORATION_INFLIGHT
        )
      ),
    [] as Decoration[]
  );

  // When we get errors, we map the ranges due to be checked back
  // through the document and add them to the dirtied ranges to be
  // checked on the next pass.
  let decorations = state.decorations.remove(decsToRemove);

  if (dirtiedRanges.length && state.config.showPendingInflightChecks) {
    decorations = decorations.add(
      tr.doc,
      dirtiedRanges.map(range => createDebugDecorationFromRange(range))
    );
  }

  return {
    ...state,
    dirtiedRanges: dirtiedRanges.length
      ? mergeRanges(state.dirtiedRanges.concat(dirtiedRanges))
      : state.dirtiedRanges,
    decorations,
    requestsInFlight: amendRequestInFlight(
      state,
      requestId,
      blockId,
      categoryIds
    ),
    requestErrors: state.requestErrors.concat(matchRequestError)
  };
};

const handleRequestComplete = <TPluginState extends IPluginState>(
  _: Transaction,
  state: TPluginState,
  { payload: { requestId } }: ActionRequestComplete
): TPluginState => {
  const requestInFlight = selectRequestInFlightById(state, requestId);
  const hasUnfinishedWork =
    requestInFlight &&
    requestInFlight.pendingBlocks.some(
      block => block.pendingCategoryIds.length
    );
  if (requestInFlight && hasUnfinishedWork) {
    /* tslint:disable-next-line:no-console */
    console.warn(
      `Request ${requestId} was marked as complete, but there is still work remaining.`,
      requestInFlight.pendingBlocks
    );
  }
  return {
    ...state,
    requestsInFlight: omit(state.requestsInFlight, requestId)
  };
};

const handleSetConfigValue = <TPluginState extends IPluginState>(
  _: Transaction,
  state: TPluginState,
  { payload: { key, value } }: ActionSetConfigValue
): TPluginState => {
  const newState = {
    ...state,
    config: {
      ...state.config,
      [key]: value
    }
  };

  const shouldRemovePendingInflightDecos = key === "showPendingInflightChecks" && !!state.config.showPendingInflightChecks && value === false
  if (shouldRemovePendingInflightDecos) {
    return {
      ...newState,
      decorations: state.decorations.remove(
        state.decorations.find(
          undefined,
          undefined,
          spec =>
            spec.type === DECORATION_INFLIGHT || spec.type === DECORATION_DIRTY
        )
      )
    };
  }
  return newState;
};

const handleSetFilterState = <TPluginState extends IPluginState>(
  _: Transaction,
  state: TPluginState,
  { payload: { filterState } }: ActionSetFilterState<TPluginState>
): TPluginState => ({
  ...state,
  filterState
});
