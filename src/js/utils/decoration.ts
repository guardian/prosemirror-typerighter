import { Decoration, DecorationSet } from "prosemirror-view";
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

// Our decoration types.
export const DECORATION_VALIDATION = "DECORATION_VALIDATION";
export const DECORATION_DIRTY = "DECORATION_DIRTY";
export const DECORATION_INFLIGHT = "DECORATION_INFLIGHT";
export const DecorationClassMap = {
  [DECORATION_DIRTY]: "validation-dirty",
  [DECORATION_INFLIGHT]: "validation-inflight",
  [DECORATION_VALIDATION]: "validation-decoration"
};

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
export const createDecorationForValidationRange = (range: ValidationOutput) => {
  const decorationId = uuid();
  return [
    Decoration.inline(
      range.from,
      range.to,
      {
        class: DecorationClassMap[DECORATION_VALIDATION],
        "data-attr-validation-id": decorationId
      } as any,
      {
        type: DECORATION_VALIDATION
      } as any
    ),
    Decoration.widget(range.from, getWidgetNode(range), { decorationId } as any)
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
export const getWidgetNode = (range: ValidationOutput) => {
  const widget = document.createElement("span");
  widget.className = "validation-widget-container";

  const contentNode = document.createElement("span");
  contentNode.className = "validation-widget";
  widget.appendChild(contentNode);

  const labelNode = document.createElement("span");
  const labelTextNode = document.createTextNode(range.type);
  labelNode.appendChild(labelTextNode);
  labelNode.className = "validation-widget-label";
  contentNode.appendChild(labelNode);

  const textNode = document.createTextNode(range.annotation);
  contentNode.appendChild(textNode);

  return widget;
};
