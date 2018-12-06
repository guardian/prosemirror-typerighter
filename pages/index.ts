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
import "../src/css/noting.scss";
import createValidatorPlugin from "../src/ts/index";
import createLanguageToolAdapter from "../src/ts/adapters/languageTool";

const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes as any, "paragraph block*", "block"),
  marks
});

const contentElement =
  document.querySelector("#content") || document.createElement("content");
const doc = DOMParser.fromSchema(mySchema).parse(contentElement);
const historyPlugin = history();
const editorElement = document.querySelector("#editor");
const { plugin: validatorPlugin, commands } = createValidatorPlugin({
  adapter: createLanguageToolAdapter("http://localhost:9001")
});

editorElement &&
  ((window as any).editor = new EditorView(editorElement, {
    state: EditorState.create({
      doc,
      plugins: [
        ...exampleSetup({
          schema: mySchema,
          history: false,
          menuContent: buildMenuItems(mySchema).fullMenu
        }),
        keymap({
          F6: commands.validateDocument
        }),
        historyPlugin,
        validatorPlugin
      ]
    })
  }));
