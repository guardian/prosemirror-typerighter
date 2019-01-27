import { IValidationInput } from "../interfaces/IValidation";
import IValidationAPIAdapter from "../interfaces/IValidationAPIAdapter";
import { ILTResponse } from "./interfaces/ILanguageTool";

/**
 * An adapter for the Typerighter service.
 */
const createLanguageToolAdapter: IValidationAPIAdapter = (
  apiUrl: string
) => async (input: IValidationInput) => {
  const body = new URLSearchParams();
  body.append(
    "data",
    JSON.stringify({
      annotation: [
        {
          text: input.str
        }
      ]
    })
  );
  body.append("language", "en-US");
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "x-www-form-urlencoded"
    }),
    body
  });
  if (response.status !== 200) {
    throw new Error(
      `Error fetching validations. The server responded with status code ${
        response.status
      }: ${response.statusText}`
    );
  }
  const validationData: ILTResponse = await response.json();
  return validationData.matches.map(match => ({
    id: input.id,
    str: match.sentence,
    from: input.from + match.offset,
    to: input.from + match.offset + match.length,
    annotation: match.message,
    type: match.rule.issueType,
    suggestions: match.replacements.map(_ => _.value)
  }));
};

export default createLanguageToolAdapter;
