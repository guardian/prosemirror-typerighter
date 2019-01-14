import { Component, h } from "preact";
import Store, { STORE_EVENT_NEW_STATE } from "../store";
import { IPluginState } from "../state";
import { IBaseValidationOutput } from "../interfaces/IValidation";

interface IProps {
  store: Store<IBaseValidationOutput>;
  setDebugState: (debug: boolean) => void;
  validateDocument: () => void;
}

/**
 * A sidebar to display current validations and allow users to apply suggestions.
 */
class ValidationControls extends Component<IProps, IPluginState<IBaseValidationOutput>> {
  public componentWillMount() {
    this.props.store.on(STORE_EVENT_NEW_STATE, this.handleNotify);
  }

  public render() {
    const { setDebugState } = this.props;
    return (
      <div className="Sidebar__section">
        <div className="Sidebar__header">Controls</div>
        <div className="Sidebar__content">
          <div className="ValidationControls__row">
            <label className="ValidationControls__label">
              Debug mode <small>(makes dirty and pending ranges visible)</small>
            </label>
            <div class="ValidationControls__input">
              <input
                type="checkbox"
                checked={this.state.debug}
                className="Input"
                onClick={() => setDebugState(!this.state.debug)}
              />
            </div>
          </div>
          <div className="ValidationControls__row">
            <button className="Button" onClick={this.props.validateDocument}>Validate whole document</button>
          </div>
        </div>
      </div>
    );
  }
  private handleNotify = (state: IPluginState<IBaseValidationOutput>) => {
    this.setState(state);
  };
}

export default ValidationControls;
