import type { IMatch, IBlock } from './interfaces/IMatch'
import Store from './state/store';
import createTyperighterPlugin from "./createTyperighterPlugin";
import MatcherService from "./services/MatcherService";
import { UserTelemetryEventSender, IUserTelemetryEvent} from "@guardian/user-telemetry-client";
import TyperighterTelemetryAdapter from "./services/TyperighterTelemetryAdapter";
import TyperighterAdapter, { convertTyperighterResponse } from "./services/adapters/TyperighterAdapter";
import TyperighterChunkedAdapter from "./services/adapters/TyperighterChunkedAdapter";
import { commands, createBoundCommands } from "./commands";
import { getBlocksFromDocument } from './utils/prosemirror';
import { filterByMatchState } from './utils/plugin';
import createView from "./createView";
import '../css/index.scss';

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
  createView,
  createTyperighterPlugin,
  filterByMatchState,
  IMatch,
  IBlock,
  IUserTelemetryEvent,
  Store
};
