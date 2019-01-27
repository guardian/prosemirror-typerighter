import v4 from "uuid/v4";
import { IValidationInput } from "../interfaces/IValidation";
import { ILTResponse } from "./interfaces/ILanguageTool";
import IValidationAPIAdapterCreator from "../interfaces/IValidationAPIAdapter";

/**
 * An adapter for the Typerighter service.
 */
const createLanguageToolAdapter: IValidationAPIAdapterCreator = (
  apiUrl: string
) => async (input: IValidationInput) => {
  const body = new URLSearchParams();
  body.append(
    "data",
    JSON.stringify({
      annotation: [
        {
          text: input.inputString
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
    id: v4(),
    inputString: match.sentence,
    from: input.from + match.offset,
    to: input.from + match.offset + match.length,
    annotation: match.message,
    type: match.rule.issueType,
    suggestions: match.replacements.map(_ => _.value)
  }));
};

export default createLanguageToolAdapter;
