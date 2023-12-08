import type { ICategory, IBlock, ISuggestion, Match } from './interfaces/IMatch'
import type { IPluginState } from './state/reducer';
import type { IMatchTypeToColourMap } from './utils/decoration';
import Store, { STORE_EVENT_NEW_STATE } from './state/store';
import createTyperighterPlugin from "./createTyperighterPlugin";
import MatcherService from "./services/MatcherService";
import { UserTelemetryEventSender, IUserTelemetryEvent} from "@guardian/user-telemetry-client";
import TyperighterTelemetryAdapter from "./services/TyperighterTelemetryAdapter";
import TyperighterAdapter, { convertTyperighterResponse } from "./services/adapters/TyperighterAdapter";
import TyperighterChunkedAdapter from "./services/adapters/TyperighterChunkedAdapter";
import { commands, createBoundCommands } from "./commands";
import * as selectors from "./state/selectors";
import { getBlocksFromDocument } from './utils/prosemirror';
import { createOverlayView } from "./components/createOverlayView";
import { filterByMatchState, getState } from './utils/plugin';
import '../css/index.scss';
import { getSquiggleAsUri } from './utils/squiggle';
import { MatchType, getMatchType, getColourForMatch, getColourForMatchType, getMatchOffset } from  './utils/decoration'
import TelemetryContext from './contexts/TelemetryContext';
import { findAncestor, getHtmlFromMarkdown } from './utils/dom';

export {
  MatcherService,
  UserTelemetryEventSender,
  TyperighterTelemetryAdapter,
  TyperighterAdapter,
  TyperighterChunkedAdapter,
  getBlocksFromDocument,
  convertTyperighterResponse,
  createBoundCommands,
  commands,
  createOverlayView,
  selectors,
  getState,
  createTyperighterPlugin,
  filterByMatchState,
  Match,
  IBlock,
  ICategory,
  ISuggestion,
  IUserTelemetryEvent,
  IPluginState,
  Store,
  STORE_EVENT_NEW_STATE,
  getSquiggleAsUri,
  findAncestor,
  getHtmlFromMarkdown,
  MatchType,
  IMatchTypeToColourMap,
  getMatchType,
  getColourForMatch,
  getColourForMatchType,
  getMatchOffset,
  TelemetryContext
};
