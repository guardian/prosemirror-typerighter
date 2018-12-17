import flatten from "lodash/flatten";
import { EventEmitter } from "./EventEmitter";
import {
  IValidationError,
  IValidationInput,
  IValidationOutput
} from "../interfaces/IValidation";
import { IValidationAPIAdapter } from "../interfaces/IValidationAPIAdapter";
import IValidationService from "../interfaces/IValidationService";
import Store from "../store";
import { Commands } from "../commands";

export const ValidationEvents = {
  VALIDATION_SUCCESS: "VALIDATION_SUCCESS",
  VALIDATION_ERROR: "VALIDATION_ERROR"
};

/**
 * The validation service. Calls to validate() begin validations
 * for ranges. Validation results and errors are emitted as events.
 */
class ValidationService extends EventEmitter implements IValidationService {
  constructor(
    private store: Store,
    private commands: Commands,
    private adapter: IValidationAPIAdapter
  ) {
    super();
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
