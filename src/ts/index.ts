import type { IMatch, ICategory, IBlock, ISuggestion } from './interfaces/IMatch'
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
import * as decoration from  './utils/decoration'
import TelemetryContext from './contexts/TelemetryContext';
import { IPluginState } from './state/reducer';
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
  IMatch,
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
  decoration,
  TelemetryContext
};
