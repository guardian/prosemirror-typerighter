import Match from "./Match";

import React, { useState, useEffect, useRef } from "react";
import { IPluginState } from "../state/reducer";
import { selectMatchByMatchId } from "../state/selectors";

import { IMatch } from "../interfaces/IMatch";
import { maybeGetDecorationElement } from "../utils/decoration";
import Store, { STORE_EVENT_NEW_STATE } from "../state/store";
import { ApplySuggestionOptions } from "../commands";
import { usePopper } from "react-popper";
import { debounce } from "lodash"
import { ModifierArguments, Options } from "@popperjs/core";

interface IProps<TPluginState extends IPluginState> {
  store: Store<TPluginState>;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
  stopHover: () => void;
  feedbackHref?: string;
  onMarkCorrect?: (match: IMatch) => void;
}

/**
 * An overlay to display match tooltips.
 */
const matchOverlay = <TPluginState extends IPluginState>({
  applySuggestions,
  feedbackHref,
  onMarkCorrect,
  stopHover,
  store
}: IProps<TPluginState>) => {
  const [pluginState, setPluginState] = useState<IPluginState | undefined>(
    undefined
  );
  const [currentMatchId, setCurrentMatchId] = useState<string | undefined>(
    undefined
  );
  const [currentRectIndex, setCurrentRectIndex] = useState<number | undefined>(
    undefined
  );
  const [
    referenceElement,
    setReferenceElement
  ] = useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
  const [showMatch, setShowMatch] = useState<boolean>(false);
  const debounceShowMatch = useRef(debounce(setShowMatch, 200))

  useEffect(() => {
    // Subscribe to the plugin state. We keep a separate reference to the
    // currentMatchId so we can create an effect that watches for it changing.
    // If we watched the whole plugin state, we'd have a lot of redundant calls.
    store.on(STORE_EVENT_NEW_STATE, newState => {
      setPluginState(newState);
      setCurrentMatchId(newState.hoverId);
      setCurrentRectIndex(newState.hoverRectIndex);
    });
    return () =>
      store.removeEventListener(STORE_EVENT_NEW_STATE, setPluginState);
  }, []);

  useEffect(() => {
    // If we've got a new match tooltip to display, get the reference to
    // the current decoration and set the state.
    if (!currentMatchId) {
      debounceShowMatch.current.cancel();
      setShowMatch(false);
      console.log(showMatch)
      return;
    }
    const matchElement = maybeGetDecorationElement(currentMatchId);
    setReferenceElement(matchElement as any);
    debounceShowMatch.current(true)
  }, [currentMatchId]);

  const hoverOverRect = React.useMemo(
    () => ({
      name: 'hoverOverRect',
      enabled: true,
      phase: "read" as const,
      fn: ({ state }: ModifierArguments<Options>) => {
        if(currentRectIndex === undefined){
          return state;
        }
        const rects = (state.elements.reference as Element).getClientRects();
        var offset = state.modifiersData.popperOffsets;
        if(offset){
          const hoverRect = rects[currentRectIndex];
          offset.x = hoverRect.x;
          offset.y = offset.y - hoverRect.height * (rects.length - currentRectIndex - 1)
        }
        return state;
      },
    }),
    [currentRectIndex]
  );

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
    modifiers: [
      hoverOverRect,
      { name: "arrow", options: { element: arrowElement } },
      // We provide a negative offset here to ensure there's an overlap
      // between the decoration triggering the tooltip and the tooltip.
      // If there's a gap, the tooltip library detects a `mouseleave` event
      // and closes the tooltip prematurely. We account for this with
      // padding on the tooltip container – see the styling for MatchWidget.
      { name: "offset", options: { offset: [0, -3] } }
    ]
  });

  if (!pluginState || !showMatch) {
    return null;
  }

  const maybeMatch =
    pluginState.hoverId &&
    selectMatchByMatchId(pluginState, pluginState.hoverId);

  if (!maybeMatch) {
    return null;
  }

  return (
    <div
      className="TyperighterPlugin__decoration-container"
      style={styles.popper as any}
      {...attributes.popper}
      ref={setPopperElement}
      onMouseLeave={stopHover}
    >
      <div ref={setArrowElement} style={styles.arrow as any} />
      <Match
        match={maybeMatch}
        matchColours={pluginState.config.matchColours}
        applySuggestions={applySuggestions}
        feedbackHref={feedbackHref}
        onMarkCorrect={onMarkCorrect}
      />
    </div>
  );
};

export default matchOverlay;
