/**
 * @module createValidationPlugin
 */

import {
  IBlock,
  IMatches,
  ICategory,
  IValidationResponse,
  IValidationError
} from "./IValidation";

/**
 * @internal
 */
export declare class IValidationAPIAdapter<
  TValidationOutput extends IMatches = IMatches
> {
  /**
   * Fetch the validation outputs for the given inputs.
   */
  public fetchMatches: (
    requestId: string,
    input: IBlock[],
    categoryIds: string[],
    onValidationReceived: TValidationReceivedCallback<TValidationOutput>,
    onValidationError: TValidationErrorCallback,
    onValidationComplete: TValidationWorkCompleteCallback
  ) => void;

  /**
   * Fetch the currently available validation categories.
   */
  public fetchCategories: () => Promise<ICategory[]>;

  constructor(apiUrl: string);
}

export type TValidationReceivedCallback<
  TValidationOutput extends IMatches = IMatches
> = (response: IValidationResponse<TValidationOutput>) => void;

export type TValidationErrorCallback = (
  validationError: IValidationError
) => void;

export type TValidationWorkCompleteCallback = (requestId: string) => void;
