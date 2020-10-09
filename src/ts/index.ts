import { IMatch, IBlock } from './interfaces/IMatch'
import Store from './state/store';
import createTyperighterPlugin from "./createTyperighterPlugin";
import MatcherService from "./services/MatcherService";
import TelemetryService from "./services/TelemetryService";
import TyperighterTelemetryAdapter from "./services/TyperighterTelemetryAdapter";
import TyperighterAdapter, { convertTyperighterResponse } from "./services/adapters/TyperighterAdapter";
import { createBoundCommands } from "./commands";
import { getBlocksFromDocument } from './utils/prosemirror';
import createView from "./createView";
import '../css/index.scss';

export {
  MatcherService,
  TelemetryService,
  TyperighterTelemetryAdapter,
  TyperighterAdapter,
  getBlocksFromDocument,
  convertTyperighterResponse,
  createBoundCommands,
  createView,
  createTyperighterPlugin,
  IMatch,
  IBlock,
  Store
};
