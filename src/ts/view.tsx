import { render, h } from "preact";
import { EditorView } from "prosemirror-view";

import HoverEvent from "./interfaces/HoverEvent";
import { Schema } from "prosemirror-model";
import { PluginState } from "./state";
import ValidationOverlay from "./components/ValidationOverlay";
import { selectValidationById } from "./state";
import { Plugin } from "prosemirror-state";

/**
 * Accepts a schema and creates a view function.
 */
export default (plugin: Plugin, schema: Schema) => (view: EditorView) => {
  const notificationSubscribers: Array<(hoverEvent: HoverEvent) => void> = [];
  const subscribe = (callback: (hoverEvent: HoverEvent) => void) => {
    notificationSubscribers.push(callback);
    return () => {
      notificationSubscribers.splice(
        notificationSubscribers.indexOf(callback),
        1
      );
    };
  };

  const applySuggestion = (suggestion: string, from: number, to: number) => {
    view.dispatch(view.state.tr.replaceWith(from, to, schema.text(suggestion)));
  };

  // Create our overlay node, which is responsible for displaying
  // validation messages when the user hovers over highlighted ranges.
  const overlayNode = document.createElement("div");

  // We wrap this in a container to allow the overlay to be positioned
  // relative to the editable document.
  const wrapperNode = document.createElement("div");
  wrapperNode.classList.add("ValidationPlugin__container");
  view.dom.parentNode!.replaceChild(wrapperNode, view.dom);
  wrapperNode.appendChild(view.dom);
  view.dom.insertAdjacentElement("afterend", overlayNode);
  render(
    <ValidationOverlay
      subscribe={subscribe}
      applySuggestion={applySuggestion}
    />,
    overlayNode
  );

  // Create a function that will notify subscribers on state change.
  const notify = (state: PluginState) =>
    notificationSubscribers.forEach(sub => {
      if (state.hoverId) {
        const validationOutput = selectValidationById(state, state.hoverId);
        return sub({
          hoverInfo: state.hoverInfo,
          validationOutput
        });
      }
      sub({
        hoverInfo: undefined,
        validationOutput: undefined
      });
    });

  return {
    update: (view: EditorView<Schema>) => notify(plugin.getState(view.state))
  };
};
