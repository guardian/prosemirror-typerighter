import { IMatches } from "../interfaces/IValidation";
import { Component, h } from "preact";
import { DECORATION_ATTRIBUTE_ID } from "../utils/decoration";
import titleCase from "lodash/startCase";
import { ApplySuggestionOptions } from "../commands";
import SuggestionList from "./SuggestionList";

interface IProps {
  output: IMatches;
  applySuggestions: (suggestions: ApplySuggestionOptions) => void;
  selectValidation: (matchId: string) => void;
  indicateHover: (blockId: string | undefined, _?: any) => void;
  selectedMatch: string | undefined;
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
    const { output, applySuggestions, selectedMatch } = this.props;
    const color = `#${output.category.colour}`;
    const hasSuggestions = !!output.suggestions;
    return (
      <div
        className={`ValidationSidebarOutput__container ${
          selectedMatch === output.matchId
            ? "ValidationSidebarOutput__container--is-selected"
            : ""
        }`}
        style={{ borderLeft: `2px solid ${color}` }}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <div
          className={"ValidationSidebarOutput__header"}
          onClick={hasSuggestions ? this.toggleOpen : undefined}
        >
          <div className="ValidationSidebarOutput__header-label">
            <div className="ValidationSidebarOutput__header-description">
              {output.annotation}
            </div>
            <div className="ValidationSidebarOutput__header-meta">
              <div
                className="Button ValidationSidebarOutput__header-range"
                onClick={this.scrollToRange}
              >
                {output.from}-{output.to}
              </div>
              <div
                className="ValidationSidebarOutput__header-category"
                style={{ color }}
              >
                {titleCase(output.category.name)}
              </div>
              {hasSuggestions && (
                <div className="ValidationSidebarOutput__header-toggle-status">
                  {this.state.isOpen ? "-" : "+"}
                </div>
              )}
            </div>
          </div>
        </div>
        {this.state.isOpen && (
          <div className="ValidationSidebarOutput__content">
            {output.suggestions && (
              <div className="ValidationSidebarOutput__suggestion-list">
                <SuggestionList
                  applySuggestions={applySuggestions}
                  matchId={output.matchId}
                  suggestions={output.suggestions}
                />
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
    this.props.selectValidation(this.props.output.matchId);
    const decorationElement = document.querySelector(
      `[${DECORATION_ATTRIBUTE_ID}="${this.props.output.matchId}"]`
    );
    if (decorationElement) {
      decorationElement.scrollIntoView({
        behavior: "smooth"
      });
    }
  };

  private handleMouseEnter = () => {
    this.props.indicateHover(this.props.output.matchId);
  };

  private handleMouseLeave = () => {
    this.props.indicateHover(undefined);
  };
}

export default ValidationSidebarOutput;
