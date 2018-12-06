/**
 * @module createValidationPlugin
 */

import defaultView from "./view";
import ValidationService, {
  ValidationEvents
} from "./services/ValidationAPIService";
import {
  Action,
  IPluginState,
  newHoverIdReceived,
  selectValidationById,
  VALIDATION_PLUGIN_ACTION,
  validationPluginReducer,
  validationRequestError,
  validationRequestPending,
  validationRequestStart,
  validationRequestSuccess
} from "./state";
import {
  createDebugDecorationFromRange,
  DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID,
  DECORATION_ATTRIBUTE_ID,
  removeValidationDecorationsFromRanges
} from "./utils/decoration";
import { DecorationSet, EditorView } from "prosemirror-view";
import { EditorState, Plugin, Transaction } from "prosemirror-state";
import {
  expandRangesToParentBlockNode,
  getMergedDirtiedRanges
} from "./utils/range";
import { getReplaceStepRangesFromTransaction } from "./utils/prosemirror";
import { getStateHoverInfoFromEvent } from "./utils/dom";
import {
  IRange,
  IValidationError,
  IValidationResponse
} from "./interfaces/IValidation";
import { IValidationAPIAdapter } from "./interfaces/IValidationAPIAdapter";
import { Node, Schema } from "prosemirror-model";

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

/**
 * Applies a suggestion from a validation to the document.
 */
type ApplySuggestionCommand = (
  validationId: string,
  suggestionIndex: number
) => (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;

/**
 * Validates an entire document.
 */
type ValidateDocumentCommand = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean;

/**
 * The commands available to the plugin consumer.
 */
export interface ICommands {
  applySuggestion: ApplySuggestionCommand;
  validateDocument: ValidateDocumentCommand;
}

interface IPluginOptions {
  /**
   * The adapter the plugin uses to asynchonously request validations.
   */
  adapter: IValidationAPIAdapter;

  /**
   * The view handler responsible for rendering any UI beyond the inline
   * decorations applied by the plugin. The default implementation shows
   * additional validation information on hover.
   */
  createViewHandler?: ViewHandler;

  /**
   * A function that receives ranges that have been dirtied since the
   * last validation request, and returns the new ranges to validate. The
   * default implementation expands the dirtied ranges to cover the parent
   * block node.
   */
  expandRanges?: (ranges: IRange[], doc: Node<any>) => IRange[];

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
    createViewHandler = defaultView as ViewHandler,
    expandRanges = expandRangesToParentBlockNode,
    throttleInMs = 2000,
    maxThrottle = 8000
  } = options;
  let localView: EditorView;

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
        validationRequestStart(
          expandRanges(pluginState.dirtiedRanges, localView.state.tr.doc)
        )
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
          validationRequestStart(
            [] // @todo: get ranges of all top level block nodes
          )
        )
      );
      return true;
    },

    applySuggestion: (validationId: string, suggestionIndex: number) => (
      state: EditorState,
      dispatch?: (tr: Transaction) => void
    ) => {
      const pluginState = plugin.getState(state);
      const validationOutput = selectValidationById(pluginState, validationId);
      if (!validationOutput) {
        return false;
      }
      const suggestion =
        validationOutput.suggestions &&
        validationOutput.suggestions[suggestionIndex];
      if (!suggestion) {
        return false;
      }
      dispatch &&
        dispatch(
          state.tr.replaceWith(
            validationOutput.from,
            validationOutput.to,
            state.schema.text(suggestion)
          )
        );
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
          hoverId: undefined,
          hoverInfo: undefined,
          trHistory: [],
          validationInFlight: undefined,
          validationPending: false,
          error: undefined
        };
      },
      apply(tr: Transaction, state: IPluginState): IPluginState {
        // Apply our reducer.
        const action: Action | undefined = tr.getMeta(VALIDATION_PLUGIN_ACTION);
        const { decorations, dirtiedRanges, trHistory, ...rest } = action
          ? validationPluginReducer(tr, state, action)
          : state;

        // Map our dirtied ranges through the current transaction, and append
        // any new ranges it has dirtied.
        let newDecorations = decorations.map(tr.mapping, tr.doc);
        let newTrHistory = trHistory;
        const newDirtiedRanges = getMergedDirtiedRanges(tr, dirtiedRanges);
        const currentDirtiedRanges = getReplaceStepRangesFromTransaction(tr);
        newDecorations = newDecorations.add(
          tr.doc,
          currentDirtiedRanges.map(range =>
            createDebugDecorationFromRange(range)
          )
        );

        if (currentDirtiedRanges.length) {
          // Remove any validations touched by the dirtied ranges from the doc
          newDecorations = removeValidationDecorationsFromRanges(
            newDecorations,
            newDirtiedRanges
          );
        }

        // Keep the transaction history up to date ... to a point! If we get a
        // validation result older than this history, we can discard it and ask
        // for another.
        newTrHistory =
          newTrHistory.length > 25
            ? newTrHistory.slice(1).concat(tr)
            : newTrHistory.concat(tr);

        return {
          ...rest,
          decorations: newDecorations,
          dirtiedRanges: newDirtiedRanges,
          trHistory: newTrHistory
        };
      }
    },

    /**
     * We use appendTransaction to handle side effects and dispatch actions
     * in response to state transitions.
     */
    appendTransaction(trs: Transaction[], oldState, newState) {
      const oldPluginState: IPluginState = plugin.getState(oldState);
      const newPluginState: IPluginState = plugin.getState(newState);
      if (
        newPluginState.dirtiedRanges.length &&
        !newPluginState.validationPending
      ) {
        // Issue a delayed request to the validation service, and mark the
        // state as pending validation.
        scheduleValidation();
        return newState.tr.setMeta(
          VALIDATION_PLUGIN_ACTION,
          validationRequestPending()
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
            console.warn(
              `No height marker found for id ${newValidationId}, or the returned marker is not an HTML element. This is odd - a height marker should be present. It's probably a bug.`
            );
            return false;
          }
          view.dispatch(
            view.state.tr.setMeta(
              VALIDATION_PLUGIN_ACTION,
              newHoverIdReceived(
                newValidationId,
                getStateHoverInfoFromEvent(event, localView.dom, heightMarker)
              )
            )
          );
          return false;
        }
      }
    },
    view(view) {
      localView = view;
      const viewHandler = createViewHandler(plugin, commands);
      return viewHandler(view);
    }
  });

  return {
    plugin,
    commands
  };
};

export default createValidatorPlugin;
