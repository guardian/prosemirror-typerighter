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
  indicateHover: (matchId: string | undefined, _: any) => void;
}

/**
 * A sidebar to display current matches and allow users to apply suggestions.
 */
class Sidebar extends Component<
  IProps,
  {
    pluginState: IPluginState<IMatch> | undefined;
    groupResults: boolean;
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
      indicateHover
    } = this.props;
    const {
      currentMatches = [],
      requestsInFlight: requestsInFlight = [],
      requestPending: requestPending = false,
      selectedMatch
    } = this.state.pluginState || { selectedMatch: undefined };
    const hasMatches = !!(currentMatches && currentMatches.length);
    const noOfAutoFixableSuggestions = this.getNoOfAutoFixableSuggestions();
    const percentRemaining = this.getPercentRemaining();
    return (
      <div className="Sidebar__section">
        <div className="Sidebar__header-container">
          <div className="Sidebar__header">
            <span>
              Results{" "}
              {hasMatches && <span>({currentMatches.length}) </span>}
              {(requestsInFlight.length || requestPending) && (
                <span className="Sidebar__loading-spinner">|</span>
              )}
              
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
          <div className="Sidebar__header-contact">
            <a href="mailto:tbc@example.co.uk">Issue with a rule? Let us know!</a>
          </div> 
          <div
            class="LoadingBar"
            style={{
              opacity: percentRemaining === 0 ? 0 : 1,
              width: `${100 - percentRemaining}%`
            }}
          />
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
                  />
                </li>
              ))}
            </ul>
          )}
          {!hasMatches && (
            <div className="Sidebar__awaiting-match">
              No matches to report.
            </div>
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
