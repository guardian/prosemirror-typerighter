import { h, Fragment } from "preact";
import Store, { STORE_EVENT_NEW_STATE } from ".././state/store";
import Results from "./Results";
import Controls from "./Controls";
import { Commands } from ".././commands";
import { IMatch } from ".././interfaces/IMatch";
import { MatcherService } from "..";
import { useState, useEffect } from "preact/hooks";
import { IPluginState } from "../state/reducer";

interface IProps {
  store: Store<IMatch>;
  matcherService: MatcherService<IMatch>;
  commands: Commands;
  contactHref?: string;
  feedbackHref?: string;
}

const Sidebar = ({
  store,
  matcherService,
  commands,
  contactHref,
  feedbackHref,
}: IProps) => {
  const [pluginState, setPluginState] = useState<IPluginState | undefined>(undefined);
  useEffect(() => {
    setPluginState(store.getState());
    store.on(STORE_EVENT_NEW_STATE, setPluginState);
    return () => {
        store.removeEventListener(STORE_EVENT_NEW_STATE, setPluginState);
    };
  }, []);
  return (
    <Fragment>    
      {pluginState?.config.isActive ? (
        <div className="Sidebar__section">
          <Controls
            store={store}
            setDebugState={value => commands.setConfigValue("debug", value)}
            setRequestOnDocModified={value =>
              commands.setConfigValue("requestMatchesOnDocModified", value)
            }
            requestMatchesForDocument={commands.requestMatchesForDocument}
            fetchCategories={matcherService.fetchCategories}
            getCurrentCategories={matcherService.getCurrentCategories}
            addCategory={matcherService.addCategory}
            removeCategory={matcherService.removeCategory}
            feedbackHref={feedbackHref}
            deactivate={() => commands.setConfigValue("isActive", false)}
          />
          <Results
            store={store}
            applySuggestions={commands.applySuggestions}
            applyAutoFixableSuggestions={commands.applyAutoFixableSuggestions}
            selectMatch={commands.selectMatch}
            indicateHover={commands.indicateHover}
            stopHover={commands.stopHover}
            contactHref={contactHref}
          />
        </div>
      ) : (
        <div className="Sidebar__section Sidebar__section--is-closed">
          <div className="Sidebar__header-container Sidebar__header-container--is-closed">
            <div className="Sidebar__header">
              <button
                type="button"
                className="Button"
                onClick={() => commands.setConfigValue("isActive", true)}
              >
                Open Typerighter
              </button>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default Sidebar;
