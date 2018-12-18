import { EditorView } from "prosemirror-view";
import { h, render } from "preact";
import ValidationOverlay from "./components/ValidationOverlay";
import Store from "./store";
import ValidationSidebar from "./components/ValidationSidebar";
import ValidationControls from "./components/ValidationControls";
import { Commands } from "./commands";

/**
 * Scaffolding for an example view.
 */
const createView = (
  view: EditorView,
  store: Store,
  commands: Commands,
  sidebarNode: Element,
  controlsNode: Element
) => {
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

  // Finally, render our components.
  render(
    <ValidationOverlay
      store={store}
      applySuggestions={commands.applySuggestions}
    />,
    overlayNode
  );

  render(
    <ValidationSidebar
      store={store}
      applySuggestions={commands.applySuggestions}
      selectValidation={commands.selectValidation}
      indicateHover={commands.indicateHover}
    />,
    sidebarNode
  );

  render(
    <ValidationControls
      store={store}
      setDebugState={commands.setDebugState}
      validateDocument={commands.validateDocument}
    />,
    controlsNode
  );
};

export default createView;
