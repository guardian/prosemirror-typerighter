import React from "react";
import { render } from "react-dom";
import MatchOverlay from "./components/MatchOverlay";
import Store from "./state/store";
import { Commands } from "./commands";
import { IMatch } from "./interfaces/IMatch";
import { MatcherService } from ".";
import { ILogger, consoleLogger } from "./utils/logger";
import Sidebar from "./components/Sidebar";
import TyperighterTelemetryAdapter from "./services/TyperighterTelemetryAdapter";
import TelemetryContext from "./contexts/TelemetryContext";
import { EditorView } from "prosemirror-view";

interface IViewOptions {
  view: EditorView;
  store: Store<IMatch>;
  matcherService: MatcherService<IMatch>;
  commands: Commands;
  sidebarNode: Element;
  overlayNode: Element;
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
  telemetryAdapter?: TyperighterTelemetryAdapter;
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
  telemetryAdapter,
  commands,
  sidebarNode,
  overlayNode,
  contactHref,
  feedbackHref,
  logger = consoleLogger,
  onMarkCorrect,
  editorScrollElement,
  getScrollOffset = () => 50
}: IViewOptions) => {
  // Create our overlay node, which is responsible for displaying
  // match messages when the user hovers over highlighted ranges.
  overlayNode.classList.add("TyperighterPlugin__tooltip-overlay");
  logger.info("Typerighter plugin starting");

  // Finally, render our components.
  render(
    <TelemetryContext.Provider value={{ telemetryAdapter }}>
      <MatchOverlay
        store={store}
        applySuggestions={suggestionOpts => {
          commands.applySuggestions(suggestionOpts);
          commands.stopHover();
          // This is necessary to prevent what we think is a bug that produces
          // odd history results when Ctrl-Z triggers an undo event and the editor
          // is not focused. If a user accepts a suggestion without the line below,
          // the editor is unfocused by the click event. If the user immediately hits
          // Ctrl-Z to revert the suggestion, the _browser's_ undo behaviour is
          // triggered – not Prosemirror's – leading to weird history shenanigans.
          // See e.g. https://discuss.prosemirror.net/t/native-undo-history/1823
          view.focus();
        }}
        onMarkCorrect={
          onMarkCorrect &&
          (match => {
            commands.ignoreMatch(match.matchId);
            onMarkCorrect(match);
            // See the previous comment re: focusing in `applySuggestions`.
            view.focus();
            telemetryAdapter?.matchIsMarkedAsCorrect(match, document.URL);
          })
        }
        feedbackHref={feedbackHref}
        stopHover={commands.stopHover}
      />
    </TelemetryContext.Provider>,
    overlayNode
  );

  render(
    <TelemetryContext.Provider value={{ telemetryAdapter }}>
      <Sidebar
        store={store}
        matcherService={matcherService}
        commands={commands}
        contactHref={contactHref}
        feedbackHref={feedbackHref}
        editorScrollElement={editorScrollElement}
        getScrollOffset={getScrollOffset}
      />
    </TelemetryContext.Provider>,
    sidebarNode
  );
};

export default createView;
