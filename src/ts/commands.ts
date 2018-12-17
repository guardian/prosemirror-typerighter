import { Transaction, EditorState } from "prosemirror-state";
import {
  VALIDATION_PLUGIN_ACTION,
  newHoverIdReceived,
  selectValidationById,
  IPluginState,
  validationRequestForDocument,
  selectValidation,
  setDebugState,
  IStateHoverInfo,
  validationRequestSuccess,
  validationRequestError
} from "./state";
import {
  IValidationOutput,
  IValidationResponse,
  IValidationError
} from "./interfaces/IValidation";
import { EditorView } from "prosemirror-view";

type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean;

type GetState = (state: EditorState) => IPluginState;

/**
 * Validates an entire document.
 */
const validateDocumentCommand = (
  state: EditorState,
  dispatch: (tr: Transaction) => void
) => {
  dispatch(
    state.tr.setMeta(VALIDATION_PLUGIN_ACTION, validationRequestForDocument())
  );
  return true;
};

/**
 * Indicate new hover information is available. This could include
 * details on hover coords if available (for example, if hovering
 * over a validation decoration) to allow the positioning of e.g. tooltips.
 */
const indicateHoverCommand = (
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
const selectValidationCommand = (
  validationId: string,
  getState: GetState
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
const setDebugStateCommand = (debug: boolean): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(state.tr.setMeta(VALIDATION_PLUGIN_ACTION, setDebugState(debug)));
  }
  return true;
};

/**
 * Apply a successful validation response to the document.
 */
const applyValidationResponseCommand = (
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
const applyValidationErrorCommand = (
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
const applySuggestionsCommand = (
  suggestionOpts: ApplySuggestionOptions,
  getState: GetState
): Command => (state, dispatch) => {
  // @todo - there's a lot of transaction logic here, but it
  // doesn't necessarily apply to the plugin state. Does it belong
  // in the reducer, or is it best placed here?
  const pluginState = getState(state);
  const outputsAndSuggestions = suggestionOpts
    .reduce(
      (acc, _) => {
        const output = selectValidationById(pluginState, _.validationId);
        if (!output) {
          return acc;
        }
        return acc.concat({
          output,
          suggestionIndex: _.suggestionIndex
        });
      },
      [] as Array<{
        output: IValidationOutput;
        suggestionIndex: number;
      }>
    )
    .filter(_ => !!_);
  if (!outputsAndSuggestions.length) {
    return false;
  }

  if (dispatch) {
    const tr = state.tr;
    outputsAndSuggestions.forEach(({ output, suggestionIndex }) => {
      const suggestion =
        output.suggestions && output.suggestions[suggestionIndex];
      if (!suggestion) {
        return false;
      }
      tr.replaceWith(output.from, output.to, state.schema.text(suggestion));
    });
    tr.setMeta(
      VALIDATION_PLUGIN_ACTION,
      newHoverIdReceived(undefined, undefined)
    );
    dispatch(tr);
  }

  return true;
};

export const createBoundCommands = (
  { state, dispatch }: EditorView,
  getState: GetState
) => {
  const bindCommand = <CommandArgs extends any[]>(action: (...args: CommandArgs) => Command) => (
    ...args: CommandArgs
  ) => action(...args)(state, dispatch);
  return {
    validateDocument: () => validateDocumentCommand(state, dispatch),
    applyValidationResult: bindCommand(applyValidationResponseCommand),
    applyValidationError: bindCommand(applyValidationErrorCommand),
    applySuggestions: (suggestionOpts: ApplySuggestionOptions) =>
      applySuggestionsCommand(suggestionOpts, getState)(state, dispatch),
    selectValidation: (validationId: string) =>
      selectValidationCommand(validationId, getState)(state, dispatch),
    indicateHover: bindCommand(indicateHoverCommand),
    setDebugState: bindCommand(setDebugStateCommand)
  };
};

/**
 * The commands available to the plugin consumer.
 */
export type Commands = ReturnType<typeof createBoundCommands>;
