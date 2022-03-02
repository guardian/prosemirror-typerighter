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
import createTyperighterPlugin from "../src/ts/createTyperighterPlugin";
import createView from "../src/ts/createView";
import { createBoundCommands } from "../src/ts/commands";
import MatcherService from "../src/ts/services/MatcherService";
import { TyperighterAdapter } from "../src/ts";
import TyperighterTelemetryAdapter from "../src/ts/services/TyperighterTelemetryAdapter";
import { UserTelemetryEventSender } from "@guardian/user-telemetry-client";
import { MatchType } from "../src/ts/utils/decoration";
import { filterByMatchState } from "../src/ts/utils/plugin";
import { findMarkPositions } from "../src/ts/utils/prosemirror";

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
const sidebarNode = document.querySelector("#sidebar");

const overlayNode = document.createElement("div");
document.body.append(overlayNode);
const isElementPartOfTyperighterUI = (element: HTMLElement) =>
  overlayNode.contains(element);

const telemetryService = new UserTelemetryEventSender("https://example.com");
const typerighterTelemetryAdapter = new TyperighterTelemetryAdapter(
  telemetryService,
  "prosemirror-typerighter",
  "DEV"
);

const { plugin: validatorPlugin, store, getState } = createTyperighterPlugin({
  isElementPartOfTyperighterUI,
  filterOptions: {
    filterMatches: filterByMatchState,
    initialFilterState: [] as MatchType[]
  },
  getSkippedRanges: (node, from, to) =>
    findMarkPositions(node, from, to, mySchema.marks.code),
  onMatchDecorationClicked: match =>
    typerighterTelemetryAdapter.matchDecorationClicked(match, document.URL)
});

if (editorElement && sidebarNode) {
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

  // When the user scrolls to matches, place the match in the middle of the editor.
  const menuHeight = 47;
  const getScrollOffset = () =>
    editorElement.getBoundingClientRect().height / 2 - menuHeight;

  const commands = createBoundCommands(view, getState);

  const matcherService = new MatcherService(
    store,
    commands,
    new TyperighterAdapter("https://api.typerighter.local.dev-gutools.co.uk"),
    typerighterTelemetryAdapter
  );

  createView({
    view,
    store,
    matcherService,
    commands,
    sidebarNode,
    overlayNode,
    contactHref: "mailto:example@typerighter.co.uk",
    feedbackHref: "http://a-form-for-example.com",
    onMarkCorrect: match => console.info("Match ignored!", match),
    editorScrollElement: editorElement,
    getScrollOffset,
    telemetryAdapter: typerighterTelemetryAdapter
  });

  // Handy debugging tools
  (window as any).editor = view;
  (window as any).ProseMirrorDevTools.applyDevTools(view, { EditorState });
}
