import { ValidationInput } from "../interfaces/Validation";

/**
 * From a string, get a range from the given index that looks
 * outward for the given number of words.
 */
export const getExpandedRange = (index: number, str: string, noOfWords = 1) => {
  const lastIndex = str.length - 1;
  const from =
    index === 0
      ? 0
      : getPositionOfNthWord(str.slice(0, index), noOfWords, false);
  const to =
    index >= lastIndex
      ? lastIndex
      : getPositionOfNthWord(str.slice(index), noOfWords) + index;
  return {
    from,
    to,
    diffFrom: from - index,
    diffTo: to - index
  };
};

export const getPositionOfNthWord = (
  str: String,
  noOfWords: number,
  forward = true
) => {
  let words = forward ? str.split(" ") : str.split(" ").reverse();
  let offset = -1;
  // Ignore leading spaces
  if (words[0] === "") {
    words = words.slice(1, words.length - 1);
    offset++;
  }
  for (let i = 0; i <= noOfWords && i <= words.length - 1; i++) {
    offset += words[i].length + 1;
  }
  return forward ? offset : str.length - offset;
};

export const isString = (str: any) => {
  return typeof str === "string" || str instanceof String;
};

/**
 * Create a single string from an array of validation inputs.
 * Assumes ordered inputs that do not overlap.
 */
export const createStringFromValidationInputs = (inputs: ValidationInput[]) =>
  inputs.reduce(
    (acc, input) => acc + " ".repeat(input.from - acc.length) + input.str,
    ""
  );
