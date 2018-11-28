import { ValidationOutput } from "./Validation";

interface HoverEvent {
  hoverLeft: number | undefined;
  hoverTop: number | undefined;
  validationOutput: ValidationOutput | undefined;
}

export default HoverEvent;
