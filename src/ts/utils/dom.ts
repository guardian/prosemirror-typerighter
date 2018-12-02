import { StateHoverInfo } from "../state";

/**
 * Find the first ancestor node of the given node that matches the selector.
 */
export function findAncestor(
  element: HTMLElement,
  selector: (e: HTMLElement) => boolean
) {
  let currentElement: HTMLElement | null = element;
  while (
    (currentElement = currentElement.parentElement) &&
    !selector(currentElement)
  );
  return currentElement;
}

/**
 * Get the dimensions required for our UI code to render a tooltip. We encapsulate this here
 * to avoid dealing with side effects in the pluginr reducer.
 */
export function getStateHoverInfoFromEvent(
  event: MouseEvent,
  heightMarker: Element | null
): StateHoverInfo | undefined {
  if (
    !event.target ||
    !(event.target instanceof HTMLElement) ||
    !heightMarker ||
    !(heightMarker instanceof HTMLElement)
  ) {
    return;
  }
  const { left, top } = event.target.getBoundingClientRect();
  const mouseOffsetX = event.clientX - left;
  const mouseOffsetY = event.clientY - top;
  const { offsetLeft, offsetTop, offsetHeight: height } = event.target;
  return {
    left,
    top,
    offsetLeft,
    offsetTop,
    height,
    mouseOffsetX,
    mouseOffsetY,
    heightOfSingleLine: heightMarker.offsetHeight
  };
}
