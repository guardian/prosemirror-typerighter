import { Transaction } from "prosemirror-state";
import {
  ActionSetValidateOnModifyState,
  ActionSetDebugState,
  ActionValidationRequestError,
  ActionValidationResponseReceived,
  ActionValidationRequestForDocument,
  ActionValidationRequestForDirtyRanges,
  ActionHandleNewDirtyRanges,
  ActionNewHoverIdReceived,
  ActionSelectValidation,
  NEW_HOVER_ID,
  VALIDATION_REQUEST_FOR_DIRTY_RANGES,
  VALIDATION_REQUEST_FOR_DOCUMENT,
  VALIDATION_REQUEST_SUCCESS,
  VALIDATION_REQUEST_ERROR,
  SELECT_VALIDATION,
  APPLY_NEW_DIRTY_RANGES,
  SET_DEBUG_STATE,
  SET_VALIDATE_ON_MODIFY_STATE,
  Action
} from "./actions";
import { IMatches, IBlockQuery, IRange } from "../interfaces/IValidation";
import { DecorationSet, Decoration } from "prosemirror-view";
import omit from "lodash/omit";
import {
  createDebugDecorationFromRange,
  DECORATION_DIRTY,
  DECORATION_INFLIGHT,
  removeDecorationsFromRanges,
  createDecorationForValidationRange,
  DECORATION_VALIDATION,
  createDecorationsForValidationRanges
} from "../utils/decoration";
import {
  mergeRanges,
  validationInputToRange,
  mapAndMergeRanges,
  mapRanges,
  findOverlappingRangeIndex,
  removeOverlappingRanges
} from "../utils/range";
import { ExpandRanges } from "../createValidationPlugin";
import { createValidationBlocksForDocument } from "../utils/prosemirror";
import { Node } from "prosemirror-model";
import {
  selectSingleBlockQueryInFlightById,
  selectBlockQueriesInFlightForSet,
  selectBlockMatchesByMatchId,
  selectBlockQueriesInFlightById
} from "./selectors";
import { Mapping } from "prosemirror-transform";
import { createValidationBlock } from "../utils/validation";

/**
 * Information about the span element the user is hovering over.
 */
export interface IStateHoverInfo {
  // The offsetLeft property of the element relative to the document container.
  // If the span covers multiple lines, this will be the point that the span
  // starts on the line - for the left position of the bounding rectangle see
  // `left`.
  offsetLeft: number;
  // The offsetTop property of the element relative to the document container.
  offsetTop: number;
  // The left property from the element's bounding rectangle.
  left: number;
  // The top property from the element's bounding rectangle.
  top: number;
  // The height of the element.
  height: number;
  // The x coordinate of the mouse position relative to the element
  mouseOffsetX: number;
  // The y coordinate of the mouse position relative to the element
  mouseOffsetY: number;
  // The height the element would have if it occupied a single line.
  // Useful when determining where to put a tooltip if the user
  // is hovering over a span that covers several lines.
  heightOfSingleLine: number;
}

export interface IInFlightBlockQuery {
  // The categories that haven't yet reported for this block.
  pendingCategoryIds: string[];
  blockQuery: IBlockQuery;
}

export interface IInFlightValidationSetState {
  totalBlocks: number;
  // The category ids that were sent with the request.
  categoryIds: string[];
  pendingBlocks: IInFlightBlockQuery[];
  mapping: Mapping;
}

export interface IPluginState<TBlockMatches extends IMatches = IMatches> {
  // Is the plugin in debug mode? Debug mode adds marks to show dirtied
  // and expanded ranges.
  debug: boolean;
  // Should we trigger validations when the document is modified?
  validateOnModify: boolean;
  // The current decorations the plugin is applying to the document.
  decorations: DecorationSet;
  // The current validation outputs for the document.
  currentValidations: TBlockMatches[];
  // The current ranges that are marked as dirty, that is, have been
  // changed since the last validation pass.
  dirtiedRanges: IRange[];
  // The currently selected match.
  selectedMatch: string | undefined;
  // The id of the validation the user is currently hovering over.
  hoverId: string | undefined;
  // See StateHoverInfo.
  hoverInfo: IStateHoverInfo | undefined;
  // Are there validations pending: have ranges been dirtied but
  // not yet been expanded and sent for validation?
  validationPending: boolean;
  // The sets of blocks that have been sent to the validation service
  // and have not yet completed processing.
  blockQueriesInFlight: {
    [validationSetId: string]: IInFlightValidationSetState;
  };
  // The current error status.
  error: string | undefined;
}

// The transaction meta key that namespaces our actions.
<<<<<<< HEAD:src/ts/state/state.ts
const VALIDATION_PLUGIN_ACTION = "VALIDATION_PLUGIN_ACTION";

/**
 * Action types.
 */

const VALIDATION_REQUEST_FOR_DIRTY_RANGES = "VAlIDATION_REQUEST_START" as const;
const VALIDATION_REQUEST_FOR_DOCUMENT = "VALIDATION_REQUEST_FOR_DOCUMENT" as const;
const VALIDATION_REQUEST_SUCCESS = "VALIDATION_REQUEST_SUCCESS" as const;
const VALIDATION_REQUEST_ERROR = "VALIDATION_REQUEST_ERROR" as const;
const NEW_HOVER_ID = "NEW_HOVER_ID" as const;
const SELECT_VALIDATION = "SELECT_VALIDATION" as const;
const APPLY_NEW_DIRTY_RANGES = "HANDLE_NEW_DIRTY_RANGES" as const;
const SET_DEBUG_STATE = "SET_DEBUG_STATE" as const;
const SET_VALIDATE_ON_MODIFY_STATE = "SET_VALIDATE_ON_MODIFY_STATE" as const;

/**
 * Action creators.
 */

export const validationRequestForDirtyRanges = (validationSetId: string) => ({
  type: VALIDATION_REQUEST_FOR_DIRTY_RANGES,
  payload: { validationSetId }
});
type ActionValidationRequestForDirtyRanges = ReturnType<
  typeof validationRequestForDirtyRanges
>;

export const validationRequestForDocument = (validationSetId: string) => ({
  type: VALIDATION_REQUEST_FOR_DOCUMENT,
  payload: { validationSetId }
});
type ActionValidationRequestForDocument = ReturnType<
  typeof validationRequestForDocument
>;

export const validationRequestSuccess = <
  TValidationMeta extends IValidationOutput
>(
  response: IValidationResponse<TValidationMeta>
) => ({
  type: VALIDATION_REQUEST_SUCCESS,
  payload: { response }
});
// tslint:disable-next-line:interface-over-type-literal
type ActionValidationResponseReceived<
  TValidationOutput extends IValidationOutput
> = {
  type: "VALIDATION_REQUEST_SUCCESS";
  payload: { response: IValidationResponse<TValidationOutput> };
};

export const validationRequestError = (validationError: IValidationError) => ({
  type: VALIDATION_REQUEST_ERROR,
  payload: { validationError }
});
type ActionValidationRequestError = ReturnType<typeof validationRequestError>;

export const newHoverIdReceived = (
  hoverId: string | undefined,
  hoverInfo?: IStateHoverInfo | undefined
) => ({
  type: NEW_HOVER_ID,
  payload: { hoverId, hoverInfo }
});
type ActionNewHoverIdReceived = ReturnType<typeof newHoverIdReceived>;

export const applyNewDirtiedRanges = (ranges: IRange[]) => ({
  type: APPLY_NEW_DIRTY_RANGES,
  payload: { ranges }
});
type ActionHandleNewDirtyRanges = ReturnType<typeof applyNewDirtiedRanges>;

export const selectMatch = (matchId: string) => ({
  type: SELECT_VALIDATION,
  payload: { matchId }
});
type ActionSelectValidation = ReturnType<typeof selectMatch>;

export const setDebugState = (debug: boolean) => ({
  type: SET_DEBUG_STATE,
  payload: { debug }
});
type ActionSetDebugState = ReturnType<typeof setDebugState>;

export const setValidateOnModifyState = (validateOnModify: boolean) => ({
  type: SET_VALIDATE_ON_MODIFY_STATE,
  payload: { validateOnModify }
});
type ActionSetValidateOnModifyState = ReturnType<
  typeof setValidateOnModifyState
>;

type Action<TValidationMeta extends IValidationOutput> =
  | ActionNewHoverIdReceived
  | ActionValidationResponseReceived<TValidationMeta>
  | ActionValidationRequestForDirtyRanges
  | ActionValidationRequestForDocument
  | ActionValidationRequestError
  | ActionSelectValidation
  | ActionHandleNewDirtyRanges
  | ActionSetDebugState
  | ActionSetValidateOnModifyState;
=======
export const VALIDATION_PLUGIN_ACTION = "VALIDATION_PLUGIN_ACTION";
>>>>>>> Migrate state management to individual files for ease of use; nest matches inside blocks to ensure clean mappings; update treatment of incoming categories and blocks to allow arbitrary combinations of either:src/ts/state/reducer.ts

/**
 * Initial state.
 */
export const createInitialState = <TValidationMeta extends IMatches>(
  doc: Node
): IPluginState<TValidationMeta> => ({
  debug: false,
  validateOnModify: false,
  decorations: DecorationSet.create(doc, []),
  dirtiedRanges: [],
  currentValidations: [],
  selectedMatch: undefined,
  hoverId: undefined,
  hoverInfo: undefined,
  blockQueriesInFlight: {},
  validationPending: false,
  error: undefined
});

<<<<<<< HEAD:src/ts/state/state.ts
/**
 * Selectors.
 */

export const selectValidationsInFlight = <
  TValidationMeta extends IValidationOutput
>(
  state: IPluginState<TValidationMeta>
) => {
  return state.validationsInFlight.validations;
};

export const selectValidationByMatchId = <
  TValidationMeta extends IValidationOutput
>(
  state: IPluginState<TValidationMeta>,
  matchId: string
): TValidationMeta | undefined =>
  state.currentValidations.find(validation => validation.matchId === matchId);

export const selectAllAutoFixableValidations = <
  TValidationMeta extends IValidationOutput
>(
  state: IPluginState<TValidationMeta>
): TValidationMeta[] =>
  state.currentValidations.filter(_ => _.autoApplyFirstSuggestion);

export const selectValidationsInFlightForSet = <
  TValidationMeta extends IValidationOutput
>(
  state: IPluginState<TValidationMeta>,
  validationSetId: string
): IValidationInFlightState | undefined => {
  return state.validationsInFlight[validationSetId];
};

export const selectValidationInFlightById = <
  TValidationMeta extends IValidationOutput
>(
  state: IPluginState<TValidationMeta>,
  validationSetId: string,
  validationId: string
): IValidationInFlight | undefined => {
  const validationInFlightState = selectValidationsInFlightForSet(
    state,
    validationSetId
  );
  if (!validationInFlightState) {
    return;
  }
  return validationInFlightState.current.find(
    _ => _.validationInput.validationId === validationId
  );
};

export const selectAllValidationsInFlight = <
  TValidationMeta extends IValidationOutput
>(
  state: IPluginState<TValidationMeta>
): IValidationInFlight[] =>
  Object.values(state.validationsInFlight).reduce(
    (acc, value) => acc.concat(value.current),
    [] as IValidationInFlight[]
  );

type TSelectValidationInFlight = Array<{
  validationSetId: string;
  total: number;
  current: IValidationInFlight[];
}>;

export const selectNewValidationInFlight = <
  TValidationMeta extends IValidationOutput
>(
  oldState: IPluginState<TValidationMeta>,
  newState: IPluginState<TValidationMeta>
): TSelectValidationInFlight =>
  Object.keys(newState.validationsInFlight).reduce(
    (acc, validationSetId) =>
      !oldState.validationsInFlight[validationSetId]
        ? acc.concat({
            validationSetId,
            ...selectValidationsInFlightForSet(newState, validationSetId)!
          })
        : acc,
    [] as TSelectValidationInFlight
  );

export const selectPercentRemaining = <
  TValidationMeta extends IValidationOutput
>(
  state: IPluginState<TValidationMeta>
) => {
  const [sumOfTotals, sumOfValidations] = Object.values(
    state.validationsInFlight
  ).reduce(
    ([totalsSum, currentSum], _) => [
      totalsSum + _.total,
      currentSum + _.current.length
    ],
    [0, 0]
  );
  return sumOfValidations ? (sumOfValidations / sumOfTotals) * 100 : 0;
};

export const selectSuggestionAndRange = <
  TValidationMeta extends IValidationOutput
>(
  state: IPluginState<TValidationMeta>,
  matchId: string,
  suggestionIndex: number
) => {
  const output = selectValidationByMatchId(state, matchId);
  if (!output) {
    return null;
  }
  const suggestion = output.suggestions && output.suggestions[suggestionIndex];
  if (!suggestion) {
    return null;
  }
  return {
    from: output.from,
    to: output.to,
    suggestion
  };
};

/**
 * Reducer.
 */

const createValidationPluginReducer = (expandRanges: ExpandRanges) => {
=======
export const createValidationPluginReducer = (expandRanges: ExpandRanges) => {
>>>>>>> Migrate state management to individual files for ease of use; nest matches inside blocks to ensure clean mappings; update treatment of incoming categories and blocks to allow arbitrary combinations of either:src/ts/state/reducer.ts
  const handleValidationRequestForDirtyRanges = createHandleValidationRequestForDirtyRanges(
    expandRanges
  );
  return <TValidationMeta extends IMatches>(
    tr: Transaction,
    incomingState: IPluginState<TValidationMeta>,
    action?: Action<TValidationMeta>
  ): IPluginState<TValidationMeta> => {
    // There are certain things we need to do every time a transaction is dispatched, e.g. mapping ranges.
    const state = getNewStateFromTransaction(tr, incomingState);

    if (!action) {
      return state;
    }

    switch (action.type) {
      case NEW_HOVER_ID:
        return handleNewHoverId(tr, state, action);
      case VALIDATION_REQUEST_FOR_DIRTY_RANGES:
        return handleValidationRequestForDirtyRanges(tr, state, action);
      case VALIDATION_REQUEST_FOR_DOCUMENT:
        return handleValidationRequestForDocument(tr, state, action);
      case VALIDATION_REQUEST_SUCCESS:
        return handleValidationRequestSuccess(tr, state, action);
      case VALIDATION_REQUEST_ERROR:
        return handleValidationRequestError(tr, state, action);
      case SELECT_VALIDATION:
        return handleSelectValidation(tr, state, action);
      case APPLY_NEW_DIRTY_RANGES:
        return handleNewDirtyRanges(tr, state, action);
      case SET_DEBUG_STATE:
        return handleSetDebugState(tr, state, action);
      case SET_VALIDATE_ON_MODIFY_STATE:
        return handleSetValidateOnModifyState(tr, state, action);
      default:
        return state;
    }
  };
};

/**
 * Get a new plugin state from the incoming transaction.
 *
 * We need to respond to each transaction in our reducer, whether or not there's
 * an action present, in order to maintain mappings and respond to user input.
 */
const getNewStateFromTransaction = <TValidationMeta extends IMatches>(
  tr: Transaction,
  incomingState: IPluginState<TValidationMeta>
): IPluginState<TValidationMeta> => {
  const mappedblockQueriesInFlight = Object.entries(
    incomingState.blockQueriesInFlight
  ).reduce((acc, [validationSetId, blockQueriesInFlight]) => {
    // We create a new mapping here to preserve state immutability, as
    // appendMapping mutates an existing mapping.
    const mapping = new Mapping();
    mapping.appendMapping(blockQueriesInFlight.mapping);
    mapping.appendMapping(tr.mapping);
    return {
      ...acc,
      [validationSetId]: {
        ...blockQueriesInFlight,
        mapping
      }
    };
  }, {});
  return {
    ...incomingState,
    decorations: incomingState.decorations.map(tr.mapping, tr.doc),
    dirtiedRanges: mapAndMergeRanges(incomingState.dirtiedRanges, tr.mapping),
    currentValidations: mapRanges(incomingState.currentValidations, tr.mapping),
    blockQueriesInFlight: mappedblockQueriesInFlight
  };
};

/**
 * Action handlers.
 */

/**
 * Handle the selection of a hover id.
 */
const handleSelectValidation = <TValidationMeta extends IMatches>(
  _: unknown,
  state: IPluginState<TValidationMeta>,
  action: ActionSelectValidation
): IPluginState<TValidationMeta> => {
  return {
    ...state,
    selectedMatch: action.payload.matchId
  };
};

/**
 * Handle the receipt of a new hover id.
 */
const handleNewHoverId = <TValidationMeta extends IMatches>(
  tr: Transaction,
  state: IPluginState<TValidationMeta>,
  action: ActionNewHoverIdReceived
): IPluginState<TValidationMeta> => {
  let decorations = state.decorations;
  const incomingHoverId = action.payload.hoverId;
  const currentHoverId = state.hoverId;

  // The current hover decorations are no longer valid -- remove them.
  const currentHoverDecorations = decorations.find(
    undefined,
    undefined,
    spec =>
      (spec.id === currentHoverId || spec.id === incomingHoverId) &&
      spec.type === DECORATION_VALIDATION
  );

  decorations = decorations.remove(currentHoverDecorations);

  // Add the new decorations for the current and incoming validations.
  const decorationData = [{ id: incomingHoverId, isSelected: true }];
  if (incomingHoverId !== currentHoverId) {
    decorationData.push({ id: currentHoverId, isSelected: false });
  }
  decorations = decorationData.reduce((acc, hoverData) => {
    const output = selectBlockMatchesByMatchId(state, hoverData.id || "");
    if (!output) {
      return acc;
    }
    return decorations.add(
      tr.doc,
      createDecorationForValidationRange(output, hoverData.isSelected, false)
    );
  }, decorations);

  return {
    ...state,
    decorations,
    hoverId: action.payload.hoverId,
    hoverInfo: action.payload.hoverInfo
  };
};

const handleNewDirtyRanges = <TValidationMeta extends IMatches>(
  tr: Transaction,
  state: IPluginState<TValidationMeta>,
  { payload: { ranges: dirtiedRanges } }: ActionHandleNewDirtyRanges
) => {
  // Map our dirtied ranges through the current transaction, and append any new ranges it has dirtied.
  let newDecorations = state.debug
    ? state.decorations.add(
        tr.doc,
        dirtiedRanges.map(range => createDebugDecorationFromRange(range))
      )
    : state.decorations;

  // Remove any validations and associated decorations
  // touched by the dirtied ranges from the doc
  newDecorations = removeDecorationsFromRanges(newDecorations, dirtiedRanges);
  const currentValidations = state.currentValidations.filter(
    output => findOverlappingRangeIndex(output, dirtiedRanges) === -1
  );

  return {
    ...state,
    currentValidations,
    decorations: newDecorations,
    // We only care about storing dirtied ranges if we're validating
    // in response to user edits.
    validationPending: state.validateOnModify ? true : false,
    dirtiedRanges: state.validateOnModify
      ? state.dirtiedRanges.concat(dirtiedRanges)
      : []
  };
};

/**
 * Handle a validation request for the current set of dirty ranges.
 */
const createHandleValidationRequestForDirtyRanges = (
  expandRanges: ExpandRanges
) => <TValidationMeta extends IMatches>(
  tr: Transaction,
  state: IPluginState<TValidationMeta>,
  {
    payload: { validationSetId, categoryIds }
  }: ActionValidationRequestForDirtyRanges
) => {
  const ranges = expandRanges(state.dirtiedRanges, tr.doc);
  const validationInputs: IBlockQuery[] = ranges.map(range =>
    createValidationBlock(tr, range)
  );
  return handleValidationRequestStart(
    validationSetId,
    validationInputs,
    categoryIds
  )(tr, state);
};

/**
 * Handle a validation request for the entire document.
 */
const handleValidationRequestForDocument = <TValidationMeta extends IMatches>(
  tr: Transaction,
  state: IPluginState<TValidationMeta>,
  {
    payload: { validationSetId, categoryIds }
  }: ActionValidationRequestForDocument
) => {
  return handleValidationRequestStart(
    validationSetId,
    createValidationBlocksForDocument(tr),
    categoryIds
  )(tr, state);
};

/**
 * Handle a validation request for a given set of validation inputs.
 */
const handleValidationRequestStart = (
  validationSetId: string,
  blockQueries: IBlockQuery[],
  categoryIds: string[]
) => <TValidationMeta extends IMatches>(
  tr: Transaction,
  state: IPluginState<TValidationMeta>
): IPluginState<TValidationMeta> => {
  // Replace any debug decorations, if they exist.
  const decorations = state.debug
    ? removeDecorationsFromRanges(state.decorations, blockQueries, [
        DECORATION_DIRTY
      ]).add(
        tr.doc,
        blockQueries.map(range => createDebugDecorationFromRange(range, false))
      )
    : state.decorations;

  const newBlockQueriesInFlight: IInFlightBlockQuery[] = blockQueries.map(
    blockQuery => ({
      blockQuery,
      pendingCategoryIds: categoryIds
    })
  );

  return {
    ...state,
    decorations,
    // We reset the dirty ranges, as they've been expanded and sent for validation.
    dirtiedRanges: [],
    validationPending: false,
    blockQueriesInFlight: {
      ...state.blockQueriesInFlight,
      [validationSetId]: {
        totalBlocks: newBlockQueriesInFlight.length,
        pendingBlocks: newBlockQueriesInFlight,
        mapping: tr.mapping,
        categoryIds
      }
    }
  };
};

const amendBlockQueriesInFlight = <TValidationOutput extends IMatches>(
  state: IPluginState<TValidationOutput>,
  validationSetId: string,
  blockQueryId: string,
  categoryIds: string[]
) => {
  const currentBlockQueriesInFlight = selectBlockQueriesInFlightForSet(
    state,
    validationSetId
  );
  if (!currentBlockQueriesInFlight) {
    return state.blockQueriesInFlight;
  }
  const newBlockQueriesInFlight: IInFlightValidationSetState = {
    ...currentBlockQueriesInFlight,
    pendingBlocks: currentBlockQueriesInFlight.pendingBlocks.reduce(
      (acc, blockQueryInFlight) => {
        // Don't modify blocks that don't match
        if (blockQueryInFlight.blockQuery.id !== blockQueryId) {
          return acc.concat(blockQueryInFlight);
        }
        const newBlockQueryInFlight = {
          ...blockQueryInFlight,
          pendingCategoryIds: blockQueryInFlight.pendingCategoryIds.filter(
            id => !categoryIds.includes(id)
          )
        };
        return newBlockQueryInFlight.pendingCategoryIds.length
          ? acc.concat(newBlockQueryInFlight)
          : acc;
      },
      [] as IInFlightBlockQuery[]
    )
  };
  if (!newBlockQueriesInFlight.pendingBlocks.length) {
    return omit(state.blockQueriesInFlight, validationSetId);
  }
  return {
    ...state.blockQueriesInFlight,
    [validationSetId]: newBlockQueriesInFlight
  };
};

/**
 * Handle a validation response, decorating the document with
 * any validations we've received.
 */
const handleValidationRequestSuccess = <TBlockMatches extends IMatches>(
  tr: Transaction,
  state: IPluginState<TBlockMatches>,
  { payload: { response } }: ActionValidationResponseReceived<TBlockMatches>
): IPluginState<TBlockMatches> => {
  if (!response) {
    return state;
  }

  const blockQueriesInFlight = selectBlockQueriesInFlightById(
    state,
    response.validationSetId,
    response.blocks.map(_ => _.id)
  );

  if (!blockQueriesInFlight.length) {
    return state;
  }

  // Remove validations superceded by the incoming matches.
  let currentValidations: TBlockMatches[] = removeOverlappingRanges(
    state.currentValidations,
    blockQueriesInFlight.map(_ => _.blockQuery),
    validation => !response.categoryIds.includes(validation.category.id)
  );

  // Remove decorations superceded by the incoming matches.
  const decsToRemove = blockQueriesInFlight.reduce(
    (acc, blockQueryInFlight) =>
      acc.concat(
        state.decorations
          .find(
            blockQueryInFlight.blockQuery.from,
            blockQueryInFlight.blockQuery.to,
            spec => response.categoryIds.includes(spec.categoryId)
          )
          .concat(
            state.debug
              ? // Ditch any decorations marking inflight validations.
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

  // Add the response to the current validations
  currentValidations = currentValidations.concat(
    mapRanges(
      response.matches,
      selectBlockQueriesInFlightForSet(state, response.validationSetId)!.mapping
    )
  );

  // We don't apply incoming validations to ranges that have
  // been dirtied since they were requested.
  currentValidations = removeOverlappingRanges(
    currentValidations,
    state.dirtiedRanges
  );

  // Create our decorations for the newly current validations.
  const newDecorations = createDecorationsForValidationRanges(response.matches);

  // Amend the block queries in flight to
  const newBlockQueriesInFlight = blockQueriesInFlight.reduce(
    (acc, blockQueryInFlight) =>
      amendBlockQueriesInFlight(
        { ...state, blockQueriesInFlight: acc },
        response.validationSetId,
        blockQueryInFlight.blockQuery.id,
        response.categoryIds
      ),
    state.blockQueriesInFlight
  );

  return {
    ...state,
    blockQueriesInFlight: newBlockQueriesInFlight,
    currentValidations,
    decorations: state.decorations
      .remove(decsToRemove)
      .add(tr.doc, newDecorations)
  };
};

/**
 * Handle a validation request error.
 */
const handleValidationRequestError = <TValidationMeta extends IMatches>(
  tr: Transaction,
  state: IPluginState<TValidationMeta>,
  {
    payload: {
      validationError: { validationSetId, validationId, message }
    }
  }: ActionValidationRequestError
) => {
  if (!validationId) {
    return { ...state, message };
  }

  const blockQueriesInFlight = selectBlockQueriesInFlightForSet(
    state,
    validationSetId
  );

  if (!blockQueriesInFlight) {
    return state;
  }

  const blockQueryInFlight = selectSingleBlockQueryInFlightById(
    state,
    validationSetId,
    validationId
  );

  if (!blockQueryInFlight) {
    return { ...state, message };
  }

  const dirtiedRanges = blockQueryInFlight
    ? mapRanges(
        [validationInputToRange(blockQueryInFlight.blockQuery)],
        blockQueriesInFlight.mapping
      )
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

  // When we get errors, we map the ranges due to be validated back
  // through the document and add them to the dirtied ranges to be
  // validated on the next pass.
  let decorations = state.decorations.remove(decsToRemove);

  if (dirtiedRanges.length && state.debug) {
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
    blockQueriesInFlight: amendBlockQueriesInFlight(
      state,
      validationSetId,
      validationId,
      []
    ),
    error: message
  };
};

const handleSetDebugState = <TValidationMeta extends IMatches>(
  _: Transaction,
  state: IPluginState<TValidationMeta>,
  { payload: { debug } }: ActionSetDebugState
) => {
  return {
    ...state,
    debug
  };
};

const handleSetValidateOnModifyState = <TValidationMeta extends IMatches>(
  _: Transaction,
  state: IPluginState<TValidationMeta>,
  { payload: { validateOnModify } }: ActionSetValidateOnModifyState
) => {
  return {
    ...state,
    validateOnModify
  };
};
