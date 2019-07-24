/**
 * @module createValidationPlugin
 */

import { IValidationInput, IValidationOutput } from "./IValidation";

/**
 * @internal
 */
export type IValidationAPIAdapter<TValidationOutput = IValidationOutput> = (
  input: IValidationInput
) => Promise<TValidationOutput[]>;

type IValidationAPIAdapterCreator<TValidationMeta = IValidationOutput> = (
  apiUrl: string
) => IValidationAPIAdapter<TValidationMeta>;

export default IValidationAPIAdapterCreator;
