import { Transaction } from "prosemirror-state";
import { PluginState } from "./index";
import {
  ValidationResponse,
  ValidationError,
  ValidationInput
} from "./interfaces/Validation";
import {
  mapRangeThroughTransactions,
  mergeRanges,
  getRangesOfParentBlockNodes,
  validationInputToRange
} from "./utils/range";
import {
  DECORATION_INFLIGHT,
  getNewDecorationsForValidationResponse,
  createDebugDecorationFromRange,
  removeValidationDecorationsFromRanges,
  DECORATION_DIRTY
} from "./utils/decoration";

// The transaction meta key that namespaces our actions.
const VALIDATION_PLUGIN_ACTION = "VALIDATION_PLUGIN_ACTION";

/**
 * Action types.
 */

const VALIDATION_REQUEST_PENDING = "VALIDATION_REQUEST_PENDING";
const VALIDATION_REQUEST_START = "VAlIDATION_REQUEST_START";
const VALIDATION_REQUEST_SUCCESS = "VALIDATION_REQUEST_SUCCESS";
const VALIDATION_REQUEST_ERROR = "VALIDATION_REQUEST_ERROR";
const NEW_HOVER_ID = "NEW_HOVER_ID";

/**
 * Action creators.
 */

export const validationRequestPending = () => ({
  type: VALIDATION_REQUEST_PENDING as typeof VALIDATION_REQUEST_PENDING
});
type ActionValidationRequestPending = ReturnType<
  typeof validationRequestPending
>;

export const validationRequestStart = () => ({
  type: VALIDATION_REQUEST_START as typeof VALIDATION_REQUEST_START
});
type ActionValidationRequestStart = ReturnType<typeof validationRequestStart>;

export const validationRequestSuccess = (response: ValidationResponse) => ({
  type: VALIDATION_REQUEST_SUCCESS as typeof VALIDATION_REQUEST_SUCCESS,
  payload: { response }
});
type ActionValidationResponseReceived = ReturnType<
  typeof validationRequestSuccess
>;

export const validationRequestError = (validationError: ValidationError) => ({
  type: VALIDATION_REQUEST_ERROR as typeof VALIDATION_REQUEST_ERROR,
  payload: { validationError }
});
type ActionValidationRequestError = ReturnType<typeof validationRequestError>;

export const newHoverIdReceived = (hoverId: string | undefined) => ({
  type: NEW_HOVER_ID as typeof NEW_HOVER_ID,
  payload: { hoverId }
});
type ActionNewHoverIdReceived = ReturnType<typeof newHoverIdReceived>;

type Action =
  | ActionNewHoverIdReceived
  | ActionValidationResponseReceived
  | ActionValidationRequestStart
  | ActionValidationRequestPending
  | ActionValidationRequestError;

/**
 * Reducer.
 */

const validationPluginReducer = (
  tr: Transaction,
  state: PluginState,
  action: Action
): PluginState => {
  switch (action.type) {
    case NEW_HOVER_ID:
      return handleNewHoverId(tr, state, action);
    case VALIDATION_REQUEST_PENDING:
      return handleValidationRequestPending(tr, state, action);
    case VALIDATION_REQUEST_START:
      return handleValidationRequestStart(tr, state, action);
    case VALIDATION_REQUEST_SUCCESS:
      return handleValidationRequestSuccess(tr, state, action);
    case VALIDATION_REQUEST_ERROR:
      return handleValidationRequestError(tr, state, action);
    default:
      return state;
  }
};

/**
 * Action handlers.
 */

type ActionHandler<ActionType> = (
  _: Transaction,
  state: PluginState,
  action: ActionType
) => PluginState;

/**
 * Handle the receipt of a new hover id.
 */
const handleNewHoverId: ActionHandler<ActionNewHoverIdReceived> = (
  _,
  state,
  action
) => {
  return {
    ...state,
    hoverId: action.payload.hoverId
  };
};

const handleValidationRequestPending: ActionHandler<
  ActionValidationRequestPending
> = (_, state) => {
  return {
    ...state,
    validationPending: true
  };
};

/**
 * Handle a validation request start.
 */
const handleValidationRequestStart: ActionHandler<
  ActionValidationRequestStart
> = (tr, state) => {
  const expandedRanges = getRangesOfParentBlockNodes(
    state.dirtiedRanges,
    tr.doc
  );
  const validationInputs: ValidationInput[] = expandedRanges.map(range => ({
    str: tr.doc.textBetween(range.from, range.to),
    ...range
  }));
  // Remove any debug decorations, if they exist.
  const decorations = removeValidationDecorationsFromRanges(
    state.decorations,
    expandedRanges,
    DECORATION_DIRTY
  ).add(
    tr.doc,
    expandedRanges.map(range => createDebugDecorationFromRange(range, false))
  );
  return {
    ...state,
    decorations,
    // We reset the dirty ranges, as they've been expanded and sent for validation.
    dirtiedRanges: [],
    validationPending: false,
    validationInFlight: {
      validationInputs,
      id: tr.time
    }
  };
};

/**
 * Handle a validation response, decorating the document with
 * any validations we've received.
 */
const handleValidationRequestSuccess: ActionHandler<
  ActionValidationResponseReceived
> = (tr, state, action) => {
  const response = action.payload.response;
  if (response && response.validationOutputs.length) {
    const decorations = getNewDecorationsForValidationResponse(
      response,
      state.decorations,
      state.trHistory,
      tr
    );
    // Ditch any decorations marking inflight validations
    const decsToRemove = state.decorations.find(
      undefined,
      undefined,
      _ => _.type === DECORATION_INFLIGHT
    );

    return {
      ...state,
      validationInFlight: undefined,
      decorations: decorations.remove(decsToRemove)
    };
  }
  return state;
};

/**
 * Handle a validation request error.
 */
const handleValidationRequestError: ActionHandler<
  ActionValidationRequestError
> = (tr, state, action) => {
  const decsToRemove = state.decorations.find(
    undefined,
    undefined,
    _ => _.type === DECORATION_INFLIGHT
  );
  const dirtiedRanges = mapRangeThroughTransactions(
    [validationInputToRange(action.payload.validationError.validationInput)],
    parseInt(String(action.payload.validationError.id), 10),
    state.trHistory
  );
  // When we get errors, we map the ranges due to be validated back
  // through the document and add them to the dirtied ranges to be
  // validated on the next pass.
  let decorations = state.decorations.remove(decsToRemove);

  if (dirtiedRanges.length) {
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
    validationInFlight: undefined,
    error: action.payload.validationError.message
  };
};

export {
  VALIDATION_PLUGIN_ACTION,
  VALIDATION_REQUEST_PENDING,
  VALIDATION_REQUEST_START,
  VALIDATION_REQUEST_SUCCESS,
  VALIDATION_REQUEST_ERROR,
  NEW_HOVER_ID,
  Action,
  validationPluginReducer
};
