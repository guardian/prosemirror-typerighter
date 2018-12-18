import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { marks, schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { exampleSetup, buildMenuItems } from "prosemirror-example-setup";

import "prosemirror-view/style/prosemirror.css";
import "prosemirror-menu/style/menu.css";
import "prosemirror-example-setup/style/style.css";
import "../src/css/validation.scss";
import "../src/css/sidebar.scss";
import "../src/css/validationControls.scss";
import "../src/css/validationSidebarOutput.scss";
import createValidatorPlugin from "../src/ts/createValidationPlugin";
import createView from "../src/ts/createView";
import regexAdapter from "../src/ts/adapters/regex";
import { createBoundCommands } from "../src/ts/commands";

const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes as any, "paragraph block*", "block"),
  marks
});

const contentElement =
  document.querySelector("#content") || document.createElement("content");
const doc = DOMParser.fromSchema(mySchema).parse(contentElement);
if (contentElement && contentElement.parentElement) {
  contentElement.parentElement.removeChild(contentElement);
}
const historyPlugin = history();
const editorElement = document.querySelector("#editor");
const sidebarElement = document.querySelector("#sidebar");
const controlsElement = document.querySelector('#controls');
const { plugin: validatorPlugin, store, getState } = createValidatorPlugin({
  adapter: regexAdapter
});

if (editorElement && sidebarElement && controlsElement) {
  const view = new EditorView(editorElement, {
    state: EditorState.create({
      doc,
      plugins: [
        ...exampleSetup({
          schema: mySchema,
          history: false,
          menuContent: buildMenuItems(mySchema).fullMenu
        }),
        historyPlugin,
        validatorPlugin
      ]
    })
  });

  const commands = createBoundCommands(view, getState);
  (window as any).editor = view;
  const debugButton = document.getElementById('debug-button');
  if (debugButton) {
    debugButton.onclick = () => commands.setDebugState(!!validatorPlugin.getState(view.state).debug)
  }
  createView(view, store, commands, sidebarElement, controlsElement);
}
