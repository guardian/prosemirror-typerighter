interface ITelemetryEvent {
  // The type of event we're sending, e.g. 'TYPERIGHTER_SUGGESTION_ACCEPTED' | 'TYPERIGHTER_MATCH_CREATED'
  type: string;
  // The value of the event in question
  value: boolean | number;
  // The time the event occurred (not the time it was queued, or sent), in ISO-8601 date format
  eventTime: string;
  // The event metadata – any additional context we'd like to provide
  tags: {
    [key: string]: string | number | boolean;
  };
}

enum TYPERIGHTER_TELEMETRY_TYPE {
  TYPERIGHTER_SUGGESTION_IS_ACCEPTED = "TYPERIGHTER_SUGGESTION_IS_ACCEPTED",
  TYPERIGHTER_MARK_AS_CORRECT = "TYPERIGHTER_MARK_AS_CORRECT",
  TYPERIGHTER_MATCH_FOUND = "TYPERIGHTER_MATCH_FOUND",
  TYPERIGHTER_CHECK_DOCUMENT = "TYPERIGHTER_CHECK_DOCUMENT",
  TYPERIGHTER_OPEN_STATE_CHANGED = "TYPERIGHTER_OPEN_STATE_CHANGED",
  TYPERIGHTER_SIDEBAR_MATCH_CLICK = "TYPERIGHTER_SIDEBAR_MATCH_CLICK"
}

interface ITyperighterTelemetryEvent extends ITelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE;
  tags: ITelemetryEvent["tags"] & {
    // The URL of the resource containing the text that was scanned
    documentUrl: string;
  };
}

interface IMatchEventTags {
  ruleId: string;
  suggestion?: string;
  match: string;
  matchContext: string;
}

interface IMatchFoundEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_MATCH_FOUND;
  value: 1;
  tags: ITyperighterTelemetryEvent["tags"] & IMatchEventTags;
}

interface ISuggestionEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SUGGESTION_IS_ACCEPTED;
  value: boolean;
  tags: ITyperighterTelemetryEvent["tags"] &
    IMatchEventTags & {
      suggestion: string;
    };
}

interface IMarkAsCorrectEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_MARK_AS_CORRECT;
  value: 1;
  tags: ITyperighterTelemetryEvent["tags"] & IMatchEventTags;
}

interface ICheckDocumentEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_CHECK_DOCUMENT;
  value: 1;
}

interface IOpenTyperighterEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_OPEN_STATE_CHANGED;
  value: boolean;
}

interface ISidebarClickEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SIDEBAR_MATCH_CLICK;
  value: 1;
  tags: ITyperighterTelemetryEvent["tags"] & IMatchEventTags;
}
