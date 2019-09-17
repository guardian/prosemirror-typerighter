import {
  selectPercentRemaining,
  selectBlockMatchesByMatchId,
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
  describe("selectValidationById", () => {
    it("should find the given validation by id", () => {
      expect(
        selectBlockMatchesByMatchId(
          {
            currentValidations: [
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
    it("should return undefined if there is no validation", () => {
      expect(
        selectBlockMatchesByMatchId(
          {
            currentValidations: [
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
  describe("selectValidationInFlightById", () => {
    it("should find a single validation in flight by its id", () => {
      const input1 = createBlock(0, 5);
      const input2 = createBlock(10, 15);
      expect(
        selectSingleBlockInFlightById(
          {
            blockQueriesInFlight: createBlockQueriesInFlight(
              exampleRequestId,
              [input1, input2]
            )
          } as any,
          exampleRequestId,
          input1.id
        )!.block
      ).toEqual(input1);
    });
  });
  describe("selectNewValidationInFlight", () => {
    it("should find the new inflight validations given an old and a new state", () => {
      const { state } = createInitialData();
      const input1 = createBlock(0, 5);
      const input2 = createBlock(10, 15);
      expect(
        selectNewBlockInFlight(
          {
            ...state,
            blockQueriesInFlight: createBlockQueriesInFlight(
              exampleRequestId,
              [input1]
            )
          },
          {
            ...state,
            blockQueriesInFlight: {
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
    it("shouldn't include validations missing in the new state but present in the old state", () => {
      const { state } = createInitialData();
      const input1 = createBlock(0, 5);
      const input2 = createBlock(10, 15);
      expect(
        selectNewBlockInFlight(
          {
            ...state,
            blockQueriesInFlight: {
              ...createBlockQueriesInFlight(exampleRequestId, [input1]),
              ...createBlockQueriesInFlight("set-id-2", [input2])
            }
          },
          {
            ...state,
            blockQueriesInFlight: createBlockQueriesInFlight(
              exampleRequestId,
              [input1]
            )
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
      const currentValidations = [
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
            currentValidations
          },
          "id",
          15
        )
      ).toEqual(null);
    });
    it("should select a suggestion and the range it should be applied to, given a validation id and suggestion index", () => {
      const { state } = createInitialData();
      const currentValidations = [
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
            currentValidations
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
            currentValidations
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
    it("should report nothing when there are no validations in flight", () => {
      const { state } = createInitialData();
      expect(selectPercentRemaining(state)).toEqual(0);
    });
    it("should select the percentage remaining for a single validation set", () => {
      const { state: initialState } = createInitialData();
      const input1 = createBlock(0, 5);
      const input2 = createBlock(10, 15);
      let state = {
        ...initialState,
        blockQueriesInFlight: createBlockQueriesInFlight(
          exampleRequestId,
          [input1, input2],
          ["1", "2"]
        )
      };
      expect(selectPercentRemaining(state)).toEqual(100);
      state = {
        ...initialState,
        blockQueriesInFlight: createBlockQueriesInFlight(
          exampleRequestId,
          [input1, input2],
          ["1", "2"],
          ["1"]
        )
      };
      expect(selectPercentRemaining(state)).toEqual(50);
    });
    it("should select the percentage remaining for multiple validation sets", () => {
      const { state: initialState } = createInitialData();
      const input1 = createBlock(0, 5);
      const input2 = createBlock(10, 15);
      const input3 = createBlock(15, 20);
      const input4 = createBlock(20, 25);
      let state = {
        ...initialState,
        blockQueriesInFlight: {
          ...createBlockQueriesInFlight(exampleRequestId, [
            input1,
            input2
          ]),
          ...createBlockQueriesInFlight("set-id-2", [input3])
        }
      };
      expect(selectPercentRemaining(state)).toEqual(100);
      state = {
        ...initialState,
        blockQueriesInFlight: {
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
            3
          )
        }
      };
      expect(selectPercentRemaining(state)).toEqual(50);
    });
  });
});
