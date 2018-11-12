import { Decoration, DecorationSet } from "prosemirror-view";
import DecorationComponent, {
  DecorationComponentProps
} from "../components/Decoration";
import {
  Range,
  ValidationResponse,
  ValidationOutput
} from "../interfaces/Validation";
import { Transaction } from "prosemirror-state";
import uuid from "uuid/v4";
import flatten from "lodash/flatten";
import { PluginState } from "..";
import { mapRangeThroughTransactions } from "./range";
import { render, h } from "preact";

// Our decoration types.
export const DECORATION_VALIDATION = "DECORATION_VALIDATION";
export const DECORATION_DIRTY = "DECORATION_DIRTY";
export const DECORATION_INFLIGHT = "DECORATION_INFLIGHT";

export const DecorationClassMap = {
  [DECORATION_DIRTY]: "ValidationDebugDirty",
  [DECORATION_INFLIGHT]: "ValidationDebugInflight",
  [DECORATION_VALIDATION]: "ValidationDecoration"
};

const DECORATION_ATTRIBUTE_ID = "data-attr-validation-id";

export const createDebugDecorationFromRange = (range: Range, dirty = true) => {
  const type = dirty ? DECORATION_DIRTY : DECORATION_INFLIGHT;
  return Decoration.inline(
    range.from,
    range.to + 1,
    {
      class: DecorationClassMap[type]
    },
    {
      type
    } as any
  );
};

export const removeValidationDecorationsFromRanges = (
  decorations: DecorationSet,
  ranges: Range[],
  type = DECORATION_VALIDATION
) =>
  ranges.reduce((acc, range) => {
    const decorationsToRemove = decorations.find(
      range.from,
      range.to,
      spec => spec.type === type
    );
    return acc.remove(decorationsToRemove);
  }, decorations);

/**
 * Given a validation response and the current decoration set,
 * returns a new decoration set containing the new validations.
 */
export const getNewDecorationsForValidationResponse = (
  response: ValidationResponse,
  decorationSet: DecorationSet,
  trs: Transaction[],
  currentTr: Transaction
) => {
  const initialTransaction = trs.find(tr => tr.time === parseInt(response.id));
  if (!initialTransaction && trs.length > 1) {
    return decorationSet;
  }
  const newRanges = mapRangeThroughTransactions(
    response.validationOutputs,
    parseInt(response.id),
    trs
  );

  // Remove existing validations for the ranges
  let newDecorationSet = removeValidationDecorationsFromRanges(
    decorationSet,
    newRanges
  );

  // There are new validations available; apply them to the document.
  const decorationsToAdd = getDecorationsForValidationRanges(newRanges);

  // Finally, we add the existing decorations to this new map.
  return newDecorationSet.add(currentTr.doc, decorationsToAdd);
};

/**
 * Create a validation decoration for the given range.
 */
export const createDecorationForValidationRange = (output: ValidationOutput) => {
  const decorationId = uuid();
  return [
    Decoration.inline(
      output.from,
      output.to,
      {
        class: DecorationClassMap[DECORATION_VALIDATION],
        [DECORATION_ATTRIBUTE_ID]: decorationId
      } as any,
      {
        type: DECORATION_VALIDATION,
        inclusiveStart: true
      } as any
    ),
    Decoration.widget(output.from, getWidgetNode(output, decorationId), {
      decorationId
    } as any)
  ];
};

export const getDecorationsForValidationRanges = (ranges: ValidationOutput[]) =>
  flatten(ranges.map(createDecorationForValidationRange));

export const findSingleDecoration = (
  state: PluginState,
  predicate: (spec: any) => boolean
): Decoration | undefined => {
  const decorations = state.decorations.find(undefined, undefined, predicate);
  if (!decorations[0]) {
    return undefined;
  }
  return decorations[0];
};

/**
 * Get a widget DOM node given a validation range.
 */
export const getWidgetNode = (validationOutput: ValidationOutput, id: string) => {
  const widget = document.createElement("span");
  widget.setAttribute(DECORATION_ATTRIBUTE_ID, id);
  render(
    h<DecorationComponentProps>(DecorationComponent, {
      type: validationOutput.type,
      annotation: validationOutput.annotation,
      suggestions: validationOutput.suggestions,
      applySuggestion: suggestion => console.log("apply", suggestion)
    }),
    widget
  );

  return widget;
};
