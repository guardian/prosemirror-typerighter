import { IMatch, IBlock } from './interfaces/IMatch'
import { IStore } from './state/store';
import createTyperighterPlugin from "./createTyperighterPlugin";
import MatcherService from "./services/MatcherService";
import TyperighterAdapter, { convertTyperighterResponse } from "./services/adapters/TyperighterAdapter";
import { createBoundCommands } from "./commands";
import { getBlocksFromDocument } from './utils/prosemirror';
import createView from "./createView";
import '../css/index.scss';

export {
  MatcherService,
  TyperighterAdapter,
  getBlocksFromDocument,
  convertTyperighterResponse,
  createBoundCommands,
  createView,
  createTyperighterPlugin,
  IMatch,
  IBlock,
  IStore
};
