import {
  selectPercentRemaining,
  selectMatchByMatchId,
  selectSuggestionAndRange,
  selectSingleBlockInRequestInFlightById,
  selectNewBlockInFlight
} from "../selectors";
import {
  createBlock,
  createRequestInFlight,
  exampleRequestId,
  createInitialData,
  exampleCategoryIds
} from "../../test/helpers/fixtures";
import { Match } from '../../interfaces/IMatch';
import { omit } from "lodash";

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
        selectSingleBlockInRequestInFlightById(
          {
            requestsInFlight: createRequestInFlight([
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
            requestsInFlight: createRequestInFlight([
              input1
            ])
          },
          {
            ...state,
            requestsInFlight: {
              ...createRequestInFlight([input1]),
              ...createRequestInFlight([input2], "set-id-2")
            }
          }
        )
      ).toEqual([
        {
          requestId: "set-id-2",
          ...createRequestInFlight([input2], "set-id-2")["set-id-2"]
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
              ...createRequestInFlight([input1]),
              ...createRequestInFlight([input2], "set-id-2")
            }
          },
          {
            ...state,
            requestsInFlight: createRequestInFlight([
              input1
            ], exampleRequestId)
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
      const currentMatches: Match[] = [
        {
          matcherType: "regex",
          ruleId: "ruleId",
          matchId: "match-id",
          from: 0,
          to: 5,
          ranges: [{ from: 0, to: 5 }],
          suggestions: [
            { type: "TEXT_SUGGESTION" as "TEXT_SUGGESTION", text: "example" },
            {
              type: "TEXT_SUGGESTION" as "TEXT_SUGGESTION",
              text: "suggestion"
            }
          ],
          message: "Annotation",
          category: {
            id: "1",
            name: "cat",
            colour: "eeeeee"
          },
          matchedText: "hai",
          matchContext: "oh [[hai]]",
          precedingText: "oh ",
          subsequentText: "",
          groupKey: "group-key"
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
      const currentMatches: Match[] = [
        {
          matcherType: "regex",
          ruleId: "ruleId",
          matchId: "match-id",
          from: 0,
          to: 5,
          ranges: [{ from: 0, to: 5 }],
          suggestions: [
            { type: "TEXT_SUGGESTION" as "TEXT_SUGGESTION", text: "example" },
            {
              type: "TEXT_SUGGESTION" as "TEXT_SUGGESTION",
              text: "suggestion"
            }
          ],
          message: "Annotation",
          category: {
            id: "1",
            name: "cat",
            colour: "eeeeee"
          },
          matchedText: "hai",
          matchContext: "Oh [[hai]]",
          precedingText: "oh ",
          subsequentText: "",
          groupKey: "group-key"
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
        requestsInFlight: createRequestInFlight(
          [input1, input2],
          exampleRequestId,
          ["1", "2"]
        )
      };
      expect(selectPercentRemaining(state)).toEqual(100);
      state = {
        ...initialState,
        requestsInFlight: createRequestInFlight(
          [input1, input2],
          exampleRequestId,
          ["1", "2"],
          ["1"]
        )
      };
      expect(selectPercentRemaining(state)).toEqual(50);
    });
    it("should select the percentage remaining for a single request for all categories", () => {
      const { state: initialState } = createInitialData();
      const input1 = createBlock(0, 5);
      const input2 = createBlock(10, 15);
      let state = {
        ...initialState,
        requestsInFlight: createRequestInFlight(
          [input1, input2],
          exampleRequestId,
          []
        )
      };
      expect(selectPercentRemaining(state)).toEqual(100);
      state = {
        ...initialState,
        requestsInFlight: omit(state.requestsInFlight, exampleRequestId),
      };
      expect(selectPercentRemaining(state)).toEqual(0);
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
          ...createRequestInFlight([input1, input2]),
          ...createRequestInFlight([input3], "set-id-2")
        }
      };
      expect(selectPercentRemaining(state)).toEqual(100);
      state = {
        ...initialState,
        requestsInFlight: {
          ...createRequestInFlight(
            [input1, input2],
            exampleRequestId,
            exampleCategoryIds,
            [],
            3
          ),
          ...createRequestInFlight(
            [input3, input4],
            "set-id-2",
            exampleCategoryIds,
            exampleCategoryIds,
            2
          )
        }
      };
      expect(selectPercentRemaining(state)).toEqual(40);
    });
    it("should derive percent remaining from percentageRequestComplete when available", () => {
      const { state: initialState } = createInitialData();
      let state = {
        ...initialState,
        percentageRequestComplete: 8
      };
      expect(selectPercentRemaining(state)).toEqual(92);
      state = {
        ...initialState,
        percentageRequestComplete: 50
      }
      expect(selectPercentRemaining(state)).toEqual(50)
    });
    it("should not allow negative numbers if percentageRequestComplete is greater than 100", () => {
      const { state: initialState } = createInitialData();
      const state = {
        ...initialState,
        percentageRequestComplete: 120
      };
      expect(selectPercentRemaining(state)).toEqual(0)
    });
  });
});
