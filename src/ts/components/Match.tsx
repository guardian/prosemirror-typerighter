import { Component, h } from "preact";
import { IMatch } from "../interfaces/IMatch";
import { ApplySuggestionOptions } from "../commands";
import SuggestionList from "./SuggestionList";

interface IMatchProps<TMatch extends IMatch> {
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
  match: TMatch;
  feedbackHref?: string;
}

class Match<TMatch extends IMatch> extends Component<IMatchProps<TMatch>> {
  public ref: HTMLDivElement | null = null;
  public render({
    match: { matchId, category, message, suggestions, replacement, markAsCorrect, matchContext },
    applySuggestions
  }: IMatchProps<TMatch>) {
    const suggestionsToRender = replacement ? [replacement] : suggestions || [];
    const suggestionContent = suggestionsToRender && applySuggestions && !markAsCorrect && (
      <div className="MatchWidget__suggestion-list">
        <SuggestionList
          applySuggestions={applySuggestions}
          matchId={matchId}
          suggestions={suggestionsToRender}
        />
      </div>
    )
    const url = document.URL;
    const feedbackInfo = {
      matchId,
      category,
      message,
      suggestions,
      replacement,
      url,
      matchContext,
      markAsCorrect
    };
    return (
      <div className="MatchWidget__container">
        <div className="MatchWidget" ref={_ => (this.ref = _)}>
          <div className="MatchWidget__type">
            <span
              className="MatchWidget__color-swatch"
              style={{ backgroundColor: `#${category.colour}` }}
            ></span>
            {category.name}
          </div>
          {suggestionContent}
          <div className="MatchWidget__annotation">{message}</div>
          {this.props.feedbackHref && (
            <div className="MatchWidget__feedbackLink">
              <a
                target="_blank"
                href={this.getFeedbackLink(
                  this.props.feedbackHref!,
                  feedbackInfo
                )}
              >
                Issue with this result? Tell us!
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  private getFeedbackLink = (feedbackHref: string, feedbackInfo: any) => {
    const data = encodeURIComponent(JSON.stringify(feedbackInfo, undefined, 2));
    return feedbackHref + data;
  };
}

export default Match;
