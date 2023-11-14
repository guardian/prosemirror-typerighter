import React, { Component } from "react";

import { MappedMatch } from "../interfaces/IMatch";
import { ApplySuggestionOptions } from "../commands";
import SuggestionList from "./SuggestionList";
import { getColourForMatch, IMatchTypeToColourMap } from "../utils/decoration";
import { Check } from "@mui/icons-material";
import { getHtmlFromMarkdown } from "../utils/dom";
import { Feedback } from "./Feedback";

interface IMatchProps {
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
  match: MappedMatch;
  matchColours: IMatchTypeToColourMap;
  onMarkCorrect?: (match: MappedMatch) => void;
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
      category,
      message,
      suggestions,
      replacement,
      markAsCorrect
    } = match;
    const url = document.URL;

    // render up to 6 suggestions if they exist (e.g. dictionary rules), otherwise render the replacement (as sometimes exists for classic Typerighter rules)
    const suggestionsToRender =
      suggestions && suggestions.length > 0
        ? suggestions.slice(0, 6)
        : replacement
        ? [replacement]
        : [];
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
            <Feedback documentUrl={url} match={match} />
          </div>
        </div>
      </div>
    );
  }
}

export default Match;
