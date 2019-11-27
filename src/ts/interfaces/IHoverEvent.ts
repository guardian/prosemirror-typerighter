import { IStateHoverInfo } from "../state/reducer";
import { IMatches } from "./IValidation";

interface IHoverEvent {
  hoverInfo: IStateHoverInfo | undefined;
  validationOutput: IMatches | undefined;
}

export default IHoverEvent;
