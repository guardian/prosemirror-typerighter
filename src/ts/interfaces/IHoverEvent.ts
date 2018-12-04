import { IStateHoverInfo } from "../state";
import { IValidationOutput } from "./IValidation";

interface IHoverEvent {
  hoverInfo: IStateHoverInfo | undefined;
  validationOutput: IValidationOutput | undefined;
}

export default IHoverEvent;
