import { h } from "preact";
import { ApplySuggestionOptions } from "../commands";
import { ISuggestion } from "../interfaces/IMatch";
import WikiSuggestion from "./WikiSuggestion";

interface IProps {
  matchId: string;
  suggestion: ISuggestion;
  applySuggestions: (opts: ApplySuggestionOptions) => void;
}

const Suggestion = ({ matchId, suggestion, applySuggestions }: IProps) => {
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
        <div
          class="MatchWidget__suggestion"
          onClick={boundApplySuggestions}
        >
          {suggestion.text}
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
