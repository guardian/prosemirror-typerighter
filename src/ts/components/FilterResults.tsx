import React, { useContext } from "react";

import TelemetryContext from "../contexts/TelemetryContext";
import {
  getColourForMatchType,
  getMatchType,
  IMatchTypeToColourMap,
  MatchType
} from "../utils/decoration";
import { MappedMatch } from "../interfaces/IMatch";

const filterOrder = Object.values([
  MatchType.OK,
  MatchType.REVIEW,
  MatchType.AMEND
]);

interface IProps {
  filterState: MatchType[];
  applyFilterState: (matchType: MatchType[]) => void;
  matches: MappedMatch[];
  matchColours: IMatchTypeToColourMap;
}

const FilterResults = ({
  filterState,
  applyFilterState,
  matches,
  matchColours
}: IProps) => {
  const { telemetryAdapter } = useContext(TelemetryContext);
  return (
    <>
      {filterOrder.map(matchType => {
        const isDisabled = filterState.includes(matchType);
        const cannotAddFilter = filterState.length >= 2;
        const { borderColour } = getColourForMatchType(matchType, matchColours);

        const noMatchesOfThisType = matches.filter(
          match => getMatchType(match) === matchType
        ).length;

        const toggleFilterValue = () => {
          telemetryAdapter?.filterStateToggled(matchType, !!isDisabled);
          applyFilterState(
            isDisabled
              ? filterState.filter(currentType => currentType !== matchType)
              : [...filterState, matchType]
          );
        };

        return (
          <button
            key={matchType}
            className="Sidebar__filter-toggle"
            title="Show/hide matches of this colour"
            disabled={cannotAddFilter && !isDisabled}
            style={{
              backgroundColor: isDisabled ? "transparent" : borderColour,
              border: `2px solid ${borderColour}`,
              color: isDisabled ? borderColour : "white"
            }}
            onClick={toggleFilterValue}
          >
            {noMatchesOfThisType}
          </button>
        );
      })}
    </>
  );
};

export default FilterResults;
