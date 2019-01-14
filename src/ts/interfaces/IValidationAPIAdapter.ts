/**
 * @module createValidationPlugin
 */

import {
  IValidationInput,
  IValidationOutput,
  IDefaultValidationMeta
} from "./IValidation";

/**
 * @internal
 */
export type IValidationAPIAdapter<TValidationMeta = IDefaultValidationMeta> = (
  input: IValidationInput
) => Promise<Array<IValidationOutput<TValidationMeta>>>;

type IValidationAPIAdapterCreator<TValidationMeta = IDefaultValidationMeta> = (
  apiUrl: string
) => IValidationAPIAdapter<TValidationMeta>;

export default IValidationAPIAdapterCreator;
