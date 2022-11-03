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
import { createEditor } from "./helpers/createEditor";
import { createBoundCommands } from "../commands";
import { IMatch, IMatcherResponse } from "../interfaces/IMatch";
import { getBlocksFromDocument } from "../utils/prosemirror";
import { createDecorationsForMatches, MatchType } from "../utils/decoration";
import { filterByMatchState, getState } from "../utils/plugin";
import TyperighterAdapter from "../services/adapters/TyperighterAdapter";

const doc = createDoc(p("Example text to check"), p("More text to check"));
const blocks = getBlocksFromDocument(doc);
const matches = [createMatch(1)];
const matchWithReplacement: IMatch = {
  ...createMatch(5),
  replacement: { text: "replacement text", type: "TEXT_SUGGESTION" }
};
const endpoint = "http://typerighter-service-endpoint.rad";
const adapter = new TyperighterAdapter(endpoint);

const createPlugin = (
  opts?: IPluginOptions
) => {
  const { plugin, store } = createTyperighterPlugin({
    matches,
    adapter,
    ...opts
  });
  const state = EditorState.create({
    doc,
    plugins: [plugin]
  });
  const editorElement = document.createElement("div");
  const view = new EditorView(editorElement, { state });
  const commands = createBoundCommands(view);
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
    expect(getState(view.state)!.currentMatches).toEqual(matches);
  });
  it("should allow us to specify real time checking when creating the plugin", () => {
    const { getState, view } = createPlugin({adapter, requestMatchesOnDocModified: true });
    expect(getState(view.state)!.config.requestMatchesOnDocModified).toEqual(true);
  });

  describe("Match persistence/removal", () => {
    it("should add matches to the document by default", () => {
      const { editorElement } = createEditor("123456", [createMatch(2, 4)]);
      const maybeMatchElement = editorElement.querySelector("span[data-match-id]")!;
      expect(maybeMatchElement).toBeTruthy()
    });
    it("should remove matches when the user makes an edit that overlaps them", () => {
      const { editorElement, view } = createEditor("123456", [createMatch(2, 4)]);

      const tr = view.state.tr
      tr.delete(3, 5)
      view.dispatch(tr);

      const maybeMatchElement = editorElement.querySelector("span[data-match-id]")!;
      expect(maybeMatchElement).toBe(null)
    });
    it("should remove matches when the user makes an insert that abuts them – rhs", () => {
      const { editorElement, view } = createEditor("123456", [createMatch(2, 4)]);

      const tr = view.state.tr
      tr.insertText("A", 4);
      view.dispatch(tr);

      const maybeMatchElement = editorElement.querySelector("span[data-match-id]")!;
      expect(maybeMatchElement).toBe(null)
    });
    it("should remove matches when the user makes an insert that abuts them - lhs", () => {
      const { editorElement, view } = createEditor("123456", [createMatch(2, 4)]);

      const tr = view.state.tr
      tr.insertText("A", 2);
      view.dispatch(tr);

      const maybeMatchElement = editorElement.querySelector("span[data-match-id]")!;
      expect(maybeMatchElement).toBe(null);
    });
    it("should not remove matches when the user makes an edit that doesn't overlap or abut them", () => {
      const { editorElement, view } = createEditor("123456", [createMatch(2, 4)]);

      const tr = view.state.tr
      tr.insertText("A", 5);
      view.dispatch(tr);

      const maybeMatchElement = editorElement.querySelector("span[data-match-id]")!;
      expect(maybeMatchElement).toBeTruthy()
    });
    it("should not remove matches when the user makes a deletion to the left hand side of the match that doesn't cover its range", () => {
      // @todo – this fails at the moment, as our change detection overestimates
      // the range affected by delete operations.
      const { editorElement, view } = createEditor("123456", [createMatch(3, 5)]);

      const tr = view.state.tr
      tr.delete(1, 2);
      view.dispatch(tr);

      const maybeMatchElement = editorElement.querySelector("span[data-match-id]")!;
      expect(maybeMatchElement).toBeTruthy()
    });
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
          matchContext: "bigger block of text",
          precedingText: "bigger block of text",
          subsequentText: ""
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
          to: 23,
          skipRanges: []
        },
        {
          from: 24,
          id: "1337-from:24-to:43",
          text: "More text to check",
          to: 43,
          skipRanges: []
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
    const { view, getState } = createPlugin({ adapter, matches: [match] });

    const decorationSpecs = getDecorationSpecsFromDoc(view);
    const expectedSpecs = getDecorationSpecsFromMatches([match], doc);
    expect(decorationSpecs).toEqual(expectedSpecs);

    const pluginMatches = getState(view.state)!.currentMatches;
    expect(pluginMatches).toEqual([match]);
  });
  it("should not add matches and their decorations on init when the ignoreMatch predicate returns true", () => {
    const match = createMatch(1, 2);
    const { view, getState } = createPlugin({
      ignoreMatch: () => true,
      adapter,
      matches: [match]
    });

    const decorations = getDecorationSpecsFromDoc(view);
    expect(decorations).toEqual(new Set());

    const pluginMatches = getState(view.state)!.currentMatches;
    expect(pluginMatches).toEqual([]);
  });
  it("should not add matches and their decorations returned from a matcher when the ignoreMatch predicate returns true", () => {
    const { commands, view, getState } = createPlugin({
      adapter,
      ignoreMatch: () => true
    });

    const response: IMatcherResponse = createMatcherResponse([
      { from: 1, to: 2, block: blocks[0] }
    ]);

    commands.requestMatchesForDocument("docId", ["cat1"]);
    commands.applyMatcherResponse(response);

    const decorations = getDecorationSpecsFromDoc(view);
    expect(decorations).toEqual(new Set());

    const pluginMatches = getState(view.state)!.currentMatches;
    expect(pluginMatches).toEqual([]);
  });
  describe("filtering matchers", () => {
    const filterOptions = {
      filterMatches: filterByMatchState,
      initialFilterState: [MatchType.OK]
    };
    it("should filter matches with the supplied predicate when the plugin initialises – remove matches", () => {
      const correctMatches = [{ ...createMatch(1), markAsCorrect: true }];
      const { view } = createPlugin({
        adapter,
        matches: correctMatches,
        filterOptions
      });
      const decorationSpecs = getDecorationSpecsFromDoc(view);
      const decorationsSpecsToExpect = getDecorationSpecs([]);
      expect(decorationSpecs).toEqual(decorationsSpecsToExpect);
    });
    it("should filter matches with the supplied predicate when the plugin initialises – retain matches", () => {
      const correctMatches = [
        { ...createMatch(1), markAsCorrect: true },
        matchWithReplacement
      ];
      const { view } = createPlugin({
        adapter,
        matches: correctMatches,
        filterOptions
      });
      const decorationSpecs = getDecorationSpecsFromDoc(view);
      const decorationsSpecsToExpect = getDecorationSpecs(
        createDecorationsForMatches([matchWithReplacement])
      );
      expect(decorationSpecs).toEqual(decorationsSpecsToExpect);
    });
    it("should filter matches with the supplied predicate when the plugin initialises", () => {
      const matchesWithReplacements: IMatch[] = [
        matchWithReplacement,
        createMatch(2),
        createMatch(3)
      ];
      const { view, commands } = createPlugin({
        adapter,
        matches: matchesWithReplacements,
        filterOptions
      });

      commands.setFilterState([MatchType.REVIEW]);

      const decorationSpecs = getDecorationSpecsFromDoc(view);
      const decorationsSpecsToExpect = getDecorationSpecs(
        createDecorationsForMatches([matchesWithReplacements[0]])
      );
      expect(decorationSpecs).toEqual(decorationsSpecsToExpect);
    });
  });
});
