import {
  selectPercentRemaining,
  selectMatchByMatchId,
  selectSuggestionAndRange,
  selectSingleBlockInFlightById,
  selectNewBlockInFlight
} from "../selectors";
import {
  createBlock,
  createBlockQueriesInFlight,
  exampleRequestId,
  createInitialData,
  exampleCategoryIds
} from "../../test/helpers/fixtures";

describe("selectors", () => {
  describe("selectMatchById", () => {
    it("should find the given match by id", () => {
      expect(
        selectMatchByMatchId(
          {
            currentMatches: [
              {
                matchId: "1"
              },
              {
                matchId: "2"
              }
            ]
          } as any,
          "1"
        )
      ).toEqual({ matchId: "1" });
    });
    it("should return undefined if there is no match", () => {
      expect(
        selectMatchByMatchId(
          {
            currentMatches: [
              {
                blockId: "1"
              },
              {
                blockId: "2"
              }
            ]
          } as any,
          "3"
        )
      ).toEqual(undefined);
    });
  });
  describe("selectBlockInFlightById", () => {
    it("should find a single block in flight by its id", () => {
      const input1 = createBlock(0, 5);
      const input2 = createBlock(10, 15);
      expect(
        selectSingleBlockInFlightById(
          {
            requestsInFlight: createBlockQueriesInFlight(exampleRequestId, [
              input1,
              input2
            ])
          } as any,
          exampleRequestId,
          input1.id
        )!.block
      ).toEqual(input1);
    });
  });
  describe("selectNewBlockInFlight", () => {
    it("should find the new inflight matches given an old and a new state", () => {
      const { state } = createInitialData();
      const input1 = createBlock(0, 5);
      const input2 = createBlock(10, 15);
      expect(
        selectNewBlockInFlight(
          {
            ...state,
            requestsInFlight: createBlockQueriesInFlight(exampleRequestId, [
              input1
            ])
          },
          {
            ...state,
            requestsInFlight: {
              ...createBlockQueriesInFlight(exampleRequestId, [input1]),
              ...createBlockQueriesInFlight("set-id-2", [input2])
            }
          }
        )
      ).toEqual([
        {
          requestId: "set-id-2",
          ...createBlockQueriesInFlight("set-id-2", [input2])["set-id-2"]
        }
      ]);
    });
    it("shouldn't include matches missing in the new state but present in the old state", () => {
      const { state } = createInitialData();
      const input1 = createBlock(0, 5);
      const input2 = createBlock(10, 15);
      expect(
        selectNewBlockInFlight(
          {
            ...state,
            requestsInFlight: {
              ...createBlockQueriesInFlight(exampleRequestId, [input1]),
              ...createBlockQueriesInFlight("set-id-2", [input2])
            }
          },
          {
            ...state,
            requestsInFlight: createBlockQueriesInFlight(exampleRequestId, [
              input1
            ])
          }
        )
      ).toEqual([]);
    });
  });
  describe("selectSuggestionAndRange", () => {
    it("should handle unknown outputs", () => {
      const { state } = createInitialData();
      expect(selectSuggestionAndRange(state, "invalidId", 5)).toEqual(null);
    });
    it("should handle unknown suggestions for found outputs", () => {
      const { state } = createInitialData();
      const currentMatches = [
        {
          matchId: "match-id",
          id: "id",
          from: 0,
          to: 5,
          suggestions: [
            { type: "TEXT_SUGGESTION" as "TEXT_SUGGESTION", text: "example" },
            {
              type: "TEXT_SUGGESTION" as "TEXT_SUGGESTION",
              text: "suggestion"
            }
          ],
          annotation: "Annotation",
          category: {
            id: "1",
            name: "cat",
            colour: "eeeeee"
          },
          text: "hai"
        }
      ];
      expect(
        selectSuggestionAndRange(
          {
            ...state,
            currentMatches
          },
          "id",
          15
        )
      ).toEqual(null);
    });
    it("should select a suggestion and the range it should be applied to, given a match id and suggestion index", () => {
      const { state } = createInitialData();
      const currentMatches = [
        {
          matchId: "match-id",
          id: "id",
          from: 0,
          to: 5,
          suggestions: [
            { type: "TEXT_SUGGESTION" as "TEXT_SUGGESTION", text: "example" },
            {
              type: "TEXT_SUGGESTION" as "TEXT_SUGGESTION",
              text: "suggestion"
            }
          ],
          annotation: "Annotation",
          category: {
            id: "1",
            name: "cat",
            colour: "eeeeee"
          },
          text: "hai"
        }
      ];
      expect(
        selectSuggestionAndRange(
          {
            ...state,
            currentMatches
          },
          "match-id",
          0
        )
      ).toEqual({
        from: 0,
        to: 5,
        suggestion: {
          type: "TEXT_SUGGESTION" as "TEXT_SUGGESTION",
          text: "example"
        }
      });
      expect(
        selectSuggestionAndRange(
          {
            ...state,
            currentMatches
          },
          "match-id",
          1
        )
      ).toEqual({
        from: 0,
        to: 5,
        suggestion: {
          type: "TEXT_SUGGESTION" as "TEXT_SUGGESTION",
          text: "suggestion"
        }
      });
    });
  });
  describe("selectPercentRemaining", () => {
    it("should report nothing when there are no requests in flight", () => {
      const { state } = createInitialData();
      expect(selectPercentRemaining(state)).toEqual(0);
    });
    it("should select the percentage remaining for a single request", () => {
      const { state: initialState } = createInitialData();
      const input1 = createBlock(0, 5);
      const input2 = createBlock(10, 15);
      let state = {
        ...initialState,
        requestsInFlight: createBlockQueriesInFlight(
          exampleRequestId,
          [input1, input2],
          ["1", "2"]
        )
      };
      expect(selectPercentRemaining(state)).toEqual(100);
      state = {
        ...initialState,
        requestsInFlight: createBlockQueriesInFlight(
          exampleRequestId,
          [input1, input2],
          ["1", "2"],
          ["1"]
        )
      };
      expect(selectPercentRemaining(state)).toEqual(50);
    });
    it("should select the percentage remaining for multiple requests", () => {
      const { state: initialState } = createInitialData();
      const input1 = createBlock(0, 5);
      const input2 = createBlock(10, 15);
      const input3 = createBlock(15, 20);
      const input4 = createBlock(20, 25);
      let state = {
        ...initialState,
        requestsInFlight: {
          ...createBlockQueriesInFlight(exampleRequestId, [input1, input2]),
          ...createBlockQueriesInFlight("set-id-2", [input3])
        }
      };
      expect(selectPercentRemaining(state)).toEqual(100);
      state = {
        ...initialState,
        requestsInFlight: {
          ...createBlockQueriesInFlight(
            exampleRequestId,
            [input1, input2],
            exampleCategoryIds,
            [],
            3
          ),
          ...createBlockQueriesInFlight(
            "set-id-2",
            [input3, input4],
            exampleCategoryIds,
            exampleCategoryIds,
            2
          )
        }
      };
      expect(selectPercentRemaining(state)).toEqual(40);
    });
  });
});
