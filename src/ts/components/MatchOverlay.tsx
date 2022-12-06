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
import { Placement } from "@popperjs/core";


interface IProps {
  store: Store;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
  stopHover: () => void;
  feedbackHref?: string;
  onMarkCorrect?: (match: IMatch) => void;
}

/**
 * An overlay to display match tooltips.
 */
const matchOverlay = ({
  applySuggestions,
  feedbackHref,
  onMarkCorrect,
  stopHover,
  store
}: IProps) => {
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
    const updateState = (newState: IPluginState) => {
      setPluginState(newState);
      setCurrentMatchId(newState.hoverId);
      setCurrentRectIndex(newState.hoverRectIndex);
    }
    store.on(STORE_EVENT_NEW_STATE, updateState);
    return () =>
      store.removeEventListener(STORE_EVENT_NEW_STATE, updateState);
  }, []);

  useEffect(() => {
    if (!currentMatchId) {
      debounceShowMatch.current.cancel();
      setShowMatch(false);
      return;
    }

    // If we've got a new match tooltip to display, get the reference to
    // the current decoration and set the state.
    const matchElement = maybeGetDecorationElement(currentMatchId);
    setReferenceElement(matchElement as any);
    debounceShowMatch.current(true)
  }, [currentMatchId]);

  const getOffsets = React.useMemo(() => ({ placement }: { placement: Placement }): [number | null | undefined, number | null | undefined] => {
    // We provide a negative offset here to ensure there's an overlap
    // between the decoration triggering the tooltip and the tooltip.
    // If there's a gap, the tooltip library detects a `mouseleave` event
    // and closes the tooltip prematurely. We account for this with
    // padding on the tooltip container – see the styling for MatchWidget.
    const yOffset = -4;
    const isTop = placement.indexOf("top") >= 0;
    const isBottom = placement.indexOf("bottom") >= 0
    if (referenceElement && currentRectIndex !== undefined && (isTop || isBottom)) {
      const rects = referenceElement?.getClientRects();
      const hoverRect = rects[currentRectIndex];
      const lastRect = rects[rects.length - 1];
      //Determine the X offset as the difference between the last rect (bottom left) and the current rect.
      //This will only work if the placement is set to the "bottom-start". If we wanted to change this we
      //would need to build more flexibility into how this is calculated.
      const x = hoverRect.left - lastRect.left;
      //Determine the Y offset by taking the rect height and multiplying by the number of rects (lines)
      //This adjustment depends on if the popup is displayed above or below the content.
      const heightMultiplier = isBottom ? Math.max(0, rects.length - 1 - currentRectIndex) : currentRectIndex;
      const y = -hoverRect.height * heightMultiplier;
      return [x, y + yOffset];
    }
    return [0, yOffset];
  }, [referenceElement, currentRectIndex])

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
    modifiers: [
      { name: "arrow", options: { element: arrowElement } },
      { name: "offset", options: { offset: getOffsets } }
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
