import { Transaction, EditorState } from "prosemirror-state";
import {
  VALIDATION_PLUGIN_ACTION,
  newHoverIdReceived,
  selectValidationById,
  IPluginState,
  validationRequestForDocument,
  selectValidation,
  setDebugState,
  IStateHoverInfo
} from "./state";
import { IValidationOutput } from "./interfaces/IValidation";

export type ApplySuggestionOptions = Array<{
    validationId: string;
    suggestionIndex: number;
  }>;

/**
 * Applies a suggestion from a validation to the document.
 */
type ApplySuggestionsCommand = (
  suggestionOpts: ApplySuggestionOptions
) => (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;

/**
 * Validates an entire document.
 */
type ValidateDocumentCommand = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean;

/**
 * Mark a given validation as active.
 */
type SelectValidationCommand = (
  validationId: string
) => (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;

/**
 * Indicate new hover information is available. This could include
 * details on hover coords if available (for example, if hovering
 * over a validation decoration) to allow the positioning of e.g. tooltips.
 */
type IndicateHoverCommand = (
  validationId: string | undefined,
  hoverInfo?: IStateHoverInfo | undefined
) => (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;

type SetDebugStateCommand = (
  debug: boolean
) => (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;

/**
 * The commands available to the plugin consumer.
 */
export interface ICommands {
  applySuggestions: ApplySuggestionsCommand;
  validateDocument: ValidateDocumentCommand;
  selectValidation: SelectValidationCommand;
  indicateHover: IndicateHoverCommand;
  setDebugState: SetDebugStateCommand;
}

const createCommands = (
  getState: (state: EditorState) => IPluginState
): ICommands => ({
  validateDocument: (
    state: EditorState,
    dispatch: (tr: Transaction) => void
  ) => {
    dispatch(
      state.tr.setMeta(VALIDATION_PLUGIN_ACTION, validationRequestForDocument())
    );
    return true;
  },

  indicateHover: (id, hoverInfo) => (state, dispatch) => {
    if (dispatch) {
      dispatch(
        state.tr.setMeta(
          VALIDATION_PLUGIN_ACTION,
          newHoverIdReceived(id, hoverInfo)
        )
      );
    }
    return true;
  },

  selectValidation: validationId => (state, dispatch) => {
    const pluginState = getState(state);
    const output = selectValidationById(pluginState, validationId);
    if (!output) {
      return false;
    }
    if (dispatch) {
      dispatch(
        state.tr.setMeta(
          VALIDATION_PLUGIN_ACTION,
          selectValidation(validationId)
        )
      );
    }
    return true;
  },

  setDebugState: debug => (state, dispatch) => {
    if (dispatch) {
      dispatch(
        state.tr.setMeta(VALIDATION_PLUGIN_ACTION, setDebugState(debug))
      );
    }
    return true;
  },

  applySuggestions: suggestionOpts => (
    state: EditorState,
    dispatch?: (tr: Transaction) => void
  ) => {
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
  }
});

export default createCommands;
