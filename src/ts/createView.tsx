import { EditorView } from "prosemirror-view";
import { h, render } from "preact";
import MatchOverlay from "./components/MatchOverlay";
import Store from "./state/store";
import Results from "./components/Results";
import Controls from "./components/Controls";
import { Commands } from "./commands";
import { IMatch } from "./interfaces/IMatch";
import { MatcherService } from ".";
import { ILogger, consoleLogger } from "./utils/logger";

interface IViewOptions {
  view: EditorView;
  store: Store<IMatch>;
  matcherService: MatcherService<IMatch>;
  commands: Commands;
  sidebarNode: Element;
  contactHref?: string;
  feedbackHref?: string;
  logger: ILogger;
  onIgnoreMatch?: (match: IMatch) => void;
}

/**
 * Instantiate a UI for the given EditorView, commands, and configuration,
 * appending it to the given HTML elements. This includes:
 *  - The overlay responsible for displaying tooltips
 *  - The plugin configuration pane
 *  - The plugin results pane
 */
const createView = ({
  view,
  store,
  matcherService,
  commands,
  sidebarNode,
  contactHref,
  feedbackHref,
  logger = consoleLogger,
  onIgnoreMatch
}: IViewOptions) => {
  // Create our overlay node, which is responsible for displaying
  // match messages when the user hovers over highlighted ranges.
  const overlayNode = document.createElement("div");

  // We wrap this in a container to allow the overlay to be positioned
  // relative to the editable document.
  const wrapperElement = document.createElement("div");
  wrapperElement.classList.add("TyperighterPlugin__container");
  view.dom.parentNode!.replaceChild(wrapperElement, view.dom);
  wrapperElement.appendChild(view.dom);
  view.dom.insertAdjacentElement("afterend", overlayNode);
  logger.info("Typerighter plugin starting");

  // Finally, render our components.
  render(
    <MatchOverlay
      store={store}
      applySuggestions={suggestionOpts => {
        commands.applySuggestions(suggestionOpts);
        commands.stopHover();
      }}
      onIgnoreMatch={
        onIgnoreMatch &&
        (match => {
          commands.ignoreMatch(match.matchId);
          onIgnoreMatch(match);
        })
      }
      containerElement={wrapperElement}
      feedbackHref={feedbackHref}
    />,
    overlayNode
  );

  render(
    <div className="Sidebar__section">
      <Controls
        store={store}
        setDebugState={commands.setDebugState}
        setRequestOnDocModified={commands.setRequestOnDocModified}
        requestMatchesForDocument={commands.requestMatchesForDocument}
        fetchCategories={matcherService.fetchCategories}
        getCurrentCategories={matcherService.getCurrentCategories}
        addCategory={matcherService.addCategory}
        removeCategory={matcherService.removeCategory}
        contactHref={contactHref}
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
    </div>,
    sidebarNode
  );
};

export default createView;
