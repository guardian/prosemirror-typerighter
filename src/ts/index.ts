import ValidationService, {
  ValidationEvents
} from "./services/ValidationAPIService";
import {
  IPluginState,
  newHoverIdReceived,
  selectValidationById,
  VALIDATION_PLUGIN_ACTION,
  validationPluginReducer,
  validationRequestError,
  validationRequestStart,
  validationRequestSuccess,
  selectValidation,
  IStateHoverInfo,
  applyNewDirtiedRanges,
  setDebugState
} from "./state";
import {
  DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID,
  DECORATION_ATTRIBUTE_ID
} from "./utils/decoration";
import { DecorationSet, EditorView } from "prosemirror-view";
import { EditorState, Plugin, Transaction } from "prosemirror-state";
import {
  expandRangesToParentBlockNode,
  mapAndMergeRanges,
  mapRanges
} from "./utils/range";
import { getReplaceStepRangesFromTransaction } from "./utils/prosemirror";
import { getStateHoverInfoFromEvent } from "./utils/dom";
import {
  IRange,
  IValidationError,
  IValidationResponse,
  IValidationOutput
} from "./interfaces/IValidation";
import { IValidationAPIAdapter } from "./interfaces/IValidationAPIAdapter";
import { Node, Schema } from "prosemirror-model";
import Store from "./store";

/**
 * @module createValidationPlugin
 */

export type ViewHandler = (
  plugin: Plugin,
  commands: ICommands
) => ((
  p: EditorView<Schema>
) => {
  update?:
    | ((view: EditorView<Schema>, prevState: EditorState<Schema>) => void)
    | null;
  destroy?: (() => void) | null;
});

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

export type ExpandRanges = (ranges: IRange[], doc: Node<any>) => IRange[];

interface IPluginOptions {
  /**
   * The adapter the plugin uses to asynchonously request validations.
   */
  adapter: IValidationAPIAdapter;

  /**
   * A function that receives ranges that have been dirtied since the
   * last validation request, and returns the new ranges to validate. The
   * default implementation expands the dirtied ranges to cover the parent
   * block node.
   */
  expandRanges?: ExpandRanges;

  /**
   * The throttle duration for validation requests, in ms.
   */
  throttleInMs?: number;

  /**
   * The maximum throttle duration.
   */
  maxThrottle?: number;
}

/**
 * Creates a document validator plugin, responsible for issuing validation
 * requests when the document is changed, decorating the document when they
 * are returned, and applying suggestions.
 *
 * @param {IPluginOptions} options The plugin options object.
 * @returns {{plugin: Plugin, commands: ICommands}}
 */
const createValidatorPlugin = (options: IPluginOptions) => {
  const {
    adapter,
    expandRanges = expandRangesToParentBlockNode,
    throttleInMs = 2000,
    maxThrottle = 8000
  } = options;
  let localView: EditorView;

  // Set up our store, which we'll use to notify consumer code of state updates.
  const store = new Store();

  // Set up our validation methods, which run outside of the plugin state lifecycle.
  const validationService = new ValidationService(adapter);

  /**
   * Request a validation for the currently pending ranges.
   */
  const requestValidation = () => {
    const pluginState: IPluginState = plugin.getState(localView.state);
    // If there's already a validation in flight, defer validation
    // for another throttle tick
    if (pluginState.validationInFlight) {
      return scheduleValidation();
    }
    localView.dispatch(
      localView.state.tr.setMeta(
        VALIDATION_PLUGIN_ACTION,
        validationRequestStart(expandRanges)
      )
    );
  };
  const scheduleValidation = () =>
    setTimeout(
      requestValidation,
      plugin.getState(localView.state).currentThrottle
    );

  const commands: ICommands = {
    validateDocument: (
      state: EditorState,
      dispatch: (tr: Transaction) => void
    ) => {
      dispatch(
        state.tr.setMeta(
          VALIDATION_PLUGIN_ACTION,
          validationRequestStart(expandRanges)
        )
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
      const pluginState = plugin.getState(state);
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
        dispatch(state.tr.setMeta(VALIDATION_PLUGIN_ACTION, setDebugState(debug)));
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
      const pluginState = plugin.getState(state);
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
  };

  const plugin: Plugin = new Plugin({
    state: {
      init(_, { doc }): IPluginState {
        // Hook up our validation events.
        validationService.on(
          ValidationEvents.VALIDATION_SUCCESS,
          (validationResponse: IValidationResponse) =>
            localView.dispatch(
              localView.state.tr.setMeta(
                VALIDATION_PLUGIN_ACTION,
                validationRequestSuccess(validationResponse)
              )
            )
        );
        validationService.on(
          ValidationEvents.VALIDATION_ERROR,
          (validationError: IValidationError) =>
            localView.dispatch(
              localView.state.tr.setMeta(
                VALIDATION_PLUGIN_ACTION,
                validationRequestError(validationError)
              )
            )
        );
        return {
          debug: false,
          currentThrottle: throttleInMs,
          initialThrottle: throttleInMs,
          maxThrottle,
          decorations: DecorationSet.create(doc, []),
          dirtiedRanges: [],
          currentValidations: [],
          selectedValidation: undefined,
          hoverId: undefined,
          hoverInfo: undefined,
          trHistory: [],
          validationInFlight: undefined,
          validationPending: false,
          error: undefined
        };
      },
      apply(tr: Transaction, state: IPluginState): IPluginState {
        // There are certain things we need to do every time a transaction
        // is dispatched, and the logic for that doesn't belong in the reducer.
        const newState = {
          ...state,
          // Map our decorations, dirtied ranges and validations through the new transaction.
          decorations: state.decorations.map(tr.mapping, tr.doc),
          dirtiedRanges: mapAndMergeRanges(tr, state.dirtiedRanges),
          currentValidations: mapRanges(tr, state.currentValidations),
          // Keep the transaction history up to date ... to a point! If we get a
          // validation result older than this history, we can discard it and ask
          // for another.
          trHistory:
            state.trHistory.length > 25
              ? state.trHistory.slice(1).concat(tr)
              : state.trHistory.concat(tr)
        };
        // Apply our reducer.
        return validationPluginReducer(
          tr,
          newState,
          tr.getMeta(VALIDATION_PLUGIN_ACTION)
        );
      }
    },

    /**
     * We use appendTransaction to handle side effects and dispatch actions
     * in response to state transitions.
     */
    appendTransaction(trs: Transaction[], oldState, newState) {
      const oldPluginState: IPluginState = plugin.getState(oldState);
      const newPluginState: IPluginState = plugin.getState(newState);
      const tr = newState.tr;

      // Check for dirted ranges and update the state accordingly.
      const newDirtiedRanges = trs.reduce(
        (acc, _) => acc.concat(getReplaceStepRangesFromTransaction(_)),
        [] as IRange[]
      );
      if (newDirtiedRanges.length) {
        // If we haven't yet scheduled a validation request, issue a delayed
        // request to the validation service, and mark the state as pending
        // validation.
        if (!newPluginState.validationPending) {
          scheduleValidation();
        }
        return tr.setMeta(
          VALIDATION_PLUGIN_ACTION,
          applyNewDirtiedRanges(newDirtiedRanges)
        );
      }

      // If we have a new validation, send it to the validation service.
      if (
        !oldPluginState.validationInFlight &&
        newPluginState.validationInFlight
      ) {
        validationService.validate(
          newPluginState.validationInFlight.validationInputs,
          trs[trs.length - 1].time
        );
      }
    },
    props: {
      decorations: state => {
        return plugin.getState(state).decorations;
      },
      handleDOMEvents: {
        mouseover: (view: EditorView, event: MouseEvent) => {
          if (!event.target || !(event.target instanceof HTMLElement)) {
            return false;
          }
          const target = event.target;
          const targetAttr = target.getAttribute(DECORATION_ATTRIBUTE_ID);
          const newValidationId = targetAttr ? targetAttr : undefined;
          if (newValidationId === plugin.getState(view.state).hoverId) {
            return false;
          }

          // Get our height marker, which tells us the height of a single line
          // for the given validation.
          const heightMarker = document.querySelector(
            `[${DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID}="${newValidationId}"]`
          );
          if (
            newValidationId &&
            (!heightMarker || !(heightMarker instanceof HTMLElement))
          ) {
            // tslint:disable-next-line no-console
            console.warn(
              `No height marker found for id ${newValidationId}, or the returned marker is not an HTML element. This is odd - a height marker should be present. It's probably a bug.`
            );
            return false;
          }

          commands.indicateHover(
            newValidationId,
            getStateHoverInfoFromEvent(event, view.dom, heightMarker)
          )(view.state, view.dispatch);

          return false;
        }
      }
    },
    view(view) {
      localView = view;
      return {
        // Update our store with the new state, which can then notify its subscribers.
        update: _ => store.notify(plugin.getState(_.state))
      };
    }
  });

  return {
    plugin,
    commands,
    store
  };
};

export default createValidatorPlugin;
