import React, { Component } from "react";

import { Match as TMatch } from "../interfaces/IMatch";
import { ApplySuggestionOptions } from "../commands";
import SuggestionList from "./SuggestionList";
import { getColourForMatch, IMatchTypeToColourMap } from "../utils/decoration";
import { Check } from "@mui/icons-material";
import { getHtmlFromMarkdown } from "../utils/dom";

interface IMatchProps {
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
  match: TMatch;
  matchColours: IMatchTypeToColourMap;
  feedbackHref?: string;
  onMarkCorrect?: (match: TMatch) => void;
}

class Match extends Component<IMatchProps> {
  public ref: HTMLDivElement | null = null;
  public render() {
    const {
      match,
      matchColours,
      applySuggestions,
      onMarkCorrect
    }: IMatchProps = this.props;
    const {
      matchId,
      category,
      message,
      suggestions,
      replacement,
      markAsCorrect,
      matchContext,
      ruleId
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
      markAsCorrect,
      ruleId
    };

    // render up to 6 suggestions if they exist (e.g. dictionary rules), otherwise render the replacement (as sometimes exists for classic Typerighter rules)
    const suggestionsToRender = suggestions && suggestions.length > 0 ? suggestions.slice(0, 6) : replacement ? [replacement] : [];
    const suggestionContent = (
      <div className="MatchWidget__suggestion-list">
        {suggestionsToRender && applySuggestions && !markAsCorrect && (
          <SuggestionList
            applySuggestions={applySuggestions}
            match={match}
            suggestions={suggestionsToRender}
          />
        )}
        {onMarkCorrect && (
          <div className="MatchWidget__ignore-match">
            <div
              className="MatchWidget__ignore-match-button"
              onClick={() => onMarkCorrect(match)}
            >
              <Check fontSize="small" />
              <span className="MatchWidget__ignore-match-text">
                Mark as correct
              </span>
            </div>
          </div>
        )}
      </div>
    );

    return (
      <div className="MatchWidget__container">
        <div className="MatchWidget" ref={_ => (this.ref = _)}>
          <div className="MatchWidget__type">
            <span
              className="MatchWidget__color-swatch"
              style={{
                backgroundColor: getColourForMatch(match, matchColours, false)
                  .borderColour
              }}
            ></span>
            {category.name}
          </div>
          {suggestionContent}
          <div
            className="MatchWidget__annotation"
            dangerouslySetInnerHTML={{ __html: getHtmlFromMarkdown(message) }}
          ></div>
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
