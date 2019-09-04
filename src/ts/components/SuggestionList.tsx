import { h, Fragment } from "preact";
import { useState } from "preact/hooks";
import { ISuggestion } from "../interfaces/IValidation";
import Suggestion from "./Suggestion";
import { ApplySuggestionOptions } from "../commands";

interface IProps {
  suggestions: ISuggestion[];
  validationId: string;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
}

const SuggestionList = ({
  suggestions,
  validationId,
  applySuggestions
}: IProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const firstSuggestion = suggestions[0];
  const otherSuggestions = suggestions.slice(1);
  return (
    <div className="ValidationSidebarOutput__suggestion-list">
      {!suggestions.length ? (
        <p>No suggestions found.</p>
      ) : (
        <Suggestion
          validationId={validationId}
          suggestion={firstSuggestion}
          applySuggestions={applySuggestions}
        />
      )}
      {!!otherSuggestions.length && (
        <div
          className="Button SuggestionList__see-more"
          onClick={() => setIsOpen(!isOpen)}
        >
          See {!isOpen ? "more" : "fewer"} suggestions (
          {otherSuggestions.length})
        </div>
      )}
      {isOpen && (
        <Fragment>
          {otherSuggestions.map(suggestion => (
            <Suggestion
              validationId={validationId}
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
