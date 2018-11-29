import { Decoration, DecorationSet } from "prosemirror-view";
import DecorationComponent, {
  DecorationComponentProps
} from "../components/Decoration";
import {
  Range,
  ValidationOutput
} from "../interfaces/Validation";
import flatten from "lodash/flatten";
import { PluginState } from "..";
import { render, h } from "preact";
import { Node } from "prosemirror-model";

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
export const getNewDecorationsForCurrentValidations = (
  outputs: ValidationOutput[],
  decorationSet: DecorationSet,
  doc: Node
) => {
  // Remove existing validations for the ranges
  let newDecorationSet = removeValidationDecorationsFromRanges(
    decorationSet,
    outputs
  );

  // There are new validations available; apply them to the document.
  const decorationsToAdd = getDecorationsForValidationRanges(outputs);

  // Finally, we add the existing decorations to this new map.
  return newDecorationSet.add(doc, decorationsToAdd);
};

/**
 * Create a validation decoration for the given range.
 */
export const createDecorationForValidationRange = (
  output: ValidationOutput
) => {
  return [
    Decoration.inline(
      output.from,
      output.to,
      {
        class: DecorationClassMap[DECORATION_VALIDATION],
        [DECORATION_ATTRIBUTE_ID]: output.id
      } as any,
      {
        type: DECORATION_VALIDATION,
        inclusiveStart: true
      } as any
    )
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
