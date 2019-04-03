import "../css/validation.scss";
import "../css/sidebar.scss";
import "../css/validationControls.scss";
import "../css/validationSidebarOutput.scss";
import createValidationPlugin from "./createValidationPlugin";
import ValidationService from "./services/ValidationAPIService";
import createTyperighterAdapter from "./services/adapters/typerighter";
import { createBoundCommands } from "./commands";
import createView from './createView';

export { ValidationService, createTyperighterAdapter, createBoundCommands, createView };
export default createValidationPlugin;
