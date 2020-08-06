import { Component, h } from "preact";
//import Block from "@material-ui/icons/Block";
import Tooltip from "@material-ui/core/Tooltip";

import { IMatch } from "../interfaces/IMatch";
import { ApplySuggestionOptions } from "../commands";
import SuggestionList from "./SuggestionList";
import { IconButton } from "@material-ui/core";
import SvgIcon from '@material-ui/core/SvgIcon';

interface IMatchProps<TMatch extends IMatch> {
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
  match: TMatch;
  feedbackHref?: string;
  onIgnoreMatch?: (match: IMatch) => void;
}

function LightBulbIcon(props: any) {
  return (
    <SvgIcon {...props}>
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
    </SvgIcon>
  );
}

class Match<TMatch extends IMatch> extends Component<IMatchProps<TMatch>> {
  public ref: HTMLDivElement | null = null;
  public render({
    match,
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
              style={{ backgroundColor: `#${category.colour}` }}
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
            <div className="MatchWidget__ignore-match">
              <Tooltip title="Add" aria-label="add">
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="span"
                  size="small"
                  onClick={onIgnoreMatch && (() => onIgnoreMatch(match))}
                >
                  <LightBulbIcon />
                </IconButton>
              </Tooltip>
            </div>
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
