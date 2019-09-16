import { IStateHoverInfo } from "../state/reducer";
import { IBlockMatches } from "./IValidation";

interface IHoverEvent {
  hoverInfo: IStateHoverInfo | undefined;
  validationOutput: IBlockMatches | undefined;
}

export default IHoverEvent;
