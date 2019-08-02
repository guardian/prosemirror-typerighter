/**
 * @module createValidationPlugin
 */

import { IValidationInput, IValidationOutput, ICategory } from "./IValidation";

/**
 * @internal
 */
export interface IValidationAPIAdapter<TValidationOutput = IValidationOutput> {
  fetchValidationOutputs: (
    input: IValidationInput,
    categoryIds?: string[]
  ) => Promise<TValidationOutput[]>;
  fetchCategories: () => Promise<ICategory[]>;
}
