import React, { useState, useEffect } from "react";

import Store, { STORE_EVENT_NEW_STATE } from ".././state/store";
import Results from "./Results";
import Controls from "./Controls";
import { Commands } from "../state/commands";
import { MatcherService } from "..";
import { IPluginState } from "../state/reducer";

interface IProps {
  store: Store;
  matcherService: MatcherService;
  commands: Commands;
  contactHref?: string;
  feedbackHref?: string;
  editorScrollElement: Element;
  getScrollOffset: () => number;
  enableDevMode?: boolean;
}

const Sidebar = ({
  store,
  matcherService,
  commands,
  contactHref,
  editorScrollElement,
  getScrollOffset,
  feedbackHref,
  enableDevMode
}: IProps) => {
  const [pluginState, setPluginState] = useState<IPluginState | undefined>(
    undefined
  );
  useEffect(() => {
    setPluginState(store.getState());
    store.on(STORE_EVENT_NEW_STATE, setPluginState);
    return () => {
      store.removeEventListener(STORE_EVENT_NEW_STATE, setPluginState);
    };
  }, []);

  return (
    <>
      {pluginState && (
        <div className="Sidebar__section">
          <Controls
            store={store}
            clearMatches={() => commands.clearMatches()}
            setShowPendingInflightChecks={value => commands.setConfigValue("showPendingInflightChecks", value)}
            setRequestOnDocModified={value =>
              commands.setConfigValue("requestMatchesOnDocModified", value)
            }
            requestMatchesForDocument={commands.requestMatchesForDocument}
            setTyperighterEnabled={commands.setTyperighterEnabled}
            getCurrentCategories={matcherService.getCurrentCategories}
            addCategory={matcherService.addCategory}
            removeCategory={matcherService.removeCategory}
            feedbackHref={feedbackHref}
            enableDevMode={enableDevMode}
          />
          <Results
            store={store}
            applyAutoFixableSuggestions={commands.applyAutoFixableSuggestions}
            applyFilterState={commands.setFilterState}
            selectMatch={commands.selectMatch}
            indicateHighlight={commands.indicateHighlight}
            stopHighlight={commands.stopHighlight}
            contactHref={contactHref}
            editorScrollElement={editorScrollElement}
            getScrollOffset={getScrollOffset}
          />
        </div>
      )}
    </>
  );
};

export default Sidebar;
