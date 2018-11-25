import { ValidationOutput } from "./Validation";

interface HoverEvent {
	hoverRect: DOMRect | ClientRect | undefined;
    validationOutput: ValidationOutput | undefined;
}

export default HoverEvent;