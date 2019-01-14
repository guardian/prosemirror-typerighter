/**
 * @module createValidationPlugin
 */

import {
  IValidationInput,
  IValidationOutput,
  IBaseValidationOutput
} from "./IValidation";

/**
 * @internal
 */
export type IValidationAPIAdapter<TValidationMeta = IBaseValidationOutput> = (
  input: IValidationInput
) => Promise<Array<IValidationOutput<TValidationMeta>>>;

type IValidationAPIAdapterCreator<TValidationMeta = IBaseValidationOutput> = (
  apiUrl: string
) => IValidationAPIAdapter<TValidationMeta>;

export default IValidationAPIAdapterCreator;
