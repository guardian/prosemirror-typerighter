import { EditorView } from "prosemirror-view";
import { h, render } from "preact";
import MatchOverlay from "./components/MatchOverlay";
import Store from "./state/store";
import Sidebar from "./components/Sidebar";
import Controls from "./components/Controls";
import { Commands } from "./commands";
import { IMatch } from "./interfaces/IMatch";
import { MatcherService } from ".";

/**
 * Scaffolding for an example view.
 * @publicapi
 */
const createView = (
  view: EditorView,
  store: Store<IMatch>,
  matcherService: MatcherService<IMatch>,
  commands: Commands,
  sidebarNode: Element,
  controlsNode: Element,
  contactHref?: string,
  feedbackHref?: string
) => {
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

  // Finally, render our components.
  render(
    <MatchOverlay
      store={store}
      applySuggestions={(suggestionOpts) => {
        commands.applySuggestions(suggestionOpts)
        commands.stopHover();
      }}
      containerElement={wrapperElement}
      feedbackHref={feedbackHref}
    />,
    overlayNode
  );

  render(
    <Sidebar
      store={store}
      applySuggestions={commands.applySuggestions}
      applyAutoFixableSuggestions={commands.applyAutoFixableSuggestions}
      selectMatch={commands.selectMatch}
      indicateHover={commands.indicateHover}
      stopHover={commands.stopHover}
      contactHref={contactHref}
    />,
    sidebarNode
  );

  render(
    <Controls
      store={store}
      setDebugState={commands.setDebugState}
      setRequestOnDocModified={commands.setRequestOnDocModified}
      requestMatchesForDocument={commands.requestMatchesForDocument}
      fetchCategories={matcherService.fetchCategories}
      getCurrentCategories={matcherService.getCurrentCategories}
      addCategory={matcherService.addCategory}
      removeCategory={matcherService.removeCategory}
    />,
    controlsNode
  );
};

export default createView;
