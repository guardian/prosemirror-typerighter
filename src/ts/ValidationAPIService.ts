import flatten from "lodash/flatten";
import { EventEmitter } from "./EventEmitter";
import {
  IValidationError,
  IValidationInput,
  IValidationOutput
} from "./interfaces/IValidation";
import { IValidationAPIAdapter } from "./interfaces/IVAlidationAPIAdapter";
import IValidationService from "./interfaces/IValidationService";

export const ValidationEvents = {
  VALIDATION_SUCCESS: "VALIDATION_SUCCESS",
  VALIDATION_ERROR: "VALIDATION_ERROR"
};

/**
 * The validation service. Calls to validate() begin validations
 * for ranges. Validation results and errors are emitted as events.
 */
class ValidationService extends EventEmitter implements IValidationService {
  constructor(private adapter: IValidationAPIAdapter) {
    super();
  }

  /**
   * Validate a Prosemirror node, restricting checks to ranges if they're supplied.
   */
  public async validate(inputs: IValidationInput[], id: string | number) {
    const results = await Promise.all(
      inputs.map(async input => {
        try {
          const result = await this.adapter(input);
          this.handleCompleteValidation(id, result);
          return result;
        } catch (e) {
          this.handleError(input, id, e.message);
          return {
            validationInput: input,
            message: e.message,
            id
          };
        }
      })
    );
    return flatten<IValidationOutput | IValidationError>(results);
  }

  /**
   * Cancel all running validations.
   */
  public cancelValidation = () => {
    this.cancelValidation();
  };

  /**
   * Handle an error.
   */
  public handleError = (
    validationInput: IValidationInput,
    id: string | number,
    message: string
  ) => {
    this.emit(ValidationEvents.VALIDATION_ERROR, {
      validationInput,
      id,
      message
    } as IValidationError);
  };

  /**
   * Handle a completed validation.
   */
  private handleCompleteValidation = (
    id: string | number,
    validationOutputs: IValidationOutput[]
  ) => {
    this.emit(ValidationEvents.VALIDATION_SUCCESS, {
      id,
      validationOutputs
    });
  };
}

export default ValidationService;
