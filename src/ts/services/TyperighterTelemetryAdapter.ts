import {
  ICheckDocumentEvent,
  IClearDocumentEvent,
  IFilterToggleEvent,
  IMarkAsCorrectEvent,
  IMatchDecorationClickedEvent,
  IMatchFoundEvent,
  IOpenTyperighterEvent,
  ISidebarClickEvent,
  ISuggestionAcceptedEvent,
  ITyperighterTelemetryEvent,
  TYPERIGHTER_TELEMETRY_TYPE
} from "../interfaces/ITelemetryData";
import { IUserTelemetryEvent, UserTelemetryEventSender } from "@guardian/user-telemetry-client";
import { IMatch } from "..";
import { MatchType } from "../utils/decoration";

class TyperighterTelemetryAdapter {
  constructor(
    private telemetryService: UserTelemetryEventSender,
    private app: string,
    private stage: string,
    private tags?: IUserTelemetryEvent["tags"],
  ) {}

  // used to update tags that are only known after the telemetry adaptor has been initialised
  public updateTelemetryTags(tags: IUserTelemetryEvent["tags"]) {
    this.tags = { ...this.tags, ...tags};
  }

  public suggestionIsAccepted(
    match: IMatch,
    documentUrl: string,
    suggestion: string
  ) {
    this.addEvent({
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SUGGESTION_IS_ACCEPTED,
      value: 1,
      tags: {
        suggestion,
        documentUrl,
        ...this.getTelemetryTagsFromMatch(match)
      }
    } as ISuggestionAcceptedEvent);
  }

  public matchIsMarkedAsCorrect(match: IMatch, documentUrl: string) {
    this.addEvent({
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_MARK_AS_CORRECT,
      value: 1,
      tags: {
        documentUrl,
        ...this.getTelemetryTagsFromMatch(match)
      }
    } as IMarkAsCorrectEvent);
  }

  public matchDecorationClicked(match: IMatch, documentUrl: string) {
    this.addEvent({
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_MATCH_DECORATION_CLICKED,
      value: 1,
      tags: {
        documentUrl,
        ...this.getTelemetryTagsFromMatch(match)
      }
    } as IMatchDecorationClickedEvent);
  }

  public documentIsChecked(tags: ITyperighterTelemetryEvent["tags"]) {
    this.addEvent({
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_CHECK_DOCUMENT,
      value: 1,
      tags
    } as ICheckDocumentEvent);
  }

  public documentIsCleared(tags: ITyperighterTelemetryEvent["tags"]) {
    this.addEvent({
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_CLEAR_DOCUMENT,
      value: 1,
      tags
    } as IClearDocumentEvent);
  }

  public typerighterIsOpened(tags: ITyperighterTelemetryEvent["tags"]) {
    this.addEvent({
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_OPEN_STATE_CHANGED,
      value: 1,
      tags
    } as IOpenTyperighterEvent);
  }

  public typerighterIsClosed(tags: ITyperighterTelemetryEvent["tags"]) {
    this.addEvent({
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_OPEN_STATE_CHANGED,
      value: 0,
      tags
    } as IOpenTyperighterEvent);
  }

  public sidebarMatchClicked(match: IMatch, documentUrl: string) {
    this.addEvent({
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SIDEBAR_MATCH_CLICK,
      value: 1,
      tags: {
        documentUrl,
        ...this.getTelemetryTagsFromMatch(match)
      }
    } as ISidebarClickEvent);
  }

  public matchFound(match: IMatch, documentUrl: string) {
    this.addEvent({
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_MATCH_FOUND,
      value: 1,
      tags: {
        documentUrl,
        ...this.getTelemetryTagsFromMatch(match)
      }
    } as IMatchFoundEvent);
  }

  public filterStateToggled(matchType: MatchType, toggledOn: boolean) {
    this.addEvent({
      type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_FILTER_STATE_CHANGED,
      value: toggledOn ? 1 : 0,
      tags: { matchType }
    } as IFilterToggleEvent);
  }

  private addEvent<TEvent extends ITyperighterTelemetryEvent>(
    event: Omit<TEvent, "app" | "stage" | "eventTime">
  ) {
    this.telemetryService.addEvent({
      type: event.type,
      value: event.value,
      app: this.app,
      stage: this.stage,
      tags: { ...this.tags, ...event.tags },
      eventTime: new Date().toISOString()
    });
  }

  private getTelemetryTagsFromMatch = (match: IMatch) => ({
    matcherType: match.matcherType,
    ruleId: match.ruleId,
    matchId: match.matchId,
    matchedText: match.matchedText,
    matchHasReplacement: match.replacement ? "true" : "false",
    matchIsAdvisory: "false",
    matchIsMarkedAsCorrect: match.markAsCorrect ? "true" : "false"
  });
}

export default TyperighterTelemetryAdapter;
