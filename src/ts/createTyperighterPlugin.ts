import { applyNewDirtiedRanges } from "./state/actions";
import {
  IPluginState,
  PROSEMIRROR_TYPERIGHTER_ACTION,
  IIgnoreMatchPredicate,
  includeAllMatches
} from "./state/reducer";
import { createInitialState, createReducer } from "./state/reducer";
import { selectNewBlockInFlight } from "./state/selectors";
import {
  DECORATION_ATTRIBUTE_ID,
  IMatchTypeToColourMap,
  defaultMatchColours
} from "./utils/decoration";
import { EditorView } from "prosemirror-view";
import { Plugin, Transaction, EditorState } from "prosemirror-state";
import { expandRangesToParentBlockNode } from "./utils/range";
import { getDirtiedRangesFromTransaction } from "./utils/prosemirror";
import { IRange, IMatch } from "./interfaces/IMatch";
import { Node } from "prosemirror-model";
import Store, {
  STORE_EVENT_NEW_STATE,
  STORE_EVENT_NEW_MATCHES,
  STORE_EVENT_NEW_DIRTIED_RANGES
} from "./state/store";
import { doNotSkipRanges, TGetSkippedRanges } from "./utils/block";
import { startHoverCommand, stopHoverCommand } from "./commands";
import { TFilterMatches, maybeResetHoverStates } from "./utils/plugin";
import { pluginKey } from "./utils/plugin";

export type ExpandRanges = (ranges: IRange[], doc: Node<any>) => IRange[];

export interface IFilterOptions<TFilterState, TMatch extends IMatch> {
  /**
   * A function to filter matches given a user-defined filter state.
   */
  filterMatches: TFilterMatches<TFilterState, TMatch>;

  /**
   * The initial state to pass to the filter predicate.
   */
  initialFilterState: TFilterState;
}

export interface IPluginOptions<
  TFilterState = undefined,
  TMatch extends IMatch = IMatch
> {
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

  /**
   * Ignore matches when this predicate returns true.
   */
  ignoreMatch?: IIgnoreMatchPredicate;

  filterOptions?: IFilterOptions<TFilterState, TMatch>;

  /**
   * The colours to use for document matches.
   */
  matchColours?: IMatchTypeToColourMap;

  /**
   * Given a node, return an array of ranges to ignore. Useful when e.g
   * your CMS allows users to exclude ranges that we don't want to check,
   * but do want to accommodate as part of the document.
   */
  getSkippedRanges?: TGetSkippedRanges;

  /**
   * The colours to use for document matches.
   * Is the given element part of the typerighter UI, but not
   * part of the Prosemirror editor? This helps us avoid resetting
   * hover or highlight states when we're hoving over e.g. tooltips
   * or other overlay nodes that are mounted outside of the editor.
   */
  isElementPartOfTyperighterUI?: (el: HTMLElement) => boolean;
}

/**
 * Creates the prosemirror-typerighter plugin. Responsible for issuing requests when the
 * document is changed via the supplied servier, decorating the document with matches
 * when they are are returned, and applying suggestions to the document.
 *
 * @param {IPluginOptions} options The plugin options object.
 * @returns {{plugin: Plugin, commands: ICommands}}
 */
const createTyperighterPlugin = <TFilterState, TMatch extends IMatch>(
  options: IPluginOptions<TFilterState, TMatch> = {}
) => {
  const {
    expandRanges = expandRangesToParentBlockNode,
    getSkippedRanges = doNotSkipRanges,
    matches = [],
    filterOptions,
    ignoreMatch = includeAllMatches,
    matchColours = defaultMatchColours,
    isElementPartOfTyperighterUI = () => false
  } = options;
  // A handy alias to reduce repetition
  type TPluginState = IPluginState<TFilterState, TMatch>;

  // Set up our store, which we'll use to notify consumer code of state updates.
  const store = new Store<TPluginState>();
  const reducer = createReducer<TPluginState>(
    expandRanges,
    ignoreMatch,
    filterOptions?.filterMatches,
    getSkippedRanges
  );

  const plugin: Plugin = new Plugin({
    key: pluginKey,
    state: {
      init: (_, { doc }) => {
        const initialState = createInitialState<TFilterState, TMatch>({
          doc,
          matches,
          ignoreMatch,
          matchColours,
          filterOptions
        });
        store.emit(STORE_EVENT_NEW_STATE, initialState);
        return initialState;
      },
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

      const newTr = newState.tr;

      const newDirtiedRanges = trs.reduce(
        (acc, tr) => acc.concat(getDirtiedRangesFromTransaction(oldState.doc, tr)),
        [] as IRange[]
      );
      if (newDirtiedRanges.length) {
        if (newPluginState.config.requestMatchesOnDocModified) {
          // We wait a tick here, as applyNewDirtiedRanges must run
          // before the newly dirtied range is available in the state.
          // @todo -- this is a bit of a hack, it can be done better.
          setTimeout(() => store.emit(STORE_EVENT_NEW_DIRTIED_RANGES));
        }
        return newTr.setMeta(
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
        const { decorations }: TPluginState = plugin.getState(state);
        return decorations;
      },
      handleDOMEvents: {
        mouseleave: (view, event) => {
          maybeResetHoverStates(view, isElementPartOfTyperighterUI, event);
          return false;
        },
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

          if (newMatchId) {
            startHoverCommand(newMatchId)(view.state, view.dispatch);
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
