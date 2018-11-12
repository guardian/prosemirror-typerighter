import { Range } from "./interfaces/Validation";
import { ValidationOutput, ValidationInput } from "./interfaces/Validation";

export type WorkerEventTypes = "VALIDATE" | "CANCEl";

export const VALIDATE_REQUEST = "VALIDATE_REQUEST";
export const VALIDATE_RESPONSE = "VALIDATE_RESPONSE";
export const CANCEL_REQUEST = "CANCEL_REQUEST";
export const CANCEL_RESPONSE = "CANCEL_RESPONSE";

export type WorkerEvents =
  | {
      type: "VALIDATE_REQUEST";
      payload: {
        id: string;
        validationInputs: ValidationInput[];
        ranges: Range[];
      };
    }
  | {
      type: "VALIDATE_RESPONSE";
      payload: {
        id: string;
        validationOutputs: ValidationOutput[];
      };
    }
  | {
      type: "CANCEL_REQUEST";
    }
  | {
      type: "CANCEL_RESPONSE";
    };
