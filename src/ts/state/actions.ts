import {
  IMatchRequestError,
  IMatcherResponse,
  IRange,
  IMatch
} from "../interfaces/IMatch";
import { IStateHoverInfo } from "./reducer";

/**
 * Action types.
 */

export const REQUEST_FOR_DIRTY_RANGES = "REQUEST_START" as const;
export const REQUEST_FOR_DOCUMENT = "REQUEST_FOR_DOCUMENT" as const;
export const REQUEST_SUCCESS = "REQUEST_SUCCESS" as const;
export const REQUEST_ERROR = "REQUEST_ERROR" as const;
export const REQUEST_COMPLETE = "REQUEST_COMPLETE" as const;
export const NEW_HOVER_ID = "NEW_HOVER_ID" as const;
export const SELECT_MATCH = "SELECT_MATCH" as const;
export const REMOVE_MATCH = "REMOVE_MATCH" as const;
export const APPLY_NEW_DIRTY_RANGES = "HANDLE_NEW_DIRTY_RANGES" as const;
export const SET_DEBUG_STATE = "SET_DEBUG_STATE" as const;
export const SET_REQUEST_MATCHES_ON_DOC_MODIFIED = "SET_REQUEST_MATCHES_ON_DOC_MODIFIED" as const;

/**
 * Action creators.
 */

export const requestMatchesForDirtyRanges = (
  requestId: string,
  categoryIds: string[]
) => ({
  type: REQUEST_FOR_DIRTY_RANGES,
  payload: { requestId, categoryIds }
});
export type ActionRequestMatchesForDirtyRanges = ReturnType<
  typeof requestMatchesForDirtyRanges
>;

export const requestMatchesForDocument = (
  requestId: string,
  categoryIds: string[]
) => ({
  type: REQUEST_FOR_DOCUMENT,
  payload: { requestId, categoryIds }
});
export type ActionRequestMatchesForDocument = ReturnType<
  typeof requestMatchesForDocument
>;

export const requestMatchesSuccess = <TBlockMatches extends IMatch>(
  response: IMatcherResponse<TBlockMatches>
) => ({
  type: REQUEST_SUCCESS,
  payload: { response }
});
// tslint:disable-next-line:interface-over-type-literal
export type ActionRequestMatchesSuccess<TMatch extends IMatch> = {
  type: "REQUEST_SUCCESS";
  payload: { response: IMatcherResponse<TMatch> };
};

export const requestError = (matchRequestError: IMatchRequestError) => ({
  type: REQUEST_ERROR,
  payload: { matchRequestError }
});
export type ActionRequestError = ReturnType<typeof requestError>;

export const requestMatchesComplete = (requestId: string) => ({
  type: REQUEST_COMPLETE,
  payload: { requestId }
});
export type ActionRequestComplete = ReturnType<typeof requestMatchesComplete>;

export const newHoverIdReceived = (
  matchId: string | undefined,
  hoverInfo?: IStateHoverInfo | undefined
) => ({
  type: NEW_HOVER_ID,
  payload: { matchId, hoverInfo }
});
export type ActionNewHoverIdReceived = ReturnType<typeof newHoverIdReceived>;

export const applyNewDirtiedRanges = (ranges: IRange[]) => ({
  type: APPLY_NEW_DIRTY_RANGES,
  payload: { ranges }
});
export type ActionHandleNewDirtyRanges = ReturnType<
  typeof applyNewDirtiedRanges
>;

export const selectMatch = (matchId: string) => ({
  type: SELECT_MATCH,
  payload: { matchId }
});
export type ActionSelectMatch = ReturnType<typeof selectMatch>;

export const setDebugState = (debug: boolean) => ({
  type: SET_DEBUG_STATE,
  payload: { debug }
});
export type ActionSetDebugState = ReturnType<typeof setDebugState>;

export const setRequestMatchesOnDocModified = (
  requestMatchesOnDocModified: boolean
) => ({
  type: SET_REQUEST_MATCHES_ON_DOC_MODIFIED,
  payload: { requestMatchesOnDocModified }
});
export type ActionSetRequestMatchesOnDocModified = ReturnType<
  typeof setRequestMatchesOnDocModified
>;

export const removeMatch = (id: string) => ({
  type: REMOVE_MATCH,
  payload: { id }
})
export type ActionRemoveMatch = ReturnType<
  typeof removeMatch
>;

export type Action<TMatch extends IMatch> =
  | ActionNewHoverIdReceived
  | ActionRequestMatchesSuccess<TMatch>
  | ActionRequestMatchesForDirtyRanges
  | ActionRequestMatchesForDocument
  | ActionRequestError
  | ActionRequestComplete
  | ActionSelectMatch
  | ActionHandleNewDirtyRanges
  | ActionSetDebugState
  | ActionSetRequestMatchesOnDocModified
  | ActionRemoveMatch
