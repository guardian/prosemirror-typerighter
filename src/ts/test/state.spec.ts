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
  createValidationPluginReducer,
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

jest.mock("uuid/v4", () => () => "uuid");

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
        expect(reducer(tr, state, validationRequestForDocument())).toEqual({
          ...state,
          validationsInFlight: [
            {
              id: "0",
              mapping: {
                from: 0,
                maps: [],
                mirror: undefined,
                to: 0
              },
              validationInput: {
                from: 1,
                inputString: "Example text to validate",
                to: 26
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
          reducer(
            tr,
            {
              ...state,
              debug: true,
              dirtiedRanges: [{ from: 5, to: 10 }],
              validationPending: true
            },
            validationRequestForDirtyRanges()
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
                inputString: "Example text to validate",
                from: 1,
                to: 25
              },
              id: "0",
              mapping: new Mapping()
            }
          ]
        });
      });
      it("should remove debug decorations, if any", () => {
        const { state, tr } = createInitialData();
        expect(
          reducer(
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
            validationRequestForDirtyRanges()
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
                inputString: "Example text to validate",
                from: 1,
                to: 25
              },
              id: "0",
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
          reducer(
            tr,
            state,
            validationRequestSuccess({
              validationOutputs: [],
              id: "0"
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
        localState = reducer(tr, localState, validationRequestForDirtyRanges());
        expect(
          reducer(
            tr,
            localState,
            validationRequestSuccess({
              validationOutputs: [
                {
                  from: 1,
                  to: 3,
                  type: "type",
                  annotation: "annotation",
                  inputString: "str",
                  id: "0"
                }
              ],
              id: "0"
            })
          ).currentValidations
        ).toMatchObject([
          {
            annotation: "annotation",
            from: 1,
            id: "0",
            inputString: "str",
            to: 3,
            type: "type"
          }
        ]);
      });
      it("should create decorations for the incoming validations", () => {
        const { state, tr } = createInitialData();
        expect(
          reducer(
            tr,
            state,
            validationRequestSuccess({
              validationOutputs: [
                {
                  id: "id",
                  inputString: "Example text to validate",
                  from: 5,
                  to: 10,
                  annotation: "Summat ain't right",
                  type: "EXAMPLE_TYPE"
                }
              ],
              id: "0"
            })
          )
        ).toMatchSnapshot();
      });
      it("should not apply validations if the ranges they apply to have since been dirtied", () => {
        const { state, tr } = createInitialData(initialDocToValidate, 1337);
        let localState = reducer(
          tr,
          state,
          applyNewDirtiedRanges([{ from: 1, to: 3 }])
        );
        localState = reducer(tr, localState, validationRequestForDirtyRanges());
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
              validationOutputs: [
                {
                  from: 1,
                  to: 3,
                  type: "type",
                  annotation: "annotation",
                  inputString: "str",
                  id: "0"
                }
              ],
              id: "0"
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
          reducer(
            tr,
            {
              ...state,
              validationsInFlight: [
                {
                  validationInput: {
                    inputString: "Example text to validate",
                    from: 1,
                    to: 25
                  },
                  id: "0",
                  mapping: new Mapping()
                }
              ]
            },
            validationRequestError({
              validationInput: {
                inputString: "Example text to validate",
                from: 1,
                to: 25
              },
              id: "0",
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
          type: "Type",
          id: "exampleHoverId"
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
            id: "1",
            from: 1,
            to: 7,
            inputString: "Example",
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
              type: "example",
              id: "exampleId"
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
    });
    describe("selectNewValidationInFlight", () => {
      it("should find the new inflight validations given an old and a new state", () => {
        expect(
          selectNewValidationInFlight(
            {
              validationsInFlight: [
                {
                  id: "1"
                },
                {
                  id: "2"
                }
              ]
            } as any,
            {
              validationsInFlight: [
                {
                  id: "1"
                },
                {
                  id: "2"
                },
                {
                  id: "3"
                },
                {
                  id: "4"
                }
              ]
            } as any
          )
        ).toEqual([
          {
            id: "1"
          },
          {
            id: "2"
          }
        ]);
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
            id: "id",
            from: 0,
            to: 5,
            suggestions: ["example", "suggestion"],
            annotation: "Annotation",
            type: "Type",
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
