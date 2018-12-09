import { Component, h } from "preact";
import Store from "../store";
import { ApplySuggestionOptions } from "..";
import { IPluginState } from "../state";
import ValidationSidebarOutput from "./ValidationSidebarOutput";

interface IProps {
  store: Store;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
  selectValidation: (validationId: string) => void;
  indicateHover: (validationId: string) => void;
}

/**
 * A sidebar to display current validations and allow users to apply suggestions.
 */
class ValidationSidebar extends Component<IProps, IPluginState> {
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
      <div>
        <div className="ValidationSidebar__header">
          <span>
            Validation results{" "}
            {hasValidations && <span>({currentValidations.length})</span>}
          </span>
          {validationInFlight ||
            (validationPending && (
              <span className="ValidationSidebar__loading-spinner">|</span>
            ))}
        </div>
        <div className="ValidationSidebar__content">
          {hasValidations && (
            <ul className="ValidationSidebar__list">
              {currentValidations.map(output => (
                <li className="ValidationSidebar__list-item">
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
            <div className="ValidationSidebar__awaiting-validation">
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
