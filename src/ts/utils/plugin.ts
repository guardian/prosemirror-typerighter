import { stopHoverCommand, stopHighlightCommand } from "../commands";
import { EditorView } from "prosemirror-view";
import { PluginKey } from "prosemirror-state";
import { getMatchType, MatchType } from "./decoration";
import { IPluginState } from "../state/reducer";
import { Match } from "../interfaces/IMatch";

export const pluginKey = new PluginKey("prosemirror-typerighter");
export const getState = (pluginKey as PluginKey<IPluginState>).getState.bind(
  pluginKey
);

export const maybeResetHoverStates = (
  view: EditorView,
  ignoreElement: (e: HTMLElement) => boolean,
  event: Event
) => {
  // If we're leaving the editor node to mouse over something that we consider part of
  // the prosemirror-typerighter UI, ignore this event – we're still within relevant UI,
  // and shouldn't reset our highlight or hover states.
  if (
    event instanceof MouseEvent &&
    event.relatedTarget instanceof HTMLElement &&
    ignoreElement(event.relatedTarget)
  ) {
    return false;
  }

  const pluginState = pluginKey.getState(view.state);
  if (pluginState.hoverId) {
    return stopHoverCommand()(view.state, view.dispatch);
  }
  if (pluginState.highlightId) {
    return stopHighlightCommand()(view.state, view.dispatch);
  }
};

export type IDefaultFilterState = MatchType[];

/**
 * A function that, receiving a filter state, returns a filtered list of matches.
 * Generic to allow plugin consumers to apply their own filter behaviour.
 */
export type IFilterMatches = (
  filterState: MatchType[],
  matches: Match[]
) => Match[];

export const filterByMatchState: IFilterMatches = (filterState, matches) =>
  matches.filter(match => !filterState.includes(getMatchType(match)));
