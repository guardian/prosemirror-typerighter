import { Transaction } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import {
  selectMatch,
  setDebugState,
  applyNewDirtiedRanges,
  requestMatchesForDocument,
  requestError,
  requestMatchesForDirtyRanges,
  requestMatchesSuccess,
  newHoverIdReceived,
  requestMatchesComplete as requestComplete
} from "../actions";
import { selectBlockQueriesInFlightForSet } from "../selectors";
import { createTyperighterPluginReducer, IPluginState } from "../reducer";
import {
  createDebugDecorationFromRange,
  getNewDecorationsForCurrentMatches,
  createDecorationForMatch
} from "../../utils/decoration";
import { expandRangesToParentBlockNode } from "../../utils/range";
import { createDoc, p } from "../../test/helpers/prosemirror";
import { IMatch } from "../../interfaces/IMatch";
import {
  createMatcherResponse,
  createBlock,
  exampleCategoryIds,
  createBlockQueriesInFlight,
  exampleRequestId,
  createInitialData,
  defaultDoc,
  addOutputsToState,
  createBlockMatches
} from "../../test/helpers/fixtures";
import { createBlockId } from "../../utils/block";

const reducer = createTyperighterPluginReducer(expandRangesToParentBlockNode);

describe("Action handlers", () => {
  describe("No action", () => {
    it("should just return the state", () => {
      const { state, tr } = createInitialData();
      expect(reducer(tr, state)).toEqual(state);
    });
  });
  describe("Unknown action", () => {
    const { state, tr } = createInitialData();
    expect(reducer(tr, state, { type: "UNKNOWN_ACTION" } as any)).toEqual(
      state
    );
  });
  describe("requestMatchesForDocument", () => {
    it("should apply dirty ranges for the entire doc", () => {
      const { state, tr } = createInitialData();
      expect(
        reducer(
          tr,
          state,
          requestMatchesForDocument(exampleRequestId, exampleCategoryIds)
        )
      ).toMatchObject({
        requestsInFlight: createBlockQueriesInFlight(exampleRequestId, [
          {
            from: 1,
            text: "Example text to check",
            to: 23,
            id: "0-from:1-to:23"
          }
        ])
      });
    });
  });
  describe("requestMatchesForDirtyRanges", () => {
    it("should remove the pending status and any dirtied ranges, and mark the request as in flight", () => {
      const { state, tr } = createInitialData();
      expect(
        reducer(
          tr,
          {
            ...state,
            debug: true,
            dirtiedRanges: [{ from: 5, to: 10 }],
            requestPending: true
          },
          requestMatchesForDirtyRanges(exampleRequestId, exampleCategoryIds)
        )
      ).toEqual({
        ...state,
        debug: true,
        dirtiedRanges: [],
        decorations: new DecorationSet().add(tr.doc, [
          createDebugDecorationFromRange({ from: 1, to: 22 }, false)
        ]),
        requestPending: false,
        requestsInFlight: createBlockQueriesInFlight(exampleRequestId, [
          {
            text: "Example text to check",
            from: 1,
            to: 22,
            id: "0-from:1-to:22"
          }
        ])
      });
    });
    it("should remove debug decorations, if any", () => {
      const { state, tr } = createInitialData();
      const newState = reducer(
        tr,
        {
          ...state,
          debug: true,
          dirtiedRanges: [{ from: 5, to: 10 }],
          decorations: new DecorationSet().add(tr.doc, [
            createDebugDecorationFromRange({ from: 1, to: 3 })
          ]),
          requestPending: true
        },
        requestMatchesForDirtyRanges("id", exampleCategoryIds)
      );
      expect(newState.decorations).toEqual(
        new DecorationSet().add(tr.doc, [
          createDebugDecorationFromRange({ from: 1, to: 22 }, false)
        ])
      );
    });
    it("should add a total to the requests in flight", () => {
      const doc = createDoc(
        p("Example text to check"),
        p("More text to check")
      );
      const { state, tr } = createInitialData(doc);
      const newState = reducer(
        tr,
        {
          ...state,
          debug: true,
          dirtiedRanges: [{ from: 5, to: 10 }, { from: 28, to: 35 }],
          decorations: new DecorationSet(),
          requestPending: true
        },
        requestMatchesForDirtyRanges("id", exampleCategoryIds)
      );
      expect(
        selectBlockQueriesInFlightForSet(newState, "id")!.totalBlocks
      ).toEqual(2);
    });
  });
  describe("requestMatchesSuccess", () => {
    it("shouldn't do anything if there's nothing in the response and nothing to clean up", () => {
      const { state, tr } = createInitialData();
      expect(
        reducer(
          tr,
          state,
          requestMatchesSuccess({
            blocks: [{ from: 1, to: 1, text: "hai", id: "1" }],
            matches: [],
            categoryIds: ["some-cat"],
            requestId: exampleRequestId
          })
        )
      ).toEqual(state);
    });
    it("shouldn't do anything if there are no categories", () => {
      const { state, tr } = createInitialData();
      expect(
        reducer(
          tr,
          state,
          requestMatchesSuccess({
            blocks: [{ from: 1, to: 1, text: "hai", id: "1" }],
            matches: [],
            categoryIds: [],
            requestId: exampleRequestId
          })
        )
      ).toEqual(state);
    });
    it("should add incoming matches to the state", () => {
      const { state, tr } = createInitialData();
      let localState = reducer(
        tr,
        state,
        applyNewDirtiedRanges([{ from: 1, to: 3 }])
      );
      localState = reducer(
        tr,
        localState,
        requestMatchesForDirtyRanges(exampleRequestId, exampleCategoryIds)
      );
      expect(
        reducer(
          tr,
          localState,
          requestMatchesSuccess(createMatcherResponse(1, 22))
        ).currentMatches
      ).toMatchObject([createBlockMatches(1, 4)]);
    });
    it("should create decorations for the incoming matches", () => {
      const { state, tr } = createInitialData();
      expect(
        reducer(
          tr,
          state,
          requestMatchesSuccess(createMatcherResponse(5, 10))
        )
      ).toMatchSnapshot();
    });
    describe("superceded matches", () => {
      const { state: initialState, tr } = createInitialData();
      const firstBlock = createBlock(0, 15, "Example text to check");
      const secondBlock = createBlock(16, 37, "Another block of text");
      const blocks = [firstBlock, secondBlock];
      const category = {
        id: "this-category-should-remain",
        colour: "purple",
        name:
          "This category should remain untouched -- it's not included in the categories for the incoming matches"
      };
      const matcherResponse1 = createMatcherResponse(0, 15, 1, 7);
      const matcherResponse2 = createMatcherResponse(0, 15, 9, 13, category);
      const matcherResponse3 = createMatcherResponse(16, 37, 17, 25); // Some other output for another block
      const requestsInFlight = createBlockQueriesInFlight(
        exampleRequestId,
        blocks,
        [...matcherResponse1.categoryIds, ...matcherResponse2.categoryIds]
      );

      const state: IPluginState = addOutputsToState(
        {
          ...initialState,
          requestsInFlight
        },
        tr.doc,
        [
          matcherResponse1.matches[0],
          matcherResponse2.matches[0],
          matcherResponse3.matches[0]
        ]
      );

      it("should remove previous matches that match the block and category of the incoming match", () => {
        const newState = reducer(
          tr,
          state,
          requestMatchesSuccess({
            blocks: [firstBlock],
            categoryIds: ["1"],
            matches: [],
            requestId: exampleRequestId
          })
        );

        expect(newState.currentMatches).toEqual([
          matcherResponse2.matches[0],
          matcherResponse3.matches[0]
        ]);
      });
      it("should remove previous decorations that match block and category of the incoming match", () => {
        const newState = reducer(
          tr,
          state,
          requestMatchesSuccess({
            blocks: [firstBlock],
            categoryIds: ["1"],
            matches: [],
            requestId: exampleRequestId
          })
        );

        expect(newState.decorations).toEqual(
          new DecorationSet().add(tr.doc, [
            ...createDecorationForMatch(matcherResponse2.matches[0]),
            ...createDecorationForMatch(matcherResponse3.matches[0])
          ])
        );
      });

      it("should remove checkd categories from the remaining categories list for in-flight blocks", () => {
        const newState = reducer(
          tr,
          state,
          requestMatchesSuccess({
            blocks: [firstBlock],
            categoryIds: ["1"],
            matches: [],
            requestId: exampleRequestId
          })
        );

        expect(newState.requestsInFlight["set-id"]!.pendingBlocks).toEqual([
          {
            block: {
              from: 0,
              id: firstBlock.id,
              text: "Example text to check",
              to: 15
            },
            pendingCategoryIds: ["this-category-should-remain"]
          },
          {
            block: {
              from: 16,
              id: secondBlock.id,
              text: "Another block of text",
              to: 37
            },
            pendingCategoryIds: ["1", "this-category-should-remain"]
          }
        ]);
      });
      it("should not regenerate decorations for matches that remain", () => {
        const newState = reducer(
          tr,
          state,
          requestMatchesSuccess({
            blocks: [firstBlock],
            categoryIds: ["another-category"],
            matches: [],
            requestId: exampleRequestId
          })
        );

        expect(newState.decorations).toBe(state.decorations);
      });
    });
    it("should not apply matches if the ranges they apply to have since been dirtied", () => {
      const { state, tr } = createInitialData(defaultDoc, 1337);
      let localState = reducer(
        tr,
        state,
        applyNewDirtiedRanges([{ from: 1, to: 3 }])
      );
      localState = reducer(
        tr,
        localState,
        requestMatchesForDirtyRanges("id", exampleCategoryIds)
      );
      localState = reducer(
        tr,
        localState,
        applyNewDirtiedRanges([{ from: 1, to: 3 }])
      );
      expect(
        reducer(
          tr,
          localState,
          requestMatchesSuccess(createMatcherResponse(1, 3))
        )
      ).toEqual({
        ...localState,
        dirtiedRanges: [{ from: 1, to: 3 }],
        currentMatches: [],
        requestPending: true
      });
    });
  });
  describe("requestMatchesError", () => {
    it("Should re-add the in-flight request ranges as dirty ranges, and remove the inflight request", () => {
      const { state: initialState, tr } = createInitialData();
      const state = {
        ...initialState,
        requestsInFlight: createBlockQueriesInFlight(exampleRequestId, [
          createBlock(1, 25, "Example text to check")
        ])
      };
      const newState = reducer(
        tr,
        state,
        requestError({
          requestId: exampleRequestId,
          blockId: createBlockId(0, 1, 25),
          message: "Too many requests"
        })
      );
      expect(newState).toMatchObject({
        requestsInFlight: {},
        dirtiedRanges: [
          {
            from: 1,
            to: 25
          }
        ],
        decorations: new DecorationSet(),
        error: "Too many requests"
      });
    });
  });
  describe("requestMatchesComplete", () => {
    const { state: initialState, tr } = createInitialData();
    it("should remove the inflight request from the state", () => {
      const state = {
        ...initialState,
        requestsInFlight: createBlockQueriesInFlight(exampleRequestId, [
          createBlock(1, 25, "Example text to check")
        ])
      };
      const newState = reducer(tr, state, requestComplete(exampleRequestId));
      expect(newState.requestsInFlight).toEqual({});
    });
    it("should ignore other requests", () => {
      const state = {
        ...initialState,
        requestsInFlight: createBlockQueriesInFlight(exampleRequestId, [
          createBlock(1, 25, "Example text to check"),
          createBlock(26, 47, "More text to check")
        ])
      };
      const newState = reducer(tr, state, requestComplete(exampleRequestId));
      expect(newState.requestsInFlight).toEqual({});
    });
    it("should do nothing if the request is not found", () => {
      const newState = reducer(
        tr,
        initialState,
        requestComplete(exampleRequestId)
      );
      expect(newState.requestsInFlight).toEqual({});
    });
  });
  describe("newHoverIdReceived", () => {
    it("should update the hover id", () => {
      const { state } = createInitialData();
      expect(
        reducer(
          new Transaction(createDoc),
          state,
          newHoverIdReceived("exampleHoverId", undefined)
        )
      ).toEqual({
        ...state,
        hoverId: "exampleHoverId",
        hoverInfo: undefined
      });
    });
    it("should add hover decorations", () => {
      const { state, tr } = createInitialData();
      const output: IMatch = {
        matchId: "match-id",
        from: 0,
        to: 5,
        annotation: "Annotation",
        category: {
          id: "1",
          name: "cat",
          colour: "eeeeee"
        }
      };
      const localState = {
        ...state,
        currentMatches: [output],
        decorations: new DecorationSet().add(
          tr.doc,
          createDecorationForMatch(output, false, true)
        )
      };
      expect(reducer(tr, localState, newHoverIdReceived("match-id"))).toEqual({
        ...localState,
        decorations: new DecorationSet().add(
          tr.doc,
          createDecorationForMatch(output, true, true)
        ),
        hoverId: "match-id",
        hoverInfo: undefined
      });
    });
    it("should remove hover decorations", () => {
      const { state, tr } = createInitialData();
      const output: IMatch = {
        matchId: "match-id",
        from: 0,
        to: 5,
        annotation: "Annotation",
        category: {
          id: "1",
          name: "cat",
          colour: "eeeeee"
        }
      };
      const localState = {
        ...state,
        decorations: new DecorationSet().add(tr.doc, [
          ...createDecorationForMatch(output, true, true)
        ]),
        currentMatches: [output],
        hoverId: "match-id",
        hoverInfo: undefined
      };
      expect(
        reducer(tr, localState, newHoverIdReceived(undefined, undefined))
      ).toEqual({
        ...localState,
        decorations: new DecorationSet().add(tr.doc, [
          ...createDecorationForMatch(output, false, true)
        ]),
        hoverId: undefined,
        hoverInfo: undefined
      });
    });
  });
  describe("handleNewDirtyRanges", () => {
    it("should remove any decorations and matches that touch the passed ranges", () => {
      const { state } = createInitialData();
      const currentMatches: IMatch[] = [
        {
          matchId: "match-id",
          from: 1,
          to: 7,
          annotation: "Annotation",
          category: {
            id: "1",
            name: "cat",
            colour: "eeeeee"
          }
        }
      ];
      const stateWithCurrentMatchesAndDecorations = {
        ...state,
        currentMatches,
        decorations: getNewDecorationsForCurrentMatches(
          currentMatches,
          state.decorations,
          defaultDoc
        )
      };
      expect(
        reducer(
          new Transaction(defaultDoc),
          stateWithCurrentMatchesAndDecorations,
          applyNewDirtiedRanges([{ from: 1, to: 2 }])
        )
      ).toEqual({
        ...state,
        requestPending: true,
        dirtiedRanges: [{ from: 1, to: 2 }]
      });
    });
  });
  describe("selectMatch", () => {
    it("should apply the selected match id", () => {
      const { state } = createInitialData();
      const otherState = {
        ...state,
        currentMatches: [
          {
            matchId: "match-id",
            text: "example",
            from: 1,
            to: 1,
            annotation: "example",
            suggestions: [],
            category: {
              id: "1",
              name: "cat",
              colour: "eeeeee"
            },
            id: "exampleId"
          }
        ]
      };
      expect(
        reducer(
          new Transaction(createDoc),
          otherState,
          selectMatch("exampleId")
        )
      ).toEqual({
        ...otherState,
        selectedMatch: "exampleId"
      });
    });
  });
  describe("setDebug", () => {
    it("should set the debug state", () => {
      const { state } = createInitialData();
      expect(
        reducer(new Transaction(createDoc), state, setDebugState(true))
      ).toEqual({ ...state, debug: true });
    });
  });
});
