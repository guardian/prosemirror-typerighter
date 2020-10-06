import { sortBy } from "lodash";
import { IMatch, ISuggestion } from "../interfaces/IMatch";
import { IPluginState, IBlockInFlight, IBlocksInFlightState } from "./reducer";

export const selectMatchByMatchId = (
  state: IPluginState<unknown>,
  matchId: string
): IMatch | undefined =>
  state.currentMatches.find(match => match.matchId === matchId);

export const selectBlockQueriesInFlightForSet = (
  state: IPluginState<unknown>,
  requestId: string
): IBlocksInFlightState | undefined => {
  return state.requestsInFlight[requestId];
};

export const selectSingleBlockInFlightById = (
  state: IPluginState,
  requestId: string,
  blockId: string
): IBlockInFlight | undefined => {
  const blocksInFlight = selectBlockQueriesInFlightForSet(state, requestId);
  if (!blocksInFlight) {
    return;
  }
  return blocksInFlight.pendingBlocks.find(_ => _.block.id === blockId);
};

export const selectBlockQueriesInFlightById = (
  state: IPluginState,
  requestId: string,
  blockIds: string[]
): IBlockInFlight[] =>
  blockIds
    .map(blockId => selectSingleBlockInFlightById(state, requestId, blockId))
    .filter(_ => !!_) as IBlockInFlight[];

export const selectAllBlockQueriesInFlight = (
  state: IPluginState
): IBlockInFlight[] =>
  Object.values(state.requestsInFlight).reduce(
    (acc, value) => acc.concat(value.pendingBlocks),
    [] as IBlockInFlight[]
  );

type TSelectRequestInFlight = Array<
  IBlocksInFlightState & {
    requestId: string;
  }
>;

export const selectNewBlockInFlight = (
  oldState: IPluginState,
  newState: IPluginState
): TSelectRequestInFlight =>
  Object.keys(newState.requestsInFlight).reduce(
    (acc, requestId) =>
      !oldState.requestsInFlight[requestId]
        ? acc.concat({
            requestId,
            ...selectBlockQueriesInFlightForSet(newState, requestId)!
          })
        : acc,
    [] as TSelectRequestInFlight
  );

export const selectPercentRemaining = <TPluginState extends IPluginState>(state?: TPluginState) => {
  if (!state) {
    return 0;
  }
  const [totalWork, totalRemainingWork] = Object.values(
    state.requestsInFlight
  ).reduce(
    ([totalWorkAcc, remainingWorkAcc], queryState) => {
      const allCategories = queryState.categoryIds.length === 0;
      const allWork =
        queryState.totalBlocks *
        (allCategories ? 1 : queryState.categoryIds.length);
      const remainingWork = queryState.pendingBlocks.reduce(
        (acc, block) =>
          acc + (allCategories ? 1 : block.pendingCategoryIds.length),
        0
      );
      return [totalWorkAcc + allWork, remainingWorkAcc + remainingWork];
    },
    [0, 0]
  );
  return totalRemainingWork ? (totalRemainingWork / totalWork) * 100 : 0;
};

export const selectSuggestionAndRange = (
  state: IPluginState,
  matchId: string,
  suggestionIndex: number
) => {
  const output = selectMatchByMatchId(state, matchId);
  if (!output) {
    return null;
  }
  const suggestion = output.suggestions && output.suggestions[suggestionIndex];
  if (!suggestion) {
    return null;
  }
  return {
    from: output.from,
    to: output.to,
    suggestion
  };
};

export const selectAllAutoFixableMatches = <T, TMatch extends IMatch>(
  state: IPluginState<T, TMatch>
): TMatch[] =>
  state.currentMatches.filter(
    _ => _.replacement && _.replacement.text === _.message
  );

export const selectHasGeneralError = (state: IPluginState): boolean => {
  const generalErrors = state.requestErrors.filter(
    _ => _.type === "GENERAL_ERROR"
  );
  return generalErrors.length > 0;
};

export const selectHasAuthError = (state: IPluginState): boolean => {
  const authErrors = state.requestErrors.filter(_ => _.type === "AUTH_ERROR");
  return authErrors.length > 0;
};

export const selectRequestsInProgress = (state: IPluginState): boolean =>
  !!Object.keys(state.requestsInFlight).length;

export const selectHasMatches = <TMatch extends IMatch>(
  state: IPluginState<unknown, TMatch>
): boolean => !!state.currentMatches && state.currentMatches.length > 0;

export const selectImportanceOrderedMatches = <TMatch extends IMatch>(
  state: IPluginState<unknown, TMatch>
): Array<IMatch<ISuggestion>> =>
  sortBy(state.currentMatches, match => {
    if (match.matchedText === match.replacement?.text) {
      return 2;
    } else if (!match.replacement) {
      return 1;
    } else {
      return 0;
    }
  });
