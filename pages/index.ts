import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { marks, schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { history } from "prosemirror-history";
import { exampleSetup, buildMenuItems } from "prosemirror-example-setup";

import "prosemirror-view/style/prosemirror.css";
import "prosemirror-menu/style/menu.css";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-example-setup/style/style.css";
import "../src/css/index.scss";
import createValidatorPlugin from "../src/ts/createValidationPlugin";
import createView from "../src/ts/createView";
import { createBoundCommands } from "../src/ts/commands";
import ValidationService from "../src/ts/services/ValidationAPIService";
import TyperighterWsAdapter from "../src/ts/services/adapters/TyperighterWsAdapter";
import { TyperighterAdapter } from "../src/ts";

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
const controlsElement = document.querySelector("#controls");
const { plugin: validatorPlugin, store, getState } = createValidatorPlugin();

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
  const validationService = new ValidationService(
    store,
    commands,
    new TyperighterAdapter("http://localhost:9000/check", "http://localhost:9000/categories")
  );
  (window as any).editor = view;
  createView(
    view,
    store,
    validationService,
    commands,
    sidebarElement,
    controlsElement
  );
}
