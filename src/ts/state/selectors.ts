import { sortBy } from "lodash";
import { IMatch, ISuggestion } from "../interfaces/IMatch";
import { getMatchType, MatchType } from "../utils/decoration";
import { IPluginState, IBlockInFlight, IRequestInFlight } from "./reducer";

export const selectMatchByMatchId = <TPluginState extends IPluginState>(
  state: TPluginState,
  matchId: string
): TPluginState["currentMatches"][number] | undefined =>
  state.currentMatches.find(match => match.matchId === matchId);

export const selectRequestInFlightById = (
  state: IPluginState,
  requestId: string
): IRequestInFlight | undefined => {
  return state.requestsInFlight[requestId];
};

export const selectSingleBlockInRequestInFlightById = (
  state: IPluginState,
  requestId: string,
  blockId: string
): IBlockInFlight | undefined => {
  const blocksInFlight = selectRequestInFlightById(state, requestId);
  if (!blocksInFlight) {
    return;
  }
  return blocksInFlight.pendingBlocks.find(_ => _.block.id === blockId);
};

export const selectBlocksInFlightById = (
  state: IPluginState,
  requestId: string,
  blockIds: string[]
): IBlockInFlight[] =>
  blockIds
    .map(blockId =>
      selectSingleBlockInRequestInFlightById(state, requestId, blockId)
    )
    .filter(_ => !!_) as IBlockInFlight[];

export const selectAllBlocksInFlight = (
  state: IPluginState
): IBlockInFlight[] =>
  Object.values(state.requestsInFlight).reduce(
    (acc, value) => acc.concat(value.pendingBlocks),
    [] as IBlockInFlight[]
  );

type TSelectRequestInFlight = Array<
  IRequestInFlight & {
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
            ...selectRequestInFlightById(newState, requestId)!
          })
        : acc,
    [] as TSelectRequestInFlight
  );

export const selectPercentRemaining = (
  state?: IPluginState
) => {
  if (!state) {
    return 0;
  }
  if (state.percentageRequestComplete) {
    return Math.max(100 - state.percentageRequestComplete, 0);
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

export const selectAllAutoFixableMatches = (state: IPluginState): IMatch[] =>
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

export const selectHasMatches = (state: IPluginState): boolean =>
  !!state.currentMatches && state.currentMatches.length > 0;

const getSortOrderForMatchType = (match: IMatch) => {
  const matchType = getMatchType(match);
  if (matchType === MatchType.HAS_REPLACEMENT) {
    return 0;
  } else if (matchType === MatchType.CORRECT) {
    return 2;
  } else {
    return 1;
  }
};

const getSortOrderForMatchAppearance = (match: IMatch) => match.from;

export const selectDocumentOrderedMatches = (
  state: IPluginState
): Array<IMatch<ISuggestion>> =>
  sortBy(state.filteredMatches, getSortOrderForMatchAppearance);

export const selectImportanceOrderedMatches = (
  state: IPluginState
): Array<IMatch<ISuggestion>> =>
  sortBy(
    state.filteredMatches,
    getSortOrderForMatchType,
    getSortOrderForMatchAppearance
  );

export const selectDocumentHasChanged = (state: IPluginState): boolean => {
  return state.docChangedSinceCheck;
};

export const selectDocumentIsEmpty = (state: IPluginState): boolean => {
  return state.docIsEmpty;
};

export const selectPluginConfig = (state: IPluginState) => state.config;
