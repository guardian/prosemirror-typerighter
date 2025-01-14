import { sortBy } from "lodash";
import { ISuggestion, Match } from "../interfaces/IMatch";
import { getMatchType, MatchType } from "../utils/decoration";
import { IBlockInFlight, IRequestInFlight } from "./reducer";
import { StoreState } from "./store";

export const selectMatchByMatchId = <TPluginState extends StoreState>(
  state: TPluginState,
  matchId: string
): TPluginState["currentMatches"][number] | undefined =>
  state.currentMatches.find(match => match.matchId === matchId);

export const selectRequestInFlightById = (
  state: StoreState,
  requestId: string
): IRequestInFlight | undefined => {
  return state.requestsInFlight[requestId];
};

export const selectSingleBlockInRequestInFlightById = (
  state: StoreState,
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
  state: StoreState,
  requestId: string,
  blockIds: string[]
): IBlockInFlight[] =>
  blockIds
    .map(blockId =>
      selectSingleBlockInRequestInFlightById(state, requestId, blockId)
    )
    .filter(_ => !!_) as IBlockInFlight[];

export const selectAllBlocksInFlight = (
  state: StoreState
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
  oldState: StoreState,
  newState: StoreState
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
  state?: StoreState
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
  state: StoreState,
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

export const selectHasGeneralError = (state: StoreState): boolean => {
  const generalErrors = state.requestErrors.filter(
    _ => _.type === "GENERAL_ERROR"
  );
  return generalErrors.length > 0;
};

export const selectHasAuthError = (state: StoreState): boolean => {
  const authErrors = state.requestErrors.filter(_ => _.type === "AUTH_ERROR");
  return authErrors.length > 0;
};

export const selectRequestsInProgress = (state: StoreState): boolean =>
  !!Object.keys(state.requestsInFlight).length;

export const selectHasMatches = (state: StoreState): boolean =>
  !!state.currentMatches && state.currentMatches.length > 0;

const getSortOrderForMatchType = (match: Match) => {
  const matchType = getMatchType(match);
  if (matchType === MatchType.AMEND) {
    return 0;
  } else if (matchType === MatchType.OK) {
    return 2;
  } else {
    return 1;
  }
};

const getSortOrderForMatchAppearance = (match: Match) => match.from;

export const selectDocumentOrderedMatches = (
  state: StoreState
): Array<Match<ISuggestion>> =>
  sortBy(state.filteredMatches, getSortOrderForMatchAppearance);

export const selectImportanceOrderedMatches = (
  state: StoreState
): Array<Match<ISuggestion>> =>
  sortBy(
    state.filteredMatches,
    getSortOrderForMatchType,
    getSortOrderForMatchAppearance
  );

export const selectDocumentHasChanged = (state: StoreState): boolean => {
  return state.docChangedSinceCheck;
};

export const selectDocumentIsEmpty = (state: StoreState): boolean => {
  return state.docIsEmpty;
};

export const selectPluginConfig = (state: StoreState) => state.config;
