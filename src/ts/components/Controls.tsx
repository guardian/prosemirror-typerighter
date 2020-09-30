import React, { useState, useEffect, useContext } from "react";
import { v4 } from "uuid";
import IconButton from "@material-ui/core/IconButton";
import { Close } from "@material-ui/icons";

import Store, { STORE_EVENT_NEW_STATE } from "../state/store";
import { IPluginState } from "../state/reducer";
import { ICategory } from "../interfaces/IMatch";
import {
  selectHasGeneralError,
  selectHasAuthError,
  selectRequestsInProgress,
  selectPluginIsActive
} from "../state/selectors";
import TelemetryContext from "../contexts/TelemetryContext";

interface IProps<TPluginState extends IPluginState> {
  store: Store<TPluginState>;
  setDebugState: (debug: boolean) => void;
  setRequestOnDocModified: (r: boolean) => void;
  requestMatchesForDocument: (requestId: string, categoryIds: string[]) => void;
  getCurrentCategories: () => ICategory[];
  addCategory: (id: string) => void;
  removeCategory: (id: string) => void;
  feedbackHref?: string;
  onToggleActiveState: () => void;
}

const getErrorFeedbackLink = (
  pluginState: IPluginState | undefined,
  feedbackHref: string | undefined
) => {
  const errorLmit = 10;
  const data = {
    url: document.location.href,
    errors: pluginState?.requestErrors?.slice(0, errorLmit)
  };
  const encodedData = encodeURIComponent(JSON.stringify(data, undefined, 2));
  return feedbackHref + encodedData;
};

/**
 * Controls to open and close Typerighter and check document.
 */
const Controls = <TPluginState extends IPluginState>({
  store,
  requestMatchesForDocument,
  getCurrentCategories,
  feedbackHref,
  onToggleActiveState,
}: IProps<TPluginState>) => {
  const [pluginState, setPluginState] = useState<
    TPluginState | undefined
  >(undefined);

  const { telemetryAdapter } = useContext(TelemetryContext);

  useEffect(() => {
    store.on(STORE_EVENT_NEW_STATE, newState => {
      setPluginState(newState);
    });
    setPluginState(store.getState());
  }, []);

  const pluginIsActive = pluginState && selectPluginIsActive(pluginState);

  const requestMatches = () => {
    requestMatchesForDocument(
      v4(),
      getCurrentCategories().map(_ => _.id)
    );
  };

  const handleCheckDocumentButtonClick = (): void => {
    if (!pluginIsActive) {
      onToggleActiveState();
      telemetryAdapter?.typerighterIsOpened({ documentUrl: document.URL });
    }
    requestMatches();
    telemetryAdapter?.documentIsChecked({ documentUrl: document.URL });
  };

  const handleCloseButtonClick = (): void => {
    telemetryAdapter?.typerighterIsClosed({ documentUrl: document.URL });
    onToggleActiveState();
  };

  const headerContainerClasses = pluginIsActive
    ? "Sidebar__header-container"
    : "Sidebar__header-container Sidebar__header-container--is-closed";

  const renderErrorMessage = () => {
    if (!pluginState) {
      return;
    }

    const hasAuthError = selectHasAuthError(pluginState);
    const hasGeneralError = selectHasGeneralError(pluginState);
    const hasErrors: boolean = hasAuthError || hasGeneralError;

    if (!hasErrors) {
      return;
    }

    const errorMessage: string = hasAuthError
      ? "Authentication error - please refresh the page."
      : "Error fetching matches. Please try checking the document again.";

    return (
      <div className="Controls__error-message">
        {errorMessage}
        {feedbackHref && (
          <span>
            If the error persists, please{" "}
            <a
              href={getErrorFeedbackLink(pluginState, feedbackHref)}
              target="_blank"
            >
              contact us
            </a>
            .
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={headerContainerClasses}>
        <div className="Sidebar__header">
          <button
            type="button"
            className="Button"
            onClick={handleCheckDocumentButtonClick}
            disabled={pluginState && selectRequestsInProgress(pluginState)}
          >
            Check document
          </button>
          {pluginIsActive && (
            <IconButton
              size="small"
              aria-label="close Typerighter"
              onClick={handleCloseButtonClick}
              disabled={pluginState && selectRequestsInProgress(pluginState)}
            >
              <Close />
            </IconButton>
          )}
        </div>
      </div>
      {pluginIsActive && renderErrorMessage()}
    </>
  );
};

export default Controls;
