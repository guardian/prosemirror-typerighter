import { IValidationInput } from "../interfaces/IValidation";
import { IValidationAPIAdapter } from "../interfaces/IValidationAPIAdapter";
import Store, { STORE_EVENT_NEW_VALIDATION } from "../store";
import { Commands } from "../commands";

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
    this.store.on(STORE_EVENT_NEW_VALIDATION, validationInFlight => {
      // If we have a new validation, send it to the validation service.
      this.validate(validationInFlight.validationInput);
    });
  }

  /**
   * Validate a Prosemirror node, restricting checks to ranges if they're supplied.
   */
  public async validate(validationInput: IValidationInput) {
    try {
      const validationOutputs = await this.adapter(validationInput);
      this.commands.applyValidationResult({
        validationOutputs,
        validationInput
      });
      return validationOutputs;
    } catch (e) {
      this.commands.applyValidationError({
        validationInput,
        message: e.message
      });
      return {
        validationInput,
        message: e.message
      };
    }
  }
}

export default ValidationService;
