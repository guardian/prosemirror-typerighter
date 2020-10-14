import throttle from "lodash/throttle";
import uniqBy from "lodash/uniqBy";
import uniq from "lodash/uniq";
import { v4 } from "uuid";
import { IMatcherResponse } from "../../interfaces/IMatch";
import { ITypeRighterResponse } from "./interfaces/ITyperighter";
import {
  IMatcherAdapter,
  TMatchesReceivedCallback,
  IFetchMatchesOptions
} from "../../interfaces/IMatcherAdapter";

/**
 * Convert an incoming response from a Typerighter service into
 * the IMatcherResponse that the plugin expects.
 */
export const convertTyperighterResponse = (
  requestId: string,
  response: ITypeRighterResponse
): IMatcherResponse => ({
  requestId,
  categoryIds: response.categoryIds,
  blocks: response.blocks,
  matches: response.matches.map(({ fromPos, toPos, rule, ...match }) => ({
    matchId: v4(),
    from: fromPos,
    to: toPos,
    matcherType: rule.matcherType,
    category: rule.category,
    ruleId: rule.id,
    ...match
  }))
});

/**
 * A MatcherAdapter for the Typerighter remote service.
 */
class TyperighterAdapter implements IMatcherAdapter {
  constructor(protected url: string, protected responseThrottleMs = 250) {}

  protected responseBuffer: ITypeRighterResponse[] = [];

  public fetchMatches = async ({
    requestId,
    blocks,
    categoryIds,
    documentUrl,
    onMatchesReceived,
    onRequestError
  }: IFetchMatchesOptions) => {
    blocks.map(async block => {
      const body = {
        requestId,
        documentUrl,
        blocks: [block]
      };
      try {
        const response = await fetch(`${this.url}/check`, {
          method: "POST",
          credentials: "include",
          headers: new Headers({
            "Content-Type": "application/json"
          }),
          body: JSON.stringify(body)
        });
        if (response.status === 401 || response.status === 419) {
          return onRequestError({
            requestId,
            blockId: block.id,
            message: `${response.status}: ${response.statusText}`,
            categoryIds,
            type: "AUTH_ERROR"
          });
        }
        if (response.status !== 200) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        const responseData: ITypeRighterResponse = await response.json();
        this.responseBuffer.push(responseData);
        this.throttledHandleResponse(requestId, onMatchesReceived);
      } catch (e) {
        onRequestError({
          requestId,
          blockId: block.id,
          message: e.message,
          categoryIds,
          type: "GENERAL_ERROR"
        });
      }
    });
  };
  public fetchCategories = async () => {
    const response = await fetch(`${this.url}/categories`, {
      credentials: "include",
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
