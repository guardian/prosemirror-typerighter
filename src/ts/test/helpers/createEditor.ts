import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { marks, schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";

import createTyperighterPlugin from "../../createTyperighterPlugin";
import { createBoundCommands } from "../../commands";
import MatcherService from "../../services/MatcherService";
import TyperighterAdapter from "../../services/adapters/TyperighterAdapter";
import { IMatch } from "../..";

export const createEditor = (htmlDoc: string, matches: IMatch[] = []) => {
  const mySchema = new Schema({
    nodes: addListNodes(schema.spec.nodes as any, "paragraph block*", "block"),
    marks
  });

  const contentElement = document.createElement("content");
  contentElement.innerHTML = htmlDoc;
  const doc = DOMParser.fromSchema(mySchema).parse(contentElement);
  if (contentElement && contentElement.parentElement) {
    contentElement.parentElement.removeChild(contentElement);
  }

  const editorElement = document.createElement("div") as HTMLElement;
  editorElement.id = "editor"

  const overlayNode = document.createElement("div");
  document.body.append(overlayNode);
  const isElementPartOfTyperighterUI = (element: HTMLElement) =>
    overlayNode.contains(element);

  const { plugin: validatorPlugin, store, getState } = createTyperighterPlugin({
    isElementPartOfTyperighterUI,
    matches
  });

  const view = new EditorView(editorElement!, {
    state: EditorState.create({
      doc,
      plugins: [
        ...exampleSetup({
          schema: mySchema,
          history: false
        }),
        validatorPlugin
      ]
    })
  });

  const commands = createBoundCommands(view, getState);
  // @ts-ignore
  const matcherService = new MatcherService(
    store,
    commands,
    new TyperighterAdapter("https://api.typerighter.local.dev-gutools.co.uk")
  );

  return { editorElement, view, commands };
};
