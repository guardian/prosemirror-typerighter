import {
  ICheckDocumentEvent,
  IClearDocumentEvent,
  IMarkAsCorrectEvent,
  IMatchFoundEvent,
  IOpenTyperighterEvent,
  ISidebarClickEvent,
  ISuggestionAcceptedEvent,
  ISummaryToggleEvent,
  ITyperighterTelemetryEvent,
  TYPERIGHTER_TELEMETRY_TYPE,
} from "../interfaces/ITelemetryData";
import TelemetryService from './TelemetryService';
import { IMatch } from "..";

class TyperighterTelemetryAdapter {
  constructor(
    private telemetryService: TelemetryService,
    private app: string,
    private stage: string
  ) {}

  public suggestionIsAccepted(match: IMatch, documentUrl: string, suggestion: string) {
    this.telemetryService.addEvent({
      app: this.app,
      stage: this.stage,
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SUGGESTION_IS_ACCEPTED,
      value: 1,
      eventTime: new Date().toISOString(),
      tags: {
        suggestion,
        documentUrl,
        ...this.getTelemetryTagsFromMatch(match)
      }
    } as ISuggestionAcceptedEvent);
  }

  public matchIsMarkedAsCorrect(match: IMatch, documentUrl: string) {
    this.telemetryService.addEvent({
      app: this.app,
      stage: this.stage,
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_MARK_AS_CORRECT,
      value: 1,
      eventTime: new Date().toISOString(),
      tags: {
        documentUrl,
        ...this.getTelemetryTagsFromMatch(match)
      }
    } as IMarkAsCorrectEvent);
  }

  public documentIsChecked(tags: ITyperighterTelemetryEvent["tags"]) {
    this.telemetryService.addEvent({
      app: this.app,
      stage: this.stage,
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_CHECK_DOCUMENT,
      value: 1,
      eventTime: new Date().toISOString(),
      tags
    } as ICheckDocumentEvent);
  }

  public documentIsCleared(tags: ITyperighterTelemetryEvent["tags"]) {
    this.telemetryService.addEvent({
      app: this.app,
      stage: this.stage,
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_CLEAR_DOCUMENT,
      value: 1,
      eventTime: new Date().toISOString(),
      tags
    } as IClearDocumentEvent);
  }

  public typerighterIsOpened(tags: ITyperighterTelemetryEvent["tags"]) {
    this.telemetryService.addEvent({
        app: this.app,
        stage: this.stage,
        type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_OPEN_STATE_CHANGED,
        value: 1,
        eventTime: new Date().toISOString(),
        tags
    } as IOpenTyperighterEvent);
  }

  public typerighterIsClosed(tags: ITyperighterTelemetryEvent["tags"]) {
    this.telemetryService.addEvent({
        app: this.app,
        stage: this.stage,
        type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_OPEN_STATE_CHANGED,
        value: 0,
        eventTime: new Date().toISOString(),
        tags
     } as IOpenTyperighterEvent);
  }

  public sidebarMatchClicked(match: IMatch, documentUrl: string) {
    this.telemetryService.addEvent({
        app: this.app,
        stage: this.stage,
        type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SIDEBAR_MATCH_CLICK,
        value: 1,
        eventTime: new Date().toISOString(),
        tags: {
          documentUrl,
          ...this.getTelemetryTagsFromMatch(match)
        }
    } as ISidebarClickEvent);
  }

  public matchFound(match: IMatch, documentUrl: string) {
    this.telemetryService.addEvent({
        app: this.app,
        stage: this.stage,
        type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_MATCH_FOUND,
        value: 1,
        eventTime: new Date().toISOString(),
        tags: {
          documentUrl,
          ...this.getTelemetryTagsFromMatch(match)
        }
    } as IMatchFoundEvent);
  }

  public summaryViewToggled(toggledOn: boolean, tags: ITyperighterTelemetryEvent["tags"]) {
    this.telemetryService.addEvent({
        app: this.app,
        stage: this.stage,
        type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SUMMARY_VIEW_TOGGLE_CHANGED,
        value: toggledOn ? 1 : 0,
        eventTime: new Date().toISOString(),
        tags
    } as ISummaryToggleEvent);
  }

  private getTelemetryTagsFromMatch = (match: IMatch) => ({
    matcherType: match.matcherType,
    ruleId: match.ruleId,
    matchId: match.matchId,
    matchedText: match.matchedText,
    matchHasReplacement: match.replacement ? 'true' : 'false',
    matchIsAdvisory: 'false',
    matchIsMarkedAsCorrect: match.markAsCorrect ? 'true' : 'false',
  })
}

export default TyperighterTelemetryAdapter;
