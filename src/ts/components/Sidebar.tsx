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
  editorScrollElement: Element;
  getScrollOffset: () => number;
}

const Sidebar = ({
  store,
  matcherService,
  commands,
  contactHref,
  editorScrollElement,
  getScrollOffset,
  feedbackHref
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

  const handleToggleActiveState = (): void => {
    commands.setConfigValue("isActive", !pluginState?.config.isActive);
  };

  const sidebarClasses = pluginState?.config.isActive
    ? "Sidebar__section"
    : "Sidebar__section Sidebar__section--is-closed";

  return (
    <Fragment>
      {pluginState && (
        <div className={sidebarClasses}>
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
            onToggleActiveState={handleToggleActiveState}
          />
          {pluginState?.config.isActive && (
            <Results
              store={store}
              applySuggestions={commands.applySuggestions}
              applyAutoFixableSuggestions={commands.applyAutoFixableSuggestions}
              selectMatch={commands.selectMatch}
              indicateHover={commands.indicateHover}
              stopHover={commands.stopHover}
              contactHref={contactHref}
              editorScrollElement={editorScrollElement}
              getScrollOffset={getScrollOffset}
            />
          )}
        </div>
      )}
    </Fragment>
  );
};

export default Sidebar;
