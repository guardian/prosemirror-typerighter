import { Component, h } from "preact";
import { IValidationOutput } from "../interfaces/IValidation";
import { ApplySuggestionOptions } from "../commands";

export interface IDecorationComponentProps extends IValidationOutput {
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
}

class ValidationOutput extends Component<IDecorationComponentProps> {
  public ref: HTMLDivElement;
  public render({
    id,
    category,
    annotation,
    suggestions,
    applySuggestions
  }: IDecorationComponentProps) {
    return (
      <div className="ValidationWidget__container">
        <div className="ValidationWidget" ref={_ => (this.ref = _)}>
          <div className="ValidationWidget__type">{category.name}</div>
          <div className="ValidationWidget__annotation">{annotation}</div>
          {suggestions && !!suggestions.length && applySuggestions && (
            <div className="ValidationWidget__suggestion-list">
              {suggestions.map((suggestion, suggestionIndex) => (
                <div
                  class="ValidationWidget__suggestion"
                  onClick={() =>
                    applySuggestions([
                      {
                        validationId: id,
                        suggestionIndex
                      }
                    ])
                  }
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ValidationOutput;
