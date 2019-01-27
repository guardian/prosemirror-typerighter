import { Transaction } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import {
  selectValidation,
  setDebugState,
  selectValidationInFlightById,
  selectNewValidationInFlight,
  applyNewDirtiedRanges,
  selectSuggestionAndRange,
  validationRequestForDocument
} from "../state";
import {
  newHoverIdReceived,
  selectValidationById,
  validationPluginReducer,
  validationRequestError,
  validationRequestForDirtyRanges,
  validationRequestSuccess
} from "../state";
import {
  createDebugDecorationFromRange,
  getNewDecorationsForCurrentValidations,
  createDecorationForValidationRange
} from "../utils/decoration";
import { expandRangesToParentBlockNode } from "../utils/range";
import { createDoc, p } from "./helpers/prosemirror";
import { Mapping } from "prosemirror-transform";
import { IValidationOutput } from "../interfaces/IValidation";
import {
  createValidationOutput,
  createValidationInput
} from "./helpers/fixtures";

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
      validationsInFlight: [],
      validationPending: false,
      error: undefined
    }
  };
};

describe("State management", () => {
  describe("Action handlers", () => {
    describe("No action", () => {
      it("should just return the state", () => {
        const { state, tr } = createInitialData();
        expect(validationPluginReducer(tr, state)).toEqual(state);
      });
    });
    describe("Unknown action", () => {
      const { state, tr } = createInitialData();
      expect(
        validationPluginReducer(tr, state, { type: "UNKNOWN_ACTION" } as any)
      ).toEqual(state);
    });
    describe("validationRequestForDocument", () => {
      it("should apply dirty ranges for the entire doc", () => {
        const { state, tr } = createInitialData();
        expect(
          validationPluginReducer(tr, state, validationRequestForDocument())
        ).toEqual({
          ...state,
          validationsInFlight: [
            {
              mapping: new Mapping(),
              validationInput: {
                from: 1,
                str: "Example text to validate",
                to: 26,
                id: "0-from:1-to:26"
              }
            }
          ]
        });
      });
    });
    describe("validationRequestForDirtyRanges", () => {
      it("should remove the pending status and any dirtied ranges, and mark the validation as in flight", () => {
        const { state, tr } = createInitialData();
        expect(
          validationPluginReducer(
            tr,
            {
              ...state,
              debug: true,
              dirtiedRanges: [{ from: 5, to: 10 }],
              validationPending: true
            },
            validationRequestForDirtyRanges(expandRangesToParentBlockNode)
          )
        ).toEqual({
          ...state,
          debug: true,
          dirtiedRanges: [],
          decorations: new DecorationSet().add(tr.doc, [
            createDebugDecorationFromRange({ from: 1, to: 25 }, false)
          ]),
          validationPending: false,
          validationsInFlight: [
            {
              validationInput: {
                str: "Example text to validate",
                from: 1,
                to: 25,
                id: "0-from:1-to:25"
              },
              mapping: new Mapping()
            }
          ]
        });
      });
      it("should remove debug decorations, if any", () => {
        const { state, tr } = createInitialData();
        expect(
          validationPluginReducer(
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
            validationRequestForDirtyRanges(expandRangesToParentBlockNode)
          )
        ).toEqual({
          ...state,
          debug: true,
          dirtiedRanges: [],
          decorations: new DecorationSet().add(tr.doc, [
            createDebugDecorationFromRange({ from: 1, to: 25 }, false)
          ]),
          validationPending: false,
          validationsInFlight: [
            {
              validationInput: createValidationInput(
                1,
                25,
                "Example text to validate"
              ),
              mapping: new Mapping()
            }
          ]
        });
      });
    });
    describe("validationRequestSuccess", () => {
      it("shouldn't do anything if there's nothing in the response", () => {
        const { state, tr } = createInitialData();
        expect(
          validationPluginReducer(
            tr,
            state,
            validationRequestSuccess({
              validationOutputs: [],
              validationInput: createValidationInput(0, 25)
            })
          )
        ).toEqual(state);
      });
      it("should add incoming validations to the state", () => {
        const { state, tr } = createInitialData();
        let localState = validationPluginReducer(
          tr,
          state,
          applyNewDirtiedRanges([{ from: 1, to: 3 }])
        );
        localState = validationPluginReducer(
          tr,
          localState,
          validationRequestForDirtyRanges(expandRangesToParentBlockNode)
        );
        expect(
          validationPluginReducer(
            tr,
            localState,
            validationRequestSuccess({
              validationOutputs: [createValidationOutput(1, 25)],
              validationInput: createValidationInput(1, 25)
            })
          ).currentValidations
        ).toMatchObject([createValidationOutput(1, 25)]);
      });
      it("should create decorations for the incoming validations", () => {
        const { state, tr } = createInitialData();
        expect(
          validationPluginReducer(
            tr,
            state,
            validationRequestSuccess({
              validationOutputs: [createValidationOutput(5, 10)],
              validationInput: createValidationInput(5, 10)
            })
          )
        ).toMatchSnapshot();
      });
      it("should remove decorations that no longer apply to the validated range", () => {
        const { state, tr } = createInitialData();
        const validationInput = createValidationInput(
          0,
          26,
          "Example text to validate"
        );
        const validationOutput = createValidationOutput(1, 7, "Example");
        const incomingValidationOutput = createValidationOutput(
          5,
          10,
          "Example text to validate"
        );
        expect(
          validationPluginReducer(
            tr,
            {
              ...state,
              validationsInFlight: [
                {
                  mapping: new Mapping(),
                  validationInput
                }
              ],
              currentValidations: [validationOutput],
              decorations: new DecorationSet().add(
                initialDocToValidate,
                createDecorationForValidationRange(validationOutput)
              )
            },
            validationRequestSuccess({
              validationOutputs: [incomingValidationOutput],
              validationInput
            })
          )
        ).toMatchObject({
          currentValidations: [incomingValidationOutput],
          decorations: new DecorationSet().add(
            initialDocToValidate,
            createDecorationForValidationRange(incomingValidationOutput)
          )
        });
      });
      it("should not apply validations if the ranges they apply to have since been dirtied", () => {
        const { state, tr } = createInitialData(initialDocToValidate, 1337);
        let localState = validationPluginReducer(
          tr,
          state,
          applyNewDirtiedRanges([{ from: 1, to: 3 }])
        );
        localState = validationPluginReducer(
          tr,
          localState,
          validationRequestForDirtyRanges(expandRangesToParentBlockNode)
        );
        localState = validationPluginReducer(
          tr,
          localState,
          applyNewDirtiedRanges([{ from: 1, to: 3 }])
        );
        expect(
          validationPluginReducer(
            tr,
            localState,
            validationRequestSuccess({
              validationOutputs: [createValidationOutput(1, 3)],
              validationInput: createValidationInput(1, 3)
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
        const { state, tr } = createInitialData();
        expect(
          validationPluginReducer(
            tr,
            {
              ...state,
              validationsInFlight: [
                {
                  validationInput: createValidationInput(
                    1,
                    25,
                    "Example text to validate"
                  ),
                  mapping: new Mapping()
                }
              ]
            },
            validationRequestError({
              validationInput: createValidationInput(
                1,
                25,
                "Example text to validate"
              ),
              message: "Too many requests"
            })
          )
        ).toEqual({
          ...state,
          dirtiedRanges: [
            {
              from: 1,
              to: 25
            }
          ],
          decorations: new DecorationSet().add(initialDocToValidate, [
            createDebugDecorationFromRange({ from: 1, to: 25 })
          ]),
          error: "Too many requests",
          validationInFlight: undefined
        });
      });
    });
    describe("newHoverIdReceived", () => {
      it("should update the hover id", () => {
        const { state } = createInitialData();
        expect(
          validationPluginReducer(
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
          str: "Example",
          annotation: "Annotation",
          type: "Type",
          id: "exampleHoverId"
        };
        const localState = { ...state, currentValidations: [output] };
        expect(
          validationPluginReducer(
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
          str: "Example",
          annotation: "Annotation",
          type: "Type",

          id: "exampleHoverId"
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
          validationPluginReducer(
            tr,
            localState,
            newHoverIdReceived(undefined, undefined)
          )
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
            id: "1",
            from: 1,
            to: 7,
            str: "Example",
            annotation: "Annotation",
            type: "Type"
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
          validationPluginReducer(
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
              str: "example",
              from: 1,
              to: 1,
              annotation: "example",
              suggestions: [],
              type: "example",
              id: "exampleId"
            }
          ]
        };
        expect(
          validationPluginReducer(
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
          validationPluginReducer(
            new Transaction(createDoc),
            state,
            setDebugState(true)
          )
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
                  id: "1"
                },
                {
                  id: "2"
                }
              ]
            } as any,
            "1"
          )
        ).toEqual({ id: "1" });
      });
      it("should return undefined if there is no validation", () => {
        expect(
          selectValidationById(
            {
              currentValidations: [
                {
                  id: "1"
                },
                {
                  id: "2"
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
        expect(
          selectValidationInFlightById(
            {
              validationsInFlight: [
                {
                  validationInput: { id: "1" }
                },
                {
                  validationInput: { id: "2" }
                }
              ]
            } as any,
            "1"
          )
        ).toEqual({ validationInput: { id: "1" } });
      });
    });
    describe("selectNewValidationInFlight", () => {
      it("should find the new inflight validations given an old and a new state", () => {
        expect(
          selectNewValidationInFlight(
            {
              validationsInFlight: [
                {
                  validationInput: { id: "1" }
                },
                {
                  validationInput: { id: "2" }
                }
              ]
            } as any,
            {
              validationsInFlight: [
                {
                  validationInput: { id: "1" }
                },
                {
                  validationInput: { id: "2" }
                },

                {
                  validationInput: { id: "3" }
                },
                {
                  validationInput: { id: "4" }
                }
              ]
            } as any
          )
        ).toEqual([
          {
            validationInput: { id: "3" }
          },
          {
            validationInput: { id: "4" }
          }
        ]);
      });
      it("shouldn't include validations missing in the new state but present in the old state", () => {
        expect(
          selectNewValidationInFlight(
            {
              validationsInFlight: [
                {
                  validationInput: { id: "1" }
                },
                {
                  validationInput: { id: "2" }
                },
                {
                  validationInput: { id: "3" }
                }
              ]
            } as any,
            {
              validationsInFlight: [
                {
                  validationInput: { id: "1" }
                },
                {
                  validationInput: { id: "2" }
                }
              ]
            } as any
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
            id: "id",
            from: 0,
            to: 5,
            suggestions: ["example", "suggestion"],
            annotation: "Annotation",
            type: "Type",
            str: "hai"
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
            id: "id",
            from: 0,
            to: 5,
            suggestions: ["example", "suggestion"],
            annotation: "Annotation",
            type: "Type",
            str: "hai"
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
        ).toEqual({ from: 0, to: 5, suggestion: "example" });
        expect(
          selectSuggestionAndRange(
            {
              ...state,
              currentValidations
            },
            "id",
            1
          )
        ).toEqual({ from: 0, to: 5, suggestion: "suggestion" });
      });
    });
  });
});
