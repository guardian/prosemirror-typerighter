import flatten from "lodash/flatten";
import {
  IValidationError,
  IValidationInput,
  IValidationOutput
} from "../interfaces/IValidation";
import { IValidationAPIAdapter } from "../interfaces/IValidationAPIAdapter";
import Store from "../store";
import { Commands } from "../commands";

export const ValidationEvents = {
  VALIDATION_SUCCESS: "VALIDATION_SUCCESS",
  VALIDATION_ERROR: "VALIDATION_ERROR"
};

/**
 * An example validation service. Calls to validate() begin validations
 * for ranges, configured via the supplied adapter. Validation results and
 * errors dispatch the appropriate Prosemirror commands.
 */
class ValidationService {
  constructor(
    private store: Store,
    private commands: Commands,
    private adapter: IValidationAPIAdapter
  ) {
    this.store.subscribe((state, prevState) => {
      // If we have a new validation, send it to the validation service.
      if (!prevState.validationInFlight && state.validationInFlight) {
        this.validate(
          state.validationInFlight.validationInputs,
          state.trHistory[state.trHistory.length - 1].time
        );
      }
    });
  }

  /**
   * Validate a Prosemirror node, restricting checks to ranges if they're supplied.
   */
  public async validate(inputs: IValidationInput[], id: string | number) {
    const results = await Promise.all(
      inputs.map(async input => {
        try {
          const result = await this.adapter(input);
          this.handleCompleteValidation(id, input, result);
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
   * Handle an error.
   */
  public handleError = (
    validationInput: IValidationInput,
    id: string | number,
    message: string
  ) => {
    this.commands.applyValidationError({
      validationInput,
      id,
      message
    });
  };

  /**
   * Handle a completed validation.
   */
  private handleCompleteValidation = (
    id: string | number,
    validationInput: IValidationInput,
    validationOutputs: IValidationOutput[]
  ) => {
    this.commands.applyValidationResult({
      id,
      validationInput,
      validationOutputs
    });
  };
}

export default ValidationService;
