import { IMatches } from "../interfaces/IValidation";
import {
  IPluginState,
  IInFlightBlockQuery,
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
  validationSetId: string
): IInFlightValidationSetState | undefined => {
  return state.blockQueriesInFlight[validationSetId];
};

export const selectSingleBlockQueryInFlightById = <
  TValidationMeta extends IMatches
>(
  state: IPluginState<TValidationMeta>,
  validationSetId: string,
  blockQueryId: string
): IInFlightBlockQuery | undefined => {
  const validationInFlightState = selectBlockQueriesInFlightForSet(
    state,
    validationSetId
  );
  if (!validationInFlightState) {
    return;
  }
  return validationInFlightState.pendingBlocks.find(
    _ => _.blockQuery.id === blockQueryId
  );
};

export const selectBlockQueriesInFlightById = <
  TValidationMeta extends IMatches
>(
  state: IPluginState<TValidationMeta>,
  validationSetId: string,
  blockQueryIds: string[]
): IInFlightBlockQuery[] =>
  blockQueryIds
    .map(blockQueryId =>
      selectSingleBlockQueryInFlightById(state, validationSetId, blockQueryId)
    )
    .filter(_ => !!_) as IInFlightBlockQuery[];

export const selectAllBlockQueriesInFlight = <TValidationMeta extends IMatches>(
  state: IPluginState<TValidationMeta>
): IInFlightBlockQuery[] =>
  Object.values(state.blockQueriesInFlight).reduce(
    (acc, value) => acc.concat(value.pendingBlocks),
    [] as IInFlightBlockQuery[]
  );

type TSelectValidationInFlight = Array<
  IInFlightValidationSetState & {
    validationSetId: string;
  }
>;

export const selectNewBlockQueryInFlight = <TValidationMeta extends IMatches>(
  oldState: IPluginState<TValidationMeta>,
  newState: IPluginState<TValidationMeta>
): TSelectValidationInFlight =>
  Object.keys(newState.blockQueriesInFlight).reduce(
    (acc, validationSetId) =>
      !oldState.blockQueriesInFlight[validationSetId]
        ? acc.concat({
            validationSetId,
            ...selectBlockQueriesInFlightForSet(newState, validationSetId)!
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
