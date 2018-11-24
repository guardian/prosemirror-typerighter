import { ValidationInput, ValidationOutput, ValidationError } from "./Validation";

export type IValidationAPIAdapter = (input: ValidationInput) => Promise<ValidationOutput[]>;
type IValidationAPIAdapterCreator = (apiUrl: string) => IValidationAPIAdapter;

export default IValidationAPIAdapterCreator;