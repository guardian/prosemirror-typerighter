import flatten from "lodash/flatten";
import { Node } from "prosemirror-model";
import { Decoration, DecorationSet } from "prosemirror-view";
import { IRange, IMatches } from "../interfaces/IValidation";

// Our decoration types.
export const DECORATION_VALIDATION = "DECORATION_VALIDATION";
export const DECORATION_VALIDATION_IS_SELECTED =
  "DECORATION_VALIDATION_IS_HOVERING";
export const DECORATION_VALIDATION_HEIGHT_MARKER =
  "DECORATION_VALIDATION_HEIGHT_MARKER";
export const DECORATION_DIRTY = "DECORATION_DIRTY";
export const DECORATION_INFLIGHT = "DECORATION_INFLIGHT";

export const DecorationClassMap = {
  [DECORATION_DIRTY]: "ValidationDebugDirty",
  [DECORATION_INFLIGHT]: "ValidationDebugInflight",
  [DECORATION_VALIDATION]: "ValidationDecoration",
  [DECORATION_VALIDATION_HEIGHT_MARKER]: "ValidationDecoration__height-marker",
  [DECORATION_VALIDATION_IS_SELECTED]: "ValidationDecoration--is-selected"
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

/**
 * Remove decorations from the given ranges. If decorations are found,
 * expand the search range to include their ranges, too.
 */
export const removeDecorationsFromRanges = (
  decorationSet: DecorationSet,
  ranges: IRange[],
  types = [DECORATION_VALIDATION, DECORATION_VALIDATION_HEIGHT_MARKER]
) =>
  ranges.reduce((acc, range) => {
    const predicate = (spec: { [key: string]: any }) =>
      types.indexOf(spec.type) !== -1;
    const decorations = decorationSet.find(range.from, range.to, predicate);
    if (!decorations.length) {
      return acc;
    }
    // Expand the range out to the range of the found decorations.
    const decorationsToRemove = flatten(
      decorations
        .map(decoration =>
          decorationSet.find(decoration.from, decoration.to, predicate)
        )
        .filter(_ => !!_)
    );
    return acc.remove(decorationsToRemove);
  }, decorationSet);

/**
 * Given a validation response and the current decoration set,
 * returns a new decoration set containing the new validations.
 */
export const getNewDecorationsForCurrentValidations = (
  outputs: IMatches[],
  decorationSet: DecorationSet,
  doc: Node
) => {
  // There are new validations available; apply them to the document.
  const decorationsToAdd = createDecorationsForValidationRanges(outputs);

  // Finally, we add the existing decorations to this new map.
  return decorationSet.add(doc, decorationsToAdd);
};

/**
 * Create a height marker element. Used to determine the height
 * of a single line of inline content, which is useful when we're
 * calculating where to place tooltips as the user hovers over multi-
 * line spans.
 */
const createHeightMarkerElement = (id: string) => {
  const element = document.createElement("span");
  element.setAttribute(DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID, id);
  element.className = DecorationClassMap[DECORATION_VALIDATION_HEIGHT_MARKER];
  return element;
};

/**
 * Create a validation decoration for the given range.
 */
export const createDecorationForValidationRange = (
  output: IMatches,
  isSelected = false,
  addHeightMarker = true
) => {
  const className = isSelected
    ? `${DecorationClassMap[DECORATION_VALIDATION]} ${
        DecorationClassMap[DECORATION_VALIDATION_IS_SELECTED]
      }`
    : DecorationClassMap[DECORATION_VALIDATION];
  const opacity = isSelected ? "30" : "07";
  const style = `background-color: #${
    output.category.colour
  }${opacity}; border-bottom: 2px solid #${output.category.colour}`;

  const decorationArray = [
    Decoration.inline(
      output.from,
      output.to,
      {
        class: className,
        style,
        [DECORATION_ATTRIBUTE_ID]: output.matchId
      } as any,
      {
        type: DECORATION_VALIDATION,
        id: output.matchId,
        categoryId: output.category.id,
        inclusiveStart: true
      } as any
    )
  ];

  return addHeightMarker
    ? [
        ...decorationArray,
        Decoration.widget(
          output.from,
          createHeightMarkerElement(output.matchId),
          {
            type: DECORATION_VALIDATION_HEIGHT_MARKER,
            id: output.matchId,
            categoryId: output.category.id
          } as any
        )
      ]
    : decorationArray;
};

export const createDecorationsForValidationRanges = (ranges: IMatches[]) =>
  flatten(ranges.map(_ => createDecorationForValidationRange(_)));

export const findSingleDecoration = (
  decorationSet: DecorationSet,
  predicate: (spec: any) => boolean
): Decoration | undefined => {
  const decorations = decorationSet.find(undefined, undefined, predicate);
  if (!decorations[0]) {
    return undefined;
  }
  return decorations[0];
};
