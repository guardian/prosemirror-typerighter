import { h, Fragment } from "preact";
import jsDiff, { Change } from "diff";

import { ApplySuggestionOptions } from "../commands";
import { ISuggestion } from "../interfaces/IMatch";
import WikiSuggestion from "./WikiSuggestion";

interface IProps {
  matchId: string;
  matchedText: string;
  suggestion: ISuggestion;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
}

/**
 * At the moment, only show fancy diffs for single words – longer text
 * is likely to require a different UI.
 */
const shouldShowDiff = (matchedText: string) => matchedText.indexOf(" ") === -1

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
    <Fragment>
      {diffs
        .filter((diff: Change) => !diff.removed)
        .map(diff => (
          <span class={`Suggestion__diff-${diff.added ? "added" : ""}`}>
            {diff.value}
          </span>
        ))}
    </Fragment>
  );
};

const renderSuggestionText = (matchedText: string, suggestionText: string) => {
  if (shouldShowDiff(matchedText)) {
    const matchSuggestionDiff = renderMatchDiff(suggestionText, matchedText);

    return (
      <Fragment>
        <span class="Suggestion__matched-text">
          {matchSuggestionDiff}
          <span class="Suggestion__matched-text-strikethrough"></span>
        </span>
        <span class="Suggestion__arrow">&nbsp;→&nbsp;</span>
        <span class="Suggestion__text">{suggestionText}</span>
      </Fragment>
    )
  }

  return <span class="Suggestion__text">{suggestionText}</span>
}

const Suggestion = ({
  matchId,
  suggestion,
  matchedText,
  applySuggestions
}: IProps) => {
  const boundApplySuggestions = () =>
    applySuggestions &&
    applySuggestions([
      {
        matchId,
        text: suggestion.text
      }
    ]);
  switch (suggestion.type) {
    case "TEXT_SUGGESTION": {
      return (
        <div class="Suggestion" onClick={boundApplySuggestions}>
          {renderSuggestionText(matchedText, suggestion.text)}
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
