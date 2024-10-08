import { news, opinion, success } from "@guardian/src-foundations";
import flatten from "lodash/flatten";
import { Node } from "prosemirror-model";
import { Decoration, DecorationSet } from "prosemirror-view";
import { IRange, Match } from "../interfaces/IMatch";
import { getSquiggleAsUri } from "./squiggle";

export enum MatchType {
  AMEND = "AMEND",
  REVIEW = "REVIEW",
  OK = "OK"
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
  hasSuggestion: news[400],
  hasSuggestionOpacity: "FF",
  default: opinion[300],
  defaultOpacity: "AD",
  correct: success[400],
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
  [DECORATION_MATCH_IS_SELECTED]: "MatchDecoration--is-selected",
  [MatchType.OK]: "MatchDecoration--is-correct",
  [MatchType.REVIEW]: "MatchDecoration--default",
  [MatchType.AMEND]: "MatchDecoration--has-replacement"
};

export const DECORATION_ATTRIBUTE_ID = "data-match-id";
export const DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID = "data-height-marker-id";
export const DECORATION_ATTRIBUTE_IS_CORRECT_ID = "data-is-correct-id";

export const createDebugDecorationFromRange = (range: IRange, dirty = true) => {
  const type = dirty ? DECORATION_DIRTY : DECORATION_INFLIGHT;
  return Decoration.inline(
    range.from,
    range.to,
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
  outputs: Match[],
  decorationSet: DecorationSet,
  doc: Node
) => {
  const decorationsToAdd = createDecorationsForMatches(outputs);

  return decorationSet.add(doc, decorationsToAdd);
};

/**
 * Create decorations for the given match.
 */
export const createDecorationsForMatch = (
  match: Match,
  isSelected: boolean = false
) => {
  const matchType = getMatchType(match);

  let className = `${DecorationClassMap[DECORATION_MATCH]} ${DecorationClassMap[matchType]}`;
  className += isSelected
    ? ` ${DecorationClassMap[DECORATION_MATCH_IS_SELECTED]}`
    : "";

  const spec = createDecorationSpecFromMatch(match);
  const decorations = match.ranges.map(range =>
    Decoration.inline(
      range.from,
      range.to,
      {
        class: className,
        [DECORATION_ATTRIBUTE_ID]: match.matchId,
        spellcheck: "false"
      },
      spec
    )
  );

  return decorations;
};

export const createDecorationSpecFromMatch = (match: Match) => ({
  type: DECORATION_MATCH,
  id: match.matchId,
  categoryId: match.category.id,
  inclusiveStart: false,
  inclusiveEnd: false
});

export const getMatchType = (match: Match): MatchType => {
  if (match.markAsCorrect) {
    return MatchType.OK;
  }
  if (match.replacement) {
    return MatchType.AMEND;
  }
  return MatchType.REVIEW;
};

export const getColourForMatch = (
  match: Match,
  matchColours: IMatchTypeToColourMap,
  isSelected: boolean
): { backgroundColour: string; borderColour: string } => {
  const matchType = getMatchType(match);
  const {
    backgroundColour,
    backgroundColourSelected,
    borderColour
  } = getColourForMatchType(matchType, matchColours);
  return {
    borderColour,
    backgroundColour: isSelected ? backgroundColourSelected : backgroundColour
  };
};

export const getColourForMatchType = (
  matchType: MatchType,
  matchColours: IMatchTypeToColourMap
): {
  backgroundColour: string;
  borderColour: string;
  backgroundColourSelected: string;
} => {
  const backgroundOpacitySelected = "50";
  const backgroundOpacity = "07";
  switch (matchType) {
    case MatchType.OK:
      return {
        backgroundColour: `${matchColours.correct}${backgroundOpacity}`,
        backgroundColourSelected: `${matchColours.correct}${backgroundOpacitySelected}`,
        borderColour: `${matchColours.correct}${matchColours.correctOpacity}`
      };
    case MatchType.AMEND:
      return {
        backgroundColour: `${matchColours.hasSuggestion}${backgroundOpacity}`,
        backgroundColourSelected: `${matchColours.hasSuggestion}${backgroundOpacitySelected}`,
        borderColour: `${matchColours.hasSuggestion}${matchColours.hasSuggestionOpacity}`
      };
    default:
      return {
        backgroundColour: `${matchColours.default}${backgroundOpacity}`,
        backgroundColourSelected: `${matchColours.default}${backgroundOpacitySelected}`,
        borderColour: `${matchColours.default}${matchColours.defaultOpacity}`
      };
  }
};

export const createDecorationsForMatches = (
  matches: Match[],
) => flatten(matches.map(match => createDecorationsForMatch(match)));

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

const getProseMirrorOffsetValue = (
  element: HTMLElement,
  scrollElement: Element
): number => {
  let offset = element.offsetTop;

  if (element.offsetParent && !element.isEqualNode(scrollElement)) {
    return (offset += getProseMirrorOffsetValue(
      element.offsetParent as HTMLElement,
      scrollElement
    ));
  }

  return offset;
};

export const maybeGetDecorationMatchIdFromEvent = (
  event: Event
): string | undefined => {
  if (!event.target || !(event.target instanceof HTMLElement)) {
    return undefined;
  }
  const target = event.target;
  const targetAttr = target.getAttribute(DECORATION_ATTRIBUTE_ID);
  return targetAttr ? targetAttr : undefined;
};

export const getMatchOffset = (
  matchId: string,
  scrollElement: Element
): number => {
  const element = document.querySelector<HTMLElement>(
    `[${DECORATION_ATTRIBUTE_ID}="${matchId}"]`
  );
  return element ? getProseMirrorOffsetValue(element, scrollElement) : 0;
};

export const GLOBAL_DECORATION_STYLE_ID = "prosemirror-typerighter-global-styles";

/**
 * Creates a global decoration style tag to style inline decoration elements.
 *
 * This saves us from applying lengthy styles to each match decoration. It's also
 * necessary to apply pseudo-element styling, as this isn't possible with inline styles –
 * see e.g. https://stackoverflow.com/questions/14141374/using-css-before-and-after-pseudo-elements-with-inline-css/20288572
 */
export const createGlobalDecorationStyleTag = (
  matchColours: IMatchTypeToColourMap
): HTMLStyleElement => {
  const correctColours = getColourForMatchType(MatchType.OK, matchColours);
  const hasReplacementColours = getColourForMatchType(MatchType.AMEND, matchColours);
  const defaultColours = getColourForMatchType(MatchType.REVIEW, matchColours);
  const styleContent = `
    .${DecorationClassMap.AMEND} {
      background-color: ${hasReplacementColours.backgroundColour};
      border-bottom: 4px double ${hasReplacementColours.borderColour};
    }

    .${DecorationClassMap.AMEND}.MatchDecoration--is-selected {
      background-color: ${hasReplacementColours.backgroundColourSelected};
    }

    .${DecorationClassMap.REVIEW} {
      position: relative;
      background-color: ${defaultColours.backgroundColour};
      border-image-source: url('${getSquiggleAsUri(defaultColours.borderColour)}');
      border-image-width: 0 0 auto 0;
      border-image-slice: 4;
      border-image-repeat: round;
      border-style: solid;
      border-width: 0 0 2px 0;
    }

    .${DecorationClassMap.REVIEW}.MatchDecoration--is-selected {
      background-color: ${defaultColours.backgroundColourSelected};
      border-image-source: linear-gradient(0deg, ${defaultColours.backgroundColourSelected} 3px, transparent 3px), url('${getSquiggleAsUri(defaultColours.borderColour)}');
    }

    .${DecorationClassMap.OK} {
      position: relative;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
      background-color: ${correctColours.backgroundColour};
      border-image-source: repeating-linear-gradient(to right, ${correctColours.borderColour} 0, ${correctColours.borderColour} 3px, transparent 3px, transparent 5px);
      border-image-width: 0 0 auto 0;
      border-image-slice: 0 0 3 0;
      border-style: solid;
      border-width: 0 0 2px 0;
    }

    .${DecorationClassMap.OK}.MatchDecoration--is-selected,
    .${DecorationClassMap.OK}.MatchDecoration--is-selected:after {
      background-color: ${correctColours.backgroundColourSelected};
    }
  `;
  const elem = document.createElement("style");
  elem.id = GLOBAL_DECORATION_STYLE_ID;
  elem.innerHTML = styleContent;
  return elem;
};
