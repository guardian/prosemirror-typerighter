import {
  IBlock,
  IMatch,
  ICategory,
  IMatcherResponse,
  TMatchRequestErrorWithDefault
} from "./IMatch";

/**
 * @internal
 */
export declare class IMatcherAdapter {
  /**
   * Fetch the matches for the given inputs.
   */
  public fetchMatches: (
    requestId: string,
    input: IBlock[],
    categoryIds: string[],
    onMatchesReceived: TMatchesReceivedCallback,
    onRequestError: TRequestErrorCallback,
    onRequestComplete: TRequestCompleteCallback
  ) => void;

  /**
   * Fetch the currently available matcher categories.
   */
  public fetchCategories: () => Promise<ICategory[]>;

  constructor(apiUrl: string);
}

export type TMatchesReceivedCallback = (response: IMatcherResponse<IMatch[]>) => void;

export type TRequestErrorCallback = (
  matchRequestError: TMatchRequestErrorWithDefault
) => void;

export type TRequestCompleteCallback = (requestId: string) => void;
