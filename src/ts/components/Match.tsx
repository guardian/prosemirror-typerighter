import { Component, h } from "preact";
import Tooltip from "@material-ui/core/Tooltip";
import Block from "./icons/Block";

import { IMatch } from "../interfaces/IMatch";
import { ApplySuggestionOptions } from "../commands";
import SuggestionList from "./SuggestionList";
import IconButton from "@material-ui/core/IconButton";
import { getColourForMatch, IMatchColours } from "../utils/decoration";

interface IMatchProps<TMatch extends IMatch> {
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
  match: TMatch;
  matchColours: IMatchColours;
  feedbackHref?: string;
  onIgnoreMatch?: (match: IMatch) => void;
}

class Match<TMatch extends IMatch> extends Component<IMatchProps<TMatch>> {
  public ref: HTMLDivElement | null = null;
  public render({
    match,
    matchColours,
    applySuggestions,
    onIgnoreMatch
  }: IMatchProps<TMatch>) {
    const {
      matchId,
      category,
      message,
      suggestions,
      replacement,
      markAsCorrect,
      matchContext
    } = match;
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

    const suggestionsToRender = replacement ? [replacement] : suggestions || [];
    const suggestionContent = suggestionsToRender &&
      applySuggestions &&
      !markAsCorrect && (
        <div className="MatchWidget__suggestion-list">
          <SuggestionList
            applySuggestions={applySuggestions}
            matchId={matchId}
            suggestions={suggestionsToRender}
          />
        </div>
      );

    return (
      <div className="MatchWidget__container">
        <div className="MatchWidget" ref={_ => (this.ref = _)}>
          <div className="MatchWidget__type">
            <span
              className="MatchWidget__color-swatch"
              style={{ backgroundColor: getColourForMatch(match, matchColours) }}
            ></span>
            {category.name}
          </div>
          {suggestionContent}
          <div className="MatchWidget__annotation">{message}</div>
          <div className="MatchWidget__footer">
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
            {onIgnoreMatch && (
              <div className="MatchWidget__ignore-match">
                <Tooltip title="Ignore this match">
                  <IconButton
                    className="MatchWidget__ignore-match-button"
                    component="span"
                    size="small"
                    onClick={() => onIgnoreMatch(match)}
                  >
                    <Block />
                  </IconButton>
                </Tooltip>
              </div>
            )}
          </div>
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
