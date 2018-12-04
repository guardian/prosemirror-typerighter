import { Transaction } from 'prosemirror-state';
import { DecorationSet } from 'prosemirror-view';
import { IRange } from './interfaces/IValidation';
import {
  IValidationError,
  IValidationInput,
  IValidationOutput,
  IValidationResponse
  } from './interfaces/IValidation';
import {
  createDebugDecorationFromRange,
  DECORATION_DIRTY,
  DECORATION_INFLIGHT,
  getNewDecorationsForCurrentValidations,
  removeValidationDecorationsFromRanges
  } from './utils/decoration';
import {
  getRangesOfParentBlockNodes,
  mapRangeThroughTransactions,
  mergeOutputsFromValidationResponse,
  mergeRanges,
  validationInputToRange
  } from './utils/range';

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

export interface IPluginState {
  // Is the plugin in debug mode? Debug mode adds marks to show dirtied
  // and expanded ranges.
  debug: boolean;
  // The initial throttle duration for pending validation requests.
  initialThrottle: number;
  // The current throttle duration, which increases during backof.
  currentThrottle: number;
  // The maximum possible throttle duration.
  maxThrottle: number;
  // The current decorations the plugin is applying to the document.
  decorations: DecorationSet;
  // The current validation outputs for the document.
  currentValidations: IValidationOutput[];
  // The current ranges that are marked as dirty, that is, have been
  // changed since the last validation pass.
  dirtiedRanges: IRange[];
  // The id of the validation the user is currently hovering over.
  hoverId: string | undefined;
  // See StateHoverInfo.
  hoverInfo: IStateHoverInfo | undefined;
  // The history of transactions accrued since the last validation.
  // These are mapped through to apply validations applied against
  // a preview document state to the current document state.
  trHistory: Transaction[];
  // Is a validation pending - that is, have ranges been dirtied but
  // not yet been expanded and sent for validation?
  validationPending: boolean;
  // Is a validation currently in flight - that is, has a validation
  // been sent to the validation service and we're awaiting its
  // return?
  validationInFlight:
    | {
        validationInputs: IValidationInput[];
        id: number;
      }
    | undefined;
  // The current error status.
  error: string | undefined;
}

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

export const validationRequestStart = (ranges: IRange[]) => ({
  type: VALIDATION_REQUEST_START as typeof VALIDATION_REQUEST_START,
  payload: { ranges }
});
type ActionValidationRequestStart = ReturnType<typeof validationRequestStart>;

export const validationRequestSuccess = (response: IValidationResponse) => ({
  type: VALIDATION_REQUEST_SUCCESS as typeof VALIDATION_REQUEST_SUCCESS,
  payload: { response }
});
type ActionValidationResponseReceived = ReturnType<
  typeof validationRequestSuccess
>;

export const validationRequestError = (validationError: IValidationError) => ({
  type: VALIDATION_REQUEST_ERROR as typeof VALIDATION_REQUEST_ERROR,
  payload: { validationError }
});
type ActionValidationRequestError = ReturnType<typeof validationRequestError>;

export const newHoverIdReceived = (
  hoverId: string | undefined,
  hoverInfo: IStateHoverInfo | undefined
) => ({
  type: NEW_HOVER_ID as typeof NEW_HOVER_ID,
  payload: { hoverId, hoverInfo }
});

type ActionNewHoverIdReceived = ReturnType<typeof newHoverIdReceived>;

type Action =
  | ActionNewHoverIdReceived
  | ActionValidationResponseReceived
  | ActionValidationRequestStart
  | ActionValidationRequestPending
  | ActionValidationRequestError;

/**
 * Selectors.
 */

export const selectValidationById = (
  state: IPluginState,
  id: string
): IValidationOutput | undefined =>
  state.currentValidations.find(validation => validation.id === id);

/**
 * Reducer.
 */

const validationPluginReducer = (
  tr: Transaction,
  state: IPluginState,
  action: Action
): IPluginState => {
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
  state: IPluginState,
  action: ActionType
) => IPluginState;

/**
 * Handle the receipt of a new hover id.
 */
const handleNewHoverId: ActionHandler<ActionNewHoverIdReceived> = (
  _,
  state,
  action
): IPluginState => {
  return {
    ...state,
    hoverId: action.payload.hoverId,
    hoverInfo: action.payload.hoverInfo
  }
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
> = (tr, state, action) => {
  const validationInputs: IValidationInput[] = action.payload.ranges.map(range => ({
    str: tr.doc.textBetween(range.from, range.to),
    ...range
  }));
  // Remove any debug decorations, if they exist.
  const decorations = removeValidationDecorationsFromRanges(
    state.decorations,
    action.payload.ranges,
    DECORATION_DIRTY
  ).add(
    tr.doc,
    action.payload.ranges.map(range => createDebugDecorationFromRange(range, false))
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
    const currentValidations = mergeOutputsFromValidationResponse(
      response,
      state.currentValidations,
      state.trHistory
    );
    const decorations = getNewDecorationsForCurrentValidations(
      currentValidations,
      state.decorations,
      tr.doc
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
      currentValidations,
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
  // @todo - add backoff if appropriate (429)
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
