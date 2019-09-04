import { Component, h } from "preact";
import Store, { STORE_EVENT_NEW_STATE } from "../store";
import { IPluginState } from "../state";
import { IValidationOutput } from "../interfaces/IValidation";

interface IProps {
  store: Store<IValidationOutput>;
  setDebugState: (debug: boolean) => void;
  setValidateOnModifyState: (validate: boolean) => void;
  validateDocument: () => void;
}

interface IState {
  pluginState?: IPluginState<IValidationOutput>;
  isOpen: boolean;
}

/**
 * A sidebar to display current validations and allow users to apply suggestions.
 */
class ValidationControls extends Component<IProps, IState> {
  public state = {
    isOpen: false
  } as IState;
  public componentWillMount() {
    this.props.store.on(STORE_EVENT_NEW_STATE, this.handleNotify);
  }

  public render() {
    const { setDebugState, setValidateOnModifyState } = this.props;
    const { debug = false, validateOnModify = false } =
      this.state.pluginState || {};
    const { isOpen } = this.state;
    return (
      <div className="Sidebar__section">
        <div
          className="Sidebar__header Sidebar__header-toggle"
          onClick={this.toggleOpenState}
        >
          Controls
          <div className="Sidebar__toggle-label">Show more</div>
          <div
            className="Sidebar__toggle"
            style={{ transform: isOpen ? "" : "rotate(-90deg)" }}
          >
            ▼
          </div>
        </div>
        <div className="Sidebar__content">
          {isOpen && (
            <div>
              <div className="ValidationControls__row">
                <label
                  className="ValidationControls__label"
                  for="ValidationControls__validate-on-modify"
                >
                  Validate when the document is modified
                </label>
                <div class="ValidationControls__input">
                  <input
                    type="checkbox"
                    id="ValidationControls__validate-on-modify"
                    checked={validateOnModify}
                    className="Input"
                    onClick={() => setValidateOnModifyState(!validateOnModify)}
                  />
                </div>
              </div>
              <div className="ValidationControls__row">
                <label
                  className="ValidationControls__label"
                  for="ValidationControls__show-dirty-ranges"
                >
                  Show dirty and pending ranges
                </label>
                <div class="ValidationControls__input">
                  <input
                    id="ValidationControls__show-dirty-ranges"
                    type="checkbox"
                    checked={debug}
                    className="Input"
                    onClick={() => setDebugState(!debug)}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="ValidationControls__row">
            <button className="Button" onClick={this.props.validateDocument}>
              Validate whole document
            </button>
          </div>
        </div>
      </div>
    );
  }
  private handleNotify = (state: IPluginState<IValidationOutput>) => {
    this.setState({ pluginState: state });
  };
  private toggleOpenState = () => this.setState({ isOpen: !this.state.isOpen });
}

export default ValidationControls;
