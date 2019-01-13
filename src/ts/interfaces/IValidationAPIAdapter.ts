/**
 * @module createValidationPlugin
 */

import { IValidationInput, IValidationOutput } from "./IValidation";

/**
 * @internal
 */
export type IValidationAPIAdapter<TValidationMeta> = (input: IValidationInput) => Promise<Array<IValidationOutput<TValidationMeta>>>;

type IValidationAPIAdapterCreator<TValidationMeta> = (apiUrl: string) => IValidationAPIAdapter<TValidationMeta>;

export default IValidationAPIAdapterCreator;