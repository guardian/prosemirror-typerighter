import { Component, h } from "preact";
import { IValidationOutput, ISuggestion } from "../interfaces/IValidation";
import { ApplySuggestionOptions } from "../commands";
import WikiSuggestion from "./WikiSuggestion";

type IValidationOutputProps<TValidationOutput extends IValidationOutput> = {
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
} & TValidationOutput;

class ValidationOutput<
  TValidationOutput extends IValidationOutput
> extends Component<IValidationOutputProps<TValidationOutput>> {
  public ref: HTMLDivElement;
  public render({
    category,
    annotation,
    suggestions,
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
              {this.renderSuggestion(suggestions)}
            </div>
          )}
        </div>
      </div>
    );
  }

  private renderSuggestion(suggestion: ISuggestion) {
    switch (suggestion.type) {
      case "BASE_SUGGESTION": {
        return suggestion.replacements.map((replacement, index) => (
          <div
            class="ValidationWidget__suggestion"
            onClick={() =>
              this.props.applySuggestions &&
              this.props.applySuggestions([
                {
                  validationId: this.props.id,
                  suggestionIndex: index
                }
              ])
            }
          >
            {replacement}
          </div>
        ));
      }
      case "WIKI_SUGGESTION": {
        return (
          <WikiSuggestion
            {...suggestion}
            applySuggestions={this.props.applySuggestions}
          />
        );
      }
    }
  }
}

export default ValidationOutput;
