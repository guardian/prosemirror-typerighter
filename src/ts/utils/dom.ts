import { IStateHoverInfo } from "../state/state";

/**
 * Find the first ancestor node of the given node that matches the selector.
 */
export function findAncestor(
  element: HTMLElement,
  selector: (e: HTMLElement) => boolean
) {
  // tslint:disable-next-line prefer-const
  let currentElement: HTMLElement | null = element;
  while (
    // tslint:disable-next-line no-conditional-assignment
    (currentElement = currentElement.parentElement) &&
    !selector(currentElement)
    // tslint:disable-next-line no-empty
  ) {}
  return currentElement;
}

/**
 * Get the dimensions required for our UI code to render a tooltip. We encapsulate this here
 * to avoid dealing with side effects in the plugin reducer.
 */
export function getStateHoverInfoFromEvent(
  event: MouseEvent,
  containerElement: Element | null,
  heightMarkerElement: Element | null
): IStateHoverInfo | undefined {
  if (
    !event.target ||
    !(event.target instanceof HTMLElement) ||
    !containerElement ||
    !(containerElement instanceof HTMLElement) ||
    !heightMarkerElement ||
    !(heightMarkerElement instanceof HTMLElement)
  ) {
    return;
  }
  const {
    left: elementLeft,
    top: elementTop
  } = event.target.getBoundingClientRect();
  const {
    left: containerLeft,
    top: containerTop
  } = containerElement.getBoundingClientRect();
  const mouseOffsetX = event.clientX - elementLeft;
  const mouseOffsetY = event.clientY - elementTop;
  const { offsetLeft, offsetTop, offsetHeight: height } = event.target;
  return {
    left: elementLeft - containerLeft,
    top: elementTop - containerTop,
    offsetLeft,
    offsetTop,
    height,
    mouseOffsetX,
    mouseOffsetY,
    heightOfSingleLine: heightMarkerElement.offsetHeight
  };
}
