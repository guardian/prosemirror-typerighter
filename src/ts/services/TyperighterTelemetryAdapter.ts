import {
  ITyperighterTelemetryEvent,
  ISuggestionAcceptedEvent,
  TYPERIGHTER_TELEMETRY_TYPE,
  IMarkAsCorrectEvent,
  ISidebarClickEvent
} from "../interfaces/ITelemetryData";

class TyperighterTelemetryAdapter {
  constructor(
    private sendTelemetryEvent: (event: ITyperighterTelemetryEvent) => void,
    private app: string, 
    private stage: string
  ) {}

  public suggestionIsAccepted(tags: ISuggestionAcceptedEvent["tags"]) {
    this.sendTelemetryEvent({
      app: this.app,
      stage: this.stage,
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SUGGESTION_IS_ACCEPTED,
      value: 1,
      eventTime: new Date().toISOString(),
      tags
    });
  }

  public matchIsMarkedAsCorrect(tags: IMarkAsCorrectEvent["tags"]) {
    this.sendTelemetryEvent({
      app: this.app,
      stage: this.stage,
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_MARK_AS_CORRECT,
      value: 1,
      eventTime: new Date().toISOString(),
      tags
    });
  }

  public documentIsChecked(tags: ITyperighterTelemetryEvent["tags"]) {
    this.sendTelemetryEvent({
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_CHECK_DOCUMENT,
      value: 1,
      eventTime: new Date().toISOString(),
      tags
    });
  }

  public typerighterIsOpened(tags: ITyperighterTelemetryEvent["tags"]) {
    this.sendTelemetryEvent({
        app: this.app,
        stage: this.stage,
        type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_OPEN_STATE_CHANGED,
        value: true,
        eventTime: new Date().toISOString(),
        tags
    });
  }

  public typerighterIsClosed(tags: ITyperighterTelemetryEvent["tags"]) {
    this.sendTelemetryEvent({
        app: this.app,
        stage: this.stage,
        type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_OPEN_STATE_CHANGED,
        value: false,
        eventTime: new Date().toISOString(),
        tags
    });
  }

  public sidebarMatchClicked(tags: ISidebarClickEvent["tags"]) {
    this.sendTelemetryEvent({
        app: this.app,
        stage: this.stage,
        type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SIDEBAR_MATCH_CLICK,
        value: 1,
        eventTime: new Date().toISOString(),
        tags
    });
  }
}

export default TyperighterTelemetryAdapter;