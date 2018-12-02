import { Plugin, Transaction, EditorState } from "prosemirror-state";
import { Schema } from "prosemirror-model";
import { DecorationSet, EditorView } from "prosemirror-view";
import { mergeRanges, getMergedDirtiedRanges } from "./utils/range";
import {
  Range,
  ValidationResponse,
  ValidationError
} from "./interfaces/Validation";
import ValidationService, { ValidationEvents } from "./ValidationAPIService";
import {
  VALIDATION_PLUGIN_ACTION,
  validationRequestStart,
  validationRequestSuccess,
  validationRequestError,
  validationPluginReducer,
  Action,
  validationRequestPending,
  newHoverIdReceived,
  PluginState
} from "./state";
import {
  createDebugDecorationFromRange,
  removeValidationDecorationsFromRanges,
  DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID,
  DECORATION_ATTRIBUTE_ID
} from "./utils/decoration";
import { getReplaceStepRangesFromTransaction } from "./utils/prosemirror";
import { getStateHoverInfoFromEvent } from "./utils/dom";
import defaultView from "./view";
import { IValidationAPIAdapter } from "./interfaces/IVAlidationAPIAdapter";

/**
 * The document validator plugin. Listens for validation commands and applies
 * validation decorations to the document.
 */
const documentValidatorPlugin = (
  schema: Schema,
  {
    createViewHandler = defaultView,
    adapter,
    throttleInMs = 2000,
    maxThrottle = 8000
  }: {
    createViewHandler?: (
      plugin: Plugin,
      schema: Schema
    ) => ((
      p: EditorView<Schema>
    ) => {
      update?:
        | ((view: EditorView<Schema>, prevState: EditorState<Schema>) => void)
        | null;
      destroy?: (() => void) | null;
    });
    adapter: IValidationAPIAdapter;
    throttleInMs?: number;
    maxThrottle?: number;
  }
) => {
  let localView: EditorView;

  // Set up our validation methods, which run outside of the plugin state lifecycle.
  const validationService = new ValidationService(adapter);

  /**
   * Request a validation for the currently pending ranges.
   */
  const requestValidation = () => {
    const pluginState: PluginState = plugin.getState(localView.state);
    // If there's already a validation in flight, defer validation
    // for another throttle tick
    if (pluginState.validationInFlight) {
      return scheduleValidation();
    }
    localView.dispatch(
      localView.state.tr.setMeta(
        VALIDATION_PLUGIN_ACTION,
        validationRequestStart()
      )
    );
  };
  const scheduleValidation = () =>
    setTimeout(
      requestValidation,
      plugin.getState(localView.state).currentThrottle
    );

  const plugin: Plugin = new Plugin({
    state: {
      init(_, { doc }): PluginState {
        // Hook up our validation events.
        validationService.on(
          ValidationEvents.VALIDATION_SUCCESS,
          (validationResponse: ValidationResponse) =>
            localView.dispatch(
              localView.state.tr.setMeta(
                VALIDATION_PLUGIN_ACTION,
                validationRequestSuccess(validationResponse)
              )
            )
        );
        validationService.on(
          ValidationEvents.VALIDATION_ERROR,
          (validationError: ValidationError) =>
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
      apply(tr: Transaction, state: PluginState): PluginState {
        // Apply our reducer.
        const action: Action | undefined = tr.getMeta(VALIDATION_PLUGIN_ACTION);
        const { decorations, dirtiedRanges, trHistory, ...rest } = action
          ? validationPluginReducer(tr, state, action)
          : state;

        // Map our dirtied ranges through the current transaction, and append
        // any new ranges it has dirtied.
        let _decorations = decorations.map(tr.mapping, tr.doc);
        let _trHistory = trHistory;
        const newDirtiedRanges = getMergedDirtiedRanges(tr, dirtiedRanges);
        const currentDirtiedRanges = getReplaceStepRangesFromTransaction(tr);
        _decorations = _decorations.add(
          tr.doc,
          currentDirtiedRanges.map(range =>
            createDebugDecorationFromRange(range)
          )
        );

        if (currentDirtiedRanges.length) {
          // Remove any validations touched by the dirtied ranges from the doc
          _decorations = removeValidationDecorationsFromRanges(
            _decorations,
            newDirtiedRanges
          );
        }

        // Keep the transaction history up to date ... to a point! If we get a
        // validation result older than this history, we can discard it and ask
        // for another.
        _trHistory =
          _trHistory.length > 25
            ? _trHistory.slice(1).concat(tr)
            : _trHistory.concat(tr);

        return {
          ...rest,
          decorations: _decorations,
          dirtiedRanges: newDirtiedRanges,
          trHistory: _trHistory
        };
      }
    },
    /**
     * We use appendTransaction to handle side effects and dispatch actions
     * in response to state transitions.
     */
    appendTransaction(trs: Transaction[], oldState, newState) {
      const oldPluginState: PluginState = plugin.getState(oldState);
      const newPluginState: PluginState = plugin.getState(newState);
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
          if (
            newValidationId === plugin.getState(view.state).hoverId
          ) {
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
                getStateHoverInfoFromEvent(event, heightMarker)
              )
            )
          );
          return false;
        }
      }
    },
    view(view) {
      localView = view;
      const viewHandler = createViewHandler(plugin, schema);
      return viewHandler(view);
    }
  });
  return plugin;
};

/**
 * The 'validate document' Prosemirror command.
 */
const validateDocument = (
  state: EditorState,
  dispatch: (tr: Transaction) => void
) =>
  dispatch(
    state.tr.setMeta(VALIDATION_PLUGIN_ACTION, validationRequestStart())
  );

export default documentValidatorPlugin;
export { validateDocument };
