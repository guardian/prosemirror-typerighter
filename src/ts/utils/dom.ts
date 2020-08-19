import snarkdown from "snarkdown";

/**
 * Strip any HTML from an input string.
 */
export const getHtmlFromMarkdown = (markdown: string) => {
  const decoder = document.createElement("div");
  decoder.innerHTML = markdown;
  return snarkdown(decoder.textContent || "");
};

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
