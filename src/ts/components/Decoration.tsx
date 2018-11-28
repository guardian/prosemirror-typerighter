import { h, Component } from "preact";

export interface DecorationComponentProps {
  type: string;
  annotation: string;
  suggestions?: string[];
  applySuggestion?: (suggestion: string) => void;
}

class Decoration extends Component<DecorationComponentProps> {
  render({
    type,
    annotation,
    suggestions,
    applySuggestion
  }: DecorationComponentProps) {
    return (
      <div className="ValidationWidget__container" onMouseOver={console.warn}>
        <div className="ValidationWidget">
          <div className="ValidationWidget__label">{type}</div>
          {annotation}
          {suggestions &&
            !!suggestions.length &&
            applySuggestion && (
              <div className="ValidationWidget__suggestion-list">
                <div className="ValidationWidget__label">Suggestions</div>
                {suggestions.map(suggestion => (
                  <div
                    class="ValidationWidget__suggestion"
                    onClick={() => applySuggestion(suggestion)}
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

export default Decoration;
