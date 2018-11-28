export function findAncestor(element: HTMLElement, selector: (e: HTMLElement) => boolean) {
  let currentElement: HTMLElement | null = element;
  while (
    (currentElement = currentElement.parentElement) &&
    !selector(currentElement)
  );
  return currentElement;
}
