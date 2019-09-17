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

export const VALIDATION_REQUEST_FOR_DIRTY_RANGES = "VAlIDATION_REQUEST_START";
export const VALIDATION_REQUEST_FOR_DOCUMENT =
  "VALIDATION_REQUEST_FOR_DOCUMENT";
export const VALIDATION_REQUEST_SUCCESS = "VALIDATION_REQUEST_SUCCESS";
export const VALIDATION_REQUEST_ERROR = "VALIDATION_REQUEST_ERROR";
export const NEW_HOVER_ID = "NEW_HOVER_ID";
export const SELECT_VALIDATION = "SELECT_VALIDATION";
export const APPLY_NEW_DIRTY_RANGES = "HANDLE_NEW_DIRTY_RANGES";
export const SET_DEBUG_STATE = "SET_DEBUG_STATE";
export const SET_VALIDATE_ON_MODIFY_STATE = "SET_VALIDATE_ON_MODIFY_STATE";

/**
 * Action creators.
 */

export const validationRequestForDirtyRanges = (
  validationSetId: string,
  categoryIds: string[]
) => ({
  type: VALIDATION_REQUEST_FOR_DIRTY_RANGES as typeof VALIDATION_REQUEST_FOR_DIRTY_RANGES,
  payload: { validationSetId, categoryIds }
});
export type ActionValidationRequestForDirtyRanges = ReturnType<
  typeof validationRequestForDirtyRanges
>;

export const validationRequestForDocument = (
  validationSetId: string,
  categoryIds: string[]
) => ({
  type: VALIDATION_REQUEST_FOR_DOCUMENT as typeof VALIDATION_REQUEST_FOR_DOCUMENT,
  payload: { validationSetId, categoryIds }
});
export type ActionValidationRequestForDocument = ReturnType<
  typeof validationRequestForDocument
>;

export const validationRequestSuccess = <TBlockMatches extends IMatches>(
  response: IValidationResponse<TBlockMatches>
) => ({
  type: VALIDATION_REQUEST_SUCCESS as typeof VALIDATION_REQUEST_SUCCESS,
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
  type: VALIDATION_REQUEST_ERROR as typeof VALIDATION_REQUEST_ERROR,
  payload: { validationError }
});
export type ActionValidationRequestError = ReturnType<
  typeof validationRequestError
>;

export const newHoverIdReceived = (
  hoverId: string | undefined,
  hoverInfo?: IStateHoverInfo | undefined
) => ({
  type: NEW_HOVER_ID as typeof NEW_HOVER_ID,
  payload: { hoverId, hoverInfo }
});
export type ActionNewHoverIdReceived = ReturnType<typeof newHoverIdReceived>;

export const applyNewDirtiedRanges = (ranges: IRange[]) => ({
  type: APPLY_NEW_DIRTY_RANGES as typeof APPLY_NEW_DIRTY_RANGES,
  payload: { ranges }
});
export type ActionHandleNewDirtyRanges = ReturnType<
  typeof applyNewDirtiedRanges
>;

export const selectMatch = (matchId: string) => ({
  type: SELECT_VALIDATION as typeof SELECT_VALIDATION,
  payload: { matchId }
});
export type ActionSelectValidation = ReturnType<typeof selectMatch>;

export const setDebugState = (debug: boolean) => ({
  type: SET_DEBUG_STATE as typeof SET_DEBUG_STATE,
  payload: { debug }
});
export type ActionSetDebugState = ReturnType<typeof setDebugState>;

export const setValidateOnModifyState = (validateOnModify: boolean) => ({
  type: SET_VALIDATE_ON_MODIFY_STATE as typeof SET_VALIDATE_ON_MODIFY_STATE,
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
  | ActionSelectValidation
  | ActionHandleNewDirtyRanges
  | ActionSetDebugState
  | ActionSetValidateOnModifyState;
