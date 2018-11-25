import { h, Component } from "preact";

export interface DecorationComponentProps {
  type: string;
  annotation: string;
  suggestions?: string[];
  applySuggestion?: (suggestion: string) => void;
}

class Decoration extends Component<DecorationComponentProps> {
  private containerRef: HTMLDivElement;
  render({
    type,
    annotation,
    suggestions,
    applySuggestion
  }: DecorationComponentProps) {
    return (
      <span className="ValidationWidget__container" ref={_ => this.containerRef = _}>
        <span className="ValidationWidget">
          <span className="ValidationWidget__label">{type}</span>
          {annotation}
          {suggestions && !!suggestions.length &&
            applySuggestion && (
              <span className="ValidationWidget__suggestion-list">
                          <span className="ValidationWidget__label">Suggestions</span>

                {suggestions.map(suggestion => (
                  <span
                    class="ValidationWidget__suggestion"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    {suggestion}
                  </span>
                ))}
              </span>
            )}
        </span>
      </span>
    );
  }
}

export default Decoration;
