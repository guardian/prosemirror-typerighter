import { identity } from "lodash";
import { DecorationSet } from "prosemirror-view";
import { IMatch } from "../..";
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
import { filterByMatchState, IDefaultFilterState } from "../../utils/plugin";
import { expandRangesToParentBlockNode } from "../../utils/range";
import { deriveFilteredDecorations, isFilterStateStale } from "../helpers";
import { createReducer, IPluginState } from "../reducer";

describe("State helpers", () => {
  const getStateWithFilter = <TFilterState extends unknown>(
    matchesToAdd: IMatch[],
    filterState: TFilterState
  ) => {
    const { state, matches } = createStateWithMatches(
      createReducer(expandRangesToParentBlockNode),
      matchesToAdd
    );
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

  describe("isFilterStateStale", () => {
    it("should report fresh when the filter state is undefined", () => {
      const matches = [] as IMatch[];
      const { state: oldState } = getStateWithFilter(matches, undefined);
      const { state: newState } = getStateWithFilter(matches, undefined);
      const isStale = isFilterStateStale(oldState, newState, identity);
      expect(isStale).toBe(false);
    });
    it("should report fresh when the filter state is undefined and the matches change", () => {
      const { state: oldState } = getStateWithFilter([] as IMatch[], undefined);
      const { state: newState } = getStateWithFilter(
        [createMatch(1, 2)],
        undefined
      );
      const isStale = isFilterStateStale(oldState, newState, identity);
      expect(isStale).toBe(false);
    });
    it("should report stale when the filter state changes", () => {
      const oldFilterState = [] as MatchType[];
      const newFilterState = [MatchType.CORRECT];
      const matches = [] as IMatch[];
      const { state: oldState } = getStateWithFilter(matches, oldFilterState);
      const { state: newState } = getStateWithFilter(matches, newFilterState);
      const isStale = isFilterStateStale(oldState, newState, identity);
      expect(isStale).toBe(true);
    });
    it("should report stale when the matches change and the filter state remains the same", () => {
      const filterState = [] as MatchType[];
      const oldMatches = [] as IMatch[];
      const newMatches = [createMatch(1, 2)];
      const { state: oldState } = getStateWithFilter(oldMatches, filterState);
      const { state: newState } = getStateWithFilter(newMatches, filterState);
      const isStale = isFilterStateStale(oldState, newState, identity);
      expect(isStale).toBe(true);
    });
  });

  describe("deriveFilterDecorations", () => {
    it("should handle empty filters and matches", () => {
      const { tr, state } = getStateWithFilter([], []);
      const { filteredMatches, decorations } = deriveFilteredDecorations(
        tr.doc,
        state as IPluginState<IDefaultFilterState>,
        filterByMatchState
      );
      expect(filteredMatches).toEqual([]);
      expect(decorations).toEqual(new DecorationSet());
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
        state as IPluginState<IDefaultFilterState>,
        filterByMatchState
      );
      expect(filteredMatches).toEqual(currentMatches);
      expect(decorations).toEqual(
        getNewDecorationsForCurrentMatches(matches, new DecorationSet(), tr.doc)
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
        state as IPluginState<IDefaultFilterState>,
        filterByMatchState
      );

      expect(currentMatches).toEqual(matches);
      expect(filteredMatches).toEqual([]);
      expect(decorations).toEqual(new DecorationSet());
    });
  });
});
