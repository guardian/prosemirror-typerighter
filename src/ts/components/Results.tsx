import React, { useState, useEffect } from "react";
import sortBy from "lodash/sortBy";
import Store, { STORE_EVENT_NEW_STATE } from "../state/store";
import { ApplySuggestionOptions } from "../commands";
import { IPluginState } from "../state/reducer";
import { selectPercentRemaining } from "../state/selectors";
import SidebarMatch from "./SidebarMatch";
import { MatchType } from "../utils/decoration";
import FilterResults from "./FilterResults";

interface IProps<TPluginState extends IPluginState> {
  store: Store<TPluginState>;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
  applyAutoFixableSuggestions: () => void;
  applyFilterState: (filterState: MatchType[]) => void;
  selectMatch: (matchId: string) => void;
  indicateHighlight: (matchId: string, _?: any) => void;
  stopHighlight: () => void;
  contactHref?: string;
  editorScrollElement: Element;
  getScrollOffset: () => number;
}

/**
 * Displays current matches and allows users to apply suggestions.
 */

const Results = <TPluginState extends IPluginState<MatchType[]>>({
  store,
  applySuggestions,
  selectMatch,
  indicateHighlight,
  stopHighlight,
  contactHref,
  editorScrollElement,
  getScrollOffset,
  applyFilterState
}: IProps<TPluginState>) => {
  const [pluginState, setPluginState] = useState<TPluginState | undefined>(
    undefined
  );
  const [loadingBarVisible, setLoadingBarVisible] = useState<boolean>(false);

  const handleNewState = (incomingState: TPluginState) => {
    setPluginState({
      ...incomingState,
      filteredMatches: sortBy(incomingState.filteredMatches, "from")
    });
    const oldKeys = pluginState
      ? Object.keys(pluginState.requestsInFlight)
      : [];
    const newKeys = Object.keys(incomingState.requestsInFlight);
    if (oldKeys.length && !newKeys.length) {
      setTimeout(maybeResetLoadingBar, 300);
    }
    if (!loadingBarVisible && newKeys.length) {
      setLoadingBarVisible(true);
    }
  };

  useEffect(() => {
    store.on(STORE_EVENT_NEW_STATE, newState => {
      handleNewState(newState);
    });
    setPluginState(store.getState());
  }, []);

  const getPercentRemaining = () => {
    if (!pluginState) {
      return 0;
    }
    return selectPercentRemaining(pluginState);
  };

  const maybeResetLoadingBar = () => {
    if (!pluginState || !!Object.keys(pluginState.requestsInFlight)) {
      setLoadingBarVisible(false);
    }
  };

  const {
    currentMatches = [],
    filteredMatches = [],
    requestsInFlight,
    selectedMatch
  } = pluginState || { selectedMatch: undefined };
  const hasMatches = !!currentMatches.length;
  const percentRemaining = getPercentRemaining();
  const isLoading =
    !!requestsInFlight && !!Object.keys(requestsInFlight).length;

  return (
    <>
      <div className="Sidebar__header-container">
        <div className="Sidebar__header">
          <div className="Sidebar__results">
            <div>
              Results {hasMatches && <span>({filteredMatches.length}) </span>}
            </div>
            {pluginState && pluginState.config.matchColours && (
              <div className="Sidebar__filter-container">
                <FilterResults
                  filterState={pluginState.filterState}
                  applyFilterState={applyFilterState}
                  matches={currentMatches}
                  matchColours={pluginState.config.matchColours}
                />
              </div>
            )}
          </div>
        </div>
        {contactHref && (
          <div className="Sidebar__header-contact">
            <a href={contactHref} target="_blank">
              Issue with Typerighter? Let us know!
            </a>
          </div>
        )}
        {loadingBarVisible && (
          <div
            className="LoadingBar"
            style={{
              opacity: isLoading ? 1 : 0,
              width: `${100 - percentRemaining}%`
            }}
          />
        )}
      </div>

      <div className="Sidebar__content">
        {hasMatches && pluginState && (
          <ul className="Sidebar__list">
            {filteredMatches.map(match => (
              <li className="Sidebar__list-item" key={match.matchId}>
                <SidebarMatch
                  matchColours={pluginState?.config.matchColours}
                  match={match}
                  selectedMatch={selectedMatch}
                  applySuggestions={applySuggestions}
                  selectMatch={selectMatch}
                  indicateHighlight={indicateHighlight}
                  stopHighlight={stopHighlight}
                  editorScrollElement={editorScrollElement}
                  getScrollOffset={getScrollOffset}
                />
              </li>
            ))}
          </ul>
        )}
        {!hasMatches && (
          <div className="Sidebar__awaiting-match">No matches to report.</div>
        )}
      </div>
    </>
  );
};

export default Results;
