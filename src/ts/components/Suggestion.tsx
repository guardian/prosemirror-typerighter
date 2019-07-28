import { h } from "preact";
import { ApplySuggestionOptions } from "../commands";
import { ISuggestion } from "../interfaces/IValidation";
import WikiSuggestion from "./WikiSuggestion";

interface IProps {
  validationId: string;
  suggestion: ISuggestion;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
}

const Suggestion = ({
  validationId,
  suggestion,
  applySuggestions
}: IProps) => {
  const boundApplySuggestions = () =>
    applySuggestions &&
    applySuggestions([
      {
        validationId,
        text: suggestion.text
      }
    ]);
  switch (suggestion.type) {
    case "TEXT_SUGGESTION": {
      return (
        <div class="ValidationWidget__suggestion" onClick={boundApplySuggestions}>
          {suggestion}
        </div>
      );
    }
    case "WIKI_SUGGESTION": {
      return (
        <WikiSuggestion {...suggestion} applySuggestion={boundApplySuggestions} />
      );
    }
  }
};

export default Suggestion;
