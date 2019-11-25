import { Component, h } from "preact";
import Store, { STORE_EVENT_NEW_STATE } from "../store";
import { ApplySuggestionOptions } from "../commands";
import { IPluginState } from "../state/reducer";
import { selectPercentRemaining } from "../state/selectors";
import ValidationSidebarOutput from "./ValidationSidebarOutput";
import { selectAllAutoFixableMatches } from "../state/selectors";
import { IMatches } from "../interfaces/IValidation";

interface IProps {
  store: Store<IMatches>;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
  applyAutoFixableSuggestions: () => void;
  selectValidation: (matchId: string) => void;
  indicateHover: (matchId: string | undefined, _: any) => void;
}

/**
 * A sidebar to display current validations and allow users to apply suggestions.
 */
class ValidationSidebar extends Component<
  IProps,
  {
    pluginState: IPluginState<IMatches> | undefined;
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
      selectValidation,
      indicateHover
    } = this.props;
    const {
      currentValidations: currentValidations = [],
      blockQueriesInFlight = [],
      validationPending = false,
      selectedMatch
    } = this.state.pluginState || { selectedMatch: undefined };
    const hasValidations = !!(currentValidations && currentValidations.length);
    const noOfAutoFixableSuggestions = this.getNoOfAutoFixableSuggestions();
    const percentRemaining = this.getPercentRemaining();
    return (
      <div className="Sidebar__section">
        <div className="Sidebar__header">
          <span>
            Validation results{" "}
            {hasValidations && <span>({currentValidations.length}) </span>}
            {(blockQueriesInFlight.length || validationPending) && (
              <span className="Sidebar__loading-spinner">|</span>
            )}
            <div
              class="LoadingBar"
              style={{
                opacity: percentRemaining === 0 ? 0 : 1,
                width: `${100 - percentRemaining}%`
              }}
            />
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
        <div className="Sidebar__content">
          {hasValidations && (
            <ul className="Sidebar__list">
              {currentValidations.map(output => (
                <li className="Sidebar__list-item" key={output.matchId}>
                  <ValidationSidebarOutput
                    output={output}
                    selectedMatch={selectedMatch}
                    applySuggestions={applySuggestions}
                    selectValidation={selectValidation}
                    indicateHover={indicateHover}
                  />
                </li>
              ))}
            </ul>
          )}
          {!hasValidations && (
            <div className="Sidebar__awaiting-validation">
              No validations to report.
            </div>
          )}
        </div>
      </div>
    );
  }

  private handleNewState = (pluginState: IPluginState<IMatches>) => {
    this.setState({
      pluginState: {
        ...pluginState,
        currentValidations: pluginState.currentValidations.sort((a, b) =>
          a.from > b.from ? 1 : -1
        )
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

export default ValidationSidebar;
