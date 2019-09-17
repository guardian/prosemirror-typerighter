import { IMatches } from "../interfaces/IValidation";
import {
  IPluginState,
  IInFlightBlock,
  IInFlightValidationSetState
} from "./reducer";

export const selectBlockQueriesInFlight = <TValidationMeta extends IMatches>(
  state: IPluginState<TValidationMeta>
) => {
  return state.blockQueriesInFlight.validations;
};

export const selectBlockMatchesByMatchId = <TValidationMeta extends IMatches>(
  state: IPluginState<TValidationMeta>,
  matchId: string
): IMatches | undefined =>
  state.currentValidations.find(validation => validation.matchId === matchId);

export const selectBlockQueriesInFlightForSet = <
  TValidationMeta extends IMatches
>(
  state: IPluginState<TValidationMeta>,
  requestId: string
): IInFlightValidationSetState | undefined => {
  return state.blockQueriesInFlight[requestId];
};

export const selectSingleBlockInFlightById = <
  TValidationMeta extends IMatches
>(
  state: IPluginState<TValidationMeta>,
  requestId: string,
  blockId: string
): IInFlightBlock | undefined => {
  const validationInFlightState = selectBlockQueriesInFlightForSet(
    state,
    requestId
  );
  if (!validationInFlightState) {
    return;
  }
  return validationInFlightState.pendingBlocks.find(
    _ => _.block.id === blockId
  );
};

export const selectBlockQueriesInFlightById = <
  TValidationMeta extends IMatches
>(
  state: IPluginState<TValidationMeta>,
  requestId: string,
  blockIds: string[]
): IInFlightBlock[] =>
  blockIds
    .map(blockId =>
      selectSingleBlockInFlightById(state, requestId, blockId)
    )
    .filter(_ => !!_) as IInFlightBlock[];

export const selectAllBlockQueriesInFlight = <TValidationMeta extends IMatches>(
  state: IPluginState<TValidationMeta>
): IInFlightBlock[] =>
  Object.values(state.blockQueriesInFlight).reduce(
    (acc, value) => acc.concat(value.pendingBlocks),
    [] as IInFlightBlock[]
  );

type TSelectValidationInFlight = Array<
  IInFlightValidationSetState & {
    requestId: string;
  }
>;

export const selectNewBlockInFlight = <TValidationMeta extends IMatches>(
  oldState: IPluginState<TValidationMeta>,
  newState: IPluginState<TValidationMeta>
): TSelectValidationInFlight =>
  Object.keys(newState.blockQueriesInFlight).reduce(
    (acc, requestId) =>
      !oldState.blockQueriesInFlight[requestId]
        ? acc.concat({
            requestId,
            ...selectBlockQueriesInFlightForSet(newState, requestId)!
          })
        : acc,
    [] as TSelectValidationInFlight
  );

export const selectPercentRemaining = <TValidationMeta extends IMatches>(
  state: IPluginState<TValidationMeta>
) => {
  const [totalWork, totalRemainingWork] = Object.values(
    state.blockQueriesInFlight
  ).reduce(
    ([totalWorkAcc, remainingWorkAcc], queryState) => {
      const allWork =
        queryState.pendingBlocks.length * queryState.categoryIds.length;
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

export const selectSuggestionAndRange = <TValidationMeta extends IMatches>(
  state: IPluginState<TValidationMeta>,
  matchId: string,
  suggestionIndex: number
) => {
  const output = selectBlockMatchesByMatchId(state, matchId);
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
