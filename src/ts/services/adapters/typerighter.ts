import v4 from "uuid/v4";
import { IValidationInput } from "../interfaces/IValidation";
import IValidationAPIAdapter from "../interfaces/IValidationAPIAdapter";
import { ITypeRighterResponse } from "./interfaces/ITyperighter";

/**
 * An adapter for the Typerighter service.
 */
const createTyperighterAdapter: IValidationAPIAdapter = (
  apiUrl: string
) => async (input: IValidationInput) => {
  const id = v4()
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({
      id,
      text: input.inputString
    })
  });
  if (response.status !== 200) {
    throw new Error(
      `Error fetching validations. The server responded with status code ${
        response.status
      }: ${response.statusText}`
    );
  }
  const validationData: ITypeRighterResponse = await response.json();
  return validationData.results.map(match => ({
    id,
    inputString: input.inputString,
    from: input.from + match.fromPos,
    to: input.from + match.toPos,
    annotation: match.shortMessage,
    category: match.rule.category,
    suggestions: match.suggestions
  }));
};

export default createTyperighterAdapter;
