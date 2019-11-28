import Match from "./Match";
import { Component, h } from "preact";
import { IStateHoverInfo, IPluginState } from "../state/reducer";
import { selectMatchByMatchId } from "../state/selectors";
import { IMatch } from "../interfaces/IMatch";
import Store, { STORE_EVENT_NEW_STATE, IStoreEvents } from "../store";
import { ApplySuggestionOptions } from "../commands";

interface IState {
  left: number | undefined;
  top: number | undefined;
  hoverInfo: IStateHoverInfo | undefined;
  match: IMatch | undefined;
  isVisible: boolean;
}
interface IProps<TMatch extends IMatch> {
  store: Store<TMatch, IStoreEvents<TMatch>>;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
  // The element that contains the tooltips. Tooltips will be positioned
  // within this element.
  containerElement?: HTMLElement;
}

/**
 * An overlay to display match tooltips. Subscribes to hover events.
 */
class MatchOverlay<
  TMatch extends IMatch = IMatch
> extends Component<IProps<TMatch>, IState> {
  public state: IState = {
    isVisible: false,
    left: undefined,
    top: undefined,
    hoverInfo: undefined,
    match: undefined
  };
  private decorationRef:
    | Match<TMatch>
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
    const { match, left, top } = this.state;
    if (!match || left === undefined || top === undefined) {
      return null;
    }
    return (
      <div class="TyperighterPlugin__overlay" onMouseOver={this.handleMouseOver}>
        <div
          class="TyperighterPlugin__decoration-container"
          style={{
            // We hoist top slightly to ensure that the rendered element overlaps the
            // span that triggered the overlay -- if the mouse falls through a gap it
            // will trigger a mouseleave event that will close the overlay.
            top: top - 1,
            left
          }}
        >
          <Match
            ref={_ => (this.decorationRef = _)}
            match={match}
            applySuggestions={this.props.applySuggestions}
          />
        </div>
      </div>
    );
  }

  private handleMouseOver = (e: MouseEvent) => e.stopPropagation();

  private handleNotify = (state: IPluginState<IMatch>) => {
    const newState = {
      isVisible: false,
      left: 0,
      top: 0
    };
    if (state.hoverId && state.hoverInfo) {
      const match = selectMatchByMatchId(state, state.hoverId);
      return this.setState({
        hoverInfo: state.hoverInfo,
        match: match,
        ...newState
      });
    }
    this.setState({
      hoverInfo: undefined,
      match: undefined,
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

export default MatchOverlay;
