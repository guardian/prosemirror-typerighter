import {
  IValidationInput,
  IValidationOutput,
  ICategory
} from "../interfaces/IValidation";
import { IValidationAPIAdapter } from "../interfaces/IValidationAPIAdapter";
import Store, {
  STORE_EVENT_NEW_VALIDATION,
  STORE_EVENT_NEW_DIRTIED_RANGES
} from "../store";
import { Commands } from "../commands";
import { selectAllValidationsInFlight } from "../state/state";
import v4 from "uuid/v4";

/**
 * An example validation service. Calls to validate() begin validations
 * for ranges, configured via the supplied adapter. Validation results and
 * errors dispatch the appropriate Prosemirror commands.
 */
class ValidationService<TValidationOutput extends IValidationOutput> {
  // The current throttle duration, which increases during backoff.
  private currentThrottle: number;
  private currentCategories = [] as ICategory[];
  private allCategories = [] as ICategory[];
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
    this.store.on(
      STORE_EVENT_NEW_VALIDATION,
      (validationSetId, validationsInFlight) => {
        // If we have a new validation, send it to the validation service.
        this.validate(validationSetId, validationsInFlight);
      }
    );
    this.store.on(STORE_EVENT_NEW_DIRTIED_RANGES, () => {
      this.scheduleValidation();
    });
  }

  /**
   * Get all of the available categories from the validation service.
   * @param validationInput
   */
  public fetchCategories = async () => {
    this.allCategories = await this.adapter.fetchCategories();
    return this.allCategories;
  };

  public getCurrentCategories = () => this.currentCategories;

  public addCategory = (categoryId: string) => {
    const category = this.allCategories.find(_ => _.id === categoryId);
    if (!category) {
      return;
    }
    this.currentCategories.push(category);
  };

  public removeCategory = (categoryId: string) => {
    this.currentCategories = this.currentCategories.filter(
      _ => _.id !== categoryId
    );
  };

  /**
   * Validate a Prosemirror node, restricting checks to ranges if they're supplied.
   */
  public async validate(
    validationSetId: string,
    validationInputs: IValidationInput[]
  ) {
    this.adapter.fetchValidationOutputs(
      validationSetId,
      validationInputs,
      this.currentCategories.map(_ => _.id),
      this.commands.applyValidationResult,
      this.commands.applyValidationError
    );
  }

  /**
   * Request a validation. If we already have validations in flight,
   * defer it until the next throttle window.
   */
  public requestValidation() {
    this.validationPending = false;
    const pluginState = this.store.getState();
    if (!pluginState || selectAllValidationsInFlight(pluginState).length) {
      return this.scheduleValidation();
    }
    const validationSetId = v4();
    this.commands.validateDirtyRanges(validationSetId);
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
