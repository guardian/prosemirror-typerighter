import React, { useState, useEffect, useContext } from "react";
import { v4 } from "uuid";
import IconButton from "@material-ui/core/IconButton";
import { DeleteForever } from "@material-ui/icons";

import Store, { STORE_EVENT_NEW_STATE } from "../state/store";
import { IPluginState } from "../state/reducer";
import { IMatch, ICategory } from "../interfaces/IMatch";
import {
  selectHasGeneralError,
  selectHasAuthError,
  selectRequestsInProgress,
  selectHasMatches
} from "../state/selectors";
import TelemetryContext from "../contexts/TelemetryContext";

interface IProps {
  store: Store<IMatch>;
  clearMatches: () => void;
  setDebugState: (debug: boolean) => void;
  setRequestOnDocModified: (r: boolean) => void;
  requestMatchesForDocument: (requestId: string, categoryIds: string[]) => void;
  getCurrentCategories: () => ICategory[];
  addCategory: (id: string) => void;
  removeCategory: (id: string) => void;
  feedbackHref?: string;
}

const getErrorFeedbackLink = (
  pluginState: IPluginState<IMatch> | undefined,
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
const Controls = ({
  store,
  clearMatches,
  requestMatchesForDocument,
  getCurrentCategories,
  feedbackHref
}: IProps) => {
  const [pluginState, setPluginState] = useState<
    IPluginState<IMatch> | undefined
  >(undefined);

  const { telemetryAdapter } = useContext(TelemetryContext);

  useEffect(() => {
    store.on(STORE_EVENT_NEW_STATE, newState => {
      setPluginState(newState);
    });
    setPluginState(store.getState());
  }, []);

  const requestMatches = () => {
    requestMatchesForDocument(
      v4(),
      getCurrentCategories().map(_ => _.id)
    );
  };

  const handleCheckDocumentButtonClick = (): void => {
    //telemetryAdapter?.typerighterIsOpened({ documentUrl: document.URL });
    requestMatches();
    telemetryAdapter?.documentIsChecked({ documentUrl: document.URL });
  };

  const handleClearButtonClick = (): void => {
    // telemetryAdapter?.typerighterIsClosed({ documentUrl: document.URL });
    clearMatches();
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

  return (
    <>
      <div className="Sidebar__header-container">
        <div className="Sidebar__header">
          <button
            type="button"
            className="Button"
            onClick={handleCheckDocumentButtonClick}
            disabled={pluginState && selectRequestsInProgress(pluginState)}
          >
            Check document
          </button>
          <IconButton
            size="small"
            aria-label="clear all matches"
            title="clear all matches"
            onClick={handleClearButtonClick}
            disabled={pluginState && (selectRequestsInProgress(pluginState) || !selectHasMatches(pluginState))}
          >
            <DeleteForever />
          </IconButton>
        </div>
      </div>
      {renderErrorMessage()}
    </>
  );
};

export default Controls;
