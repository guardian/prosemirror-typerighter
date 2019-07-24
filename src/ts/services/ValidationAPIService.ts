import { IValidationInput, IValidationOutput } from "../interfaces/IValidation";
import { IValidationAPIAdapter } from "../interfaces/IValidationAPIAdapter";
import Store, {
  STORE_EVENT_NEW_VALIDATION,
  STORE_EVENT_NEW_DIRTIED_RANGES
} from "../store";
import { Commands } from "../commands";
import { selectValidationsInFlight } from "../state";

/**
 * An example validation service. Calls to validate() begin validations
 * for ranges, configured via the supplied adapter. Validation results and
 * errors dispatch the appropriate Prosemirror commands.
 */
class ValidationService<TValidationOutput extends IValidationOutput> {
  // The current throttle duration, which increases during backoff.
  private currentThrottle: number;
  private validationPending = false;

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
      this.validate(validationInFlight.validationInput);
    });
    this.store.on(STORE_EVENT_NEW_DIRTIED_RANGES, () => {
      this.scheduleValidation();
    });
  }

  /**
   * Request a validation. If we already have validations in flight,
   * defer it until the next throttle window.
   */
  public requestValidation() {
    this.validationPending = false;
    const pluginState = this.store.getState();
    if (!pluginState || selectValidationsInFlight(pluginState).length) {
      return this.scheduleValidation();
    }
    this.commands.validateDirtyRangesCommand();
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

  /**
   * Schedule a validation for the next throttle tick.
   */
  private scheduleValidation = (): unknown => {
    if (this.validationPending) {
      return;
    }
    this.validationPending = true;
    setTimeout(() => this.requestValidation(), this.currentThrottle);
  };
}

export default ValidationService;
