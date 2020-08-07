import { applyNewDirtiedRanges } from "./state/actions";
import { IPluginState, PROSEMIRROR_TYPERIGHTER_ACTION } from "./state/reducer";
import { createInitialState, createReducer } from "./state/reducer";
import { selectNewBlockInFlight } from "./state/selectors";
import {
  DECORATION_ATTRIBUTE_ID
} from "./utils/decoration";
import { EditorView } from "prosemirror-view";
import { Plugin, Transaction, EditorState, PluginKey } from "prosemirror-state";
import { expandRangesToParentBlockNode } from "./utils/range";
import { getReplaceStepRangesFromTransaction } from "./utils/prosemirror";
import { getStateHoverInfoFromEvent } from "./utils/dom";
import { IRange, IMatch } from "./interfaces/IMatch";
import { Node } from "prosemirror-model";
import Store, {
  STORE_EVENT_NEW_STATE,
  STORE_EVENT_NEW_MATCHES,
  STORE_EVENT_NEW_DIRTIED_RANGES
} from "./state/store";
import { indicateHoverCommand, stopHoverCommand } from "./commands";

export type ExpandRanges = (ranges: IRange[], doc: Node<any>) => IRange[];

interface IPluginOptions<TMatch extends IMatch> {
  /**
   * A function that receives ranges that have been dirtied since the
   * last request, and returns the new ranges to find matches for. The
   * default implementation expands the dirtied ranges to cover the parent
   * block node.
   */
  expandRanges?: ExpandRanges;

  /**
   * The initial set of matches to apply to the document, if any.
   */
  matches?: TMatch[];
}

/**
 * Creates the prosemirror-typerighter plugin. Responsible for issuing requests when the
 * document is changed via the supplied servier, decorating the document with matches
 * when they are are returned, and applying suggestions to the document.
 *
 * @param {IPluginOptions} options The plugin options object.
 * @returns {{plugin: Plugin, commands: ICommands}}
 */
const createTyperighterPlugin = <TMatch extends IMatch>(
  options: IPluginOptions<TMatch> = {}
) => {
  const { expandRanges = expandRangesToParentBlockNode, matches = [] } = options;
  // A handy alias to reduce repetition
  type TPluginState = IPluginState<TMatch>;

  // Set up our store, which we'll use to notify consumer code of state updates.
  const store = new Store();
  const reducer = createReducer(expandRanges);

  const plugin: Plugin = new Plugin({
    key: new PluginKey("prosemirror-typerighter"),
    state: {
      init: (_, { doc }) => createInitialState(doc, matches),
      apply(tr: Transaction, state: TPluginState): TPluginState {
        // We use the reducer pattern to handle state transitions.
        return reducer(tr, state, tr.getMeta(PROSEMIRROR_TYPERIGHTER_ACTION));
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

      const newDirtiedRanges = trs.reduce(
        (acc, range) => acc.concat(getReplaceStepRangesFromTransaction(range)),
        [] as IRange[]
      );
      if (newDirtiedRanges.length) {
        if (newPluginState.config.requestMatchesOnDocModified) {
          // We wait a tick here, as applyNewDirtiedRanges must run
          // before the newly dirtied range is available in the state.
          // @todo -- this is a bit of a hack, it can be done better.
          setTimeout(() => store.emit(STORE_EVENT_NEW_DIRTIED_RANGES));
        }
        return tr.setMeta(
          PROSEMIRROR_TYPERIGHTER_ACTION,
          applyNewDirtiedRanges(newDirtiedRanges)
        );
      }

      const blockStates = selectNewBlockInFlight(
        oldPluginState,
        newPluginState
      );
      blockStates.forEach(({ requestId, pendingBlocks }) =>
        store.emit(
          STORE_EVENT_NEW_MATCHES,
          requestId,
          pendingBlocks.map(_ => _.block)
        )
      );
    },
    props: {
      decorations: state => {
        return plugin.getState(state).decorations;
      },
      handleDOMEvents: {
        mouseover: (view: EditorView, event: Event) => {
          if (!event.target || !(event.target instanceof HTMLElement)) {
            return false;
          }
          const target = event.target;
          const targetAttr = target.getAttribute(DECORATION_ATTRIBUTE_ID);
          const newMatchId = targetAttr ? targetAttr : undefined;
          if (newMatchId === plugin.getState(view.state).hoverId) {
            return false;
          }

          // Get our height marker, which tells us the height of a single line
          // for the given match.
          const matchDecoration = document.querySelector(
            `[${DECORATION_ATTRIBUTE_ID}="${newMatchId}"]`
          );
          if (
            newMatchId &&
            (!matchDecoration || !(matchDecoration instanceof HTMLElement))
          ) {
            // tslint:disable-next-line no-console
            console.warn(
              `No height marker found for id ${newMatchId}, or the returned marker is not an HTML element. This is odd - a height marker should be present. It's probably a bug.`
            );
            return false;
          }

          const hoverInfo = getStateHoverInfoFromEvent(
            // We're very sure that this is a mouseevent, but Typescript isn't.
            event as MouseEvent,
            view.dom,
            matchDecoration
          );

          if (newMatchId && hoverInfo) {
            indicateHoverCommand(newMatchId, hoverInfo)(
              view.state,
              view.dispatch
            );
          } else {
            stopHoverCommand()(view.state, view.dispatch);
          }

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

export default createTyperighterPlugin;
