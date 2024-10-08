import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { marks, schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { history } from "prosemirror-history";
import { toggleMark } from "prosemirror-commands";
import { exampleSetup, buildMenuItems } from "prosemirror-example-setup";
import applyDevTools from "prosemirror-dev-tools";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-menu/style/menu.css";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-example-setup/style/style.css";
import "../src/css/index.scss";
import createTyperighterPlugin from "../src/ts/createTyperighterPlugin";
import { createOverlayView } from "../src/ts/components/createOverlayView";
import { createSidebarView } from "../src/ts/components/createSidebarView";
import { createBoundCommands } from "../src/ts/commands";
import TyperighterTelemetryAdapter from "../src/ts/services/TyperighterTelemetryAdapter";
import { UserTelemetryEventSender } from "@guardian/user-telemetry-client";
import { MatchType } from "../src/ts/utils/decoration";
import { filterByMatchState } from "../src/ts/utils/plugin";
import { findMarkPositions } from "../src/ts/utils/prosemirror";
import TyperighterChunkedAdapter from "../src/ts/services/adapters/TyperighterChunkedAdapter";
import { keymap } from "prosemirror-keymap";

const noteMark = {
  parseDOM: [{ tag: "note" }],
  toDOM() { return ['note', 0] as [string, number]; }
}

const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes as any, "paragraph block*", "block"),
  marks: {
    ...marks,
    note: noteMark
  }
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

const {
  plugin: validatorPlugin,
  store,
  matcherService
} = createTyperighterPlugin({
  isElementPartOfTyperighterUI,
  filterOptions: {
    filterMatches: filterByMatchState,
    initialFilterState: [] as MatchType[]
  },
  getIgnoredRanges: (node, from, to) =>
    findMarkPositions(node, from, to, mySchema.marks.note),
  onMatchDecorationClicked: match =>
    typerighterTelemetryAdapter.matchDecorationClicked(match, document.URL),
  requestMatchesOnDocModified: true,
  adapter: new TyperighterChunkedAdapter(
    "https://checker.typerighter.code.dev-gutools.co.uk"
  ),
  telemetryAdapter: typerighterTelemetryAdapter,
  typerighterEnabled: true
});

const toggleNoteMark = toggleMark(mySchema.marks.note);

if (editorElement && sidebarNode) {
  const view = new EditorView(editorElement, {
    state: EditorState.create({
      doc,
      plugins: [
        ...exampleSetup({
          schema: mySchema,
          history: false,
          menuContent: buildMenuItems(mySchema).fullMenu,
        }),
        keymap({
          "F10": toggleNoteMark,
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

  const commands = createBoundCommands(view, typerighterTelemetryAdapter);

  createSidebarView({
    store,
    matcherService,
    commands,
    sidebarNode,
    contactHref: "mailto:example@typerighter.co.uk",
    feedbackHref: "http://a-form-for-example.com",
    editorScrollElement: editorElement,
    getScrollOffset,
    telemetryAdapter: typerighterTelemetryAdapter,
    enableDevMode: true
  });

  createOverlayView({
    view,
    store,
    commands,
    overlayNode,
    onMarkCorrect: match => console.info("Match ignored!", match),
    telemetryAdapter: typerighterTelemetryAdapter,
  });

  // Handy debugging tools
  (window as any).editor = view;
  // We need this due to a transitive dependency that expects a global `process` object.
  // See https://github.com/d4rkr00t/prosemirror-dev-tools/issues/115
  (window as any).process = {};
  applyDevTools(view);
}
