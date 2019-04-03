import clamp from 'lodash/clamp';
import ValidationOutput from './ValidationOutputContainer';
import { Component, h } from 'preact';
import { IStateHoverInfo, selectValidationById, IPluginState } from '../state';
import { IValidationOutput, IBaseValidationOutput } from '../interfaces/IValidation';
import Store, { STORE_EVENT_NEW_STATE } from '../store';
import { ApplySuggestionOptions } from '../commands';

interface IState {
  left: number | undefined;
  top: number | undefined;
  hoverInfo: IStateHoverInfo | undefined;
  validationOutput: IValidationOutput | undefined;
  isVisible: boolean;
}
interface IProps {
  store: Store<IBaseValidationOutput>;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
}

/**
 * An overlay to display validation tooltips. Subscribes to hover events.
 */
class ValidationOverlay extends Component<IProps, IState> {
  public state: IState = {
    isVisible: false,
    left: undefined,
    top: undefined,
    hoverInfo: undefined,
    validationOutput: undefined
  };
  private decorationRef: ValidationOutput;

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
            {...validationOutput}
            applySuggestions={this.props.applySuggestions}
          />
        </div>
      </div>
    );
  }

  private handleMouseOver = (e: MouseEvent) => e.stopPropagation();

  private handleNotify = (state: IPluginState<IBaseValidationOutput>) => {
    const newState = {
      isVisible: false,
      left: 0,
      top: 0
    }
    if (state.hoverId && state.hoverInfo) {
      const validationOutput = selectValidationById(state, state.hoverId);
      return this.setState({
        hoverInfo: state.hoverInfo,
        validationOutput,
        ...newState
      });
    }
    this.setState({
      hoverInfo: undefined,
      validationOutput: undefined,
      ...newState,
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

    // Fit the ideal position to the viewport.
    const left = clamp(
      tooltipLeft || 0,
      0,
      document.body.clientWidth - this.decorationRef.ref.offsetTop
    );
    const top = clamp(
      tooltipTop || 0,
      0,
      document.body.clientHeight - this.decorationRef.ref.offsetHeight
    );
    return { left, top };
  };

  private getTooltipCoords = (hoverInfo: IStateHoverInfo) => {
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
