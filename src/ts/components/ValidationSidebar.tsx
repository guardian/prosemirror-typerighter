import { Component, h } from "preact";
import Store, { STORE_EVENT_NEW_STATE } from "../store";
import { ApplySuggestionOptions } from "../commands";
import { IPluginState, selectPercentRemaining } from "../state/state";
import ValidationSidebarOutput from "./ValidationSidebarOutput";
import { IValidationOutput } from "../interfaces/IValidation";

interface IProps {
  store: Store<IValidationOutput>;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
  selectValidation: (validationId: string) => void;
  indicateHover: (validationId: string | undefined, _: any) => void;
}

/**
 * A sidebar to display current validations and allow users to apply suggestions.
 */
class ValidationSidebar extends Component<
  IProps,
  {
    pluginState: IPluginState<IValidationOutput> | undefined;
    groupResults: boolean;
  }
> {
  public componentWillMount() {
    this.props.store.on(STORE_EVENT_NEW_STATE, this.handleNewState);
  }

  public render() {
    const { applySuggestions, selectValidation, indicateHover } = this.props;
    const {
      currentValidations = [],
      validationsInFlight = [],
      validationPending = false,
      selectedValidation
    } = this.state.pluginState || { selectedValidation: undefined };
    const hasValidations = !!(currentValidations && currentValidations.length);
    const percentRemaining = this.getPercentRemaining();
    return (
      <div className="Sidebar__section">
        <div className="Sidebar__header">
          <span>
            Validation results{" "}
            {hasValidations && <span>({currentValidations.length}) </span>}
            {(validationsInFlight.length || validationPending) && (
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
        </div>
        <div className="Sidebar__content">
          {hasValidations && (
            <ul className="Sidebar__list">
              {currentValidations.map(output => (
                <li className="Sidebar__list-item">
                  <ValidationSidebarOutput
                    output={output}
                    selectedValidation={selectedValidation}
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

  private handleNewState = (
    pluginState: IPluginState<IValidationOutput>
  ) => {
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
}

export default ValidationSidebar;
