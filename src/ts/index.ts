import createTyperighterPlugin from "./createTyperighterPlugin";
import MatcherService from "./services/MatcherService";
import TyperighterAdapter from "./services/adapters/TyperighterAdapter";
import { createBoundCommands } from "./commands";
import { getBlocksFromDocument } from './utils/prosemirror';
import createView from "./createView";
import '../css/index.scss';

export {
  MatcherService,
  TyperighterAdapter,
  getBlocksFromDocument,
  createBoundCommands,
  createView,
  createTyperighterPlugin
};
