import { Component, h } from "preact";
import { IBlockMatches } from "../interfaces/IValidation";
import { ApplySuggestionOptions } from "../commands";
import SuggestionList from "./SuggestionList";

interface IValidationOutputProps<TValidationOutput extends IBlockMatches> {
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
  validationOutput: TValidationOutput;
}

class ValidationOutput<
  TValidationOutput extends IBlockMatches
> extends Component<IValidationOutputProps<TValidationOutput>> {
  public ref: HTMLDivElement | undefined;
  public render({
    validationOutput: { matchId, category, annotation, suggestions },
    applySuggestions
  }: IValidationOutputProps<TValidationOutput>) {
    return (
      <div className="ValidationWidget__container">
        <div className="ValidationWidget" ref={_ => (this.ref = _)}>
          <div
            className="ValidationWidget__type"
            style={{ color: `#${category.colour}` }}
          >
            {category.name}
          </div>
          <div className="ValidationWidget__annotation">{annotation}</div>
          {suggestions && applySuggestions && (
            <div className="ValidationWidget__suggestion-list">
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

export default ValidationOutput;
