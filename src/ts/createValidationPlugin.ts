import {
  IPluginState,
  VALIDATION_PLUGIN_ACTION,
  createValidationPluginReducer,
  applyNewDirtiedRanges,
  createInitialState,
  selectNewValidationInFlight
} from "./state";
import {
  DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID,
  DECORATION_ATTRIBUTE_ID
} from "./utils/decoration";
import { EditorView } from "prosemirror-view";
import { Plugin, Transaction, EditorState } from "prosemirror-state";
import { expandRangesToParentBlockNode } from "./utils/range";
import { getReplaceStepRangesFromTransaction } from "./utils/prosemirror";
import { getStateHoverInfoFromEvent } from "./utils/dom";
import { IRange, IBaseValidationOutput } from "./interfaces/IValidation";
import { Node } from "prosemirror-model";
import Store, {
  STORE_EVENT_NEW_STATE,
  STORE_EVENT_NEW_VALIDATION
} from "./store";
import { indicateHoverCommand } from "./commands";

/**
 * @module createValidationPlugin
 */

export type ExpandRanges = (ranges: IRange[], doc: Node<any>) => IRange[];

interface IPluginOptions {
  /**
   * A function that receives ranges that have been dirtied since the
   * last validation request, and returns the new ranges to validate. The
   * default implementation expands the dirtied ranges to cover the parent
   * block node.
   */
  expandRanges?: ExpandRanges;
}

/**
 * Creates a document validator plugin, responsible for issuing validation
 * requests when the document is changed, decorating the document when they
 * are returned, and applying suggestions.
 *
 * @param {IPluginOptions} options The plugin options object.
 * @returns {{plugin: Plugin, commands: ICommands}}
 */
const createValidatorPlugin = <TValidationMeta extends IBaseValidationOutput>(
  options: IPluginOptions = {}
) => {
  const { expandRanges = expandRangesToParentBlockNode } = options;
  // A handy alias to reduce repetition
  type TPluginState = IPluginState<TValidationMeta>;

  // Set up our store, which we'll use to notify consumer code of state updates.
  const store = new Store();
  const reducer = createValidationPluginReducer(expandRanges);

  const plugin: Plugin = new Plugin({
    state: {
      init: (_, { doc }) => createInitialState(doc),
      apply(tr: Transaction, state: TPluginState): TPluginState {
        // We use the reducer pattern to handle state transitions.
        return reducer(tr, state, tr.getMeta(VALIDATION_PLUGIN_ACTION));
      }
    },

    /**
     * We use appendTransaction to handle side effects and dispatch actions
     * in response to state transitions.
     */
    appendTransaction(trs: Transaction[], oldState, newState) {
      const oldPluginState: TPluginState = plugin.getState(oldState);
      const newPluginState: TPluginState = plugin.getState(newState);
      const tr = newState.tr;

      // Check for dirted ranges and update the state accordingly.
      const newDirtiedRanges = trs.reduce(
        (acc, range) => acc.concat(getReplaceStepRangesFromTransaction(range)),
        [] as IRange[]
      );
      if (newDirtiedRanges.length) {
        return tr.setMeta(
          VALIDATION_PLUGIN_ACTION,
          applyNewDirtiedRanges(newDirtiedRanges)
        );
      }
      const newValidationsInFlight = selectNewValidationInFlight(
        oldPluginState,
        newPluginState
      );
      newValidationsInFlight.forEach(_ =>
        store.emit(STORE_EVENT_NEW_VALIDATION, _)
      );
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

          indicateHoverCommand(
            newValidationId,
            getStateHoverInfoFromEvent(event, view.dom, heightMarker)
          )(view.state, view.dispatch);

          return false;
        }
      }
    },
    view(view) {
      return {
        // Update our store with the new state.
        update: _ =>
          store.emit(STORE_EVENT_NEW_STATE, plugin.getState(view.state))
      };
    }
  });

  return {
    plugin,
    store,
    getState: plugin.getState.bind(plugin) as (
      state: EditorState
    ) => TPluginState
  };
};

export default createValidatorPlugin;
