import { MatchType } from "../utils/decoration";

type TelemetryBool = "true" | "false";

export interface ITelemetryEvent {
  /**
   * The application sending the event
   */
  app: string;

  /**
   * The application stage, e.g. 'CODE' | 'PROD'
   */
  stage: string;

  /**
   * The type of event we're sending, e.g. 'USER_ACTION_1' | 'USER_ACTION_2'
   */
  type: string;

  /**
   * The value of the event in question
   */
  value: number;

  /**
   * The time the event occurred (not the time it was queued, or sent), in ISO-8601 date format
   * @format date-time
   */
  eventTime: string;

  /**
   * The event metadata – any additional context we'd like to provide.
   */
  tags?: {
    [key: string]: string | number | boolean;
  };
}

export enum TYPERIGHTER_TELEMETRY_TYPE {
  TYPERIGHTER_MATCH_DECORATION_CLICKED = "TYPERIGHTER_MATCH_DECORATION_CLICKED",
  TYPERIGHTER_SUGGESTION_IS_ACCEPTED = "TYPERIGHTER_SUGGESTION_IS_ACCEPTED",
  TYPERIGHTER_MARK_AS_CORRECT = "TYPERIGHTER_MARK_AS_CORRECT",
  TYPERIGHTER_MATCH_FOUND = "TYPERIGHTER_MATCH_FOUND",
  TYPERIGHTER_CHECK_DOCUMENT = "TYPERIGHTER_CHECK_DOCUMENT",
  TYPERIGHTER_CLEAR_DOCUMENT = "TYPERIGHTER_CLEAR_DOCUMENT",
  TYPERIGHTER_OPEN_STATE_CHANGED = "TYPERIGHTER_OPEN_STATE_CHANGED",
  TYPERIGHTER_SIDEBAR_MATCH_CLICK = "TYPERIGHTER_SIDEBAR_MATCH_CLICK",
  TYPERIGHTER_SUMMARY_VIEW_TOGGLE_CHANGED = "TYPERIGHTER_SUMMARY_VIEW_TOGGLE_CHANGED",
  TYPERIGHTER_FILTER_STATE_CHANGED = "TYPERIGHTER_FILTER_STATE_CHANGED"
}

export interface ITyperighterTelemetryEvent extends ITelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE;
  tags: ITelemetryEvent["tags"] & {
    // The URL of the resource containing the text that was scanned
    documentUrl: string;
  };
}

interface IMatchEventTags {
  matcherType: string;
  ruleId: string;
  suggestion?: string;
  matchId: string;
  matchIsMarkedAsCorrect: TelemetryBool;
  matchIsAdvisory: TelemetryBool;
  matchHasReplacement: TelemetryBool;
  matchedText: string;
  matchContext: string;
}

export interface IMatchFoundEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_MATCH_FOUND;
  value: 1;
  tags: ITyperighterTelemetryEvent["tags"] & IMatchEventTags;
}

export interface ISuggestionAcceptedEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SUGGESTION_IS_ACCEPTED;
  value: 1;
  tags: ITyperighterTelemetryEvent["tags"] &
    IMatchEventTags & {
      suggestion: string;
    };
}

export interface IMarkAsCorrectEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_MARK_AS_CORRECT;
  value: 1;
  tags: ITyperighterTelemetryEvent["tags"] & IMatchEventTags;
}

export interface IMatchDecorationClickedEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_MATCH_DECORATION_CLICKED;
  value: 1;
  tags: ITyperighterTelemetryEvent["tags"] & IMatchEventTags;
}

export interface ICheckDocumentEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_CHECK_DOCUMENT;
  value: 1;
}

export interface IClearDocumentEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_CLEAR_DOCUMENT;
  value: 1;
}

export interface IOpenTyperighterEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_OPEN_STATE_CHANGED;
  value: 0 | 1;
}

export interface ISidebarClickEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SIDEBAR_MATCH_CLICK;
  value: 1;
  tags: ITyperighterTelemetryEvent["tags"] & IMatchEventTags;
}

export interface ISummaryToggleEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SUMMARY_VIEW_TOGGLE_CHANGED;
  value: 0 | 1;
}

export interface IFilterToggleEvent extends ITyperighterTelemetryEvent {
  type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_FILTER_STATE_CHANGED;
  value: 0 | 1;
  tags: ITyperighterTelemetryEvent["tags"] & { matchType: MatchType };
}
