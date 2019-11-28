import createTyperighterPlugin from "./createTyperighterPlugin";
import MatcherService from "./services/MatcherService";
import TyperighterAdapter from "./services/adapters/TyperighterAdapter";
import { createBoundCommands } from "./commands";
import createView from "./createView";
import '../css/index.scss';

export {
  MatcherService,
  TyperighterAdapter,
  createBoundCommands,
  createView,
  createTyperighterPlugin
};
