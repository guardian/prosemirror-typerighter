import { h, Component } from "preact";

export interface DecorationComponentProps {
  type: string;
  from: number;
  to: number;
  annotation: string;
  suggestions?: string[];
  applySuggestion?: (suggestion: string, from: number, to: number) => void;
}

class Decoration extends Component<DecorationComponentProps> {
  public ref: HTMLDivElement;
  render({
    type,
    from,
    to,
    annotation,
    suggestions,
    applySuggestion
  }: DecorationComponentProps) {
    return (
      <div className="ValidationWidget__container">
        <div className="ValidationWidget" ref={_ => this.ref = _}>
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
                    onClick={() => applySuggestion(suggestion, from, to)}
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
