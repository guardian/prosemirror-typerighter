import { ValidationOutput } from "./Validation";
import { StateHoverInfo } from "../state";

interface HoverEvent {
  hoverInfo: StateHoverInfo | undefined;
  validationOutput: ValidationOutput | undefined;
}

export default HoverEvent;
