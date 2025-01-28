import React, { useState, useEffect, useContext } from "react";
import { v4 } from "uuid";
import { IconButton } from "@mui/material";
import { DeleteForever } from "@mui/icons-material";
import Store, { STORE_EVENT_NEW_STATE, StoreState } from "../state/store";
import { ICategory } from "../interfaces/IMatch";
import {
  selectHasGeneralError,
  selectHasAuthError,
  selectRequestsInProgress,
  selectHasMatches,
  selectDocumentHasChanged,
  selectDocumentIsEmpty,
  selectPluginConfig
} from "../state/selectors";
import TelemetryContext from "../contexts/TelemetryContext";
import TyperighterTelemetryAdapter from "../services/TyperighterTelemetryAdapter";

interface IProps {
  store: Store;
  clearMatches: () => void;
  setShowPendingInflightChecks: (isEnabled: boolean) => void;
  setRequestOnDocModified: (r: boolean) => void;
  setTyperighterEnabled: (typerighterEnabled: boolean) => void;
  requestMatchesForDocument: (requestId: string, categoryIds: string[], telemetryAdapter?: TyperighterTelemetryAdapter) => void;
  getCurrentCategories: () => ICategory[];
  addCategory: (id: string) => void;
  removeCategory: (id: string) => void;
  feedbackHref?: string;
  enableDevMode?: boolean;
}

const getErrorFeedbackLink = (
  pluginState: StoreState | undefined,
  feedbackHref: string | undefined
) => {
  const errorLimit = 10;
  const data = {
    url: document.location.href,
    errors: pluginState?.requestErrors?.slice(0, errorLimit)
  };
  const encodedData = encodeURIComponent(JSON.stringify(data, undefined, 2));
  return feedbackHref + encodedData;
};

/**
 * Controls to open and close Typerighter and check document.
 */
const Controls = ({
  store,
  clearMatches,
  requestMatchesForDocument,
  getCurrentCategories,
  feedbackHref,
  enableDevMode,
  setRequestOnDocModified,
  setShowPendingInflightChecks,
  setTyperighterEnabled
}: IProps) => {
  const [pluginState, setPluginState] = useState<StoreState | undefined>(
    undefined
  );

  useEffect(() => {
    store.on(STORE_EVENT_NEW_STATE, newState => {
      setPluginState(newState);
    });
    setPluginState(store.getState());
  }, []);

  const { telemetryAdapter } = useContext(TelemetryContext);

  const requestMatches = () => {
    requestMatchesForDocument(
      v4(),
      getCurrentCategories().map(_ => _.id),
      telemetryAdapter
    );
  };

  const handleCheckDocumentButtonClick = (): void => {
    requestMatches();
  };

  const handleClearButtonClick = (): void => {
    clearMatches();
    telemetryAdapter?.documentIsCleared({ documentUrl: document.URL });
  };

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

  const renderCheckDocumentButton = () => {
    const requestInProgress =
      !!pluginState && selectRequestsInProgress(pluginState);
    const docIsEmpty = !!pluginState && selectDocumentIsEmpty(pluginState);
    const docHasChanged =
      !!pluginState && !docIsEmpty && selectDocumentHasChanged(pluginState);

    const isDisabled = requestInProgress || docIsEmpty;
    const message = docIsEmpty ? "The document has no text to check" : "";

    const plainButton = (
      <>
        <button
          type="button"
          className="Sidebar__header-button Button"
          onClick={handleCheckDocumentButtonClick}
          disabled={isDisabled}
          title={message}
        >
          Check document
        </button>

      </>
    );

    if (!docHasChanged) {
      return plainButton;
    }

    return (
      <div
        className="Sidebar__header-button-container"
        title="Changes were made since last check"
      >
        {plainButton}
        <div className="Sidebar__header-change-indicator"></div>
      </div>
    );
  };

  if (!pluginState) {
    return null;
  }

  const { requestMatchesOnDocModified, showPendingInflightChecks } = selectPluginConfig(pluginState)
  const typerighterEnabled = pluginState.typerighterEnabled;

  return (
    <>
      <div className="Sidebar__header-container">
        <div className="Sidebar__header">
          {renderCheckDocumentButton()}
          <IconButton
            size="small"
            aria-label="clear all matches"
            title="clear all matches"
            onClick={handleClearButtonClick}
            disabled={
              pluginState &&
              (selectRequestsInProgress(pluginState) ||
                !selectHasMatches(pluginState))
            }
          >
            <DeleteForever />
          </IconButton>
        </div>
        {enableDevMode && (
          <div>
            <hr />
            <div className="Controls__input-group">
              <input
                type="checkbox"
                id="real-time-checks"
                checked={requestMatchesOnDocModified}
                onChange={() =>
                  setRequestOnDocModified(!requestMatchesOnDocModified)
                }
              ></input>
              <label htmlFor="real-time-checks" className="Controls__label">
                Enable real-time checking
              </label>
            </div>
            <div className="Controls__input-group">
              <input
                type="checkbox"
                id="debug"
                checked={showPendingInflightChecks}
                onChange={() => setShowPendingInflightChecks(!showPendingInflightChecks)}
              ></input>
              <label htmlFor="debug" className="Controls__label">
                Show pending and inflight checks
              </label>
            </div>
            <div className="Controls__input-group">
              <input
                type="checkbox"
                id="debug"
                checked={typerighterEnabled}
                onChange={() => setTyperighterEnabled(!typerighterEnabled)}
              ></input>
              <label htmlFor="debug" className="Controls__label">
                Enable Typerighter
              </label>
            </div>
          </div>
        )}
      </div>
      {renderErrorMessage()}
    </>
  );
};

export default Controls;
