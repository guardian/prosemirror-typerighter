import { EditorView } from "prosemirror-view";
import { h, render } from "preact";
import MatchOverlay from "./components/MatchOverlay";
import Store from "./state/store";
import { Commands } from "./commands";
import { IMatch } from "./interfaces/IMatch";
import { MatcherService } from ".";
import { ILogger, consoleLogger } from "./utils/logger";
import Sidebar from "./components/Sidebar";

interface IViewOptions {
  view: EditorView;
  store: Store<IMatch>;
  matcherService: MatcherService<IMatch>;
  commands: Commands;
  sidebarNode: Element;
  contactHref?: string;
  feedbackHref?: string;
  logger?: ILogger;
  onMarkCorrect?: (match: IMatch) => void;
  // The element responsible for scrolling the editor content.
  // Used to scroll to matches when they're clicked in the sidebar.
  editorScrollElement: Element;
  // Gets a scroll offset when we scroll to matches. This allows consumers
  // to dynamically change the offset. Useful when e.g. consumers would like
  // to place the match in the middle of the screen, as the size of the
  // document might change during the lifecycle of the page.
  getScrollOffset?: () => number;
}

/**
 * Instantiate a UI for the given EditorView, commands, and configuration,
 * appending it to the given HTML elements. This includes:
 *  - The overlay responsible for displaying tooltips
 *  - The plugin configuration pane
 *  - The plugin results pane
 */
const createView = ({
  store,
  matcherService,
  commands,
  sidebarNode,
  contactHref,
  feedbackHref,
  logger = consoleLogger,
  onMarkCorrect,
  editorScrollElement,
  getScrollOffset = () => 50
}: IViewOptions) => {
  // Create our overlay node, which is responsible for displaying
  // match messages when the user hovers over highlighted ranges.
  const overlayNode = document.createElement("div");
  overlayNode.classList.add("TyperighterPlugin__tooltip-overlay");
  document.body.appendChild(overlayNode);
  logger.info("Typerighter plugin starting");

  // Finally, render our components.
  render(
    <MatchOverlay
      store={store}
      applySuggestions={suggestionOpts => {
        commands.applySuggestions(suggestionOpts);
        commands.stopHover();
      }}
      onMarkCorrect={
        onMarkCorrect &&
        (match => {
          commands.ignoreMatch(match.matchId);
          onMarkCorrect(match);
        })
      }
      feedbackHref={feedbackHref}
    />,
    overlayNode
  );

  render(
    <Sidebar
      store={store}
      matcherService={matcherService}
      commands={commands}
      contactHref={contactHref}
      feedbackHref={feedbackHref}
      editorScrollElement={editorScrollElement}
      getScrollOffset={getScrollOffset}
    />,
    sidebarNode
  );
};

export default createView;
