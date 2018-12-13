import { Transaction } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import { IPluginState, selectValidation, setDebugState } from "../state";
import {
  newHoverIdReceived,
  selectValidationById,
  validationPluginReducer,
  validationRequestError,
  validationRequestForDirtyRanges,
  validationRequestSuccess
} from "../state";
import { createDebugDecorationFromRange } from "../utils/decoration";
import { expandRangesToParentBlockNode } from "../utils/range";
import { doc, p } from './helpers/prosemirror';

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
  validationInFlight: undefined,
  validationPending: false,
  error: undefined
};

describe("State management", () => {
  describe("Action handlers", () => {
    describe("validationRequestStart", () => {
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
          validationInFlight: {
            validationInputs: [
              {
                str: "Example text to validate",
                from: 1,
                to: 25
              }
            ],
            id: 1337
          }
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
          validationInFlight: {
            validationInputs: [
              {
                str: "Example text to validate",
                from: 1,
                to: 25
              }
            ],
            id: 1337
          }
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
              validationInput: {
                str: "hai",
                from: 0,
                to: 25
              },
              id: "1337"
            })
          )
        ).toEqual(initialState);
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
              validationInput: {
                str: "Example text to validate",
                from: 5,
                to: 10
              },
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
    });
    describe("validationRequestError", () => {
      it("Should re-add the in-flight validation ranges as dirty ranges, and remove the inflight validation", () => {
        expect(
          validationPluginReducer(
            initialTr,
            {
              ...initialState,
              validationInFlight: {
                validationInputs: [
                  {
                    str: "Example text to validate",
                    from: 1,
                    to: 25
                  }
                ],
                id: 1337
              }
            },
            validationRequestError({
              validationInput: {
                str: "Example text to validate",
                from: 1,
                to: 25
              },
              id: 1337,
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
  });
});
