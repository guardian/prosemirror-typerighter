import React, { useState, useEffect, useContext } from "react";
import sortBy from "lodash/sortBy";
import Store, { STORE_EVENT_NEW_STATE } from "../state/store";
import { ApplySuggestionOptions } from "../commands";
import { IPluginState } from "../state/reducer";
import { selectMatches, selectPercentRemaining } from "../state/selectors";
import { Switch } from "@material-ui/core";
import FilterResults from "./FilterResults";
import { MatchType } from "../utils/decoration";
import TelemetryContext from "../contexts/TelemetryContext";
import { chain } from "lodash";
import _ from "lodash";
import SidebarMatchGroup from "./SidebarMatchGroup";
import SidebarMatch from "./SidebarMatch";

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
  const [sortAndGroup, setSortAndGroup] = useState<boolean>(true);
  const { telemetryAdapter } = useContext(TelemetryContext);

  const handleNewState = (incomingState: TPluginState) => {
    setPluginState({
      ...incomingState,
      currentMatches: sortBy(incomingState.currentMatches, "from")
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

  const maybeResetLoadingBar = () => {
    if (!pluginState || !!Object.keys(pluginState.requestsInFlight)) {
      setLoadingBarVisible(false);
    }
  };

  const toggleSortAndGroup = () => {
    const newValue = !sortAndGroup;
    telemetryAdapter?.summaryViewToggled(newValue, { documentUrl: document.URL })
    setSortAndGroup(newValue)
  }

  const {
    currentMatches = [],
    filteredMatches = [],
    requestsInFlight,
    selectedMatch
  } = pluginState || { selectedMatch: undefined };
  const hasMatches = !!currentMatches.length;
  const percentRemaining = selectPercentRemaining(pluginState);
  const orderedMatches = pluginState
    ? selectMatches(pluginState, sortAndGroup)
    : [];
  const isLoading =
    !!requestsInFlight && !!Object.keys(requestsInFlight).length;
  const groupedCurrentMatches = chain(orderedMatches)
    .groupBy("ruleId")
    .map((matches, _) => matches)
    .value();


  return (
    <>
      <div className="Sidebar__header-container">
        <div className="Sidebar__header">
          <span>
            Results {hasMatches && <span>({filteredMatches.length}) </span>}
          </span>
          <span className="Sidebar__header-sort">
            Summary view
            <Switch
              size="small"
              checked={sortAndGroup}
              onChange={toggleSortAndGroup}
              color="primary"
              inputProps={{ "aria-label": "Summary view" }}
            />
          </span>
        </div>
        <div className="Sidebar__header-bottom">
          {pluginState && pluginState.config.matchColours && (
            <FilterResults
              filterState={pluginState.filterState}
              applyFilterState={applyFilterState}
              matches={currentMatches}
              matchColours={pluginState.config.matchColours}
            />
          )}
          {contactHref && (
            <div className="Sidebar__header-contact">
              <a href={contactHref} target="_blank">
                Issue with Typerighter? Let us know!
              </a>
            </div>
          )}
        </div>
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
            {sortAndGroup
              ? groupedCurrentMatches.map((group, index) => (
                  <SidebarMatchGroup
                    matchColours={pluginState?.config.matchColours}
                    matchGroup={group}
                    selectedMatch={selectedMatch}
                    applySuggestions={applySuggestions}
                    selectMatch={selectMatch}
                    indicateHighlight={indicateHighlight}
                    stopHighlight={stopHighlight}
                    editorScrollElement={editorScrollElement}
                    getScrollOffset={getScrollOffset}
                    key={index}
                  />
                ))
              : orderedMatches.map(match => (
                  <li className="Sidebar__list-item" key={match.matchId}>
                    <SidebarMatch
                      matchColours={pluginState?.config.matchColours}
                      match={match}
                      selectedMatch={selectedMatch}
                      selectMatch={selectMatch}
                      applySuggestions={applySuggestions}
                      indicateHighlight={indicateHighlight}
                      stopHighlight={stopHighlight}
                      editorScrollElement={editorScrollElement}
                      getScrollOffset={getScrollOffset}
                      isGroup={false}
                      isSubset={false}
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
