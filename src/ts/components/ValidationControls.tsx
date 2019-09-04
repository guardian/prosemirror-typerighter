import { Component, h } from "preact";
import v4 from 'uuid/v4';
import Store, { STORE_EVENT_NEW_STATE } from "../store";
import { IPluginState } from "../state/state";
import { IValidationOutput, ICategory } from "../interfaces/IValidation";

interface IProps {
  store: Store<IValidationOutput>;
  setDebugState: (debug: boolean) => void;
  setValidateOnModifyState: (validate: boolean) => void;
  validateDocument: (validationSetId: string) => void;
  fetchCategories: () => Promise<ICategory[]>;
  getCurrentCategories: () => ICategory[];
  addCategory: (id: string) => void;
  removeCategory: (id: string) => void;
}

interface IState {
  pluginState?: IPluginState<IValidationOutput>;
  isOpen: boolean;
  allCategories: ICategory[];
  currentCategories: ICategory[];
  isLoadingCategories: boolean;
}

/**
 * A sidebar to display current validations and allow users to apply suggestions.
 */
class ValidationControls extends Component<IProps, IState> {
  public state = {
    isOpen: false,
    allCategories: [],
    currentCategories: [],
    isLoadingCategories: false
  } as IState;
  public componentWillMount() {
    this.props.store.on(STORE_EVENT_NEW_STATE, this.handleNotify);
    this.initCategories();
  }

  public render() {
    const { setDebugState, setValidateOnModifyState } = this.props;
    const { debug = false, validateOnModify = false } =
      this.state.pluginState || {};
    const { isOpen, isLoadingCategories } = this.state;
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
              <div className="ValidationControls__row">
                <hr />
              </div>
              <div className="ValidationControls__row">
                Select categories&nbsp;
                {isLoadingCategories && (
                  <span className="Sidebar__loading-spinner">|</span>
                )}
                <button
                  class="Button flex-align-right"
                  onClick={this.fetchCategories}
                >
                  Refresh
                </button>
              </div>
              {this.state.allCategories.map(category => (
                <div className="ValidationControls__row">
                  <label
                    className="ValidationControls__label"
                    for="ValidationControls__show-dirty-ranges"
                  >
                    {category.name}
                  </label>
                  <div class="ValidationControls__input">
                    <input
                      id="ValidationControls__show-dirty-ranges"
                      type="checkbox"
                      checked={
                        !!this.state.currentCategories.find(
                          _ => _.id === category.id
                        )
                      }
                      className="Input"
                      onInput={(e: Event) =>
                        this.setCategoryState(
                          category.id,
                          (e.target! as HTMLInputElement).checked
                        )
                      }
                    />
                  </div>
                </div>
              ))}
              <div className="ValidationControls__row">
                <hr />
              </div>
            </div>
          )}
          <div className="ValidationControls__row">
            <button className="Button" onClick={this.validateDocument}>
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
  private setCategoryState = (categoryId: string, enabled: boolean) => {
    enabled
      ? this.props.addCategory(categoryId)
      : this.props.removeCategory(categoryId);
    this.setState({
      currentCategories: this.props.getCurrentCategories()
    });
  };

  private initCategories = async () => {
    const allCategories = await this.fetchCategories();
    if (!allCategories) {
      return;
    }
    this.setState({
      currentCategories: allCategories
    });
    allCategories.forEach(category => this.props.addCategory(category.id));
  };

  private fetchCategories = async () => {
    this.setState({ isLoadingCategories: true });
    try {
      const allCategories = await this.props.fetchCategories();
      this.setState({
        allCategories,
        isLoadingCategories: false
      });
      return allCategories;
    } catch (e) {
      this.setState({
        isLoadingCategories: false
      });
    }
  };

  private validateDocument = () => {
    this.props.validateDocument(v4())
  }
}

export default ValidationControls;
