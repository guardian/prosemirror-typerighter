/**
 * @module createValidationPlugin
 */

import { IValidationInput, IValidationOutput } from "./IValidation";

/**
 * @internal
 */
export type IValidationAPIAdapter = (input: IValidationInput) => Promise<IValidationOutput[]>;

type IValidationAPIAdapterCreator = (apiUrl: string) => IValidationAPIAdapter;

export default IValidationAPIAdapterCreator;