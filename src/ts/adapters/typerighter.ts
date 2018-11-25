import { ValidationInput } from "../interfaces/Validation";
import IValidationAPIAdapter from "../interfaces/IVAlidationAPIAdapter";
import { TypeRighterResponse } from "./interfaces/Typerighter";
import v4 from "uuid/v4";

/**
 * An adapter for the Typerighter service.
 */
const createTyperighterAdapter: IValidationAPIAdapter = (
  apiUrl: string
) => async (input: ValidationInput) => {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({
      text: input.str
    })
  });
  if (response.status !== 200) {
    throw new Error(
      `Error fetching validations. The server responded with status code ${
        response.status
      }: ${response.statusText}`
    );
  }
  const validationData: TypeRighterResponse = await response.json();
  return validationData.results.map(match => ({
    id: v4(),
    str: input.str,
    from: input.from + match.fromPos,
    to: input.from + match.toPos,
    annotation: match.message,
    type: match.rule.description,
    suggestions: match.suggestedReplacements
  }));
};

export default createTyperighterAdapter;
