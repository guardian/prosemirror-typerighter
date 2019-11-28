/**
 * @module createTyperighterPlugin
 */

import {
  IBlock,
  IMatch,
  ICategory,
  IMatcherResponse,
  IMatchRequestError
} from "./IMatch";

/**
 * @internal
 */
export declare class IMatcherAdapter<
  TMatch extends IMatch = IMatch
> {
  /**
   * Fetch the matches for the given inputs.
   */
  public fetchMatches: (
    requestId: string,
    input: IBlock[],
    categoryIds: string[],
    onMatchesReceived: TMatchesReceivedCallback<TMatch>,
    onRequestError: TRequestErrorCallback,
    onRequestComplete: TRequestCompleteCallback
  ) => void;

  /**
   * Fetch the currently available matcher categories.
   */
  public fetchCategories: () => Promise<ICategory[]>;

  constructor(apiUrl: string);
}

export type TMatchesReceivedCallback<
  TMatch extends IMatch = IMatch
> = (response: IMatcherResponse<TMatch>) => void;

export type TRequestErrorCallback = (
  matchRequestError: IMatchRequestError
) => void;

export type TRequestCompleteCallback = (requestId: string) => void;
