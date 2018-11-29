import { Component, h } from "preact";
import HoverEvent from "../interfaces/HoverEvent";
import Decoration from "./Decoration";

class ValidationOverlay extends Component<
  {
    subscribe: (callback: (hoverEvent: HoverEvent) => void) => () => void;
    applySuggestion: (suggestion: string, from: number, to: number) => void;
  },
  HoverEvent
> {
  public state: HoverEvent = {
    hoverLeft: undefined,
    hoverTop: undefined,
    validationOutput: undefined
  };
  public componentWillMount() {
    this.props.subscribe(this.handleValidationHoverEvent);
  }
  public handleValidationHoverEvent = (hoverEvent: HoverEvent) => {
    this.setState(hoverEvent);
  };
  public render() {
    const { validationOutput, hoverLeft, hoverTop } = this.state;
    if (!validationOutput || !hoverLeft || !hoverTop) {
      return null;
	  }
    return (
      <div class="ValidationPlugin__overlay">
        <div
          class="ValidationPlugin__decoration-container"
          style={{ top: hoverTop, left: hoverLeft }}
          data-attr-validation-id={this.state.validationOutput!.id}
        >
          <Decoration {...validationOutput} applySuggestion={this.props.applySuggestion} />
        </div>
      </div>
    );
  }
}

export default ValidationOverlay;
