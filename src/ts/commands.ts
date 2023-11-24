import { Transaction, EditorState } from "prosemirror-state";
import {
  newHoverIdReceived,
  requestMatchesForDocument,
  selectMatch,
  setConfigValue,
  requestMatchesSuccess,
  requestError,
  requestMatchesForDirtyRanges,
  requestMatchesComplete,
  removeMatch,
  removeAllMatches,
  newHighlightIdReceived,
  setFilterState,
  setTyperighterEnabled
} from "./state/actions";
import {
  selectMatchByMatchId
} from "./state/selectors";
import {
  PROSEMIRROR_TYPERIGHTER_ACTION,
  IPluginState,
  IPluginConfig
} from "./state/reducer";
import {
  IMatcherResponse,
  MappedMatch,
  TMatchRequestErrorWithDefault
} from "./interfaces/IMatch";
import { EditorView } from "prosemirror-view";
import { compact } from "./utils/array";
import {
  getPatchesFromReplacementText,
  applyPatchToTransaction
} from "./utils/prosemirror";
import { getState } from "./utils/plugin";
import TyperighterTelemetryAdapter from "./services/TyperighterTelemetryAdapter";

type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean;

type GetState = (state: EditorState) => IPluginState | null | undefined;

/**
 * Requests matches for an entire document.
 */
export const requestMatchesForDocumentCommand = (
  requestId: string,
  categoryIds: string[],
  telemetryAdapter?: TyperighterTelemetryAdapter
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        requestMatchesForDocument(requestId, categoryIds)
      )
    );
    telemetryAdapter?.documentIsChecked({ documentUrl: document.URL });
  }
  return true;
};

/**
 * Request matches for the current set of dirty ranges.
 */
export const requestMatchesForDirtyRangesCommand = (
  requestId: string,
  categoryIds: string[],
  telemetryAdaptor?: TyperighterTelemetryAdapter,
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        requestMatchesForDirtyRanges(requestId, categoryIds)
      )
    );
    telemetryAdaptor?.rangeIsChecked({ documentUrl: document.URL });
  }

  return true;
};

/**
 * Indicate the user is hovering over a match.
 */
export const startHoverCommand = (
  matchId: string,
  rectIndex: number | undefined
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        newHoverIdReceived(matchId, rectIndex)
      )
    );
  }
  return true;
};

/**
 * Indicate that the user is no longer hovering over a match.
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
 * Indicate the user is highlighting a match decoration.
 *
 * The highlight state indicates that we'd like to draw the user's
 * attention to this match, without additional UI elements, e.g. tooltips.
 */
export const startHighlightCommand = (matchId: string): Command => (
  state,
  dispatch
) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        newHighlightIdReceived(matchId)
      )
    );
  }
  return true;
};

/**
 * Indicate that the user is no longer highlighting a match decoration.
 */
export const stopHighlightCommand = (): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        newHighlightIdReceived(undefined)
      )
    );
  }
  return true;
};

/**
 * Mark a given match as active.
 */
export const selectMatchCommand = (
  matchId: string,
  getState: GetState
): Command => (state, dispatch) => {
  const pluginState = getState(state);
  if (!pluginState) {
    return false;
  }

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
 * Set a configuration value.
 */
export const setConfigValueCommand = <
  ConfigKey extends keyof IPluginConfig,
  ConfigValue extends IPluginConfig[ConfigKey]
>(
  key: ConfigKey,
  value: ConfigValue
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        setConfigValue(key, value)
      )
    );
  }
  return true;
};

/**
 * Set the current filter state.
 */
export const setFilterStateCommand = <TPluginState extends IPluginState>(
  filterState: TPluginState["filterState"]
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        setFilterState(filterState)
      )
    );
  }
  return true;
};

/**
 * Apply a successful matcher response to the document.
 */
export const applyMatcherResponseCommand = (
  matcherResponse: IMatcherResponse<MappedMatch[]>
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
  matchRequestError: TMatchRequestErrorWithDefault,
  telemetryAdapter?: TyperighterTelemetryAdapter
): Command => (state, dispatch) => {
  telemetryAdapter?.error(matchRequestError.message);
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        requestError({
          ...matchRequestError,
          type: matchRequestError.type || "GENERAL_ERROR"
        })
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
export const applySuggestionsCommand = (
  suggestionOptions: ApplySuggestionOptions,
  getState: GetState
): Command => (state, dispatch) => {
  const pluginState = getState(state);
  if (!pluginState) {
    return false;
  }

  const suggestionsToApply = suggestionOptions
    .map(opt => {
      const maybeMatch = selectMatchByMatchId(pluginState, opt.matchId);
      return maybeMatch
        ? {
            match: maybeMatch,
            text: opt.text
          }
        : undefined;
    })
    .filter(compact);

  return maybeApplySuggestions(suggestionsToApply, state, dispatch);
};

/**
 * Ignore a match, removing it from the plugin state.
 * Returns true if the match was found, false if not.
 */
export const ignoreMatchCommand = (id: string) => (getState: GetState) => (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean => {
  const pluginState = getState(state);
  if (!pluginState) {
    return false;
  }
  const match = selectMatchByMatchId(pluginState, id);
  if (match && dispatch) {
    dispatch(state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, removeMatch(id)));
  }
  return !!match;
};

export const clearMatchesCommand = () => (_: GetState) => (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, removeAllMatches())
    );
  }
  return true;
};

const maybeApplySuggestions = (
  suggestionsToApply: Array<{
    match: MappedMatch,
    text: string | undefined;
  }>,
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => {
  if (!suggestionsToApply.length) {
    return false;
  }

  if (!dispatch) {
    return true;
  }

  const tr = state.tr;
  suggestionsToApply.forEach(({ match, text }) => {
    if (!text) {
      return;
    }

    let textCursor = 0;

    // Apply the suggestion to the matched range.
    //
    // If the match is split into multiple ranges, attempts to preserve a reasonable split between
    // ranges by allocating the suggestion the same number of characters as the original range. Extra
    // characters are append.
    //
    // For example, given:
    //   - the match 'ex-a-mple', where dashes denote splits in the match
    //   - the suggestion 'ample'
    // We get the result 'am-p-le'.
    match.ranges.forEach(({ from, to }, index) => {
      const isLastRange = index === match.ranges.length - 1;
      const mappedFrom = tr.mapping.map(from);
      const mappedTo = tr.mapping.map(to);
      const fragmentToApply = text.slice(textCursor, !isLastRange ? textCursor + (to - from) : Infinity);
      textCursor += fragmentToApply.length;

      const replacementFrags = getPatchesFromReplacementText(
        tr,
        mappedFrom,
        mappedTo,
        fragmentToApply
      );

      // Do not attempt to preserve marks if match ranges are split –
      // it's likely to go wrong!
      const preserveMarks = match.ranges.length === 1;

      replacementFrags.forEach(frag =>
        applyPatchToTransaction(tr, state.schema, frag, preserveMarks)
      );
    })

  });

  dispatch(tr);

  return true;
};

/**
 * Enable or disable typerighter
 *
 * When Typerighter is enabled:
 *  - a check occurs of the whole document.
 *  - realtime checks will continue to occur if they are enabled.
 * When Typerighter is disabled:
 *  - all matches are removed
 *  - all pending requests are discarded
 *  - realtime checks will no longer occur
 */
export const setTyperighterEnabledCommand = (
  typerighterEnabled: boolean
): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_TYPERIGHTER_ACTION,
        setTyperighterEnabled(typerighterEnabled)
      )
    );
  }
  return true;
};

/**
 * Create a palette of prosemirror-typerighter commands bound to the given EditorView.
 */
export const createBoundCommands = (
  view: EditorView,
  telemetryAdapter?: TyperighterTelemetryAdapter
) => {
  const dispatch = (tr: Transaction) => {
    if (view.isDestroyed) {
      return;
    }
    return view.dispatch(tr);
  }

  const bindCommand = <CommandArgs extends any[]>(
    action: (...args: CommandArgs) => Command
  ) => (...args: CommandArgs) => action(...args)(view.state, dispatch);

  return {
    ignoreMatch: (id: string) =>
      ignoreMatchCommand(id)(getState)(view.state, dispatch),
    clearMatches: () =>
      clearMatchesCommand()(getState)(view.state, dispatch),
    applySuggestions: (suggestionOpts: ApplySuggestionOptions) =>
      applySuggestionsCommand(suggestionOpts, getState)(
        view.state,
        dispatch
      ),
    selectMatch: (blockId: string) =>
      selectMatchCommand(blockId, getState)(view.state, dispatch),
    requestMatchesForDocument: bindCommand(requestMatchesForDocumentCommand),
    requestMatchesForDirtyRanges: bindCommand(
      requestMatchesForDirtyRangesCommand
    ),
    indicateHover: bindCommand(startHoverCommand),
    stopHover: bindCommand(stopHoverCommand),
    indicateHighlight: bindCommand(startHighlightCommand),
    stopHighlight: bindCommand(stopHighlightCommand),
    setConfigValue: bindCommand(setConfigValueCommand),
    applyMatcherResponse: bindCommand(applyMatcherResponseCommand),
    applyRequestError: (matchRequestError: TMatchRequestErrorWithDefault) =>
      applyRequestErrorCommand(matchRequestError, telemetryAdapter)(
        view.state,
        dispatch
      ),
    applyRequestComplete: bindCommand(applyRequestCompleteCommand),
    setFilterState: bindCommand(setFilterStateCommand),
    setTyperighterEnabled: bindCommand(setTyperighterEnabledCommand)
  };
};

export const commands = {
  ignoreMatchCommand,
  clearMatchesCommand,
  applySuggestionsCommand,
  selectMatchCommand,
  requestMatchesForDocumentCommand,
  requestMatchesForDirtyRangesCommand,
  startHoverCommand,
  stopHoverCommand,
  startHighlightCommand,
  stopHighlightCommand,
  setConfigValueCommand,
  applyMatcherResponseCommand,
  applyRequestErrorCommand,
  applyRequestCompleteCommand,
  setFilterStateCommand,
  setTyperighterEnabledCommand
};

export type Commands = ReturnType<typeof createBoundCommands>;
