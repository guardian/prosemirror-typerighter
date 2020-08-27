import React, { useContext } from "react";
import jsDiff, { Change } from "diff";

import { ApplySuggestionOptions } from "../commands";
import { ISuggestion, IMatch } from "../interfaces/IMatch";
import WikiSuggestion from "./WikiSuggestion";
import TelemetryContext from "../contexts/TelemetryContext";

interface IProps {
  match: IMatch;
  suggestion: ISuggestion;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
}

/**
 * At the moment, only show fancy diffs for smaller words.
 */
const shouldShowDiff = (matchedText: string) => matchedText.length < 16;

/**
 * Render a diff between the matched text and the suggestion, only showing
 * removed characters – this will show a limited diff for the match, and
 * ensure the matched text remains unaltered but coloured where text is removed.
 *
 * E.g. (using [] to denote a coloured char):
 *    missspelled -> misspelled: miss[s]pelled – removed char highlighted
 *    accordian -> accordion: accordi[a]n – changed char highlighted
 *    mispelled -> misspelled: mispelled – added char not highlighted, as it would change the match text
 */
const renderMatchDiff = (suggestionText: string, matchedText: string) => {
  const diffs = jsDiff.diffChars(suggestionText, matchedText);

  return (
    <>
      {diffs
        .filter((diff: Change) => !diff.removed)
        .map(diff => (
          <span className={`Suggestion__diff-${diff.added ? "added" : ""}`}>
            {diff.value}
          </span>
        ))}
    </>
  );
};

const renderSuggestionText = (matchedText: string, suggestionText: string) => {
  if (shouldShowDiff(matchedText)) {
    const matchSuggestionDiff = renderMatchDiff(suggestionText, matchedText);

    return (
      <>
        <span className="Suggestion__matched-text">
          {matchSuggestionDiff}
          <span className="Suggestion__matched-text-strikethrough"></span>
        </span>
        <span className="Suggestion__arrow">&nbsp;→&nbsp;</span>
        <span className="Suggestion__text">{suggestionText}</span>
      </>
    );
  }

  return <span className="Suggestion__text">{suggestionText}</span>;
};

const Suggestion = ({ match, suggestion, applySuggestions }: IProps) => {
  const { telemetryService } = useContext(TelemetryContext);

  const boundApplySuggestions = () => {
    if (!applySuggestions) {
      return;
    }

    applySuggestions([
      {
        matchId: match.matchId,
        text: suggestion.text
      }
    ]);

    telemetryService?.suggestionIsAccepted({
      documentUrl: document.URL,
      ruleId: match.ruleId,
      matchId: match.matchId,
      matchedText: match.matchedText,
      matchContext: match.matchContext,
      suggestion: suggestion.text
    });
  };
  switch (suggestion.type) {
    case "TEXT_SUGGESTION": {
      return (
        <div className="Suggestion" onClick={boundApplySuggestions}>
          {renderSuggestionText(match.matchedText, suggestion.text)}
        </div>
      );
    }
    case "WIKI_SUGGESTION": {
      return (
        <WikiSuggestion
          {...suggestion}
          applySuggestion={boundApplySuggestions}
        />
      );
    }
  }
};

export default Suggestion;
