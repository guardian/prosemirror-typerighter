import React, { Component } from "react";

import { IMatch } from "../interfaces/IMatch";
import { ApplySuggestionOptions } from "../commands";
import SuggestionList from "./SuggestionList";
import { getColourForMatch, IMatchColours } from "../utils/decoration";
import { Check } from "@material-ui/icons";
import { getHtmlFromMarkdown } from "../utils/dom";

interface IMatchProps<TMatch extends IMatch> {
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
  match: TMatch;
  matchColours: IMatchColours;
  feedbackHref?: string;
  onMarkCorrect?: (match: IMatch) => void;
}

class Match<TMatch extends IMatch> extends Component<IMatchProps<TMatch>> {
  public ref: HTMLDivElement | null = null;
  public render() {
    const {
      match,
      matchColours,
      applySuggestions,
      onMarkCorrect
    }: IMatchProps<TMatch> = this.props;
    const {
      matchId,
      category,
      message,
      suggestions,
      replacement,
      markAsCorrect,
      matchContext,
      matchedText
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
    const suggestionContent = (
      <div className="MatchWidget__suggestion-list">
        {suggestionsToRender && applySuggestions && !markAsCorrect && (
          <SuggestionList
            applySuggestions={applySuggestions}
            matchId={matchId}
            matchedText={matchedText}
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
