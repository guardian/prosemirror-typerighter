import { Transaction } from "prosemirror-state";
import { DecorationSet, Decoration } from "prosemirror-view";
import {
  IPluginState,
  selectValidation,
  setDebugState,
  selectValidationInFlightById,
  selectNewValidationInFlight,
  applyNewDirtiedRanges,
  selectSuggestionAndRange
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
  getNewDecorationsForCurrentValidations
} from "../utils/decoration";
import { expandRangesToParentBlockNode } from "../utils/range";
import { doc, p } from "./helpers/prosemirror";
import { Mapping } from "prosemirror-transform";
import { IValidationOutput } from "../interfaces/IValidation";

jest.mock("uuid/v4", () => () => "uuid");

const initialDocToValidate = doc(p("Example text to validate"));
const initialTr = new Transaction(initialDocToValidate);
initialTr.doc = initialDocToValidate;
initialTr.time = 0;
const initialState: IPluginState = {
  debug: false,
  currentThrottle: 100,
  initialThrottle: 100,
  maxThrottle: 1000,
  decorations: DecorationSet.create(doc, []),
  dirtiedRanges: [],
  currentValidations: [],
  selectedValidation: undefined,
  hoverId: undefined,
  hoverInfo: undefined,
  trHistory: [initialTr],
  validationsInFlight: [],
  validationPending: false,
  error: undefined
};

describe("State management", () => {
  describe("Action handlers", () => {
    describe("validationRequestForDirtyRanges", () => {
      it("should remove the pending status and any dirtied ranges, and mark the validation as in flight", () => {
        const docToValidate = doc(p("Example text to validate"));
        const tr = new Transaction(docToValidate);
        tr.doc = docToValidate;
        tr.time = 1337;
        expect(
          validationPluginReducer(
            tr,
            {
              ...initialState,
              debug: true,
              dirtiedRanges: [{ from: 5, to: 10 }],
              validationPending: true
            },
            validationRequestForDirtyRanges(expandRangesToParentBlockNode)
          )
        ).toEqual({
          ...initialState,
          debug: true,
          dirtiedRanges: [],
          decorations: new DecorationSet().add(docToValidate, [
            createDebugDecorationFromRange({ from: 1, to: 25 }, false)
          ]),
          validationPending: false,
          validationsInFlight: [
            {
              validationInput: {
                str: "Example text to validate",
                from: 1,
                to: 25
              },
              id: "1337",
              mapping: new Mapping()
            }
          ]
        });
      });
      it("should remove debug decorations, if any", () => {
        const docToValidate = doc(p("Example text to validate"));
        const tr = new Transaction(docToValidate);
        tr.doc = docToValidate;
        tr.time = 1337;
        expect(
          validationPluginReducer(
            tr,
            {
              ...initialState,
              debug: true,
              dirtiedRanges: [{ from: 5, to: 10 }],
              decorations: new DecorationSet().add(docToValidate, [
                createDebugDecorationFromRange({ from: 1, to: 3 })
              ]),
              validationPending: true
            },
            validationRequestForDirtyRanges(expandRangesToParentBlockNode)
          )
        ).toEqual({
          ...initialState,
          debug: true,
          dirtiedRanges: [],
          decorations: new DecorationSet().add(docToValidate, [
            createDebugDecorationFromRange({ from: 1, to: 25 }, false)
          ]),
          validationPending: false,
          validationsInFlight: [
            {
              validationInput: {
                str: "Example text to validate",
                from: 1,
                to: 25
              },
              id: "1337",
              mapping: new Mapping()
            }
          ]
        });
      });
    });
    describe("validationRequestSuccess", () => {
      it("shouldn't do anything if there's nothing in the response", () => {
        expect(
          validationPluginReducer(
            initialTr,
            initialState,
            validationRequestSuccess({
              validationOutputs: [],
              id: "1337"
            })
          )
        ).toEqual(initialState);
      });
      it("should add incoming validations to the state", () => {
        let state = validationPluginReducer(
          initialTr,
          initialState,
          applyNewDirtiedRanges([{ from: 1, to: 3 }])
        );
        state = validationPluginReducer(
          initialTr,
          state,
          validationRequestForDirtyRanges(expandRangesToParentBlockNode)
        );
        expect(
          validationPluginReducer(
            initialTr,
            state,
            validationRequestSuccess({
              validationOutputs: [
                {
                  from: 1,
                  to: 3,
                  type: "type",
                  annotation: "annotation",
                  str: "str",
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
            str: "str",
            to: 3,
            type: "type"
          }
        ]);
      });
      it("should create decorations for the incoming validations", () => {
        const docToValidate = doc(p("Example text to validate"));
        const tr = new Transaction(docToValidate);
        tr.doc = docToValidate;
        tr.time = 1337;
        expect(
          validationPluginReducer(
            tr,
            initialState,
            validationRequestSuccess({
              validationOutputs: [
                {
                  id: "id",
                  str: "Example text to validate",
                  from: 5,
                  to: 10,
                  annotation: "Summat ain't right",
                  type: "EXAMPLE_TYPE"
                }
              ],
              id: "1337"
            })
          )
        ).toMatchSnapshot();
      });
      it("should not apply validations if the ranges they apply to have since been dirtied", () => {
        let state = validationPluginReducer(
          initialTr,
          initialState,
          applyNewDirtiedRanges([{ from: 1, to: 3 }])
        );
        state = validationPluginReducer(
          initialTr,
          state,
          validationRequestForDirtyRanges(expandRangesToParentBlockNode)
        );
        state = validationPluginReducer(
          initialTr,
          state,
          applyNewDirtiedRanges([{ from: 1, to: 3 }])
        );
        expect(
          validationPluginReducer(
            initialTr,
            state,
            validationRequestSuccess({
              validationOutputs: [
                {
                  from: 1,
                  to: 3,
                  type: "type",
                  annotation: "annotation",
                  str: "str",
                  id: "0"
                }
              ],
              id: "0"
            })
          )
        ).toEqual({
          ...initialState,
          dirtiedRanges: [{ from: 1, to: 3 }],
          currentValidations: [],
          validationPending: true
        });
      });
    });
    describe("validationRequestError", () => {
      it("Should re-add the in-flight validation ranges as dirty ranges, and remove the inflight validation", () => {
        expect(
          validationPluginReducer(
            initialTr,
            {
              ...initialState,
              validationsInFlight: [
                {
                  validationInput: {
                    str: "Example text to validate",
                    from: 1,
                    to: 25
                  },
                  id: "1337",
                  mapping: new Mapping()
                }
              ]
            },
            validationRequestError({
              validationInput: {
                str: "Example text to validate",
                from: 1,
                to: 25
              },
              id: "1337",
              message: "Too many requests"
            })
          )
        ).toEqual({
          ...initialState,
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
        expect(
          validationPluginReducer(
            new Transaction(doc),
            initialState,
            newHoverIdReceived("exampleHoverId", undefined)
          )
        ).toEqual({
          ...initialState,
          hoverId: "exampleHoverId",
          hoverInfo: undefined
        });
      });
    });
    describe("handleNewDirtyRanges", () => {
      it("should remove any decorations and validations that touch the passed ranges", () => {
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
          ...initialState,
          currentValidations,
          decorations: getNewDecorationsForCurrentValidations(
            currentValidations,
            initialState.decorations,
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
          ...initialState,
          validationPending: true,
          dirtiedRanges: [{ from: 1, to: 2 }]
        });
      });
    });
    describe("selectValidation", () => {
      it("should apply the selected validation id", () => {
        const otherState = {
          ...initialState,
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
            new Transaction(doc),
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
        expect(
          validationPluginReducer(
            new Transaction(doc),
            initialState,
            setDebugState(true)
          )
        ).toEqual({ ...initialState, debug: true });
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
      it("should select a suggestion and the range it should be applied to, given a validation id and suggestion index", () => {
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
              ...initialState,
              currentValidations
            },
            "id",
            0
          )
        ).toEqual({ from: 0, to: 5, suggestion: "example" });
        expect(
          selectSuggestionAndRange(
            {
              ...initialState,
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
