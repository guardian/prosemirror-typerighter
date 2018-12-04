import { ValidationError, ValidationInput, ValidationOutput } from "./IValidation";

export type IValidationAPIAdapter = (input: ValidationInput) => Promise<ValidationOutput[]>;
type IValidationAPIAdapterCreator = (apiUrl: string) => IValidationAPIAdapter;

export default IValidationAPIAdapterCreator;