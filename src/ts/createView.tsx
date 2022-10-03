import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import MatchOverlay from "./components/MatchOverlay";
import Store from "./state/store";
import { Commands } from "./commands";
import { IMatch } from "./interfaces/IMatch";
import { MatcherService } from ".";
import Sidebar from "./components/Sidebar";
import TyperighterTelemetryAdapter from "./services/TyperighterTelemetryAdapter";
import TelemetryContext from "./contexts/TelemetryContext";
import { EditorView } from "prosemirror-view";
import { IPluginState } from "./state/reducer";
import { MatchType } from "./utils/decoration";

interface OverlayViewOptions<TPluginState extends IPluginState> {
  view: EditorView;
  store: Store<TPluginState>;
  commands: Commands;
  overlayNode: Element;
  feedbackHref?: string;
  onMarkCorrect?: (match: IMatch) => void;
  telemetryAdapter?: TyperighterTelemetryAdapter;
}

/**
 * Instantiate the overlay view. The overlay view is responsible for rendering
 * the suggestion tooltip when users hover over a match in a document.
 */
export const createOverlayView = <
  TPluginState extends IPluginState<MatchType[]>
>({
  view,
  store,
  telemetryAdapter,
  commands,
  overlayNode,
  feedbackHref,
  onMarkCorrect
}: OverlayViewOptions<TPluginState>) => {
  overlayNode.classList.add("TyperighterPlugin__tooltip-overlay");

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

  return () => unmountComponentAtNode(overlayNode);
};

interface SidebarViewOptions<TPluginState extends IPluginState> {
  store: Store<TPluginState>;
  matcherService: MatcherService<TPluginState["filterState"], IMatch>;
  commands: Commands;
  sidebarNode: Element;
  contactHref?: string;
  feedbackHref?: string;
  // The element responsible for scrolling the editor content.
  // Used to scroll to matches when they're clicked in the sidebar.
  editorScrollElement: Element;
  // Gets a scroll offset when we scroll to matches. This allows consumers
  // to dynamically change the offset. Useful when e.g. consumers would like
  // to place the match in the middle of the screen, as the size of the
  // document might change during the lifecycle of the page.
  getScrollOffset?: () => number;
  telemetryAdapter?: TyperighterTelemetryAdapter;
  // Expose useful utilities for developers.
  enableDevMode?: boolean;
}

/**
 * Create a sidebar view. The sidebar is responsible for displaying an
 * overview of all of the matches in a document, allowing users to see
 * a summary of matches and navigate to those matches.
 */
export const createSidebarView = <
  TPluginState extends IPluginState<MatchType[]>
>({
  store,
  matcherService,
  telemetryAdapter,
  commands,
  sidebarNode,
  contactHref,
  feedbackHref,
  editorScrollElement,
  getScrollOffset = () => 50,
  enableDevMode = false
}: SidebarViewOptions<TPluginState>) => {
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
        enableDevMode={enableDevMode}
      />
    </TelemetryContext.Provider>,
    sidebarNode
  );

  return () => unmountComponentAtNode(sidebarNode);
};
