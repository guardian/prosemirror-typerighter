import { identity } from "lodash";
import { DecorationSet } from "prosemirror-view";
import { IMatch } from "../..";
import {
  createBlockQueriesInFlight,
  createInitialTr,
  createMatch,
  createStateWithMatches,
  defaultDoc,
  createBlock,
  exampleRequestId,
} from "../../test/helpers/fixtures";
import {
  getNewDecorationsForCurrentMatches,
  MatchType
} from "../../utils/decoration";
import { filterByMatchState, IDefaultFilterState } from "../../utils/plugin";
import { expandRangesToParentBlockNode } from "../../utils/range";
import { deriveFilteredDecorations, getNewStateFromTransaction, isFilterStateStale } from "../helpers";
import { createReducer, IPluginState } from "../reducer";

describe("State helpers", () => {
  const getState = <TFilterState extends unknown>(
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
      const { state: oldState } = getState(matches, undefined);
      const { state: newState } = getState(matches, undefined);
      const isStale = isFilterStateStale(oldState, newState, identity);
      expect(isStale).toBe(false);
    });
    it("should report fresh when the filter state is undefined and the matches change", () => {
      const { state: oldState } = getState([] as IMatch[], undefined);
      const { state: newState } = getState(
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
      const { state: oldState } = getState(matches, oldFilterState);
      const { state: newState } = getState(matches, newFilterState);
      const isStale = isFilterStateStale(oldState, newState, identity);
      expect(isStale).toBe(true);
    });
    it("should report stale when the matches change and the filter state remains the same", () => {
      const filterState = [] as MatchType[];
      const oldMatches = [] as IMatch[];
      const newMatches = [createMatch(1, 2)];
      const { state: oldState } = getState(oldMatches, filterState);
      const { state: newState } = getState(newMatches, filterState);
      const isStale = isFilterStateStale(oldState, newState, identity);
      expect(isStale).toBe(true);
    });
  });

  describe("deriveFilterDecorations", () => {
    it("should handle empty filters and matches", () => {
      const { tr, state } = getState([], []);
      const { filteredMatches, decorations } = deriveFilteredDecorations(
        tr.doc,
        state as IPluginState<IDefaultFilterState>,
        filterByMatchState
      );
      expect(filteredMatches).toEqual([]);
      expect(decorations).toEqual(DecorationSet.empty);
    });
    it("should handle a no-op filter state, adding matches to the filtered state", () => {
      const matches = [createMatch(1, 4), createMatch(4, 7)];
      const { tr, state } = getState(matches, []);
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
        getNewDecorationsForCurrentMatches(matches, DecorationSet.empty, tr.doc)
      );
    });
    it("should remove matches when they don't pass the filter", () => {
      const matches = [createMatch(1, 4), createMatch(4, 7)];
      const { tr, state } = getState(matches, [MatchType.DEFAULT]);
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
      expect(decorations).toEqual(DecorationSet.empty);
    });
  });

  describe("getNewStateFromTransaction", () => {
    it("should map current matches through the transaction mapping", () => {
      const deleteRange = 1;
      const deleteFrom = 2;
      const matches = [createMatch(1, 4), createMatch(4, 7)];
      const { tr, state } = getState(matches, [MatchType.DEFAULT]);

      tr.delete(deleteFrom, deleteFrom + deleteRange);
      const newState = getNewStateFromTransaction(tr, state);

      expect(newState.currentMatches[0].from).toBe(matches[0].from);
      expect(newState.currentMatches[0].to).toBe(matches[0].to - deleteRange);
      expect(newState.currentMatches[1].from).toBe(matches[1].from - deleteRange);
      expect(newState.currentMatches[1].to).toBe(matches[1].to - deleteRange);
    });

    it("should map dirtied ranges through the transaction mapping", () => {
      const deleteRange = 1;
      const deleteFrom = 2;
      const { tr, state } = getState([], [MatchType.DEFAULT]);
      const dirtiedRange = { from: 0, to: 4 };
      const initState = {
        ...state,
        dirtiedRanges: [dirtiedRange]
      }

      tr.delete(deleteFrom, deleteFrom + deleteRange);
      const newState = getNewStateFromTransaction(tr, initState);

      expect(newState.dirtiedRanges[0].from).toEqual(dirtiedRange.from);
      expect(newState.dirtiedRanges[0].to).toEqual(dirtiedRange.to - deleteRange);
    });

    it("should add mapping to the requests in flight", () => {
      const deleteRange = 1;
      const deleteFrom = 2;
      const { tr, state } = getState([], [MatchType.DEFAULT]);
      const initState = {
        ...state,
        requestsInFlight: createBlockQueriesInFlight([createBlock(1, 22, "Example text to check")])
      };

      tr.delete(deleteFrom, deleteFrom + deleteRange);
      const newState = getNewStateFromTransaction(tr, initState);

      expect(newState.requestsInFlight[exampleRequestId].mapping).toEqual(tr.mapping);
    });

    it("should map requestsInFlight blocks through the incoming transaction mapping", () => {
      const deleteRange = 1;
      const deleteFrom = 2;
      const { tr, state } = getState([], [MatchType.DEFAULT]);
      const requestsInFlight = createBlockQueriesInFlight([createBlock(1, 23, "Example text to check")])
      const initState = {
        ...state,
        requestsInFlight
      };

      tr.delete(deleteFrom, deleteFrom + deleteRange);
      const newState = getNewStateFromTransaction(tr, initState);

      const oldBlockInFlight = state.requestsInFlight[exampleRequestId].pendingBlocks[0].block
      const newBlockInFlight = newState.requestsInFlight[exampleRequestId].pendingBlocks[0].block

      expect(newBlockInFlight.from).toEqual(oldBlockInFlight.from);
      expect(newBlockInFlight.to).toEqual(oldBlockInFlight.to - deleteRange);
    });
  })
});
