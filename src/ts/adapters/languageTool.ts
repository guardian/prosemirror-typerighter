import { ValidationInput } from "../interfaces/Validation";
import { LTResponse } from "./interfaces/LanguageTool";
import IValidationAPIAdapter from "../interfaces/IVAlidationAPIAdapter";
import v4 from 'uuid/v4';

/**
 * An adapter for the Typerighter service.
 */
const createLanguageToolAdapter: IValidationAPIAdapter = (
  apiUrl: string
) => async (input: ValidationInput) => {
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
  const validationData: LTResponse = await response.json();
  return validationData.matches.map(match => ({
    id: v4(),
    str: match.sentence,
    from: input.from + match.offset,
    to: input.from + match.offset + match.length,
    annotation: match.message,
    type: match.rule.description,
    suggestions: match.replacements.map(_ => _.value)
  }));
};

export default createLanguageToolAdapter;
