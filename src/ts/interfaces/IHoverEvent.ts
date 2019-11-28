import { IStateHoverInfo } from "../state/reducer";
import { IMatch } from "./IMatch";

interface IHoverEvent {
  hoverInfo: IStateHoverInfo | undefined;
  match: IMatch | undefined;
}

export default IHoverEvent;
