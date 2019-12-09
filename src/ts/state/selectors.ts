import { IMatch } from "../interfaces/IMatch";
import {
  IPluginState,
  IBlockInFlight,
  IBlocksInFlightState
} from "./reducer";

export const selectMatchByMatchId = <TMatch extends IMatch>(
  state: IPluginState<TMatch>,
  matchId: string
): IMatch | undefined =>
  state.currentMatches.find(match => match.matchId === matchId);

export const selectBlockQueriesInFlightForSet = <
  TMatch extends IMatch
>(
  state: IPluginState<TMatch>,
  requestId: string
): IBlocksInFlightState | undefined => {
  return state.requestsInFlight[requestId];
};

export const selectSingleBlockInFlightById = <TMatch extends IMatch>(
  state: IPluginState<TMatch>,
  requestId: string,
  blockId: string
): IBlockInFlight | undefined => {
  const blocksInFlight = selectBlockQueriesInFlightForSet(
    state,
    requestId
  );
  if (!blocksInFlight) {
    return;
  }
  return blocksInFlight.pendingBlocks.find(
    _ => _.block.id === blockId
  );
};

export const selectBlockQueriesInFlightById = <
  TMatch extends IMatch
>(
  state: IPluginState<TMatch>,
  requestId: string,
  blockIds: string[]
): IBlockInFlight[] =>
  blockIds
    .map(blockId => selectSingleBlockInFlightById(state, requestId, blockId))
    .filter(_ => !!_) as IBlockInFlight[];

export const selectAllBlockQueriesInFlight = <TMatch extends IMatch>(
  state: IPluginState<TMatch>
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

export const selectNewBlockInFlight = <TMatch extends IMatch>(
  oldState: IPluginState<TMatch>,
  newState: IPluginState<TMatch>
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

export const selectPercentRemaining = <TMatch extends IMatch>(
  state: IPluginState<TMatch>
) => {
  const [totalWork, totalRemainingWork] = Object.values(
    state.requestsInFlight
  ).reduce(
    ([totalWorkAcc, remainingWorkAcc], queryState) => {
      const allWork = queryState.totalBlocks * queryState.categoryIds.length;
      const remainingWork = queryState.pendingBlocks.reduce(
        (acc, block) => acc + block.pendingCategoryIds.length,
        0
      );
      return [totalWorkAcc + allWork, remainingWorkAcc + remainingWork];
    },
    [0, 0]
  );
  return totalRemainingWork ? (totalRemainingWork / totalWork) * 100 : 0;
};

export const selectSuggestionAndRange = <TMatch extends IMatch>(
  state: IPluginState<TMatch>,
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

export const selectAllAutoFixableMatches = <TMatch extends IMatch>(
  state: IPluginState<TMatch>
): TMatch[] =>
  state.currentMatches.filter(
    _ => _.replacement && _.replacement.text === _.message
  );
