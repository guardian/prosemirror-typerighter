import {
  IBlock,
  IMatch,
  ICategory,
  IMatcherResponse,
  TMatchRequestErrorWithDefault
} from "./IMatch";

export type FetchMatches = {
  requestId: string,
  inputs: IBlock[],
  categoryIds: string[],
  excludeCategoryIds: string[],
  onMatchesReceived: TMatchesReceivedCallback,
  onRequestError: TRequestErrorCallback,
  onRequestComplete: TRequestCompleteCallback
}

/**
 * @internal
 */
export declare class IMatcherAdapter {
  /**
   * Fetch the matches for the given inputs.
   */
  public fetchMatches: (options: FetchMatches) => void;

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
