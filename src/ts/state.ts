import { Transaction } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import { IRange } from "./interfaces/IValidation";
import {
  IValidationError,
  IValidationInput,
  IValidationOutput,
  IValidationResponse
} from "./interfaces/IValidation";
import {
  createDebugDecorationFromRange,
  DECORATION_DIRTY,
  DECORATION_INFLIGHT,
  getNewDecorationsForCurrentValidations as createNewDecorationsForCurrentValidations,
  removeDecorationsFromRanges,
  createDecorationForValidationRange,
  DECORATION_VALIDATION
} from "./utils/decoration";
import {
  mapRangeThroughTransactions,
  mergeOutputsFromValidationResponse,
  mergeRanges,
  validationInputToRange
} from "./utils/range";
import { ExpandRanges } from ".";

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
  // The currently selected validation;
  selectedValidation: string | undefined;
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

const VALIDATION_REQUEST_START = "VAlIDATION_REQUEST_START";
const VALIDATION_REQUEST_SUCCESS = "VALIDATION_REQUEST_SUCCESS";
const VALIDATION_REQUEST_ERROR = "VALIDATION_REQUEST_ERROR";
const NEW_HOVER_ID = "NEW_HOVER_ID";
const SELECT_VALIDATION = "SELECT_VALIDATION";
const HANDLE_NEW_DIRTY_RANGES = "HANDLE_NEW_DIRTY_RANGES";

/**
 * Action creators.
 */

export const validationRequestStart = (expandRanges: ExpandRanges) => ({
  type: VALIDATION_REQUEST_START as typeof VALIDATION_REQUEST_START,
  payload: { expandRanges }
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
  hoverInfo?: IStateHoverInfo | undefined
) => ({
  type: NEW_HOVER_ID as typeof NEW_HOVER_ID,
  payload: { hoverId, hoverInfo }
});

export const applyNewDirtiedRanges = (ranges: IRange[]) => ({
  type: HANDLE_NEW_DIRTY_RANGES as typeof HANDLE_NEW_DIRTY_RANGES,
  payload: { ranges }
});
type ActionHandleNewDirtyRanges = ReturnType<typeof applyNewDirtiedRanges>;

export const selectValidation = (validationId: string) => ({
  type: SELECT_VALIDATION as typeof SELECT_VALIDATION,
  payload: { validationId }
});
type ActionSelectValidation = ReturnType<typeof selectValidation>;

type ActionNewHoverIdReceived = ReturnType<typeof newHoverIdReceived>;

type Action =
  | ActionNewHoverIdReceived
  | ActionValidationResponseReceived
  | ActionValidationRequestStart
  | ActionValidationRequestError
  | ActionSelectValidation
  | ActionHandleNewDirtyRanges;

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
  action?: Action
): IPluginState => {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case NEW_HOVER_ID:
      return handleNewHoverId(tr, state, action);
    case VALIDATION_REQUEST_START:
      return handleValidationRequestStart(tr, state, action);
    case VALIDATION_REQUEST_SUCCESS:
      return handleValidationRequestSuccess(tr, state, action);
    case VALIDATION_REQUEST_ERROR:
      return handleValidationRequestError(tr, state, action);
    case SELECT_VALIDATION:
      return handleSelectValidation(tr, state, action);
    case HANDLE_NEW_DIRTY_RANGES:
      return handleNewDirtyRanges(tr, state, action);
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
 * Handle the selection of a hover id.
 */
const handleSelectValidation: ActionHandler<ActionSelectValidation> = (
  _,
  state,
  action
): IPluginState => {
  return {
    ...state,
    selectedValidation: action.payload.validationId
  };
};

/**
 * Handle the receipt of a new hover id.
 */
const handleNewHoverId: ActionHandler<ActionNewHoverIdReceived> = (
  tr,
  state,
  action
): IPluginState => {
  let decorations = state.decorations;
  const incomingHoverId = action.payload.hoverId;
  const currentHoverId = state.hoverId;
  const isHovering = !!action.payload.hoverId;
  const decorationsToRemove = currentHoverId
    ? state.decorations.find(
        undefined,
        undefined,
        spec =>
          spec.id === currentHoverId && spec.type === DECORATION_VALIDATION
      )
    : [];
  decorations = decorations.remove(decorationsToRemove);
  // @todo - crikey this is verbose!
  if (incomingHoverId) {
    const incomingValidationOutput = selectValidationById(
      state,
      incomingHoverId
    );
    if (incomingValidationOutput) {
      decorations = decorations.add(
        tr.doc,
        createDecorationForValidationRange(
          incomingValidationOutput,
          isHovering,
          false
        )
      );
    }
  }
  if (currentHoverId) {
    const currentValidationOutput = selectValidationById(state, currentHoverId);
    if (currentValidationOutput) {
      decorations = decorations.add(
        tr.doc,
        createDecorationForValidationRange(
          currentValidationOutput,
          false,
          false
        )
      );
    }
  }

  return {
    ...state,
    decorations,
    hoverId: action.payload.hoverId,
    hoverInfo: action.payload.hoverInfo
  };
};

const handleNewDirtyRanges: ActionHandler<ActionHandleNewDirtyRanges> = (
  tr,
  state,
  { payload: { ranges: dirtiedRanges } }
) => {
  // Map our dirtied ranges through the current transaction, and append
  // any new ranges it has dirtied.
  let newDecorations = state.decorations.add(
    tr.doc,
    dirtiedRanges.map(range => createDebugDecorationFromRange(range))
  );

  // Remove any validations touched by the dirtied ranges from the doc
  newDecorations = removeDecorationsFromRanges(newDecorations, dirtiedRanges);

  return {
    ...state,
    validationPending: true,
    decorations: newDecorations,
    dirtiedRanges: state.dirtiedRanges.concat(dirtiedRanges)
  };
};

/**
 * Handle a validation request start.
 */
const handleValidationRequestStart: ActionHandler<
  ActionValidationRequestStart
> = (tr, state, { payload: { expandRanges } }) => {
  const ranges = expandRanges(state.dirtiedRanges, tr.doc);
  const validationInputs: IValidationInput[] = ranges.map(range => ({
    str: tr.doc.textBetween(range.from, range.to),
    ...range
  }));
  // Remove any debug decorations, if they exist.
  const decorations = removeDecorationsFromRanges(state.decorations, ranges, [
    DECORATION_DIRTY
  ]).add(
    tr.doc,
    ranges.map(range => createDebugDecorationFromRange(range, false))
  );

  return {
    ...state,
    decorations,
    // We reset the dirty ranges, as they've been expanded and sent for validation.
    dirtiedRanges: [],
    validationPending: false,
    validationInFlight: ranges.length ? {
      validationInputs,
      id: tr.time
    } : undefined
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
    const decorations = createNewDecorationsForCurrentValidations(
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
  VALIDATION_REQUEST_START,
  VALIDATION_REQUEST_SUCCESS,
  VALIDATION_REQUEST_ERROR,
  NEW_HOVER_ID,
  Action,
  validationPluginReducer
};
