import { render, h } from "preact";
import { Plugin, Transaction, EditorState } from "prosemirror-state";
import { Schema } from "prosemirror-model";
import { DecorationSet, EditorView } from "prosemirror-view";
import { mergeRanges } from "./utils/range";
import {
  ValidationResponse,
  ValidationInput,
  ValidationError,
  Range,
  ValidationOutput
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
  selectValidationById
} from "./state";
import {
  findSingleDecoration,
  createDebugDecorationFromRange,
  removeValidationDecorationsFromRanges
} from "./utils/decoration";
import { getReplaceStepRangesFromTransaction } from "./utils/prosemirror";
import createLanguageToolAdapter from "./adapters/languageTool";
import ValidationOverlay from "./components/ValidationOverlay";
import HoverEvent from "./interfaces/HoverEvent";

/**
 * Create a function responsible for updating the view. We update the view
 * when we need to update our decorations with hover information.
 */
const updateView = (plugin: Plugin, notify: (s: PluginState) => void) => (
  view: EditorView,
  prevState: EditorState
) => {
  const pluginState: PluginState = plugin.getState(view.state);
  notify(pluginState);
  const decorationId = pluginState.hoverId;
  const prevDecorationId = plugin.getState(prevState).hoverId;
  if (prevDecorationId === decorationId) {
    return;
  }
  if (!prevDecorationId && decorationId) {
    const decoration = findSingleDecoration(
      pluginState,
      spec => spec.decorationId === decorationId
    );
    if (!decoration) {
      return;
    }
    (decoration as any).type.widget.classList.add(
      "ValidationWidget__container--is-hovering"
    );
    return;
  }
  const decoration = findSingleDecoration(
    pluginState,
    spec => spec.decorationId === prevDecorationId
  );
  if (!decoration) {
    return;
  }
  // @todo - revisit typing, as PM doesn't expose the 'type' property
  // but we need access to the appropriate DOM node here
  (decoration as any).type.widget &&
    (decoration as any).type.widget.classList.remove(
      "ValidationWidget__container--is-hovering"
    );
};

type PluginState = {
  initialThrottle: number;
  currentThrottle: number;
  maxThrottle: number;
  decorations: DecorationSet;
  currentValidations: ValidationOutput[];
  dirtiedRanges: Range[];
  lastValidationTime: number;
  hoverId: string | undefined;
  hoverRect: DOMRect | ClientRect | undefined;
  trHistory: Transaction[];
  validationPending: boolean;
  validationInFlight:
    | {
        validationInputs: ValidationInput[];
        id: number;
      }
    | undefined;
  error: string | undefined;
};

const getMergedDirtiedRanges = (tr: Transaction, oldRanges: Range[]) =>
  mergeRanges(
    oldRanges
      .map(range => ({
        from: tr.mapping.map(range.from),
        to: tr.mapping.map(range.to)
      }))
      .concat(getReplaceStepRangesFromTransaction(tr))
  );

/**
 * The document validator plugin. Listens for validation commands and applies
 * validation decorations to the document.
 */
const documentValidatorPlugin = (
  schema: Schema,
  {
    apiUrl,
    throttleInMs = 2000,
    maxThrottle = 8000
  }: {
    apiUrl: string;
    throttleInMs?: number;
    maxThrottle?: number;
  }
) => {
  let localView: EditorView;
  let overlayNode: HTMLDivElement;
  const validationService = new ValidationService(
    createLanguageToolAdapter(apiUrl)
  );
  validationService.on(ValidationEvents.VALIDATION_SUCCESS, console.log);
  const sendValidation = () => {
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
  const scheduleValidation = () => {
    setTimeout(
      sendValidation,
      plugin.getState(localView.state).currentThrottle
    );
  };

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
          currentThrottle: throttleInMs,
          initialThrottle: throttleInMs,
          maxThrottle,
          decorations: DecorationSet.create(doc, []),
          dirtiedRanges: [],
          currentValidations: [],
          lastValidationTime: 0,
          hoverId: undefined,
          hoverRect: undefined,
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

        // Keep the transaction history up to date
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
        // Issue a delayed request to the validation service,
        // and mark the state as pending validation
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
        mouseover: (view: EditorView, e: Event) => {
          const target = e.target;
          if (target) {
            const targetAttr = (target as HTMLElement).getAttribute(
              "data-attr-validation-id"
            );
            const newValidationId = targetAttr ? targetAttr : undefined;
            if (newValidationId !== plugin.getState(view.state).hoverId) {
              view.dispatch(
                view.state.tr.setMeta(
                  VALIDATION_PLUGIN_ACTION,
                  newHoverIdReceived(
                    newValidationId,
                    (target as HTMLDivElement).getBoundingClientRect()
                  )
                )
              );
            }
          }
          return false;
        }
      }
    },
    view(view: EditorView) {
      const notificationSubscribers: Array<
        (hoverEvent: HoverEvent) => void
      > = [];
      const subscribe = (callback: (hoverEvent: HoverEvent) => void) => {
        notificationSubscribers.push(callback);
        return () => {
          notificationSubscribers.splice(
            notificationSubscribers.indexOf(callback),
            1
          );
        };
      };
  
      // Create our overlay node, which is responsible for displaying
      // validation messages when the user hovers over highlighted ranges.
      overlayNode = document.createElement("div");
      view.dom.insertAdjacentElement("afterend", overlayNode);
      render(<ValidationOverlay subscribe={subscribe} />, overlayNode);
      const notify = (state: PluginState) => notificationSubscribers.forEach(sub => {
        if (state.hoverId) {
          const validationOutput = selectValidationById(state, state.hoverId);
          return sub({
            hoverRect: state.hoverRect,
            validationOutput
          })
        }
        sub({
          hoverRect: undefined,
          validationOutput: undefined
        })
      });

      localView = view;
      return {
        update: updateView(plugin, notify)
      };
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
export { validateDocument, PluginState };
