import ValidationOutput from "./ValidationOutput";
import { Component, h } from "preact";
import { IStateHoverInfo, IPluginState } from "../state/reducer";
import { selectBlockMatchesByMatchId } from "../state/selectors";
import { IMatches } from "../interfaces/IValidation";
import Store, { STORE_EVENT_NEW_STATE, IStoreEvents } from "../store";
import { ApplySuggestionOptions } from "../commands";

interface IState {
  left: number | undefined;
  top: number | undefined;
  hoverInfo: IStateHoverInfo | undefined;
  validationOutput: IMatches | undefined;
  isVisible: boolean;
}
interface IProps<TValidationOutput extends IMatches> {
  store: Store<TValidationOutput, IStoreEvents<TValidationOutput>>;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
  // The element that contains the tooltips. Tooltips will be positioned
  // within this element.
  containerElement?: HTMLElement;
}

/**
 * An overlay to display validation tooltips. Subscribes to hover events.
 */
class ValidationOverlay<
  TValidationOutput extends IMatches = IMatches
> extends Component<IProps<TValidationOutput>, IState> {
  public state: IState = {
    isVisible: false,
    left: undefined,
    top: undefined,
    hoverInfo: undefined,
    validationOutput: undefined
  };
  private decorationRef:
    | ValidationOutput<TValidationOutput>
    | undefined = undefined;

  public componentWillMount() {
    this.props.store.on(STORE_EVENT_NEW_STATE, this.handleNotify);
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
          style={{
            // We hoist top slightly to ensure that the rendered element overlaps the
            // span that triggered the overlay -- if the mouse falls through a gap it
            // will trigger a mouseleave event that will close the overlay.
            top: top - 1,
            left
          }}
        >
          <ValidationOutput
            ref={_ => (this.decorationRef = _)}
            validationOutput={validationOutput}
            applySuggestions={this.props.applySuggestions}
          />
        </div>
      </div>
    );
  }

  private handleMouseOver = (e: MouseEvent) => e.stopPropagation();

  private handleNotify = (state: IPluginState<IMatches>) => {
    const newState = {
      isVisible: false,
      left: 0,
      top: 0
    };
    if (state.hoverId && state.hoverInfo) {
      const validationOutput = selectBlockMatchesByMatchId(state, state.hoverId);
      return this.setState({
        hoverInfo: state.hoverInfo,
        validationOutput,
        ...newState
      });
    }
    this.setState({
      hoverInfo: undefined,
      validationOutput: undefined,
      ...newState
    });
  };

  private getCoordsFromHoverEvent = () => {
    if (!this.decorationRef || !this.state.hoverInfo) {
      return { left: 0, top: 0 };
    }

    // Get the ideal tooltip position.
    const { left: tooltipLeft, top: tooltipTop } = this.getTooltipCoords(
      this.state.hoverInfo
    );

    const maxLeft = this.props.containerElement
      ? this.props.containerElement.clientWidth -
        this.decorationRef.ref!.offsetWidth
      : Infinity;

    const maxTop = this.props.containerElement
      ? this.props.containerElement.clientHeight -
        this.decorationRef.ref!.offsetHeight
      : Infinity;

    return {
      left: tooltipLeft < maxLeft ? tooltipLeft : maxLeft,
      top:
        tooltipTop < maxTop
          ? tooltipTop
          : maxTop - this.state.hoverInfo.height * 2
    };
  };

  private getTooltipCoords = (hoverInfo: IStateHoverInfo) => {
    // The mouse offset isn't an integer, so we round it here to avoid oddness.
    // @todo -- the plus three is a bit of a hack based on manual testing, but
    // we should figure out why this is necessary and remove if possible.
    const isHoveringOverFirstLine =
      hoverInfo.heightOfSingleLine + 3 >= Math.floor(hoverInfo.mouseOffsetY);
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
