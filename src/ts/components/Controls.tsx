import React, { useState, useEffect } from "react";
import { v4 } from "uuid";
import IconButton from "@material-ui/core/IconButton";
import { Close } from "@material-ui/icons";

import Store, { STORE_EVENT_NEW_STATE } from "../state/store";
import { IPluginState } from "../state/reducer";
import { IMatch, ICategory } from "../interfaces/IMatch";
import {
  selectHasGeneralError,
  selectHasAuthError,
  selectRequestsInProgress,
  selectPluginIsActive
} from "../state/selectors";

interface IProps {
  store: Store<IMatch>;
  setDebugState: (debug: boolean) => void;
  setRequestOnDocModified: (r: boolean) => void;
  requestMatchesForDocument: (requestId: string, categoryIds: string[]) => void;
  fetchCategories: () => Promise<ICategory[]>;
  getCurrentCategories: () => ICategory[];
  addCategory: (id: string) => void;
  removeCategory: (id: string) => void;
  feedbackHref?: string;
  onToggleActiveState: () => void;
}

const getErrorFeedbackLink = (pluginState: IPluginState<IMatch> | undefined, feedbackHref: string | undefined) => {
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
const controls = ({
    store,
    requestMatchesForDocument,
    fetchCategories,
    getCurrentCategories,
    feedbackHref,
    onToggleActiveState,
    addCategory
  }: IProps) => {

    const [pluginState, setPluginState] = useState<IPluginState<IMatch> | undefined>(undefined);
    const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);
    
    const fetchAllCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const allCategories = await fetchCategories();
        allCategories.forEach(category => addCategory(category.id));
        setIsLoadingCategories(false);
      } catch (e) {
        setIsLoadingCategories(false);
      }
    };
    
    useEffect(() => {   
      store.on(STORE_EVENT_NEW_STATE, newState => {
        setPluginState(newState);
      });
      setPluginState(store.getState());

      fetchAllCategories();
    }, []);

    const pluginIsActive =
      pluginState && selectPluginIsActive(pluginState);

    const requestMatches = () => {
      requestMatchesForDocument(
        v4(),
        getCurrentCategories().map(_ => _.id)
      );
    };

    const handleCheckDocumentButtonClick = (): void => {
      if (!pluginIsActive) {
        onToggleActiveState();
      }
      requestMatches();
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
              <a href={getErrorFeedbackLink(pluginState, feedbackHref)} target="_blank">
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
              disabled={
                isLoadingCategories || (
                pluginState &&
                selectRequestsInProgress(pluginState))
              }
            >
              Check document
            </button>
            {pluginIsActive && (
              <IconButton
                size="small"
                aria-label="close Typerighter"
                onClick={onToggleActiveState}
                disabled={
                  pluginState &&
                  selectRequestsInProgress(pluginState)
                }
              >
                <Close />
              </IconButton>
            )}
          </div>
        </div>
        {pluginIsActive && renderErrorMessage()}
      </>
    );
  }


export default controls;
