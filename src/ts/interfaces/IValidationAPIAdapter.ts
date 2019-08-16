/**
 * @module createValidationPlugin
 */

import {
  IValidationInput,
  IValidationOutput,
  ICategory,
  IValidationResponse,
  IValidationError
} from "./IValidation";

/**
 * @internal
 */
export declare class IValidationAPIAdapter<
  TValidationOutput extends IValidationOutput = IValidationOutput
> {
  /**
   * Fetch the validation outputs for the given inputs.
   */
  public fetchValidationOutputs: (
    validationSetId: string,
    input: IValidationInput[],
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
  TValidationOutput extends IValidationOutput = IValidationOutput
> = (response: IValidationResponse<TValidationOutput>) => void;

export type TValidationErrorCallback = (
  validationError: IValidationError
) => void;
