import flatten from "lodash/flatten";
import { Node } from "prosemirror-model";
import { Decoration, DecorationSet } from "prosemirror-view";
import { IRange, IMatch } from "../interfaces/IMatch";

export enum MatchType {
  HAS_REPLACEMENT = "HAS_REPLACEMENT",
  DEFAULT = "DEFAULT",
  CORRECT = "CORRECT"
}

export interface IMatchTypeToColourMap {
  hasSuggestion: string;
  hasSuggestionOpacity: string;
  default: string;
  defaultOpacity: string;
  correct: string;
  correctOpacity: string;
}

export const defaultMatchColours = {
  hasSuggestion: "#d90000",
  hasSuggestionOpacity: "FF",
  default: "#ffa500",
  defaultOpacity: "AD",
  correct: "#228816",
  correctOpacity: "FF"
};

// Our decoration types.
export const DECORATION_MATCH = "DECORATION_MATCH";
export const DECORATION_MATCH_IS_SELECTED = "DECORATION_MATCH_IS_HOVERING";
export const DECORATION_MATCH_HEIGHT_MARKER = "DECORATION_MATCH_HEIGHT_MARKER";
export const DECORATION_DIRTY = "DECORATION_DIRTY";
export const DECORATION_INFLIGHT = "DECORATION_INFLIGHT";

export const DecorationClassMap = {
  [DECORATION_DIRTY]: "MatchDebugDirty",
  [DECORATION_INFLIGHT]: "MatchDebugInflight",
  [DECORATION_MATCH]: "MatchDecoration",
  [DECORATION_MATCH_HEIGHT_MARKER]: "MatchDecoration__height-marker",
  [DECORATION_MATCH_IS_SELECTED]: "MatchDecoration--is-selected"
};

export const DECORATION_ATTRIBUTE_ID = "data-match-id";
export const DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID = "data-height-marker-id";
export const DECORATION_ATTRIBUTE_IS_CORRECT_ID = "data-is-correct-id";

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
  types = [DECORATION_MATCH, DECORATION_MATCH_HEIGHT_MARKER]
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
 * Given a matcher response and the current decoration set,
 * returns a new decoration set containing the new matches.
 */
export const getNewDecorationsForCurrentMatches = (
  outputs: IMatch[],
  decorationSet: DecorationSet,
  doc: Node,
  matchColours: IMatchTypeToColourMap = defaultMatchColours
) => {
  const decorationsToAdd = createDecorationsForMatches(outputs, matchColours);

  return decorationSet.add(doc, decorationsToAdd);
};

/**
 * Create decorations for the given match.
 */
export const createDecorationsForMatch = (
  match: IMatch,
  matchColours: IMatchTypeToColourMap = defaultMatchColours,
  isSelected = false
) => {
  const className = isSelected
    ? `${DecorationClassMap[DECORATION_MATCH]} ${DecorationClassMap[DECORATION_MATCH_IS_SELECTED]}`
    : DecorationClassMap[DECORATION_MATCH];

  const { backgroundColour, borderColour } = getColourForMatch(
    match,
    matchColours,
    isSelected
  );
  const style = `background-color: ${backgroundColour}; border-bottom: 2px solid ${borderColour}`;

  const spec = createDecorationSpecFromMatch(match);
  const decorations = [
    Decoration.inline(
      match.from,
      match.to,
      {
        class: className,
        style,
        [DECORATION_ATTRIBUTE_ID]: match.matchId
      },
      spec
    )
  ];

  return decorations;
};

export const createDecorationSpecFromMatch = (match: IMatch) => ({
  type: DECORATION_MATCH,
  id: match.matchId,
  categoryId: match.category.id,
  inclusiveStart: false,
  inclusiveEnd: false
});

export const getMatchType = (match: IMatch): MatchType => {
  if (match.markAsCorrect) {
    return MatchType.CORRECT;
  }
  if (match.replacement) {
    return MatchType.HAS_REPLACEMENT;
  }
  return MatchType.DEFAULT;
};

export const getColourForMatch = (
  match: IMatch,
  matchColours: IMatchTypeToColourMap,
  isSelected: boolean
): { backgroundColour: string; borderColour: string } => {
  const backgroundOpacity = isSelected ? "50" : "07";
  const matchType = getMatchType(match);
  return getColourForMatchType(matchType, matchColours, backgroundOpacity);
};

export const getColourForMatchType = (
  matchType: MatchType,
  matchColours: IMatchTypeToColourMap,
  backgroundOpacity: string = "99"
): { backgroundColour: string; borderColour: string } => {
  switch (matchType) {
    case MatchType.CORRECT:
      return {
        backgroundColour: `${matchColours.correct}${backgroundOpacity}`,
        borderColour: `${matchColours.correct}${matchColours.correctOpacity}`
      };
    case MatchType.HAS_REPLACEMENT:
      return {
        backgroundColour: `${matchColours.hasSuggestion}${backgroundOpacity}`,
        borderColour: `${matchColours.hasSuggestion}${matchColours.hasSuggestionOpacity}`
      };
    default:
      return {
        backgroundColour: `${matchColours.default}${backgroundOpacity}`,
        borderColour: `${matchColours.default}${matchColours.defaultOpacity}`
      };
  }
};

export const createDecorationsForMatches = (
  matches: IMatch[],
  matchColours: IMatchTypeToColourMap = defaultMatchColours
) => flatten(matches.map(_ => createDecorationsForMatch(_, matchColours)));

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

export const maybeGetDecorationElement = (
  matchId: string
): HTMLElement | null =>
  document.querySelector(`[${DECORATION_ATTRIBUTE_ID}="${matchId}"]`);

const getProseMirrorOffsetValue = (element: HTMLElement): number => {
  var offset = element.offsetTop;

  if(element.offsetParent && !element.offsetParent.className.includes("ProseMirror")){
    return offset += getProseMirrorOffsetValue(element.offsetParent as HTMLElement);
  }

  return offset;
}

export const getMatchOffset = (
  matchId: string
): number => {
  const element = document.querySelector<HTMLElement>(`[${DECORATION_ATTRIBUTE_ID}="${matchId}"]`);
  return element ? getProseMirrorOffsetValue(element) : 0;
}
