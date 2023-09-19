import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import Store from "../state/store";
import { Commands } from "../state/commands";
import { MatcherService } from "..";
import Sidebar from "./Sidebar";
import TyperighterTelemetryAdapter from "../services/TyperighterTelemetryAdapter";
import TelemetryContext from "../contexts/TelemetryContext";

interface SidebarViewOptions {
  store: Store;
  matcherService: MatcherService;
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
export const createSidebarView = ({
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
}: SidebarViewOptions) => {
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
