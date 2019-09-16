import { IBlockQuery, IValidationResponse } from "../../interfaces/IValidation";
import { ITypeRighterResponse } from "./interfaces/ITyperighter";
import {
  IValidationAPIAdapter,
  TValidationReceivedCallback,
  TValidationErrorCallback
} from "../../interfaces/IValidationAPIAdapter";

export const convertTyperighterResponse = (
  validationSetId: string,
  response: ITypeRighterResponse
): IValidationResponse => ({
  validationSetId,
  blockResults: response.blocks.map((block, index) => ({
    validationId: block.id,
    categoryIds: block.categoryIds,
    from: block.from,
    to: block.to,
    blockMatches: block.matches.map(match => ({
      matchId: `${block.id}--match-${index}`,
      from: match.fromPos,
      to: match.toPos,
      annotation: match.shortMessage,
      category: match.rule.category,
      suggestions: match.suggestions
    }))
  }))
});

/**
 * An adapter for the Typerighter service.
 */
class TyperighterAdapter implements IValidationAPIAdapter {
  constructor(protected checkUrl: string, protected categoriesUrl: string) {}

  public fetchMatches = async (
    validationSetId: string,
    inputs: IBlockQuery[],
    categoryIds: string[],
    onValidationReceived: TValidationReceivedCallback,
    onValidationError: TValidationErrorCallback
  ) => {
    inputs.map(async input => {
      const body: { text: string; id: string; categoryIds?: string[] } = {
        id: input.id,
        text: input.inputString,
        categoryIds
      };
      try {
        const response = await fetch(this.checkUrl, {
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
        const responseData: ITypeRighterResponse = await response.json();
        const validationResponse = convertTyperighterResponse(
          validationSetId,
          responseData
        );
        onValidationReceived(validationResponse);
      } catch (e) {
        onValidationError({
          validationSetId,
          validationId: input.id,
          message: e.message
        });
      }
    });
  };
  public fetchCategories = async () => {
    const response = await fetch(this.categoriesUrl, {
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
  };
}

export default TyperighterAdapter;
