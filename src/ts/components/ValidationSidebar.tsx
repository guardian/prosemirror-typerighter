import { Component, h } from "preact";
import Store, { STORE_EVENT_NEW_STATE } from "../store";
import { ApplySuggestionOptions } from "../commands";
import { IPluginState } from "../state";
import ValidationSidebarOutput from "./ValidationSidebarOutput";
import { IBaseValidationOutput } from "../interfaces/IValidation";

interface IProps {
  store: Store<IBaseValidationOutput>;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
  selectValidation: (validationId: string) => void;
  indicateHover: (validationId: string, _: any) => void;
}

/**
 * A sidebar to display current validations and allow users to apply suggestions.
 */
class ValidationSidebar extends Component<
  IProps,
  { pluginState: IPluginState<IBaseValidationOutput> | undefined; groupResults: boolean }
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
    return (
      <div className="Sidebar__section">
        <div className="Sidebar__header">
          <span>
            Validation results{" "}
            {hasValidations && <span>({currentValidations.length}) </span>}
            {(validationsInFlight.length || validationPending) && (
              <span className="Sidebar__loading-spinner">|</span>
            )}
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
  private handleNewState = (pluginState: IPluginState<IBaseValidationOutput>) => {
    this.setState({
      pluginState: {
        ...pluginState,
        currentValidations: pluginState.currentValidations.sort((a, b) =>
          a.from > b.from ? 1 : -1
        )
      }
    });
  };
}

export default ValidationSidebar;
