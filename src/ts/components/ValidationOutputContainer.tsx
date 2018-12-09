import { Component, h } from 'preact';
import { ApplySuggestionOptions } from '..';

export interface IDecorationComponentProps {
  id: string;
  type: string;
  from: number;
  to: number;
  annotation: string;
  suggestions?: string[];
  applySuggestions?: (opts: ApplySuggestionOptions) => void;
}

class ValidationOutput extends Component<IDecorationComponentProps> {
  public ref: HTMLDivElement;
  public render({
    id,
    type,
    annotation,
    suggestions,
    applySuggestions
  }: IDecorationComponentProps) {
    return (
      <div className="ValidationWidget__container">
        <div className="ValidationWidget" ref={_ => this.ref = _}>
          <div className="ValidationWidget__label">{type}</div>
          {annotation}
          {suggestions &&
            !!suggestions.length &&
            applySuggestions && (
              <div className="ValidationWidget__suggestion-list">
                <div className="ValidationWidget__label">Suggestions</div>
                {suggestions.map((suggestion, suggestionIndex) => (
                  <div
                    class="ValidationWidget__suggestion"
                    onClick={() => applySuggestions([{
                      validationId: id,
                      suggestionIndex
                    }])}
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
