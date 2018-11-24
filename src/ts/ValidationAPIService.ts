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
        body.append(
          "data",
          JSON.stringify({
            annotation: [
              {
                text: input.str
              }
            ]
          })
        );
        body.append("language", "en-US");
        const validation = {
          id,
          validationInputs: inputs
        };
        this.addRunningValidation(validation);
        const response = await fetch(this.apiUrl, {
          method: "POST",
          headers: new Headers({
            "Content-Type": "x-www-form-urlencoded"
          }),
          body
        });
        if (response.status !== 200) {
          this.handleError(input, id, response.status, response.statusText);
          return [
            {
              validationInput: input,
              id,
              message: response.statusText,
              status: response.status
            }
          ];
        }
        const validationData: LTResponse = await response.json();
        const validationOutputs: ValidationOutput[] = validationData.matches.map(
          match => ({
            str: match.sentence,
            from: input.from + match.offset,
            to: input.from + match.offset + match.length,
            annotation: match.message,
            type: match.rule.description,
            suggestions: match.replacements.map(_ => _.value)
          })
        );
        this.handleCompleteValidation(id, validationOutputs);
        return validationOutputs;
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
    this.emit(ValidationEvents.VALIDATION_SUCCESS, {
      id,
      validationOutputs
    });
    this.removeRunningValidation(completeValidation);
  };
}

export default ValidationService;
