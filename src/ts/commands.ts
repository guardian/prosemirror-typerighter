import { Transaction, EditorState } from "prosemirror-state";
import {
  newHoverIdReceived,
  validationRequestForDocument,
  selectMatch,
  setDebugState,
  setValidateOnModifyState,
  validationRequestSuccess,
  validationRequestError,
  validationRequestForDirtyRanges,
  selectAllAutoFixableValidations,
  validationRequestComplete
} from "./state/actions";
import { selectBlockMatchesByMatchId } from "./state/selectors";
import {
  VALIDATION_PLUGIN_ACTION,
  IPluginState,
  IStateHoverInfo
} from "./state/reducer";
import {
  IValidationResponse,
  IValidationError,
  IMatches
} from "./interfaces/IValidation";
import { EditorView } from "prosemirror-view";
import { compact } from "./utils/array";

type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean;

type GetState<TValidationOutput extends IMatches> = (
  state: EditorState
) => IPluginState<TValidationOutput>;

/**
 * Validates an entire document.
 */
export const validateDocumentCommand = (
  requestId: string,
  categoryIds: string[]
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        VALIDATION_PLUGIN_ACTION,
        validationRequestForDocument(requestId, categoryIds)
      )
    );
  }
  return true;
};

/**
 * Validates the current set of dirty ranges.
 */
export const validateDirtyRangesCommand = (
  requestId: string,
  categoryIds: string[]
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        VALIDATION_PLUGIN_ACTION,
        validationRequestForDirtyRanges(requestId, categoryIds)
      )
    );
  }

  return true;
};

/**
 * Indicate new hover information is available. This could include
 * details on hover coords if available (for example, if hovering
 * over a validation decoration) to allow the positioning of e.g. tooltips.
 */
export const indicateHoverCommand = (
  matchId: string | undefined,
  hoverInfo: IStateHoverInfo | undefined
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        VALIDATION_PLUGIN_ACTION,
        newHoverIdReceived(matchId, hoverInfo)
      )
    );
  }
  return true;
};

/**
 * Mark a given validation as active.
 */
export const selectMatchCommand = <
  TValidationOutput extends IMatches
>(
  matchId: string,
  getState: GetState<TValidationOutput>
): Command => (state, dispatch) => {
  const pluginState = getState(state);
  const output = selectBlockMatchesByMatchId(pluginState, matchId);
  if (!output) {
    return false;
  }
  if (dispatch) {
    dispatch(
      state.tr.setMeta(VALIDATION_PLUGIN_ACTION, selectMatch(matchId))
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

/**
 * Apply a validation error to the document. Important to ensure
 * that failed validation requests are reapplied as dirtied ranges
 * to be resent on the next request.
 */
export const applyValidationCompleteCommand = (
  requestId: string
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        VALIDATION_PLUGIN_ACTION,
        validationRequestComplete(requestId)
      )
    );
  }
  return true;
};

export type ApplySuggestionOptions = Array<{
  matchId: string;
  text: string;
}>;

/**
 * Applies a suggestion from a validation to the document.
 */
export const applySuggestionsCommand = <
  TValidationOutput extends IMatches
>(
  suggestionOptions: ApplySuggestionOptions,
  getState: GetState<TValidationOutput>
): Command => (state, dispatch) => {
  const pluginState = getState(state);
  const suggestionsToApply = suggestionOptions
    .map(opt => {
      const validation = selectBlockMatchesByMatchId(pluginState, opt.matchId);
      return validation
        ? {
            from: validation.from,
            to: validation.to,
            text: opt.text
          }
        : undefined;
    })
    .filter(compact);

  return maybeApplySuggestions(suggestionsToApply, state, dispatch);
};

/**
 * Applies the first suggestion for each rule marked as auto-fixable.
 */
export const applyAutoFixableSuggestionsCommand = <
  TMatches extends IMatches
>(
  getState: GetState<TMatches>
): Command => (state, dispatch) => {
  const pluginState = getState(state);
  const suggestionsToApply = selectAllAutoFixableValidations(pluginState).map(
    output => ({
      from: output.from,
      to: output.to,
      text:
        output.suggestions && output.suggestions.length
          ? output.suggestions[0].text
          : undefined
    })
  );
  return maybeApplySuggestions(suggestionsToApply, state, dispatch);
};

const maybeApplySuggestions = (
  suggestionsToApply: Array<{
    from: number;
    to: number;
    text: string | undefined;
  }>,
  state: EditorState,
  dispatch?: (tr: Transaction<any>) => void
) => {
  if (!suggestionsToApply.length) {
    return false;
  }

  if (dispatch) {
    const tr = state.tr;
    suggestionsToApply.forEach(
      ({ from, to, text }) =>
        text &&
        tr.replaceWith(
          tr.mapping.map(from),
          tr.mapping.map(to),
          state.schema.text(text)
        )
    );
    dispatch(tr);
  }

  return true;
};

export const createBoundCommands = <TValidationOutput extends IMatches>(
  view: EditorView,
  getState: GetState<TValidationOutput>
) => {
  const bindCommand = <CommandArgs extends any[]>(
    action: (...args: CommandArgs) => Command
  ) => (...args: CommandArgs) => action(...args)(view.state, view.dispatch);
  return {
    applySuggestions: (suggestionOpts: ApplySuggestionOptions) =>
      applySuggestionsCommand(suggestionOpts, getState)(
        view.state,
        view.dispatch
      ),
    selectMatch: (blockId: string) =>
      selectMatchCommand(blockId, getState)(
        view.state,
        view.dispatch
      ),
    applyAutoFixableSuggestions: () =>
      applyAutoFixableSuggestionsCommand(getState)(view.state, view.dispatch),
    validateDocument: bindCommand(validateDocumentCommand),
    validateDirtyRanges: bindCommand(validateDirtyRangesCommand),
    indicateHover: bindCommand(indicateHoverCommand),
    setDebugState: bindCommand(setDebugStateCommand),
    setValidateOnModifyState: bindCommand(setValidateOnModifyStateCommand),
    applyValidationResult: bindCommand(applyValidationResponseCommand),
    applyValidationError: bindCommand(applyValidationErrorCommand),
    applyValidationComplete: bindCommand(applyValidationCompleteCommand)
  };
};

/**
 * The commands available to the plugin consumer.
 */
export type Commands = ReturnType<typeof createBoundCommands>;
