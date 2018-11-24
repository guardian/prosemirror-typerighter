import {
  ValidationOutput,
  ValidationInput,
  ValidationError
} from "./interfaces/Validation";
import ValidationStateManager, {
  RunningServiceValidation
} from "./ValidationStateManager";
import IValidationService from "./interfaces/IValidationService";
import { LTResponse } from "./interfaces/LanguageTool";
import flatten from "lodash/flatten";
import IValidationAPIAdapterCreator, {
  IValidationAPIAdapter
} from "./interfaces/IVAlidationAPIAdapter";

const serviceName = "[validationAPIService]";

export const ValidationEvents = {
  VALIDATION_SUCCESS: "VALIDATION_SUCCESS",
  VALIDATION_ERROR: "VALIDATION_ERROR"
};

/**
 * The validation service. Calls to validate() begin validations
 * for ranges, which are returned via an event.
 */
class ValidationService extends ValidationStateManager<RunningServiceValidation>
  implements IValidationService {
  private adapter: IValidationAPIAdapter;
  constructor(apiUrl: string, adapterCreator: IValidationAPIAdapterCreator) {
    super();
    this.adapter = adapterCreator(apiUrl);
  }

  /**
   * Validate a Prosemirror node, restricting checks to ranges if they're supplied.
   */
  public async validate(inputs: ValidationInput[], id: string | number) {
    const results = await Promise.all(
      inputs.map(async input => {
        try {
          const outputs = await this.adapter(input);
          this.handleCompleteValidation(id, outputs);
          return outputs;
        } catch (e) {
          this.handleError(input, id, e.message);
          return {
            validationInput: input,
            id,
            message: e.message
          };
        }
      })
    );
    return flatten<ValidationOutput | ValidationError>(results);
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
  handleError = (
    validationInput: ValidationInput,
    id: string | number,
    message: string
  ) => {
    this.emit(ValidationEvents.VALIDATION_ERROR, {
      validationInput,
      id,
      message
    } as ValidationError);
  };

  /**
   * Handle a completed validation.
   */
  private handleCompleteValidation = (
    id: string | number,
    validationOutputs: ValidationOutput[]
  ) => {
    const completeValidation = this.findRunningValidation(id);
    if (!completeValidation) {
      return console.warn(
        `${serviceName} Received validation from worker, but no match in running validations for id ${id}`
      );
    }
    this.emit(ValidationEvents.VALIDATION_SUCCESS, {
      id,
      validationOutputs
    });
    this.removeRunningValidation(completeValidation);
  };
}

export default ValidationService;
