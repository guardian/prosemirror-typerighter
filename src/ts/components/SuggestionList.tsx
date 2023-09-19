import React, { useState } from "react";
import { ISuggestion, IMatch } from "../interfaces/IMatch";
import Suggestion from "./Suggestion";
import { ApplySuggestionOptions } from "../state/commands";

interface IProps {
  suggestions: ISuggestion[];
  match: IMatch;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
}

const SuggestionList = ({
  suggestions,
  match,
  applySuggestions,
}: IProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const firstSuggestion = suggestions[0];
  const otherSuggestions = suggestions.slice(1);
  return (
      <div className="SidebarMatch__suggestion-list">
        {suggestions.length ? (
          <Suggestion
            match={match}
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
          <>
            {otherSuggestions.map(suggestion => (
              <Suggestion
                match={match}
                suggestion={suggestion}
                applySuggestions={applySuggestions}
              />
            ))}
          </>
        )}
      </div>
  );
};

export default SuggestionList;
