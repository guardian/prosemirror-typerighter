import { Transaction, EditorState } from "prosemirror-state";
import {
  newHoverIdReceived,
  requestMatchesForDocument,
  selectMatch,
  setDebugState,
  setRequestMatchesOnDocModified,
  requestMatchesSuccess,
  requestError,
  requestMatchesForDirtyRanges,
  requestMatchesComplete
} from "./state/actions";
import {
  selectMatchByMatchId,
  selectAllAutoFixableMatches
} from "./state/selectors";
import {
  PROSEMIRROR_TYPERIGHTER_ACTION,
  IPluginState,
  IStateHoverInfo
} from "./state/reducer";
import {
  IMatcherResponse,
  IMatchRequestError,
  IMatch
} from "./interfaces/IMatch";
import { EditorView } from "prosemirror-view";
import { compact } from "./utils/array";

type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean;

type GetState<TMatch extends IMatch> = (
  state: EditorState
) => IPluginState<TMatch>;

/**
 * Requests matches for an entire document.
 */
export const requestMatchesForDocumentCommand = (
  requestId: string,
  categoryIds: string[]
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        requestMatchesForDocument(requestId, categoryIds)
      )
    );
  }
  return true;
};

/**
 * Request matches for the current set of dirty ranges.
 */
export const requestMatchesForDirtyRangesCommand = (
  requestId: string,
  categoryIds: string[]
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        requestMatchesForDirtyRanges(requestId, categoryIds)
      )
    );
  }

  return true;
};

/**
 * Indicate new hover information is available. This could include
 * details on hover coords if available (for example, if hovering
 * over a match decoration) to allow the positioning of e.g. tooltips.
 */
export const indicateHoverCommand = (
  matchId: string,
  hoverInfo?: IStateHoverInfo
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        newHoverIdReceived(matchId, hoverInfo)
      )
    );
  }
  return true;
};

/**
 * Indicate that the user is no longer hovering over a
 * prosemirror-typerighter tooltip.
 */
export const stopHoverCommand = (): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        newHoverIdReceived(undefined, undefined)
      )
    );
  }
  return true;
};

/**
 * Mark a given match as active.
 */
export const selectMatchCommand = <TMatch extends IMatch>(
  matchId: string,
  getState: GetState<TMatch>
): Command => (state, dispatch) => {
  const pluginState = getState(state);
  const output = selectMatchByMatchId(pluginState, matchId);
  if (!output) {
    return false;
  }
  if (dispatch) {
    dispatch(
      state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, selectMatch(matchId))
    );
  }
  return true;
};

/**
 * Set the debug state. Enabling debug mode provides additional marks
 * to reveal dirty ranges and ranges sent for matching.
 */
export const setDebugStateCommand = (debug: boolean): Command => (
  state,
  dispatch
) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, setDebugState(debug))
    );
  }
  return true;
};

/**
 * When enabled, the plugin will queue match requests as soon as the document is modified.
 */
export const setRequestOnDocModifiedState = (
  requestMatchesOnDocModified: boolean
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        setRequestMatchesOnDocModified(requestMatchesOnDocModified)
      )
    );
  }
  return true;
};

/**
 * Apply a successful matcher response to the document.
 */
export const applyMatcherResponseCommand = (
  matcherResponse: IMatcherResponse
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        requestMatchesSuccess(matcherResponse)
      )
    );
  }
  return true;
};

/**
 * Apply an error to the document. Important to ensure
 * that failed matcher requests are reapplied as dirtied ranges
 * to be resent on the next request.
 */
export const applyRequestErrorCommand = (
  matchRequestError: IMatchRequestError
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        requestError(matchRequestError)
      )
    );
  }
  return true;
};

/**
 * Mark the
 */
export const applyRequestCompleteCommand = (requestId: string): Command => (
  state,
  dispatch
) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        requestMatchesComplete(requestId)
      )
    );
  }
  return true;
};

export type ApplySuggestionOptions = Array<{
  matchId: string;
  text: string;
}>;

/**
 * Applies a suggestion from a match to the document.
 */
export const applySuggestionsCommand = <TMatch extends IMatch>(
  suggestionOptions: ApplySuggestionOptions,
  getState: GetState<TMatch>
): Command => (state, dispatch) => {
  const pluginState = getState(state);
  const suggestionsToApply = suggestionOptions
    .map(opt => {
      const maybeMatch = selectMatchByMatchId(pluginState, opt.matchId);
      return maybeMatch
        ? {
            from: maybeMatch.from,
            to: maybeMatch.to,
            text: opt.text
          }
        : undefined;
    })
    .filter(compact);

  return maybeApplySuggestions(suggestionsToApply, state, dispatch);
};

/**
 * Applies the first suggestion for each rule marked as auto-fixable.
 */
export const applyAutoFixableSuggestionsCommand = <TMatch extends IMatch>(
  getState: GetState<TMatch>
): Command => (state, dispatch) => {
  const pluginState = getState(state);
  const suggestionsToApply = selectAllAutoFixableMatches(pluginState).map(
    output => ({
      from: output.from,
      to: output.to,
      text:
        output.suggestions && output.suggestions.length
          ? output.suggestions[0].text
          : undefined
    })
  );
  return maybeApplySuggestions(suggestionsToApply, state, dispatch);
};

const maybeApplySuggestions = (
  suggestionsToApply: Array<{
    from: number;
    to: number;
    text: string | undefined;
  }>,
  state: EditorState,
  dispatch?: (tr: Transaction<any>) => void
) => {
  if (!suggestionsToApply.length) {
    return false;
  }

  if (dispatch) {
    const tr = state.tr;
    suggestionsToApply.forEach(
      ({ from, to, text }) =>
        text &&
        tr.replaceWith(
          tr.mapping.map(from),
          tr.mapping.map(to),
          state.schema.text(text)
        )
    );
    dispatch(tr);
  }

  return true;
};

/**
 * Create a palette of prosemirror-typerighter commands bound to the given EditorView.
 */
export const createBoundCommands = <TMatch extends IMatch>(
  view: EditorView,
  getState: GetState<TMatch>
) => {
  const bindCommand = <CommandArgs extends any[]>(
    action: (...args: CommandArgs) => Command
  ) => (...args: CommandArgs) => action(...args)(view.state, view.dispatch);
  return {
    applySuggestions: (suggestionOpts: ApplySuggestionOptions) =>
      applySuggestionsCommand(suggestionOpts, getState)(
        view.state,
        view.dispatch
      ),
    selectMatch: (blockId: string) =>
      selectMatchCommand(blockId, getState)(view.state, view.dispatch),
    applyAutoFixableSuggestions: () =>
      applyAutoFixableSuggestionsCommand(getState)(view.state, view.dispatch),
    requestMatchesForDocument: bindCommand(requestMatchesForDocumentCommand),
    requestMatchesForDirtyRanges: bindCommand(
      requestMatchesForDirtyRangesCommand
    ),
    indicateHover: bindCommand(indicateHoverCommand),
    stopHover: bindCommand(stopHoverCommand),
    setDebugState: bindCommand(setDebugStateCommand),
    setRequestOnDocModified: bindCommand(setRequestOnDocModifiedState),
    applyMatcherResponse: bindCommand(applyMatcherResponseCommand),
    applyRequestError: bindCommand(applyRequestErrorCommand),
    applyRequestComplete: bindCommand(applyRequestCompleteCommand)
  };
};

export type Commands = ReturnType<typeof createBoundCommands>;
