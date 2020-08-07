import { h, Fragment } from "preact";
import Store from ".././state/store";
import Results from "./Results";
import Controls from "./Controls";
import { Commands } from ".././commands";
import { IMatch } from ".././interfaces/IMatch";
import { MatcherService } from "..";
import { useState } from "preact/hooks";

interface IProps {
  store: Store<IMatch>;
  matcherService: MatcherService<IMatch>;
  commands: Commands;
  contactHref?: string;
  feedbackHref?: string;
  active: boolean;
}

const Sidebar = ({
  store,
  matcherService,
  commands,
  contactHref,
  feedbackHref,
  active
}: IProps) => {
  const [isActive, setIsActive] = useState(active);
  return (
    <div className="Sidebar__section">
      {isActive ? (
        <Fragment>
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
            deactivate={() => setIsActive(false)}
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
        </Fragment>
      ) : (
        <button
          type="button"
          className="Button"
          onClick={() => setIsActive(true)}
        >
          Open Typerighter
        </button>
      )}
    </div>
  );
};

export default Sidebar;