import flatten from "lodash/flatten";
import { Node } from "prosemirror-model";
import { Decoration, DecorationSet } from "prosemirror-view";
import { IRange, IValidationOutput, IValidationInput } from "../interfaces/IValidation";
import { IPluginState } from "../state";

// Our decoration types.
export const DECORATION_VALIDATION = "DECORATION_VALIDATION";
export const DECORATION_VALIDATION_IS_HOVERING =
  "DECORATION_VALIDATION_IS_HOVERING";
export const DECORATION_VALIDATION_HEIGHT_MARKER =
  "DECORATION_VALIDATION_HEIGHT_MARKER";
export const DECORATION_DIRTY = "DECORATION_DIRTY";
export const DECORATION_INFLIGHT = "DECORATION_INFLIGHT";

export const DecorationClassMap = {
  [DECORATION_DIRTY]: "ValidationDebugDirty",
  [DECORATION_INFLIGHT]: "ValidationDebugInflight",
  [DECORATION_VALIDATION]: "ValidationDecoration",
  [DECORATION_VALIDATION_IS_HOVERING]: "ValidationDecoration--is-hovering"
};

export const DECORATION_ATTRIBUTE_ID = "data-validation-id";
export const DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID = "data-height-marker-id";

export const createDebugDecorationFromRange = (range: IRange, dirty = true) => {
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

export const removeDecorationsFromRanges = (
  decorations: DecorationSet,
  ranges: IRange[],
  types = [DECORATION_VALIDATION]
) =>
  ranges.reduce((acc, range) => {
    const decorationsToRemove = decorations.find(
      range.from,
      range.to,
      spec => types.indexOf(spec.type) !== -1
    );
    return acc.remove(decorationsToRemove);
  }, decorations);

/**
 * Given a validation response and the current decoration set,
 * returns a new decoration set containing the new validations.
 */
export const getNewDecorationsForCurrentValidations = (
  outputs: IValidationOutput[],
  decorationSet: DecorationSet,
  doc: Node
) => {
  // Remove existing validations for the ranges
  const newDecorationSet = removeDecorationsFromRanges(decorationSet, outputs);

  // There are new validations available; apply them to the document.
  const decorationsToAdd = createDecorationsForValidationRanges(outputs);

  // Finally, we add the existing decorations to this new map.
  return newDecorationSet.add(doc, decorationsToAdd);
};

/**
 * Create a height marker DOM node. Used to determine the height
 * of a single line of inline content, which is useful when we're
 * calculating where to place tooltips as the user hovers over multi-
 * line spans.
 */
const createHeightMarkerNode = (id: string) => {
  const node = document.createElement("span");
  node.setAttribute(DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID, id);
  return node;
};

/**
 * Create a validation decoration for the given range.
 */
export const createDecorationForValidationRange = (
  output: IValidationOutput,
  isHovering = false,
  addHeightMarker = true
) => {
  const className = isHovering
    ? `${DecorationClassMap[DECORATION_VALIDATION]} ${
        DecorationClassMap[DECORATION_VALIDATION_IS_HOVERING]
      }`
    : DecorationClassMap[DECORATION_VALIDATION];
  const decorationArray = [
    Decoration.inline(
      output.from,
      output.to,
      {
        class: className,
        [DECORATION_ATTRIBUTE_ID]: output.id
      } as any,
      {
        type: DECORATION_VALIDATION,
        id: output.id,
        inclusiveStart: true
      } as any
    )
  ];
  return addHeightMarker
    ? [
        ...decorationArray,
        Decoration.widget(output.from, createHeightMarkerNode(output.id), {
          type: DECORATION_VALIDATION_HEIGHT_MARKER,
          id: output.id
        } as any)
      ]
    : decorationArray;
};

export const createDecorationsForValidationRanges = (
  ranges: IValidationOutput[]
) => flatten(ranges.map(_ => createDecorationForValidationRange(_)));

export const findSingleDecoration = (
  state: IPluginState,
  predicate: (spec: any) => boolean
): Decoration | undefined => {
  const decorations = state.decorations.find(undefined, undefined, predicate);
  if (!decorations[0]) {
    return undefined;
  }
  return decorations[0];
};
