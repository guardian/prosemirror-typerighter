import React, { useState, useEffect } from "react";
import sortBy from "lodash/sortBy";
import Store, { STORE_EVENT_NEW_STATE } from "../state/store";
import { ApplySuggestionOptions } from "../commands";
import { IPluginState } from "../state/reducer";
import { selectImportanceOrderedMatches, selectPercentRemaining } from "../state/selectors";
import SidebarMatch from "./SidebarMatch";
import { IMatch } from "../interfaces/IMatch";

interface IProps {
  store: Store<IMatch>;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
  applyAutoFixableSuggestions: () => void;
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

  const Results =  ({
    store,
    applySuggestions,
    selectMatch,
    indicateHighlight,
    stopHighlight,
    contactHref,
    editorScrollElement,
    getScrollOffset
  }: IProps) => {

    const [pluginState, setPluginState] = useState<IPluginState<IMatch> | undefined>(undefined);
    const [loadingBarVisible, setLoadingBarVisible] = useState<boolean>(false);
    const [matchSortBy, setMatchSortBy] = useState<string>("order");

    const handleNewState = (pluginState: IPluginState<IMatch>) => {
      setPluginState({
          ...pluginState,
          currentMatches: sortBy(pluginState.currentMatches, "from")
        
      });
      const oldKeys = pluginState
        ? Object.keys(pluginState.requestsInFlight)
        : [];
      const newKeys = Object.keys(pluginState.requestsInFlight);
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

    const orderedMatches= () => {
      if(!pluginState){
        return []
      }

      switch(matchSortBy){
        case "importance":
          return selectImportanceOrderedMatches(pluginState);
        default:
          return currentMatches;
      }
    }
  
    const maybeResetLoadingBar = () => {
      if (
        !pluginState ||
        !!Object.keys(pluginState.requestsInFlight)
      ) {
        setLoadingBarVisible(false);
      }
    };
    
    const { currentMatches = [], requestsInFlight, selectedMatch } = pluginState || { selectedMatch: undefined };
    const hasMatches = !!(currentMatches && currentMatches.length);
    const percentRemaining = getPercentRemaining();
    const isLoading =
      !!requestsInFlight && !!Object.keys(requestsInFlight).length;

    return (
      <>
        <div className="Sidebar__header-container">
          <div className="Sidebar__header">
            <span>
              Results {hasMatches && <span>({currentMatches.length}) </span>}
            </span>
            <span className="Sidebar__header-sort">
              Sory By 
              <select className="Sidebar__header-sort-dropdown" value={matchSortBy} onChange={(event) => setMatchSortBy(event.target.value)}>
                <option value="appearance">Appearance</option>
                <option value="importance">Importance</option>
              </select>
            </span>
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
              {orderedMatches().map(match => (
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
  }

export default Results;
