import createValidationPlugin from "./createValidationPlugin";
import ValidationService from "./services/ValidationAPIService";
import createTyperighterAdapter from "./services/adapters/typerighter";
import { createBoundCommands } from "./commands";
import createView from './createView';

export { ValidationService, createTyperighterAdapter, createBoundCommands, createView };
export default createValidationPlugin;
