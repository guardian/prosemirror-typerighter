import IHoverEvent from "./interfaces/IHoverEvent";
import ValidationOverlay from "./components/ValidationOverlay";
import { ICommands } from ".";
import { EditorView } from "prosemirror-view";
import { h, render } from "preact";
import { IPluginState } from "./state";
import { Plugin } from "prosemirror-state";
import { Schema } from "prosemirror-model";
import { selectValidationById } from "./state";

/**
 * Accepts a plugin schema and creates a view function.
 */
const createView = (plugin: Plugin, commands: ICommands) => (view: EditorView) => {
  const notificationSubscribers: Array<(hoverEvent: IHoverEvent) => void> = [];
  const subscribe = (callback: (hoverEvent: IHoverEvent) => void) => {
    notificationSubscribers.push(callback);
    return () => {
      notificationSubscribers.splice(
        notificationSubscribers.indexOf(callback),
        1
      );
    };
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
      applySuggestion={(validationId: string, suggestionIndex: number) =>
        commands.applySuggestion(validationId, suggestionIndex)(
          view.state,
          view.dispatch
        )
      }
    />,
    overlayNode
  );

  // Create a function that will notify subscribers on state change.
  const notify = (state: IPluginState) =>
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

export default createView;