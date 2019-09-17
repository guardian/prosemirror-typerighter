import { IMatches } from "../interfaces/IValidation";
import {
  IPluginState,
  IBlockQueryInFlight,
  IBlockQueriesInFlightState
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
): IBlockQueriesInFlightState | undefined => {
  return state.blockQueriesInFlight[validationSetId];
};

export const selectSingleBlockQueryInFlightById = <
  TValidationMeta extends IMatches
>(
  state: IPluginState<TValidationMeta>,
  validationSetId: string,
  blockQueryId: string
): IBlockQueryInFlight | undefined => {
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
): IBlockQueryInFlight[] =>
  blockQueryIds
    .map(blockQueryId =>
      selectSingleBlockQueryInFlightById(state, validationSetId, blockQueryId)
    )
    .filter(_ => !!_) as IBlockQueryInFlight[];

export const selectAllBlockQueriesInFlight = <TValidationMeta extends IMatches>(
  state: IPluginState<TValidationMeta>
): IBlockQueryInFlight[] =>
  Object.values(state.blockQueriesInFlight).reduce(
    (acc, value) => acc.concat(value.pendingBlocks),
    [] as IBlockQueryInFlight[]
  );

type TSelectValidationInFlight = Array<
  IBlockQueriesInFlightState & {
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
  const [sumOfTotals, sumOfValidations] = Object.values(
    state.blockQueriesInFlight
  ).reduce(
    ([totalsSum, currentSum], _) => [
      totalsSum + _.totalBlocks,
      currentSum + _.pendingBlocks.length
    ],
    [0, 0]
  );
  return sumOfValidations ? (sumOfValidations / sumOfTotals) * 100 : 0;
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
