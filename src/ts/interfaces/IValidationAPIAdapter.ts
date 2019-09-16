/**
 * @module createValidationPlugin
 */

import {
  IBlockQuery,
  IBlockMatches,
  ICategory,
  IValidationResponse,
  IValidationError
} from "./IValidation";

/**
 * @internal
 */
export declare class IValidationAPIAdapter<
  TValidationOutput extends IBlockMatches = IBlockMatches
> {
  /**
   * Fetch the validation outputs for the given inputs.
   */
  public fetchMatches: (
    validationSetId: string,
    input: IBlockQuery[],
    categoryIds: string[],
    onValidationReceived: TValidationReceivedCallback<TValidationOutput>,
    onValidationError: TValidationErrorCallback
  ) => void;

  /**
   * Fetch the currently available validation categories.
   */
  public fetchCategories: () => Promise<ICategory[]>;

  constructor(
    apiUrl: string,
    onValidationReceived: TValidationReceivedCallback,
    onValidationError: TValidationErrorCallback
  );
}

export type TValidationReceivedCallback<
  TValidationOutput extends IBlockMatches = IBlockMatches
> = (response: IValidationResponse<TValidationOutput>) => void;

export type TValidationErrorCallback = (
  validationError: IValidationError
) => void;
