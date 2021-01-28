import {
  IMatchRequestError,
  IMatcherResponse
} from "../interfaces/IMatch";
import { IPluginConfig, IPluginState } from "./reducer";

/**
 * Action types.
 */

export const REQUEST_FOR_DIRTY_RANGES = "REQUEST_START" as const;
export const REQUEST_FOR_DOCUMENT = "REQUEST_FOR_DOCUMENT" as const;
export const REQUEST_SUCCESS = "REQUEST_SUCCESS" as const;
export const REQUEST_ERROR = "REQUEST_ERROR" as const;
export const REQUEST_COMPLETE = "REQUEST_COMPLETE" as const;
export const NEW_HOVER_ID = "NEW_HOVER_ID" as const;
export const NEW_HIGHLIGHT_ID = "NEW_HIGHLIGHT_ID" as const;
export const SELECT_MATCH = "SELECT_MATCH" as const;
export const REMOVE_MATCH = "REMOVE_MATCH" as const;
export const REMOVE_ALL_MATCHES = "REMOVE_ALL_MATCHES" as const;
export const APPLY_NEW_DIRTY_RANGES = "HANDLE_NEW_DIRTY_RANGES" as const;
export const SET_CONFIG_VALUE = "SET_CONFIG_VALUE" as const;
export const SET_FILTER_STATE = "SET_FILTER_STATE" as const;

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

export const requestMatchesSuccess = <TPluginState extends IPluginState>(
  response: IMatcherResponse<TPluginState["currentMatches"]>
) => ({
  type: REQUEST_SUCCESS,
  payload: { response }
});
// We must repeat ourselves here, as ReturnType doesn't play nicely with type parameters.
// See https://github.com/microsoft/TypeScript/issues/26856
// tslint:disable-next-line:interface-over-type-literal
export type ActionRequestMatchesSuccess<TPluginState extends IPluginState> = {
  type: "REQUEST_SUCCESS";
  payload: { response: IMatcherResponse<TPluginState["currentMatches"]> };
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

export const newHoverIdReceived = (matchId: string | undefined, rectIndex: number | undefined) => ({
  type: NEW_HOVER_ID,
  payload: { matchId, rectIndex }
});
export type ActionNewHoverIdReceived = ReturnType<typeof newHoverIdReceived>;

export const newHighlightIdReceived = (matchId: string | undefined) => ({
  type: NEW_HIGHLIGHT_ID,
  payload: { matchId }
});
export type ActionNewHighlightIdReceived = ReturnType<
  typeof newHighlightIdReceived
>;

export const selectMatch = (matchId: string) => ({
  type: SELECT_MATCH,
  payload: { matchId }
});
export type ActionSelectMatch = ReturnType<typeof selectMatch>;

export const setConfigValue = <
  ConfigKey extends keyof IPluginConfig,
  ConfigValue extends IPluginConfig[ConfigKey]
>(
  key: ConfigKey,
  value: ConfigValue
) => ({
  type: SET_CONFIG_VALUE,
  payload: { key, value }
});
export type ActionSetConfigValue = ReturnType<typeof setConfigValue>;

export const removeMatch = (id: string) => ({
  type: REMOVE_MATCH,
  payload: { id }
});
export type ActionRemoveMatch = ReturnType<typeof removeMatch>;

export const removeAllMatches = () => ({
  type: REMOVE_ALL_MATCHES
});
export type ActionRemoveAllMatches = ReturnType<typeof removeAllMatches>;

export const setFilterState = <TPluginState extends IPluginState>(
  filterState: TPluginState["filterState"]
) => ({
  type: SET_FILTER_STATE,
  payload: { filterState }
});
// tslint:disable-next-line:interface-over-type-literal
export type ActionSetFilterState<TPluginState extends IPluginState> = {
  type: typeof SET_FILTER_STATE;
  payload: { filterState: TPluginState["filterState"] };
};

export type Action<TPluginState extends IPluginState> =
  | ActionNewHoverIdReceived
  | ActionNewHighlightIdReceived
  | ActionRequestMatchesSuccess<TPluginState>
  | ActionRequestMatchesForDirtyRanges
  | ActionRequestMatchesForDocument
  | ActionRequestError
  | ActionRequestComplete
  | ActionSelectMatch
  | ActionSetConfigValue
  | ActionRemoveMatch
  | ActionRemoveAllMatches
  | ActionSetFilterState<TPluginState>;
