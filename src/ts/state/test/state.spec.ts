import { Transaction } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import {
  selectValidation,
  setDebugState,
  selectValidationInFlightById,
  selectNewValidationInFlight,
  applyNewDirtiedRanges,
  selectSuggestionAndRange,
  validationRequestForDocument,
  IPluginState,
  selectValidationsInFlightForSet,
  selectPercentRemaining
} from "../state";
import {
  newHoverIdReceived,
  selectValidationById,
  createValidationPluginReducer,
  validationRequestError,
  validationRequestForDirtyRanges,
  validationRequestSuccess
} from "../state";
import {
  createDebugDecorationFromRange,
  getNewDecorationsForCurrentValidations,
  createDecorationForValidationRange
} from "../../utils/decoration";
import { expandRangesToParentBlockNode } from "../../utils/range";
import { createDoc, p } from "../../test/helpers/prosemirror";
import { Mapping } from "prosemirror-transform";
import {
  IValidationOutput,
  IValidationInput
} from "../../interfaces/IValidation";
import {
  createValidationOutput,
  createValidationInput
} from "../../test/helpers/fixtures";
import { createValidationId } from "../../utils/validation";

const reducer = createValidationPluginReducer(expandRangesToParentBlockNode);
const initialDocToValidate = createDoc(p("Example text to validate"));
const createInitialTr = () => {
  const tr = new Transaction(initialDocToValidate);
  tr.doc = initialDocToValidate;
  tr.time = 0;
  return tr;
};
const createInitialData = (initialDoc = initialDocToValidate, time = 0) => {
  const tr = createInitialTr();
  tr.doc = initialDoc;
  tr.time = time;
  return {
    tr,
    state: {
      debug: false,
      validateOnModify: true,
      currentThrottle: 100,
      initialThrottle: 100,
      maxThrottle: 1000,
      decorations: DecorationSet.create(tr.doc, []),
      dirtiedRanges: [],
      currentValidations: [],
      selectedValidation: undefined,
      hoverId: undefined,
      hoverInfo: undefined,
      trHistory: [tr],
      validationsInFlight: {},
      validationPending: false,
      error: undefined
    }
  };
};
const validationSetId = "set-id";

const addOutputsToState = (
  state: IPluginState<IValidationOutput>,
  doc: any,
  outputs: IValidationOutput[]
) => {
  const decorations = outputs.reduce(
    (set, output) => set.add(doc, createDecorationForValidationRange(output)),
    new DecorationSet()
  );
  return {
    ...state,
    currentValidations: outputs,
    decorations
  };
};

const getValidationsInFlight = (
  setId: string,
  inputs: IValidationInput[],
  total?: number
) => ({
  [setId]: {
    total: total || inputs.length,
    current: inputs.map(input => ({
      validationInput: input,
      mapping: new Mapping()
    }))
  }
});

describe("State management", () => {
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
    describe("validationRequestForDocument", () => {
      it("should apply dirty ranges for the entire doc", () => {
        const { state, tr } = createInitialData();
        expect(
          reducer(tr, state, validationRequestForDocument(validationSetId))
        ).toMatchObject({
          validationsInFlight: getValidationsInFlight(validationSetId, [
            {
              from: 1,
              inputString: "Example text to validate",
              to: 26,
              validationId: "0-from:1-to:26"
            }
          ])
        });
      });
    });
    describe("validationRequestForDirtyRanges", () => {
      it("should remove the pending status and any dirtied ranges, and mark the validation as in flight", () => {
        const { state, tr } = createInitialData();
        expect(
          reducer(
            tr,
            {
              ...state,
              debug: true,
              dirtiedRanges: [{ from: 5, to: 10 }],
              validationPending: true
            },
            validationRequestForDirtyRanges(validationSetId)
          )
        ).toEqual({
          ...state,
          debug: true,
          dirtiedRanges: [],
          decorations: new DecorationSet().add(tr.doc, [
            createDebugDecorationFromRange({ from: 1, to: 25 }, false)
          ]),
          validationPending: false,
          validationsInFlight: getValidationsInFlight(validationSetId, [
            {
              inputString: "Example text to validate",
              from: 1,
              to: 25,
              validationId: "0-from:1-to:25"
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
            validationPending: true
          },
          validationRequestForDirtyRanges("id")
        );
        expect(newState.decorations).toEqual(
          new DecorationSet().add(tr.doc, [
            createDebugDecorationFromRange({ from: 1, to: 25 }, false)
          ])
        );
      });
      it("should add a total to the validations in flight", () => {
        const doc = createDoc(
          p("Example text to validate"),
          p("More text to validate")
        );
        const { state, tr } = createInitialData(doc);
        const newState = reducer(
          tr,
          {
            ...state,
            debug: true,
            dirtiedRanges: [{ from: 5, to: 10 }, { from: 28, to: 35 }],
            decorations: new DecorationSet(),
            validationPending: true
          },
          validationRequestForDirtyRanges("id")
        );
        expect(selectValidationsInFlightForSet(newState, "id")!.total).toEqual(
          2
        );
      });
    });
    describe("validationRequestSuccess", () => {
      it("shouldn't do anything if there's nothing in the response and nothing to clean up", () => {
        const { state, tr } = createInitialData();
        expect(
          reducer(
            tr,
            state,
            validationRequestSuccess({
              validationOutputs: [],
              validationId: "id-that-does-not-exist-in-state",
              validationSetId
            })
          )
        ).toEqual(state);
      });
      it("should add incoming validations to the state", () => {
        const { state, tr } = createInitialData();
        let localState = reducer(
          tr,
          state,
          applyNewDirtiedRanges([{ from: 1, to: 3 }])
        );
        localState = reducer(
          tr,
          localState,
          validationRequestForDirtyRanges(validationSetId)
        );
        expect(
          reducer(
            tr,
            localState,
            validationRequestSuccess({
              validationOutputs: [createValidationOutput(1, 25)],
              validationId: createValidationId(0, 1, 25),
              validationSetId
            })
          ).currentValidations
        ).toMatchObject([createValidationOutput(1, 25)]);
      });
      it("should create decorations for the incoming validations", () => {
        const { state, tr } = createInitialData();
        expect(
          reducer(
            tr,
            state,
            validationRequestSuccess({
              validationOutputs: [createValidationOutput(5, 10)],
              validationId: createValidationId(0, 5, 10),
              validationSetId
            })
          )
        ).toMatchSnapshot();
      });
      it("should remove previous validations & decorations that no longer apply to the validated range", () => {
        const { state: initialState, tr } = createInitialData();
        const validationInput = createValidationInput(
          0,
          15,
          "Example text to validate"
        );
        const state = {
          ...initialState,
          validationsInFlight: getValidationsInFlight(validationSetId, [
            validationInput
          ])
        };
        const validationOutput1 = createValidationOutput(1, 7, "Example");
        const validationOutput2 = createValidationOutput(17, 25, "validate");
        const newState = reducer(
          tr,
          addOutputsToState(state, tr.doc, [
            validationOutput1,
            validationOutput2
          ]),
          validationRequestSuccess({
            validationOutputs: [],
            validationId: validationInput.validationId,
            validationSetId
          })
        );
        expect(newState.currentValidations).toEqual([validationOutput2]);
        expect(newState.decorations).toEqual(
          new DecorationSet().add(
            tr.doc,
            createDecorationForValidationRange(validationOutput2)
          )
        );
      });
      it("should not apply validations if the ranges they apply to have since been dirtied", () => {
        const { state, tr } = createInitialData(initialDocToValidate, 1337);
        let localState = reducer(
          tr,
          state,
          applyNewDirtiedRanges([{ from: 1, to: 3 }])
        );
        localState = reducer(
          tr,
          localState,
          validationRequestForDirtyRanges("id")
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
            validationRequestSuccess({
              validationOutputs: [createValidationOutput(1, 3)],
              validationId: createValidationId(0, 1, 3),
              validationSetId
            })
          )
        ).toEqual({
          ...localState,
          dirtiedRanges: [{ from: 1, to: 3 }],
          currentValidations: [],
          validationPending: true
        });
      });
    });
    describe("validationRequestError", () => {
      it("Should re-add the in-flight validation ranges as dirty ranges, and remove the inflight validation", () => {
        const { state: initialState, tr } = createInitialData();
        const state = {
          ...initialState,
          validationsInFlight: getValidationsInFlight(validationSetId, [
            createValidationInput(1, 25, "Example text to validate")
          ])
        };
        const newState = reducer(
          tr,
          state,
          validationRequestError({
            validationSetId,
            validationId: createValidationId(0, 1, 25),
            message: "Too many requests"
          })
        );
        expect(newState).toMatchObject({
          validationsInFlight: {},
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
        const output: IValidationOutput = {
          from: 0,
          to: 5,
          inputString: "Example",
          annotation: "Annotation",
          category: {
            id: "1",
            name: "cat",
            colour: "eeeeee"
          },
          validationId: "exampleHoverId"
        };
        const localState = { ...state, currentValidations: [output] };
        expect(
          reducer(
            tr,
            localState,
            newHoverIdReceived("exampleHoverId", undefined)
          )
        ).toEqual({
          ...localState,
          decorations: new DecorationSet().add(
            tr.doc,
            createDecorationForValidationRange(output, true, false)
          ),
          hoverId: "exampleHoverId",
          hoverInfo: undefined
        });
      });
      it("should remove hover decorations", () => {
        const { state, tr } = createInitialData();
        const output: IValidationOutput = {
          from: 0,
          to: 5,
          inputString: "Example",
          annotation: "Annotation",
          validationId: "exampleHoverId",
          category: {
            id: "1",
            name: "cat",
            colour: "eeeeee"
          }
        };
        const localState = {
          ...state,
          decorations: new DecorationSet().add(
            tr.doc,
            createDecorationForValidationRange(output, true, false)
          ),
          hoverId: "exampleHoverId",
          hoverInfo: undefined
        };
        expect(
          reducer(tr, localState, newHoverIdReceived(undefined, undefined))
        ).toEqual({
          ...localState,
          decorations: new DecorationSet(),
          hoverId: undefined,
          hoverInfo: undefined
        });
      });
    });
    describe("handleNewDirtyRanges", () => {
      it("should remove any decorations and validations that touch the passed ranges", () => {
        const { state } = createInitialData();
        const currentValidations: IValidationOutput[] = [
          {
            validationId: "1",
            from: 1,
            to: 7,
            inputString: "Example",
            annotation: "Annotation",
            category: {
              id: "1",
              name: "cat",
              colour: "eeeeee"
            }
          }
        ];
        const stateWithCurrentValidationsAndDecorations = {
          ...state,
          currentValidations,
          decorations: getNewDecorationsForCurrentValidations(
            currentValidations,
            state.decorations,
            initialDocToValidate
          )
        };
        expect(
          reducer(
            new Transaction(initialDocToValidate),
            stateWithCurrentValidationsAndDecorations,
            applyNewDirtiedRanges([{ from: 1, to: 2 }])
          )
        ).toEqual({
          ...state,
          validationPending: true,
          dirtiedRanges: [{ from: 1, to: 2 }]
        });
      });
    });
    describe("selectValidation", () => {
      it("should apply the selected validation id", () => {
        const { state } = createInitialData();
        const otherState = {
          ...state,
          currentValidations: [
            {
              inputString: "example",
              from: 1,
              to: 1,
              annotation: "example",
              suggestions: [],
              category: {
                id: "1",
                name: "cat",
                colour: "eeeeee"
              },
              validationId: "exampleId"
            }
          ]
        };
        expect(
          reducer(
            new Transaction(createDoc),
            otherState,
            selectValidation("exampleId")
          )
        ).toEqual({
          ...otherState,
          selectedValidation: "exampleId"
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
  describe("selectors", () => {
    describe("selectValidationById", () => {
      it("should find the given validation by id", () => {
        expect(
          selectValidationById(
            {
              currentValidations: [
                {
                  validationId: "1"
                },
                {
                  validationId: "2"
                }
              ]
            } as any,
            "1"
          )
        ).toEqual({ validationId: "1" });
      });
      it("should return undefined if there is no validation", () => {
        expect(
          selectValidationById(
            {
              currentValidations: [
                {
                  validationId: "1"
                },
                {
                  validationId: "2"
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
        const input1 = createValidationInput(0, 5);
        const input2 = createValidationInput(10, 15);
        expect(
          selectValidationInFlightById(
            {
              validationsInFlight: getValidationsInFlight(validationSetId, [
                input1,
                input2
              ])
            } as any,
            validationSetId,
            input1.validationId
          )!.validationInput
        ).toEqual(input1);
      });
    });
    describe("selectNewValidationInFlight", () => {
      it("should find the new inflight validations given an old and a new state", () => {
        const { state } = createInitialData();
        const input1 = createValidationInput(0, 5);
        const input2 = createValidationInput(10, 15);
        expect(
          selectNewValidationInFlight(
            {
              ...state,
              validationsInFlight: getValidationsInFlight(validationSetId, [
                input1
              ])
            },
            {
              ...state,
              validationsInFlight: {
                ...getValidationsInFlight(validationSetId, [input1]),
                ...getValidationsInFlight("set-id-2", [input2])
              }
            }
          )
        ).toEqual([
          {
            validationSetId: "set-id-2",
            ...getValidationsInFlight("set-id-2", [input2])["set-id-2"]
          }
        ]);
      });
      it("shouldn't include validations missing in the new state but present in the old state", () => {
        const { state } = createInitialData();
        const input1 = createValidationInput(0, 5);
        const input2 = createValidationInput(10, 15);
        expect(
          selectNewValidationInFlight(
            {
              ...state,
              validationsInFlight: {
                ...getValidationsInFlight(validationSetId, [input1]),
                ...getValidationsInFlight("set-id-2", [input2])
              }
            },
            {
              ...state,
              validationsInFlight: getValidationsInFlight(validationSetId, [
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
        const currentValidations = [
          {
            validationId: "id",
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
            inputString: "hai"
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
            validationId: "id",
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
            inputString: "hai"
          }
        ];
        expect(
          selectSuggestionAndRange(
            {
              ...state,
              currentValidations
            },
            "id",
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
            "id",
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
        const input1 = createValidationInput(0, 5);
        const input2 = createValidationInput(10, 15);
        let state = {
          ...initialState,
          validationsInFlight: getValidationsInFlight(validationSetId, [
            input1,
            input2
          ])
        };
        expect(selectPercentRemaining(state)).toEqual(100);
        state = {
          ...initialState,
          validationsInFlight: getValidationsInFlight(
            validationSetId,
            [input1, input2],
            4
          )
        };
        expect(selectPercentRemaining(state)).toEqual(50);
      });
      it("should select the percentage remaining for multiple validation sets", () => {
        const { state: initialState } = createInitialData();
        const input1 = createValidationInput(0, 5);
        const input2 = createValidationInput(10, 15);
        const input3 = createValidationInput(10, 15);
        let state = {
          ...initialState,
          validationsInFlight: {
            ...getValidationsInFlight(validationSetId, [input1, input2]),
            ...getValidationsInFlight("set-id-2", [input3])
          }
        };
        expect(selectPercentRemaining(state)).toEqual(100);
        state = {
          ...initialState,
          validationsInFlight: {
            ...getValidationsInFlight(validationSetId, [input1, input2], 3),
            ...getValidationsInFlight("set-id-2", [input3], 3)
          }
        };
        expect(selectPercentRemaining(state)).toEqual(50);
      });
    });
  });
});
