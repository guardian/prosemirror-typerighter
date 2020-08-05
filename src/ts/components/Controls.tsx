import { Component, h, Fragment } from "preact";
import v4 from "uuid/v4";
import Store, { STORE_EVENT_NEW_STATE } from "../state/store";
import { IPluginState } from "../state/reducer";
import { IMatch, ICategory } from "../interfaces/IMatch";
import { selectHasError } from "../state/selectors";

interface IProps {
  store: Store<IMatch>;
  setDebugState: (debug: boolean) => void;
  setRequestOnDocModified: (r: boolean) => void;
  requestMatchesForDocument: (requestId: string, categoryIds: string[]) => void;
  fetchCategories: () => Promise<ICategory[]>;
  getCurrentCategories: () => ICategory[];
  addCategory: (id: string) => void;
  removeCategory: (id: string) => void;
  contactHref?: string;
}

interface IState {
  pluginState: IPluginState<IMatch> | undefined;
  isOpen: boolean;
  allCategories: ICategory[];
  currentCategories: ICategory[];
  isLoadingCategories: boolean;
}

/**
 * A sidebar to display current matches and allow users to apply suggestions.
 */
class Controls extends Component<IProps, IState> {
  public state = {
    isOpen: false,
    allCategories: [],
    currentCategories: [],
    isLoadingCategories: false,
    pluginState: undefined
  } as IState;
  public componentWillMount() {
    this.props.store.on(STORE_EVENT_NEW_STATE, this.handleNotify);
    this.initCategories();
  }

  public render() {
    // const { setDebugState, setRequestOnDocModified } = this.props;
    // const { debug = false, requestMatchesOnDocModified = false } =
    //   this.state.pluginState || {};
    const { isOpen, isLoadingCategories } = this.state;
    return (
      <Fragment>
        <div className="Sidebar__header-container">
          <div className="Sidebar__header Sidebar__header-toggle">
            <button
              type="button"
              className="Button"
              onClick={this.requestMatchesForDocument}
              disabled={
                this.state.pluginState &&
                !!Object.keys(this.state.pluginState.requestsInFlight).length
              }
            >
              Check document
            </button>

            <div
              onClick={this.toggleOpenState}
              className="Sidebar__toggle-label"
            >
              Advanced&nbsp;
              <span
                className="Sidebar__toggle"
                style={{ transform: isOpen ? "" : "rotate(-90deg)" }}
              >
                ▼
              </span>
            </div>
          </div>
        </div>
        {isOpen && (
          <div>
            {/* <div className="Controls__row">
                <label
                  className="Controls__label"
                  for="Controls__check-on-modify"
                >
                  Run checks when the document is modified
                </label>
                <div class="Controls__input">
                  <input
                    type="checkbox"
                    id="Controls__check-on-modify"
                    checked={requestMatchesOnDocModified}
                    className="Input"
                    onClick={() =>
                      setRequestOnDocModified(!requestMatchesOnDocModified)
                    }
                  />
                </div>
              </div>
              <div className="Controls__row">
                <label
                  className="Controls__label"
                  for="Controls__show-dirty-ranges"
                >
                  Show dirty and pending ranges
                </label>
                <div class="Controls__input">
                  <input
                    id="Controls__show-dirty-ranges"
                    type="checkbox"
                    checked={debug}
                    className="Input"
                    onClick={() => setDebugState(!debug)}
                  />
                </div>
              </div>
              <div className="Controls__row">
                <hr />
              </div> */}
            <div className="Controls__row">
              <div className="Controls__header">
                Select categories&nbsp;
                {isLoadingCategories && (
                  <span className="Sidebar__loading-spinner">|</span>
                )}
              </div>
              <button
                type="button"
                class="Button flex-align-right"
                onClick={this.fetchCategories}
              >
                Refresh
              </button>
            </div>
            {this.state.allCategories.map(category => (
              <div className="Controls__row">
                <label
                  className="Controls__label"
                  for="Controls__show-dirty-ranges"
                >
                  {category.name}
                </label>
                <div class="Controls__input">
                  <input
                    id="Controls__show-dirty-ranges"
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
            <hr />
          </div>
        )}
        {this.state.pluginState && selectHasError(this.state.pluginState) && (
          <div className="Controls__error-message">
            Error fetching matches. Please try checking the document again.{" "}
            {this.props.contactHref && (
              <span>
                If the error persists, please{" "}
                <a href={this.props.contactHref} target="_blank">
                  contact us
                </a>
                .
              </span>
            )}
          </div>
        )}
      </Fragment>
    );
  }
  private handleNotify = (state: IPluginState<IMatch>) => {
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

  private requestMatchesForDocument = () => {
    this.props.requestMatchesForDocument(
      v4(),
      this.props.getCurrentCategories().map(_ => _.id)
    );
  };
}

export default Controls;
