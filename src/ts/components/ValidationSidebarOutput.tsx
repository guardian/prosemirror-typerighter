import { IValidationOutput } from "../interfaces/IValidation";
import { Component, h } from "preact";
import { DECORATION_ATTRIBUTE_ID } from "../utils/decoration";
import titleCase from "lodash/startCase";
import { ApplySuggestionOptions } from "../commands";

interface IProps {
  output: IValidationOutput;
  applySuggestions: (suggestions: ApplySuggestionOptions) => void;
  selectValidation: (validationId: string) => void;
  indicateHover: (validationId: string | undefined, _?: any) => void;
  selectedValidation: string | undefined;
}

interface IState {
  isOpen: boolean;
}

/**
 * Display information for a single validation output.
 */
class ValidationSidebarOutput extends Component<IProps, IState> {
  public state = {
    isOpen: false
  };

  public render() {
    const { output, applySuggestions, selectedValidation } = this.props;
    return (
      <div
        className={`ValidationSidebarOutput__container ${
          selectedValidation === output.id
            ? "ValidationSidebarOutput__container--is-selected"
            : ""
        }`}
        onMouseOver={this.handleMouseOver}
        onMouseLeave={this.handleMouseLeave}
      >
        <div
          className={"ValidationSidebarOutput__header"}
          onClick={this.toggleOpen}
        >
          <div className="ValidationSidebarOutput__header-label">
            {titleCase(output.type)}
            <span className="Button ValidationSidebarOutput__header-range" onClick={this.scrollToRange}>
              {output.from}-{output.to}
            </span>
          </div>
          <div className="ValidationSidebarOutput__header-toggle-status">
            {this.state.isOpen ? "-" : "+"}
          </div>
        </div>
        {this.state.isOpen && (
          <div className="ValidationSidebarOutput__content">
            <div className="ValidationSidebarOutput__annotation">
              {output.annotation}
            </div>
            {output.suggestions && (
              <div className="ValidationSidebarOutput__suggestion-list">
                {output.suggestions.map((suggestion, suggestionIndex) => (
                  <div
                    class="ValidationWidget__suggestion"
                    onClick={() =>
                      applySuggestions([
                        {
                          validationId: output.id,
                          suggestionIndex
                        }
                      ])
                    }
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  private toggleOpen = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  private scrollToRange = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.selectValidation(this.props.output.id);
    const decorationElement = document.querySelector(
      `[${DECORATION_ATTRIBUTE_ID}="${this.props.output.id}"]`
    );
    if (decorationElement) {
      decorationElement.scrollIntoView({
        behavior: "smooth"
      });
    }
  }

  private handleMouseOver = () => {
    this.props.indicateHover(this.props.output.id);
  };

  private handleMouseLeave = () => {
    this.props.indicateHover(undefined);
  };
}

export default ValidationSidebarOutput;
