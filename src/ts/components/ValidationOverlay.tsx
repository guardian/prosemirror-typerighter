import { Component, h } from "preact";
import HoverEvent from "../interfaces/HoverEvent";
import Decoration from "./Decoration";
import clamp from "lodash/clamp";
import { ValidationOutput } from "../interfaces/Validation";
import { StateHoverInfo } from "../state";

interface State {
  left: number | undefined;
  top: number | undefined;
  hoverInfo: StateHoverInfo | undefined;
  validationOutput: ValidationOutput | undefined;
  isVisible: boolean;
}
interface Props {
  subscribe: (callback: (hoverEvent: HoverEvent) => void) => () => void;
  applySuggestion: (suggestion: string, from: number, to: number) => void;
}

/**
 * An overlay to display validation tooltips. Subscribes to hover events.
 */
class ValidationOverlay extends Component<Props, State> {
  private decorationRef: Decoration;
  public state: State = {
    isVisible: false,
    left: undefined,
    top: undefined,
    hoverInfo: undefined,
    validationOutput: undefined
  };

  public componentWillMount() {
    this.props.subscribe(this.handleValidationHoverEvent);
  }

  public componentDidUpdate() {
    if (this.state.isVisible) {
      return;
    }
    const { left, top } = this.getCoordsFromHoverEvent();
    this.setState({
      isVisible: true,
      left,
      top
    });
  }

  public render() {
    const { validationOutput, left, top } = this.state;
    if (!validationOutput || left === undefined || top === undefined) {
      return null;
    }
    return (
      <div class="ValidationPlugin__overlay" onMouseOver={this.handleMouseOver}>
        <div
          class="ValidationPlugin__decoration-container"
          style={{ top: top - 1, left }}
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

  private handleMouseOver = (e: MouseEvent) => e.stopPropagation();

  private handleValidationHoverEvent = (hoverEvent: HoverEvent) => {
    this.setState({
      ...this.state,
      ...hoverEvent,
      isVisible: false,
      left: 0,
      top: 0
    });
  };

  private getCoordsFromHoverEvent = () => {
    if (!this.decorationRef || !this.state.hoverInfo)
      return { left: 0, top: 0 };

    // Get the ideal tooltip position.
    const { left: tooltipLeft, top: tooltipTop } = this.getTooltipCoords(
      this.state.hoverInfo
    );

    // Fit the ideal position to the viewport.
    const left = clamp(
      tooltipLeft || 0,
      0,
      window.innerWidth - this.decorationRef.ref.offsetTop
    );
    const top = clamp(
      tooltipTop || 0,
      0,
      window.innerWidth - this.decorationRef.ref.offsetHeight
    );
    return { left, top };
  };

  private getTooltipCoords = (hoverInfo: StateHoverInfo) => {
    // The mouse offset isn't an integer, so we round it here to avoid oddness.
    const isHoveringOverFirstLine =
      hoverInfo.heightOfSingleLine >= Math.floor(hoverInfo.mouseOffsetY);
    const left = isHoveringOverFirstLine
      ? hoverInfo.offsetLeft
      : hoverInfo.left;
    const top = isHoveringOverFirstLine
      ? hoverInfo.offsetTop + hoverInfo.heightOfSingleLine
      : hoverInfo.offsetTop + hoverInfo.height;
    return { left, top };
  };
}

export default ValidationOverlay;
