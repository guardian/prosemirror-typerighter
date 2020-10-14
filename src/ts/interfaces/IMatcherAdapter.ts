import {
  IBlock,
  IMatch,
  ICategory,
  IMatcherResponse,
  TMatchRequestErrorWithDefault
} from "./IMatch";

export interface IFetchMatchesOptions<TMatch extends IMatch = IMatch> {
  requestId: string;
  blocks: IBlock[];
  categoryIds: string[];
  onMatchesReceived: TMatchesReceivedCallback<TMatch>;
  onRequestError: TRequestErrorCallback;
  onRequestComplete?: TRequestCompleteCallback;
  documentUrl?: string;
}

/**
 * @internal
 */
export declare class IMatcherAdapter<TMatch extends IMatch = IMatch> {
  /**
   * Fetch the matches for the given inputs.
   */
  public fetchMatches: (opts: IFetchMatchesOptions<TMatch>) => void;

  /**
   * Fetch the currently available matcher categories.
   */
  public fetchCategories: () => Promise<ICategory[]>;

  constructor(apiUrl: string);
}

export type TMatchesReceivedCallback<TMatch extends IMatch = IMatch> = (
  response: IMatcherResponse<TMatch[]>
) => void;

export type TRequestErrorCallback = (
  matchRequestError: TMatchRequestErrorWithDefault
) => void;

export type TRequestCompleteCallback = (requestId: string) => void;
