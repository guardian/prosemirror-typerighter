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
  constructor(private apiUrl: string) {
    super();
  }

  /**
   * Validate a Prosemirror node, restricting checks to ranges if they're supplied.
   */
  public async validate(inputs: ValidationInput[], id: string | number) {
    const results = await Promise.all(
      inputs.map(async input => {
        const body = new URLSearchParams();
        const validation = {
          id,
          validationInputs: inputs
        };
        this.addRunningValidation(validation);
        try {
          const response = await fetch(this.apiUrl, {
            method: "POST",
            headers: new Headers({
              "Content-Type": "application/json"
            }),
            body: JSON.stringify({
              text: input.str
            })
          });
          const validationData: LTResponse = await response.json();
          const validationOutputs: ValidationOutput[] = validationData.results.map(
            match => ({
              str: input.str,
              from: input.from + match.fromPos,
              to: input.from + match.toPos,
              annotation: match.message,
              type: match.rule.description,
              suggestions: match.suggestedReplacements
            })
          );
          this.handleCompleteValidation(id, validationOutputs);
          return validationOutputs;
        } catch (e) {
          console.log(e.message)
          this.handleError(input, id, e.status, e.message);
          return [
            {
              validationInput: input,
              id,
              message: e.message,
              status: e.status
            }
          ];
        }
      })
    );
    return flatten<ValidationError | ValidationOutput>(results);
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
    status: number,
    message: string
  ) => {
    console.log(ValidationEvents.VALIDATION_ERROR);
    this.emit(ValidationEvents.VALIDATION_ERROR, {
      validationInput,
      id,
      message,
      status
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
    console.log(ValidationEvents.VALIDATION_SUCCESS, validationOutputs);
    this.emit(ValidationEvents.VALIDATION_SUCCESS, {
      id,
      validationOutputs
    });
    this.removeRunningValidation(completeValidation);
  };
}

export default ValidationService;
