import { Component, h } from "preact";
import { IMatch } from "../interfaces/IMatch";
import { ApplySuggestionOptions } from "../commands";
import SuggestionList from "./SuggestionList";

interface IMatchProps<TMatch extends IMatch> {
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
  match: TMatch;
}

class Match<TMatch extends IMatch> extends Component<IMatchProps<TMatch>> {
  public ref: HTMLDivElement | null = null;
  public render({
    match: { matchId, category, message, suggestions },
    applySuggestions
  }: IMatchProps<TMatch>) {
    return (
      <div className="MatchWidget__container">
        <div className="MatchWidget" ref={_ => (this.ref = _)}>
          <div
            className="MatchWidget__type"
            style={{ color: `#${category.colour}` }}
          >
            {category.name}
          </div>
          <div className="MatchWidget__annotation">{message}</div>
          {suggestions && applySuggestions && (
            <div className="MatchWidget__suggestion-list">
              <SuggestionList
                applySuggestions={applySuggestions}
                matchId={matchId}
                suggestions={suggestions}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Match;
