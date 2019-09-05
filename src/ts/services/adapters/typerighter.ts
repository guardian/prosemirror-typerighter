import { IValidationInput } from "../../interfaces/IValidation";
import { ITypeRighterResponse } from "./interfaces/ITyperighter";
import {
  IValidationAPIAdapter,
  TValidationReceivedCallback,
  TValidationErrorCallback
} from "../../interfaces/IValidationAPIAdapter";

/**
 * An adapter for the Typerighter service.
 */
class TyperighterAdapter implements IValidationAPIAdapter {
  protected checkPath = "check";
  protected categoriesPath = "categories";

  constructor(protected apiUrl: string) {}

  public fetchValidationOutputs = async (
    validationSetId: string,
    inputs: IValidationInput[],
    categoryIds: string[],
    onValidationReceived: TValidationReceivedCallback,
    onValidationError: TValidationErrorCallback
  ) => {
    inputs.map(async input => {
      const body: { text: string; id: string; categoryIds?: string[] } = {
        id: input.validationId,
        text: input.inputString,
        categoryIds
      };
      try {
        const response = await fetch(
          `${this.apiUrl}/${this.checkPath}`,
          {
            method: "POST",
            headers: new Headers({
              "Content-Type": "application/json"
            }),
            body: JSON.stringify(body)
          }
        );
        if (response.status !== 200) {
          throw new Error(
            `Error fetching validations. The server responded with status code ${
              response.status
            }: ${response.statusText}`
          );
        }
        const validationData: ITypeRighterResponse = await response.json();
        onValidationReceived({
          validationSetId,
          validationId: input.validationId,
          validationOutputs: validationData.results.map(match => ({
            validationId: input.validationId,
            inputString: input.inputString,
            from: input.from + match.fromPos,
            to: input.from + match.toPos,
            annotation: match.shortMessage,
            category: match.rule.category,
            suggestions: match.suggestions
          }))
        });
      } catch (e) {
        onValidationError({
          validationSetId,
          validationId: input.validationId,
          message: e.message
        });
      }
    });
  };
  public fetchCategories = async () => {
    const response = await fetch(
      `http://${this.apiUrl}/${this.categoriesPath}`,
      {
        headers: new Headers({
          "Content-Type": "application/json"
        })
      }
    );
    if (response.status !== 200) {
      throw new Error(
        `Error fetching categories. The server responded with status code ${
          response.status
        }: ${response.statusText}`
      );
    }
    return await response.json();
  };
}

export default TyperighterAdapter;
