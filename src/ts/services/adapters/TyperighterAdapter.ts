import v4 from "uuid/v4";
import { IBlock, IMatcherResponse } from "../../interfaces/IMatch";
import { ITypeRighterResponse } from "./interfaces/ITyperighter";
import {
  IMatcherAdapter,
  TMatchesReceivedCallback,
  TRequestErrorCallback,
  TRequestCompleteCallback
} from "../../interfaces/IMatcherAdapter";

export const convertTyperighterResponse = (
  requestId: string,
  response: ITypeRighterResponse
): IMatcherResponse => ({
  requestId,
  categoryIds: response.categoryIds,
  blocks: response.blocks,
  matches: response.matches.map(match => ({
    matchId: v4(),
    from: match.fromPos,
    to: match.toPos,
    annotation: match.shortMessage,
    category: match.rule.category,
    suggestions: match.suggestions,
    replacement: match.rule.replacement,
    markAsCorrect: match.markAsCorrect
  }))
});

/**
 * An adapter for the Typerighter service.
 */
class TyperighterAdapter implements IMatcherAdapter {
  constructor(protected checkUrl: string, protected categoriesUrl: string) {}

  public fetchMatches = async (
    requestId: string,
    inputs: IBlock[],
    categoryIds: string[],
    onMatchesReceived: TMatchesReceivedCallback,
    onRequestError: TRequestErrorCallback,
    onRequestComplete: TRequestCompleteCallback
  ) => {
    inputs.map(async input => {
      const body = {
        requestId,
        blocks: [input],
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
            `Error fetching matches. The server responded with status code ${
              response.status
            }: ${response.statusText}`
          );
        }
        const responseData: ITypeRighterResponse = await response.json();
        const matcherResponse = convertTyperighterResponse(
          requestId,
          responseData
        );
        onMatchesReceived(matcherResponse);
      } catch (e) {
        onRequestError({
          requestId,
          blockId: input.id,
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
