import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

import {
  createDoc,
  p,
  getDecorationSpecsFromDoc,
  getDecorationSpecs,
  getDecorationSpecsFromMatches
} from "./helpers/prosemirror";
import createTyperighterPlugin, {
  IPluginOptions
} from "../createTyperighterPlugin";
import { createMatch, createMatcherResponse } from "./helpers/fixtures";
import { createBoundCommands } from "../commands";
import { IMatcherResponse } from "../interfaces/IMatch";
import { getBlocksFromDocument } from "../utils/prosemirror";
import { createDecorationsForMatches } from "../utils/decoration";

const doc = createDoc(p("Example text to check"), p("More text to check"));
const blocks = getBlocksFromDocument(doc);
const matches = [createMatch(1)];

const createPlugin = (opts?: IPluginOptions) => {
  const { plugin, getState, store } = createTyperighterPlugin({
    matches,
    ...opts
  });
  const state = EditorState.create({
    doc,
    plugins: [plugin]
  });
  const editorElement = document.createElement("div");
  const view = new EditorView(editorElement, { state });
  const commands = createBoundCommands(view, getState);
  return { plugin, getState, store, view, commands };
};

describe("createTyperighterPlugin", () => {
  let now: () => number;
  beforeAll(() => {
    now = Date.now;
    Date.now = () => 1337;
  });
  afterAll(() => {
    Date.now = now;
  });
  it("should add matches passed to the plugin to the plugin state when the plugin is constructed", () => {
    const { getState, view } = createPlugin();
    expect(getState(view.state).currentMatches).toEqual(matches);
  });
  it("should trigger onMatches when matches are found in the document", () => {
    const { store, commands } = createPlugin();
    const storeSpy = jest.fn();
    store.on("STORE_EVENT_NEW_MATCHES", storeSpy);
    const response: IMatcherResponse = {
      blocks,
      categoryIds: ["cat1"],
      matches: [
        {
          ...blocks[0],
          matcherType: "regex",
          ruleId: "ruleId",
          matchId: "matchId",
          matchedText: blocks[0].text,
          message: "Example message",
          category: {
            id: "cat1",
            name: "Category 1",
            colour: "puce"
          },
          matchContext: "bigger block of text"
        }
      ],
      requestId: "reqId"
    };
    commands.requestMatchesForDocument("docId", ["cat1"]);
    commands.applyMatcherResponse(response);
    expect(storeSpy.mock.calls[0]).toEqual([
      "docId",
      [
        {
          from: 1,
          id: "1337-from:1-to:23",
          text: "Example text to check",
          to: 23
        },
        {
          from: 24,
          id: "1337-from:24-to:43",
          text: "More text to check",
          to: 43
        }
      ]
    ]);
  });
  it("should show decorations when plugin is active", () => {
    const { view } = createPlugin();
    const decorationSpecs = getDecorationSpecsFromDoc(view);
    const decorationsSpecsToExpect = getDecorationSpecs(
      createDecorationsForMatches(matches)
    );

    expect(decorationSpecs).toEqual(decorationsSpecsToExpect);
  });
  it("should add matches and their decorations on init", () => {
    const match = createMatch(1, 2);
    const { view, getState } = createPlugin({ matches: [match] });

    const decorationSpecs = getDecorationSpecsFromDoc(view);
    const expectedSpecs = getDecorationSpecsFromMatches([match], doc);
    expect(decorationSpecs).toEqual(expectedSpecs);

    const pluginMatches = getState(view.state).currentMatches;
    expect(pluginMatches).toEqual([match]);
  });
  it("should not add matches and their decorations on init when the ignoreMatch predicate returns true", () => {
    const match = createMatch(1, 2);
    const { view, getState } = createPlugin({
      ignoreMatch: () => true,
      matches: [match]
    });

    const decorations = getDecorationSpecsFromDoc(view);
    expect(decorations).toEqual(new Set());

    const pluginMatches = getState(view.state).currentMatches;
    expect(pluginMatches).toEqual([]);
  });
  it("should not add matches and their decorations returned from a matcher when the ignoreMatch predicate returns true", () => {
    const { commands, view, getState } = createPlugin({
      ignoreMatch: () => true
    });

    const response: IMatcherResponse = createMatcherResponse([
      { from: 1, to: 2, block: blocks[0] }
    ]);

    commands.requestMatchesForDocument("docId", ["cat1"]);
    commands.applyMatcherResponse(response);

    const decorations = getDecorationSpecsFromDoc(view);
    expect(decorations).toEqual(new Set());

    const pluginMatches = getState(view.state).currentMatches;
    expect(pluginMatches).toEqual([]);
  });
});
