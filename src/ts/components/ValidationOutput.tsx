import { Component, h } from "preact";
import { IValidationOutput } from "../interfaces/IValidation";
import { ApplySuggestionOptions } from "../commands";
import SuggestionList from "./SuggestionList";

interface IValidationOutputProps<TValidationOutput extends IValidationOutput> {
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
  validationOutput: TValidationOutput;
}

class ValidationOutput<
  TValidationOutput extends IValidationOutput
> extends Component<IValidationOutputProps<TValidationOutput>> {
  public ref: HTMLDivElement | undefined;
  public render({
    validationOutput: { validationId: id, category, annotation, suggestions },
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
                validationId={id}
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
