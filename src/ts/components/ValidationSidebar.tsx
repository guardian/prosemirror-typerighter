import { Component, h } from "preact";
import Store from "../store";
import { ApplySuggestionOptions } from "../commands";
import { IPluginState } from "../state";
import ValidationSidebarOutput from "./ValidationSidebarOutput";

interface IProps {
  store: Store;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
  selectValidation: (validationId: string) => void;
  indicateHover: (validationId: string, _: any) => void;
}

/**
 * A sidebar to display current validations and allow users to apply suggestions.
 */
class ValidationSidebar extends Component<
  IProps,
  IPluginState & { groupResults: boolean }
> {
  public componentWillMount() {
    this.props.store.subscribe(this.handleNotify);
  }

  public render() {
    const { applySuggestions, selectValidation, indicateHover } = this.props;
    const {
      currentValidations,
      validationInFlight,
      validationPending,
      selectedValidation
    } = this.state;
    const hasValidations = !!(currentValidations && currentValidations.length);
    return (
      <div className="Sidebar__section">
        <div className="Sidebar__header">
          <span>
            Validation results{" "}
            {hasValidations && <span>({currentValidations.length}) </span>}
            {(validationInFlight ||
              validationPending) && (
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
  private handleNotify = (state: IPluginState) => {
    this.setState(state);
  };
}

export default ValidationSidebar;
