import { Component, h } from "preact";
import HoverEvent from "../interfaces/HoverEvent";

class ValidationOverlay extends Component<
  {
    subscribe: (callback: (hoverEvent: HoverEvent) => void) => () => void;
  },
  HoverEvent
> {
  public state = {
    hoverRect: undefined,
    validationOutput: undefined
  };
  public componentWillMount() {
    this.props.subscribe(this.handleValidationHoverEvent);
  }
  public handleValidationHoverEvent = (hoverEvent: HoverEvent) => {
	  this.setState(hoverEvent);
  }
  public render() {
    return <div>{JSON.stringify(this.state)}</div>;
  }
}

export default ValidationOverlay;
