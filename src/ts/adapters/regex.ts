import { IValidationInput, IValidationOutput } from "../interfaces/IValidation";

/**
 * An example adapter that applies a regex to find three letter words in the document.
 */
const regexAdapter = async (input: IValidationInput) => {
  const outputs = [] as IValidationOutput[];
  const threeLetterExpr = /\b[a-zA-Z]{3}\b/g;
  const sixLetterExpr = /\b[a-zA-Z]{6}\b/g;
  let result;
  // tslint:disable-next-line no-conditional-assignment
  while ((result = threeLetterExpr.exec(input.str))) {
    outputs.push({
      from: input.from + result.index,
      to: input.from + result.index + result[0].length,
      str: result[0],
      annotation:
        "This word has three letters. Consider a larger, grander word.",
      type: "3 letter word",
      id: input.id,
      suggestions: ["replace", "with", "grand", "word"]
    });
  }
  // tslint:disable-next-line no-conditional-assignment
  while ((result = sixLetterExpr.exec(input.str))) {
    outputs.push({
      from: input.from + result.index,
      to: input.from + result.index + result[0].length,
      str: result[0],
      annotation:
        "This word has six letters. Consider a smaller, less fancy word.",
      type: "6 letter word",
      id: input.id,
      suggestions: ["replace", "with", "bijou", "word"]
    });
  }

  // Add some latency.
  await new Promise(_ => setTimeout(_, 1000));

  return outputs;
};

export default regexAdapter;
