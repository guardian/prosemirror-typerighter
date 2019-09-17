import {
  IValidationError,
  IValidationResponse,
  IRange,
  IMatches
} from "../interfaces/IValidation";
import { IStateHoverInfo } from "./reducer";

/**
 * Action types.
 */

export const VALIDATION_REQUEST_FOR_DIRTY_RANGES = "VAlIDATION_REQUEST_START" as const;
export const VALIDATION_REQUEST_FOR_DOCUMENT = "VALIDATION_REQUEST_FOR_DOCUMENT" as const;
export const VALIDATION_REQUEST_SUCCESS = "VALIDATION_REQUEST_SUCCESS" as const;
export const VALIDATION_REQUEST_ERROR = "VALIDATION_REQUEST_ERROR" as const;
export const VALIDATION_REQUEST_COMPLETE = "VALIDATION_REQUEST_COMPLETE" as const;
export const NEW_HOVER_ID = "NEW_HOVER_ID" as const;
export const SELECT_MATCH = "SELECT_MATCH" as const;
export const APPLY_NEW_DIRTY_RANGES = "HANDLE_NEW_DIRTY_RANGES" as const;
export const SET_DEBUG_STATE = "SET_DEBUG_STATE" as const;
export const SET_VALIDATE_ON_MODIFY_STATE = "SET_VALIDATE_ON_MODIFY_STATE" as const;

/**
 * Action creators.
 */

export const validationRequestForDirtyRanges = (
  requestId: string,
  categoryIds: string[]
) => ({
  type: VALIDATION_REQUEST_FOR_DIRTY_RANGES,
  payload: { requestId, categoryIds }
});
export type ActionValidationRequestForDirtyRanges = ReturnType<
  typeof validationRequestForDirtyRanges
>;

export const validationRequestForDocument = (
  requestId: string,
  categoryIds: string[]
) => ({
  type: VALIDATION_REQUEST_FOR_DOCUMENT,
  payload: { requestId, categoryIds }
});
export type ActionValidationRequestForDocument = ReturnType<
  typeof validationRequestForDocument
>;

export const validationRequestSuccess = <TBlockMatches extends IMatches>(
  response: IValidationResponse<TBlockMatches>
) => ({
  type: VALIDATION_REQUEST_SUCCESS,
  payload: { response }
});
// tslint:disable-next-line:interface-over-type-literal
export type ActionValidationResponseReceived<
  TValidationOutput extends IMatches
> = {
  type: "VALIDATION_REQUEST_SUCCESS";
  payload: { response: IValidationResponse<TValidationOutput> };
};

export const validationRequestError = (validationError: IValidationError) => ({
  type: VALIDATION_REQUEST_ERROR,
  payload: { validationError }
});
export type ActionValidationRequestError = ReturnType<
  typeof validationRequestError
>;

export const validationRequestComplete = (requestId: string) => ({
  type: VALIDATION_REQUEST_COMPLETE,
  payload: { requestId }
});
export type ActionValidationRequestComplete = ReturnType<
  typeof validationRequestComplete
>;

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
export type ActionSelectValidation = ReturnType<typeof selectMatch>;

export const setDebugState = (debug: boolean) => ({
  type: SET_DEBUG_STATE,
  payload: { debug }
});
export type ActionSetDebugState = ReturnType<typeof setDebugState>;

export const setValidateOnModifyState = (validateOnModify: boolean) => ({
  type: SET_VALIDATE_ON_MODIFY_STATE,
  payload: { validateOnModify }
});
export type ActionSetValidateOnModifyState = ReturnType<
  typeof setValidateOnModifyState
>;

export type Action<TValidationMeta extends IMatches> =
  | ActionNewHoverIdReceived
  | ActionValidationResponseReceived<TValidationMeta>
  | ActionValidationRequestForDirtyRanges
  | ActionValidationRequestForDocument
  | ActionValidationRequestError
  | ActionValidationRequestComplete
  | ActionSelectValidation
  | ActionHandleNewDirtyRanges
  | ActionSetDebugState
  | ActionSetValidateOnModifyState;
