import { EventEmitter } from "../services/EventEmitter";
import { IValidationError, IValidationInput, IValidationOutput } from "./IValidation";

/**
 * A service that receives requests for validation and emits responses.
 */
interface IValidationService extends EventEmitter {
	validate(inputs: IValidationInput[], id: string|number): Promise<Array<IValidationOutput|IValidationError>>;
	cancelValidation(): void;
}


export default IValidationService;