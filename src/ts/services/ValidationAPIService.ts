import {
  IValidationInput,
  IDefaultValidationMeta
} from "../interfaces/IValidation";
import { IValidationAPIAdapter } from "../interfaces/IValidationAPIAdapter";
import Store, { STORE_EVENT_NEW_VALIDATION } from "../store";
import { Commands } from "../commands";

/**
 * An example validation service. Calls to validate() begin validations
 * for ranges, configured via the supplied adapter. Validation results and
 * errors dispatch the appropriate Prosemirror commands.
 */
class ValidationService<TValidationMeta extends IDefaultValidationMeta> {
  constructor(
    private store: Store<TValidationMeta>,
    private commands: Commands,
    private adapter: IValidationAPIAdapter<TValidationMeta>
  ) {
    this.store.on(STORE_EVENT_NEW_VALIDATION, validationInFlight => {
      // If we have a new validation, send it to the validation service.
      this.validate(validationInFlight.validationInput, validationInFlight.id);
    });
  }

  /**
   * Validate a Prosemirror node, restricting checks to ranges if they're supplied.
   */
  public async validate(validationInput: IValidationInput, id: string) {
    try {
      const validationOutputs = await this.adapter(validationInput);
      this.commands.applyValidationResult({
        id,
        validationOutputs
      });
      return validationOutputs;
    } catch (e) {
      this.commands.applyValidationError({
        validationInput,
        id,
        message: e.message
      });
      return {
        validationInput,
        message: e.message,
        id
      };
    }
  }
}

export default ValidationService;
