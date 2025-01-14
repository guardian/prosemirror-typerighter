import { applyNewDirtiedRanges } from "./state/actions";
import {
  IPluginState,
  PROSEMIRROR_TYPERIGHTER_ACTION,
  IIgnoreMatchPredicate,
  includeAllMatches,
  IPluginConfig
} from "./state/reducer";
import { createInitialState, createReducer } from "./state/reducer";
import {
  selectMatchByMatchId,
  selectNewBlockInFlight,
  selectPluginConfig
} from "./state/selectors";
import {
  IMatchTypeToColourMap,
  defaultMatchColours,
  maybeGetDecorationMatchIdFromEvent,
  createGlobalDecorationStyleTag,
  GLOBAL_DECORATION_STYLE_ID,
  MatchType
} from "./utils/decoration";
import { EditorView } from "prosemirror-view";
import { Plugin, Transaction } from "prosemirror-state";
import { expandRangesToParentBlockNodes } from "./utils/range";
import { getDirtiedRangesFromTransaction } from "./utils/prosemirror";
import { IRange, Match } from "./interfaces/IMatch";
import { Node } from "prosemirror-model";
import Store, {
  STORE_EVENT_NEW_STATE,
  STORE_EVENT_NEW_MATCHES,
  STORE_EVENT_NEW_DIRTIED_RANGES
} from "./state/store";
import { doNotIgnoreRanges, GetIgnoredRanges } from "./utils/block";
import { createBoundCommands, startHoverCommand, stopHoverCommand } from "./commands";
import { IFilterMatches, maybeResetHoverStates } from "./utils/plugin";
import { pluginKey } from "./utils/plugin";
import { getClientRectIndex } from "./utils/clientRect";
import MatcherService from "./services/MatcherService";
import TyperighterTelemetryAdapter from "./services/TyperighterTelemetryAdapter";
import { IMatcherAdapter } from "./interfaces/IMatcherAdapter";
import { v4 } from "uuid";
import { emptyArray } from "./state/helpers";
import { shallowEqual } from "./utils/shallowEqual";

export type ExpandRanges = (ranges: IRange[], doc: Node) => IRange[];

export interface IFilterOptions{
  /**
   * A function to filter matches given a user-defined filter state.
   */
  filterMatches: IFilterMatches;

  /**
   * The initial state to pass to the filter predicate.
   */
  initialFilterState: MatchType[];
}

type PluginOptionsFromConfig = Partial<Pick<IPluginConfig, "requestMatchesOnDocModified">>;

export interface IPluginOptions extends PluginOptionsFromConfig {
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
  matches?: Match[];

  /**
   * Ignore matches when this predicate returns true.
   */
  ignoreMatch?: IIgnoreMatchPredicate;

  filterOptions?: IFilterOptions;

  /**
   * The colours to use for document matches.
   */
  matchColours?: IMatchTypeToColourMap;

  /**
   * Given a node, return an array of ranges to ignore. Useful when e.g
   * your CMS allows users to exclude ranges that we don't want to check,
   * but do want to accommodate as part of the document.
   */
  getIgnoredRanges?: GetIgnoredRanges;

  /**
   * Is the given element part of the typerighter UI, but not
   * part of the Prosemirror editor? This helps us avoid resetting
   * hover or highlight states when we're hoving over e.g. tooltips
   * or other overlay nodes that are mounted outside of the editor.
   */
  isElementPartOfTyperighterUI?: (el: HTMLElement) => boolean;

  /**
   * Called when a match decoration is clicked.
   */
  onMatchDecorationClicked?: (match: Match) => void;

  telemetryAdapter?: TyperighterTelemetryAdapter;

  adapter: IMatcherAdapter,

  typerighterEnabled?: boolean
  /**
   * A list of categoryIds to exclude from checks. These can be
   * modified on the MatcherService instance if they need to be changed after
   * the plugin initialises.
   */
  excludedCategoryIds?: string[]
}

/**
 * Creates the prosemirror-typerighter plugin. Responsible for issuing requests when the
 * document is changed via the supplied servier, decorating the document with matches
 * when they are are returned, and applying suggestions to the document.
 */
const createTyperighterPlugin = (
  options: IPluginOptions
): {
  plugin: Plugin<IPluginState>;
  store: Store;
  matcherService: MatcherService
} => {
  const {
    expandRanges = expandRangesToParentBlockNodes,
    getIgnoredRanges = doNotIgnoreRanges,
    matches = emptyArray as Match[],
    filterOptions,
    ignoreMatch = includeAllMatches,
    matchColours = defaultMatchColours,
    onMatchDecorationClicked = () => undefined,
    isElementPartOfTyperighterUI = () => false,
    requestMatchesOnDocModified = false,
    adapter,
    telemetryAdapter,
    typerighterEnabled = true,
    excludedCategoryIds = emptyArray as string[]
  } = options;
  // Set up our store, which we'll use to notify consumer code of state updates.
  const store = new Store();
  const reducer = createReducer(
    expandRanges,
    ignoreMatch,
    filterOptions?.filterMatches,
    getIgnoredRanges
  );

  const matcherService = new MatcherService(store, adapter, telemetryAdapter, 2000, excludedCategoryIds)

  const plugin: Plugin<IPluginState> = new Plugin({
    key: pluginKey,
    state: {
      init: (_, { doc }) => {
        const initialState = createInitialState({
          doc,
          matches,
          ignoreMatch,
          matchColours,
          filterOptions,
          requestMatchesOnDocModified,
          typerighterEnabled
        });
        store.emit(STORE_EVENT_NEW_STATE, initialState);
        return initialState;
      },
      apply(tr: Transaction, state: IPluginState): IPluginState {
        // We use the reducer pattern to handle state transitions.
        return reducer(tr, state, tr.getMeta(PROSEMIRROR_TYPERIGHTER_ACTION));
      }
    },

    /**
     * We use appendTransaction to handle side effects and dispatch actions
     * in response to state transitions.
     */
    appendTransaction(trs, oldState, newState) {
      const oldPluginState = plugin.getState(oldState);
      const newPluginState = plugin.getState(newState);

      if (!oldPluginState || !newPluginState) {
        return;
      }

      const newTr = newState.tr;
      const newDirtiedRanges = trs.reduce(
        (acc, tr) => acc.concat(getDirtiedRangesFromTransaction(oldState.doc, tr)),
        [] as IRange[]
      );

      if (newDirtiedRanges.length) {
        if (newPluginState.config.requestMatchesOnDocModified && newPluginState.typerighterEnabled) {
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
      decorations: state => plugin.getState(state)?.decorations,
      handleDOMEvents: {
        mouseleave: (view, event) => {
          maybeResetHoverStates(view, isElementPartOfTyperighterUI, event);
          return false;
        },
        click: (view: EditorView, event: Event) => {
          const pluginState = plugin.getState(view.state);
          if (!pluginState) {
            return;
          }

          const matchId = maybeGetDecorationMatchIdFromEvent(event);
          const match =
            matchId &&
            selectMatchByMatchId(pluginState, matchId);
          if (match) {
            onMatchDecorationClicked(match);
          }

          return false;
        },
        mouseover: (view: EditorView, event: Event) => {
          const matchId = maybeGetDecorationMatchIdFromEvent(event);

          if (!matchId) {
            stopHoverCommand()(view.state, view.dispatch);
          }

          if (!matchId || matchId === plugin.getState(view.state)?.hoverId) {
            return false;
          }

          startHoverCommand(matchId, getClientRectIndex(event))(
            view.state,
            view.dispatch
          );

          return false;
        }
      }
    },
    view(view) {
      const commands = createBoundCommands(view, telemetryAdapter);
      matcherService.setCommands(commands);

      // Check the document eagerly on editor initialisation if
      // requestMatchesOnDocModified is enabled
      const pluginState = pluginKey.getState(view.state);
      if (
        pluginState &&
        selectPluginConfig(pluginState).requestMatchesOnDocModified &&
        pluginState.typerighterEnabled
      ) {
        commands.requestMatchesForDocument(
          v4(),
          matcherService.getCurrentCategories().map(_ => _.id),
          telemetryAdapter
        );
      }

      // Prepend any globally available styles to the document editor if they
      // are not already present.
      if (!document.getElementById(GLOBAL_DECORATION_STYLE_ID)) {
        const globalPluginStyleTag = createGlobalDecorationStyleTag(matchColours);
        globalPluginStyleTag.id = GLOBAL_DECORATION_STYLE_ID;
        view.dom.parentNode?.insertBefore(globalPluginStyleTag, view.dom);
      }

      return {
        // Update our store with the new state.
        update: (_, prevState) => {
          const { dirtiedRanges, ...pluginState } = plugin.getState(view.state) as IPluginState;
          const { dirtiedRanges: prevDirtiedRanges, ...prevPluginState } = plugin.getState(prevState) as IPluginState;

          // Do not update if nothing has changed.
          if (shallowEqual(pluginState, prevPluginState)) {
            return;
          }

          store.emit(STORE_EVENT_NEW_STATE, pluginState);
        }
      };
    }
  });

  return {
    plugin,
    store,
    matcherService
  };
};

export default createTyperighterPlugin;
