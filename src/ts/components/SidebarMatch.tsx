import compact from "lodash/compact";
import { IMatch } from "../interfaces/IMatch";
import { Component, h } from "preact";
import { DECORATION_ATTRIBUTE_ID } from "../utils/decoration";
import titleCase from "lodash/startCase";
import { ApplySuggestionOptions } from "../commands";
import SuggestionList from "./SuggestionList";

interface IProps {
  output: IMatch;
  applySuggestions: (suggestions: ApplySuggestionOptions) => void;
  selectMatch: (matchId: string) => void;
  indicateHover: (blockId: string | undefined, _?: any) => void;
  selectedMatch: string | undefined;
}

interface IState {
  isOpen: boolean;
}

/**
 * Display information for a single match
 */
class SidebarMatch extends Component<IProps, IState> {
  public state = {
    isOpen: false
  };

  public render() {
    const { output, applySuggestions, selectedMatch } = this.props;
    const color = `#${output.category.colour}`;
    const hasSuggestions = !!output.suggestions && !!output.suggestions.length;
    const suggestions = compact([
      output.replacement,
      ...(output.suggestions || [])
    ]);
    return (
      <div
        className={`SidebarMatch__container ${
          selectedMatch === output.matchId
            ? "SidebarMatch__container--is-selected"
            : ""
        }`}
        style={{ borderLeft: `2px solid ${color}` }}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <div
          className={"SidebarMatch__header"}
          onClick={hasSuggestions ? this.toggleOpen : undefined}
        >
          <div className="SidebarMatch__header-label">
            <div className="SidebarMatch__header-description">
              <strong>{output.matchedText}</strong>&nbsp;
              {output.message}
            </div>
            <div className="SidebarMatch__header-meta">
              <div
                className="SidebarMatch__header-range"
                onClick={this.scrollToRange}
              >
                <span className="Button">{output.from}-{output.to}</span>
                
              </div>
              <div
                className="SidebarMatch__header-category"
                style={{ color }}
              >
                {titleCase(output.category.name)}
              </div>
              {hasSuggestions && (
                <div className="SidebarMatch__header-toggle-status">
                  {this.state.isOpen ? "-" : "+"}
                </div>
              )}
            </div>
          </div>
        </div>
        {this.state.isOpen && (
          <div className="SidebarMatch__content">
            {suggestions.length && (
              <div className="SidebarMatch__suggestion-list">
                <SuggestionList
                  applySuggestions={applySuggestions}
                  matchId={output.matchId}
                  suggestions={suggestions}
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
    this.props.selectMatch(this.props.output.matchId);
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

export default SidebarMatch;
