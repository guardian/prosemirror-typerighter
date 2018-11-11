import { ValidationOutput, ValidationInput } from "./interfaces/Validation";
import { Range } from "./interfaces/Validation";
import { EventEmitter } from "./EventEmitter";

export type RunningServiceValidation = {
  id: string | number;
  validationInputs: ValidationInput[];
};

export type RunningWorkerValidation = {
  id: string | number;
  validationInputs: ValidationInput[];
  promise: Promise<ValidationOutput[]>;
  omitOverlappingInputs: (inputs?: ValidationInput[]) => void;
};

/**
 * A base class to handle the state of running validations
 * and provide methods for common operations on that state.
 */
class ValidationStateManager<
  T extends RunningServiceValidation | RunningWorkerValidation
> extends EventEmitter {
  protected runningValidations: T[] = [];

  protected addRunningValidation = (rv: T) => {
    this.runningValidations.push(rv);
  };

  protected removeRunningValidation = (validation: T) => {
    this.runningValidations.splice(
      this.runningValidations.indexOf(validation),
      1
    );
  };

  protected findRunningValidation = (id: string | number) => {
    return this.runningValidations.find(_ => _.id === id);
  };

  /**
   * Get validation ids for the given ranges. If no ranges are supplied,
   * return all current validation ids.
   */
  public getRunningValidations = (ranges?: Range[]) => {
    // @todo: get validations by range
    return this.runningValidations;
  };
}

export default ValidationStateManager;
