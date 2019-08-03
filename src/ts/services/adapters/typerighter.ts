import v4 from "uuid/v4";
import { IValidationInput, ICategory } from "../../interfaces/IValidation";
import { ITypeRighterResponse } from "./interfaces/ITyperighter";

const checkPath = "check";
const categoriesPath = "categories";

/**
 * An adapter for the Typerighter service.
 */
const createTyperighterAdapter = (apiUrl: string) => ({
  fetchValidationOutputs: async (
    input: IValidationInput,
    categoryIds?: string[]
  ) => {
    const id = v4()
    const body: { text: string; id: string, categoryIds?: string[] } = {
      id,
      text: input.inputString
    };
    if (categoryIds && categoryIds.length) {
      body.categoryIds = categoryIds;
    }
    const response = await fetch(`${apiUrl}/${checkPath}`, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify(body)
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
  },
  fetchCategories: async () => {
    const response = await fetch(`${apiUrl}/${categoriesPath}`, {
      headers: new Headers({
        "Content-Type": "application/json"
      })
    });
    if (response.status !== 200) {
      throw new Error(
        `Error fetching categories. The server responded with status code ${
          response.status
        }: ${response.statusText}`
      );
    }
    return await response.json();
  }
});

export default createTyperighterAdapter;
