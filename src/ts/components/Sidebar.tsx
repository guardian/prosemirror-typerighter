import { Component, h } from "preact";
import sortBy from "lodash/sortBy";
import Store, { STORE_EVENT_NEW_STATE } from "../state/store";
import { ApplySuggestionOptions } from "../commands";
import { IPluginState } from "../state/reducer";
import { selectPercentRemaining } from "../state/selectors";
import SidebarMatch from "./SidebarMatch";
import { selectAllAutoFixableMatches } from "../state/selectors";
import { IMatch } from "../interfaces/IMatch";

interface IProps {
  store: Store<IMatch>;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
  applyAutoFixableSuggestions: () => void;
  selectMatch: (matchId: string) => void;
  indicateHover: (matchId: string, _?: any) => void;
  stopHover: () => void;
  contactHref?: string;
}

/**
 * A sidebar to display current matches and allow users to apply suggestions.
 */
class Sidebar extends Component<
  IProps,
  {
    pluginState: IPluginState<IMatch> | undefined;
    groupResults: boolean;
    loadingBarVisible: boolean;
  }
> {
  public componentWillMount() {
    this.props.store.on(STORE_EVENT_NEW_STATE, this.handleNewState);
  }

  public render() {
    const {
      applySuggestions,
      applyAutoFixableSuggestions,
      selectMatch,
      indicateHover,
      stopHover,
      contactHref
    } = this.props;
    const { currentMatches = [], requestsInFlight, selectedMatch } = this.state
      .pluginState || { selectedMatch: undefined };
    const hasMatches = !!(currentMatches && currentMatches.length && !this.state.pluginState?.error);
    const noOfAutoFixableSuggestions = this.getNoOfAutoFixableSuggestions();
    const percentRemaining = this.getPercentRemaining();
    const isLoading =
      !!requestsInFlight && !!Object.keys(requestsInFlight).length;

    return (
      <div className="Sidebar__section">
        <div className="Sidebar__header-container">
          <div className="Sidebar__header">
            <span>
              Results {hasMatches && <span>({currentMatches.length}) </span>}
            </span>
            {!!noOfAutoFixableSuggestions && (
              <button
                class="Button flex-align-right"
                onClick={applyAutoFixableSuggestions}
              >
                Fix all ({noOfAutoFixableSuggestions})
              </button>
            )}
          </div>
          {contactHref && (
            <div className="Sidebar__header-contact">
              <a href={contactHref} target="_blank">
                Issue with a rule? Let us know!
              </a>
            </div>
          )}
          {this.state.loadingBarVisible && (
            <div
              class="LoadingBar"
              style={{
                opacity: isLoading ? 1 : 0,
                width: `${100 - percentRemaining}%`
              }}
            />
          )}
        </div>

        <div className="Sidebar__content">
          {hasMatches && (
            <ul className="Sidebar__list">
              {currentMatches.map(output => (
                <li className="Sidebar__list-item" key={output.matchId}>
                  <SidebarMatch
                    output={output}
                    selectedMatch={selectedMatch}
                    applySuggestions={applySuggestions}
                    selectMatch={selectMatch}
                    indicateHover={indicateHover}
                    stopHover={stopHover}
                  />
                </li>
              ))}
            </ul>
          )}
          {!hasMatches && (
            <div className="Sidebar__awaiting-match">No matches to report.</div>
          )}
        </div>
      </div>
    );
  }

  private handleNewState = (pluginState: IPluginState<IMatch>) => {
    this.setState({
      pluginState: {
        ...pluginState,
        currentMatches: sortBy(pluginState.currentMatches, "from")
      }
    });
    const oldKeys = this.state.pluginState
      ? Object.keys(this.state.pluginState.requestsInFlight)
      : [];
    const newKeys = Object.keys(pluginState.requestsInFlight);
    if (oldKeys.length && !newKeys.length) {
      setTimeout(this.maybeResetLoadingBar, 300);
    }
    if (!oldKeys.length && newKeys.length) {
      this.setState({ loadingBarVisible: true });
    }
  };

  private maybeResetLoadingBar = () => {
    if (
      !this.state.pluginState ||
      !!Object.keys(this.state.pluginState.requestsInFlight)
    ) {
      this.setState({ loadingBarVisible: false });
    }
  };

  private getPercentRemaining = () => {
    const state = this.state.pluginState;
    if (!state) {
      return 0;
    }
    return selectPercentRemaining(state);
  };

  private getNoOfAutoFixableSuggestions = () => {
    const state = this.state.pluginState;
    if (!state) {
      return 0;
    }
    return selectAllAutoFixableMatches(state).length;
  };
}

export default Sidebar;
