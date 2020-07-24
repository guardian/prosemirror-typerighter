import throttle from "lodash/throttle";
import uniqBy from "lodash/uniqBy";
import uniq from "lodash/uniq";
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
    matchedText: match.matchedText,
    message: match.shortMessage,
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
  constructor(protected url: string, protected responseThrottleMs = 250) {}

  protected responseBuffer: ITypeRighterResponse[] = [];

  public fetchMatches = async (
    requestId: string,
    inputs: IBlock[],
    categoryIds: string[],
    onMatchesReceived: TMatchesReceivedCallback,
    onRequestError: TRequestErrorCallback,
    _: TRequestCompleteCallback
  ) => {
    inputs.map(async input => {
      const body = {
        requestId,
        blocks: [input],
        categoryIds
      };
      try {
        const response = await fetch(`${this.url}/check`, {
          method: "POST",
          credentials: 'include',
          headers: new Headers({
            "Content-Type": "application/json"
          }),
          body: JSON.stringify(body)
        });
        if (response.status !== 200) {
          throw new Error(
            `Error fetching matches. The server responded with status code ${response.status}: ${response.statusText}`
          );
        }
        const responseData: ITypeRighterResponse = await response.json();
        this.responseBuffer.push(responseData);
        this.throttledHandleResponse(requestId, onMatchesReceived);
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
    const response = await fetch(`${this.url}/categories`, {
      credentials: 'include',
      headers: new Headers({
        "Content-Type": "application/json"
      })
    });
    if (response.status !== 200) {
      throw new Error(
        `Error fetching categories. The server responded with status code ${response.status}: ${response.statusText}`
      );
    }
    return await response.json();
  };

  protected flushResponseBuffer = (
    requestId: string,
    onMatchesReceived: TMatchesReceivedCallback
  ) => {
    if (!this.responseBuffer.length) {
      return;
    }
    const blocks = uniqBy(
      this.responseBuffer.flatMap(_ => _.blocks),
      "id"
    );
    const categoryIds = uniq(this.responseBuffer.flatMap(_ => _.categoryIds));
    const matches = this.responseBuffer.flatMap(_ => _.matches);
    const socketMessage = {
      blocks,
      categoryIds,
      matches,
      requestId
    };

    onMatchesReceived(convertTyperighterResponse(requestId, socketMessage));

    // Clear the buffer
    this.responseBuffer = [];
  };

  protected throttledHandleResponse = throttle(
    this.flushResponseBuffer,
    this.responseThrottleMs
  );
}

export default TyperighterAdapter;
