import { identity } from "lodash";
import { DecorationSet } from "prosemirror-view";
import { IMatch } from "../..";
import { createEditor } from "../../test/helpers/createEditor";
import {
  createInitialTr,
  createMatch,
  createStateWithMatches,
  defaultDoc
} from "../../test/helpers/fixtures";
import {
  getNewDecorationsForCurrentMatches,
  MatchType
} from "../../utils/decoration";
import { filterByMatchState } from "../../utils/plugin";
import { deriveFilteredDecorations, getNewStateFromTransaction } from "../helpers";
import { IPluginState } from "../reducer";

const getStateWithFilter = <TFilterState extends unknown>(
  matchesToAdd: IMatch[],
  filterState: TFilterState
) => {
  const { state, matches } = createStateWithMatches(matchesToAdd);
  const tr = createInitialTr(defaultDoc);
  return {
    tr,
    matches,
    state: {
      ...state,
      filterState
    } as IPluginState<TFilterState>
  };
};

describe("State helpers", () => {
  describe("deriveFilterDecorations", () => {
    it("should handle empty filters and matches", () => {
      const { tr, state } = getStateWithFilter([], []);
      const { filteredMatches, decorations } = deriveFilteredDecorations(
        tr.doc,
        state,
        filterByMatchState
      );
      expect(filteredMatches).toEqual([]);
      expect(decorations).toEqual(DecorationSet.empty);
    });
    it("should handle a no-op filter state, adding matches to the filtered state", () => {
      const matches = [createMatch(1, 4), createMatch(4, 7)];
      const { tr, state } = getStateWithFilter(matches, []);
      const {
        currentMatches,
        filteredMatches,
        decorations
      } = deriveFilteredDecorations(
        tr.doc,
        state,
        filterByMatchState
      );
      expect(filteredMatches).toEqual(currentMatches);
      expect(decorations).toEqual(
        getNewDecorationsForCurrentMatches(matches, DecorationSet.empty, tr.doc)
      );
    });
    it("should remove matches when they don't pass the filter", () => {
      const matches = [createMatch(1, 4), createMatch(4, 7)];
      const { tr, state } = getStateWithFilter(matches, [MatchType.DEFAULT]);
      const {
        currentMatches,
        filteredMatches,
        decorations
      } = deriveFilteredDecorations(
        tr.doc,
        state,
        filterByMatchState
      );

      expect(currentMatches).toEqual(matches);
      expect(filteredMatches).toEqual([]);
      expect(decorations).toEqual(DecorationSet.empty);
    });
  });

  describe("getNewStateFromTransaction", () => {
    it("should do nothing when the transaction does not alter the document", () => {
      const { getPluginState, view } = createEditor("123456", []);
      const oldPluginState = getPluginState(view.state);

      const newPluginState = getNewStateFromTransaction(view.state.tr, oldPluginState, view.state)

      expect(oldPluginState).toEqual(newPluginState);
    });
    it("should update the dirty state when the transaction alters the document", () => {
      const { getPluginState, view } = createEditor("123456", []);
      const oldPluginState = getPluginState(view.state);
      const tr = view.state.tr;

      tr.deleteRange(1, 2);
      const newPluginState = getNewStateFromTransaction(tr, oldPluginState, view.state);

      expect(newPluginState.docChangedSinceCheck).toEqual(true);
    });
    it("should map current matches through incoming transactions, producing new ranges", () => {
      const { getPluginState, view } = createEditor("123456", [createMatch(2,3)]);
      const oldPluginState = getPluginState(view.state);
      const tr = view.state.tr;

      tr.deleteRange(1, 2);
      const newPluginState = getNewStateFromTransaction(tr, oldPluginState, view.state);
      const mappedMatch = newPluginState.currentMatches[0];

      expect(mappedMatch.from).toEqual(1);
      expect(mappedMatch.to).toEqual(2);
    });
    it("should map current decorations through incoming transactions, producing new ranges", () => {
      const { getPluginState, view } = createEditor("123456", [createMatch(2,3)]);
      const oldPluginState = getPluginState(view.state);
      const tr = view.state.tr;

      tr.deleteRange(1, 2);
      const newPluginState = getNewStateFromTransaction(tr, oldPluginState, view.state);
      const [mappedDeco] = newPluginState.decorations.find();

      expect(mappedDeco.from).toEqual(1);
      expect(mappedDeco.to).toEqual(2);
    });
    it("should filter out any matches that have a range of 0", () => {
      const { getPluginState, view } = createEditor("123456", []);
      const oldPluginState = {...getPluginState(view.state), currentMatches: [createMatch(4,4)]}
      const tr = view.state.tr;

      tr.deleteRange(1, 2);
      const newPluginState = getNewStateFromTransaction(tr, oldPluginState, view.state);

      expect(newPluginState.currentMatches).toEqual([]);
    });
  })
});
