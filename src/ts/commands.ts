import { Transaction, EditorState } from "prosemirror-state";
import {
  VALIDATION_PLUGIN_ACTION,
  newHoverIdReceived,
  selectValidationById,
  IPluginState,
  validationRequestForDocument,
  selectValidation,
  setDebugState,
  setValidateOnModifyState,
  IStateHoverInfo,
  validationRequestSuccess,
  validationRequestError,
  selectSuggestionAndRange,
  validationRequestForDirtyRanges
} from "./state";
import {
  IValidationResponse,
  IValidationError,
  IBaseValidationOutput
} from "./interfaces/IValidation";
import { EditorView } from "prosemirror-view";
import { compact } from "./utils/array";

type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean;

type GetState<TValidationOutput extends IBaseValidationOutput> = (
  state: EditorState
) => IPluginState<TValidationOutput>;

/**
 * Validates an entire document.
 */
export const validateDocumentCommand = (
  state: EditorState,
  dispatch: (tr: Transaction) => void
) => {
  dispatch(
    state.tr.setMeta(VALIDATION_PLUGIN_ACTION, validationRequestForDocument())
  );
  return true;
};

/**
 * Validates the current set of dirty ranges.
 */
export const validateDirtyRangesCommand = (
  state: EditorState,
  dispatch: (tr: Transaction) => void
) => {
  dispatch(
    state.tr.setMeta(
      VALIDATION_PLUGIN_ACTION,
      validationRequestForDirtyRanges()
    )
  );
  return true;
};

/**
 * Indicate new hover information is available. This could include
 * details on hover coords if available (for example, if hovering
 * over a validation decoration) to allow the positioning of e.g. tooltips.
 */
export const indicateHoverCommand = (
  id: string | undefined,
  hoverInfo: IStateHoverInfo | undefined
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        VALIDATION_PLUGIN_ACTION,
        newHoverIdReceived(id, hoverInfo)
      )
    );
  }
  return true;
};

/**
 * Mark a given validation as active.
 */
export const selectValidationCommand = <
  TValidationOutput extends IBaseValidationOutput
>(
  validationId: string,
  getState: GetState<TValidationOutput>
): Command => (state, dispatch) => {
  const pluginState = getState(state);
  const output = selectValidationById(pluginState, validationId);
  if (!output) {
    return false;
  }
  if (dispatch) {
    dispatch(
      state.tr.setMeta(VALIDATION_PLUGIN_ACTION, selectValidation(validationId))
    );
  }
  return true;
};

/**
 * Set the debug state. Enabling debug mode provides additional marks
 * to reveal dirty ranges and ranges sent for validation.
 */
export const setDebugStateCommand = (debug: boolean): Command => (
  state,
  dispatch
) => {
  if (dispatch) {
    dispatch(state.tr.setMeta(VALIDATION_PLUGIN_ACTION, setDebugState(debug)));
  }
  return true;
};

/**
 * Set the validate on modify state. When enabled, the plugin will queue
 * validation requests as soon as the document is modified.
 */
export const setValidateOnModifyStateCommand = (
  validateOnModify: boolean
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        VALIDATION_PLUGIN_ACTION,
        setValidateOnModifyState(validateOnModify)
      )
    );
  }
  return true;
};

/**
 * Apply a successful validation response to the document.
 */
export const applyValidationResponseCommand = (
  validationResponse: IValidationResponse
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        VALIDATION_PLUGIN_ACTION,
        validationRequestSuccess(validationResponse)
      )
    );
  }
  return true;
};

/**
 * Apply a validation error to the document. Important to ensure
 * that failed validation requests are reapplied as dirtied ranges
 * to be resent on the next request.
 */
export const applyValidationErrorCommand = (
  validationError: IValidationError
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        VALIDATION_PLUGIN_ACTION,
        validationRequestError(validationError)
      )
    );
  }
  return true;
};

export type ApplySuggestionOptions = Array<{
  validationId: string;
  suggestionIndex: number;
}>;

/**
 * Applies a suggestion from a validation to the document.
 */
export const applySuggestionsCommand = <
  TValidationOutput extends IBaseValidationOutput
>(
  suggestionOptions: ApplySuggestionOptions,
  getState: GetState<TValidationOutput>
): Command => (state, dispatch) => {
  const pluginState = getState(state);
  const outputsAndSuggestions = suggestionOptions
    .map(opt =>
      selectSuggestionAndRange(
        pluginState,
        opt.validationId,
        opt.suggestionIndex
      )
    )
    .filter(compact);

  if (!outputsAndSuggestions.length) {
    return false;
  }

  if (dispatch) {
    const tr = state.tr;
    outputsAndSuggestions.forEach(({ from, to, suggestion }) =>
      tr.replaceWith(from, to, state.schema.text(suggestion))
    );
    dispatch(tr);
  }

  return true;
};

export const createBoundCommands = <
  TValidationOutput extends IBaseValidationOutput
>(
  view: EditorView,
  getState: GetState<TValidationOutput>
) => {
  const bindCommand = <CommandArgs extends any[]>(
    action: (...args: CommandArgs) => Command
  ) => (...args: CommandArgs) => action(...args)(view.state, view.dispatch);
  return {
    validateDocument: () => validateDocumentCommand(view.state, view.dispatch),
    validateDirtyRangesCommand: () =>
      validateDirtyRangesCommand(view.state, view.dispatch),
    applySuggestions: (suggestionOpts: ApplySuggestionOptions) =>
      applySuggestionsCommand(suggestionOpts, getState)(
        view.state,
        view.dispatch
      ),
    selectValidation: (validationId: string) =>
      selectValidationCommand(validationId, getState)(
        view.state,
        view.dispatch
      ),
    indicateHover: bindCommand(indicateHoverCommand),
    setDebugState: bindCommand(setDebugStateCommand),
    setValidateOnModifyState: bindCommand(setValidateOnModifyStateCommand),
    applyValidationResult: bindCommand(applyValidationResponseCommand),
    applyValidationError: bindCommand(applyValidationErrorCommand)
  };
};

/**
 * The commands available to the plugin consumer.
 */
export type Commands = ReturnType<typeof createBoundCommands>;
