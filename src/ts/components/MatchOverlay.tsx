import Match from "./Match";
import { Component, h } from "preact";
import { IStateHoverInfo, IPluginState } from "../state/reducer";
import { selectMatchByMatchId } from "../state/selectors";
import { IMatch } from "../interfaces/IMatch";
import Store, { STORE_EVENT_NEW_STATE, IStoreEvents } from "../state/store";
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
  feedbackHref?: string;
  onIgnoreMatch?: (match: IMatch) => void;
}

/**
 * An overlay to display match tooltips. Subscribes to hover events.
 */
class MatchOverlay<TMatch extends IMatch = IMatch> extends Component<
  IProps<TMatch>,
  IState
> {
  public state: IState = {
    isVisible: false,
    left: undefined,
    top: undefined,
    hoverInfo: undefined,
    match: undefined
  };
  private matchRef: Match<TMatch> | undefined = undefined;

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
    const { applySuggestions, feedbackHref, onIgnoreMatch } = this.props;
    const { match, left, top } = this.state;
    if (!match || left === undefined || top === undefined) {
      return null;
    }
    return (
      <div
        class="TyperighterPlugin__overlay"
        onMouseOver={this.handleMouseOver}
      >
        <div
          class="TyperighterPlugin__decoration-container"
          style={{
            // We hoist top slightly to ensure that the rendered element overlaps the
            // span that triggered the overlay -- if the mouse falls through a gap it
            // will trigger a mouseleave event that will close the overlay.
            top: top - 5,
            left
          }}
        >
          <Match
            ref={_ => (this.matchRef = _)}
            match={match}
            applySuggestions={applySuggestions}
            feedbackHref={feedbackHref}
            onIgnoreMatch={onIgnoreMatch}
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
        match,
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
    if (!this.matchRef || !this.state.hoverInfo) {
      return { left: 0, top: 0 };
    }

    const {
      left: tooltipLeft,
      top: tooltipTop,
      maxLeft: toolTipMaxLeft
    } = this.getIdealTooltipCoords(this.state.hoverInfo);

    const maxLeft = this.props.containerElement
      ? (toolTipMaxLeft || this.props.containerElement.clientWidth) -
        this.matchRef.ref!.offsetWidth
      : Infinity;

    return {
      left: tooltipLeft < maxLeft ? tooltipLeft : maxLeft,
      top: tooltipTop
    };
  };

  private getIdealTooltipCoords = (hoverInfo: IStateHoverInfo) => {
    const spanRects = Array.from(hoverInfo.markerClientRects);
    const hoveredRect = spanRects.find(rect =>
      this.areCoordsWithinClientRect(
        hoverInfo.mouseClientX,
        hoverInfo.mouseClientY,
        rect
      )
    );
    const maxLeft =
      spanRects.length > 1
        ? Math.max(...spanRects.map(_ => _.right))
        : undefined;
    const absoluteLeft = hoveredRect ? hoveredRect.left : hoverInfo.mouseClientX;
    const absoluteTop = hoveredRect
      ? hoveredRect.top + hoveredRect.height
      : hoverInfo.mouseClientX;

    const left = absoluteLeft - hoverInfo.containerLeft;
    const top = absoluteTop - hoverInfo.containerTop;

    return { left, top, maxLeft };
  };

  private areCoordsWithinClientRect = (
    x: number,
    y: number,
    rect: DOMRect | ClientRect
  ): boolean => {
    // We seem to need some padding here to account for small discrepancies between
    // the mouse coords and the bounding box of the span rect.
    const padding = 2;
    const isInRect = !!(
      x >= rect.left - padding &&
      x <= rect.left + rect.width + padding &&
      y >= rect.top - padding &&
      y <= rect.top + rect.height + padding
    );
    return isInRect;
  };
}

export default MatchOverlay;
