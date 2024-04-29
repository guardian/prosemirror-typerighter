import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import MatchOverlay from "./MatchOverlay";
import Store from "../state/store";
import { Commands } from "../commands";
import { IMatch } from "../interfaces/IMatch";
import TyperighterTelemetryAdapter from "../services/TyperighterTelemetryAdapter";
import TelemetryContext from "../contexts/TelemetryContext";
import { EditorView } from "prosemirror-view";

interface OverlayViewOptions {
  view: EditorView;
  store: Store;
  commands: Commands;
  overlayNode: Element;
  onMarkCorrect?: (match: IMatch) => void;
  telemetryAdapter?: TyperighterTelemetryAdapter;
}

/**
 * Instantiate the overlay view. The overlay view is responsible for rendering
 * the suggestion tooltip when users hover over a match in a document.
 */
export const createOverlayView = ({
  view,
  store,
  telemetryAdapter,
  commands,
  overlayNode,
  onMarkCorrect
}: OverlayViewOptions) => {
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
        stopHover={commands.stopHover}
      />
    </TelemetryContext.Provider>,
    overlayNode
  );

  return () => unmountComponentAtNode(overlayNode);
};
