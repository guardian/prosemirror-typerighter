import { EditorView } from "prosemirror-view";
import { h, render } from "preact";
import ValidationOverlay from "./components/ValidationOverlay";
import Store from "./store";
import ValidationSidebar from "./components/ValidationSidebar";
import ValidationControls from "./components/ValidationControls";
import { Commands } from "./commands";
import { IBaseValidationOutput } from "./interfaces/IValidation";

/**
 * Scaffolding for an example view.
 */
const createView = (
  view: EditorView,
  store: Store<IBaseValidationOutput>,
  commands: Commands,
  sidebarNode: Element,
  controlsNode: Element
) => {
  // Create our overlay node, which is responsible for displaying
  // validation messages when the user hovers over highlighted ranges.
  const overlayNode = document.createElement("div");

  // We wrap this in a container to allow the overlay to be positioned
  // relative to the editable document.
  const wrapperElement = document.createElement("div");
  wrapperElement.classList.add("ValidationPlugin__container");
  view.dom.parentNode!.replaceChild(wrapperElement, view.dom);
  wrapperElement.appendChild(view.dom);
  view.dom.insertAdjacentElement("afterend", overlayNode);

  // Finally, render our components.
  render(
    <ValidationOverlay
      store={store}
      applySuggestions={commands.applySuggestions}
      containerElement={wrapperElement}
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
