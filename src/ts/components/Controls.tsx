import { Component, h, Fragment } from "preact";
import { v4 } from "uuid";
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

     return (
      <Fragment>
        <div className="Sidebar__header-container">
          <div className="Sidebar__header">
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
          </div>
        </div>
      
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
