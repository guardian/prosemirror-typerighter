import { Component, h, Ref } from "preact";
import HoverEvent from "../interfaces/HoverEvent";
import Decoration from "./Decoration";
import clamp from "lodash/clamp";
import { ValidationOutput } from "../interfaces/Validation";

interface State {
  left: number | undefined;
  top: number | undefined;
  validationOutput: ValidationOutput | undefined;
  isVisible: boolean;
}
interface Props {
  subscribe: (callback: (hoverEvent: HoverEvent) => void) => () => void;
  applySuggestion: (suggestion: string, from: number, to: number) => void;
}

class ValidationOverlay extends Component<Props, State> {
  private decorationRef: Decoration;
  public state: State = {
    isVisible: false,
    left: undefined,
    top: undefined,
    validationOutput: undefined
  };
  public componentWillMount() {
    this.props.subscribe(this.handleValidationHoverEvent);
  }
  public render() {
    const { validationOutput, left, top } = this.state;
    if (!validationOutput || left === undefined || top === undefined) {
      return null;
    }
    return (
      <div class="ValidationPlugin__overlay">
        <div
          class="ValidationPlugin__decoration-container"
          style={{ top, left }}
          data-attr-validation-id={this.state.validationOutput!.id}
        >
          <Decoration
            ref={_ => (this.decorationRef = _)}
            {...validationOutput}
            applySuggestion={this.props.applySuggestion}
          />
        </div>
      </div>
    );
  }
  private handleValidationHoverEvent = (hoverEvent: HoverEvent) => {
    const { left, top } = this.getCoordsFromHoverEvent(hoverEvent);
    this.setState({
      ...hoverEvent,
      left,
      top
    });
  };
  private getCoordsFromHoverEvent = (hoverEvent: HoverEvent) => {
    console.log(
      "w",
      window.innerWidth,
      this.decorationRef && this.decorationRef.ref.offsetWidth
    );
    console.log(
      "h",
      window.innerHeight,
      this.decorationRef && this.decorationRef.ref.offsetHeight
    );
    if (!this.decorationRef) return { left: 0, top: 0 };
    const left = clamp(
      hoverEvent.hoverLeft || 0,
      0,
      window.innerWidth - this.decorationRef.ref.offsetWidth
    );
    const top = clamp(
      hoverEvent.hoverTop || 0,
      0,
      window.innerWidth - this.decorationRef.ref.offsetHeight
    );
    return { left, top };
  };
}

export default ValidationOverlay;
