import { h, Fragment } from "preact";
import { useState } from "preact/hooks";
import { ISuggestion } from "../interfaces/IMatch";
import Suggestion from "./Suggestion";
import { ApplySuggestionOptions } from "../commands";

interface IProps {
  suggestions: ISuggestion[];
  matchId: string;
  matchedText: string;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
}

const SuggestionList = ({ suggestions, matchId, matchedText, applySuggestions }: IProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const firstSuggestion = suggestions[0];
  const otherSuggestions = suggestions.slice(1);
  return (
    <div className="SidebarMatch__suggestion-list">
      {suggestions.length ? (
        <Suggestion
          matchId={matchId}
          matchedText={matchedText}
          suggestion={firstSuggestion}
          applySuggestions={applySuggestions}
        />
      ) : null}
      {!!otherSuggestions.length ? (
        <div
          className="Button SuggestionList__see-more"
          onClick={() => setIsOpen(!isOpen)}
        >
          See {!isOpen ? "more" : "fewer"} suggestions (
          {otherSuggestions.length})
        </div>
      ) : null}
      {isOpen && (
        <Fragment>
          {otherSuggestions.map(suggestion => (
            <Suggestion
              matchId={matchId}
              matchedText={matchedText}
              suggestion={suggestion}
              applySuggestions={applySuggestions}
            />
          ))}
        </Fragment>
      )}
    </div>
  );
};

export default SuggestionList;
