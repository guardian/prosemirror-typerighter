import {
  IValidationInput,
  IBaseValidationOutput
} from "../interfaces/IValidation";
import { IValidationAPIAdapter } from "../interfaces/IValidationAPIAdapter";
import Store, {
  STORE_EVENT_NEW_VALIDATION,
  STORE_EVENT_DOCUMENT_DIRTIED
} from "../store";
import { Commands } from "../commands";
import { selectValidationsInFlight } from "../state";

/**
 * An example validation service. Calls to validate() begin validations
 * for ranges, configured via the supplied adapter. Validation results and
 * errors dispatch the appropriate Prosemirror commands.
 */
class ValidationService<TValidationOutput extends IBaseValidationOutput> {
  // The current throttle duration, which increases during backoff.
  private currentThrottle: number;

  constructor(
    private store: Store<TValidationOutput>,
    private commands: Commands,
    private adapter: IValidationAPIAdapter<TValidationOutput>,
    // The initial throttle duration for pending validation requests.
    private initialThrottle = 2000,
    // The maximum possible throttle duration on backoff.
    private maxThrottle = 16000
  ) {
    this.currentThrottle = initialThrottle;
    this.store.on(STORE_EVENT_NEW_VALIDATION, validationInFlight => {
      // If we have a new validation, send it to the validation service.
      this.validate(validationInFlight.validationInput, validationInFlight.id);
    });
    this.store.on(STORE_EVENT_DOCUMENT_DIRTIED, () => this.requestValidation());
  }

  /**
   * Request a validation. If we already have validations in flight,
   * defer it until the next throttle window.
   */
  public requestValidation() {
    const pluginState = this.store.getState();
    if (!pluginState || selectValidationsInFlight(pluginState).length) {
      this.scheduleValidation();
    }
    this.commands.validateDirtyRangesCommand();
  }

  /**
   * Schedule a validation for the next throttle tick.
   */
  private scheduleValidation = () =>
    setTimeout(this.requestValidation, this.currentThrottle);

  /**
   * Validate a Prosemirror node, restricting checks to ranges if they're supplied.
   */
  private async validate(validationInput: IValidationInput, id: string) {
    try {
      const validationOutputs = await this.adapter(validationInput);
      this.commands.applyValidationResult({
        id,
        validationOutputs
      });
    } catch (e) {
      this.commands.applyValidationError({
        validationInput,
        id,
        message: e.message
      });
    }
  }
}

export default ValidationService;
