import React from "react";

import { IMatch } from "..";
import {
  getColourForMatchType,
  getMatchType,
  IMatchTypeToColourMap,
  MatchType
} from "../utils/decoration";

const filterOrder = Object.values([
  MatchType.CORRECT,
  MatchType.DEFAULT,
  MatchType.HAS_REPLACEMENT
]);

interface IProps {
  filterState: MatchType[];
  applyFilterState: (matchType: MatchType[]) => void;
  matches: IMatch[];
  matchColours: IMatchTypeToColourMap;
}

const FilterResults = ({
  filterState,
  applyFilterState,
  matches,
  matchColours
}: IProps) => (
  <>
    {filterOrder.map(matchType => {
      const isDisabled = filterState.includes(matchType);
      const cannotAddFilter = filterState.length >= 2;
      const { borderColour } = getColourForMatchType(matchType, matchColours);

      const noMatchesOfThisType = matches.filter(
        match => getMatchType(match) === matchType
      ).length;

      const toggleFilterValue = () =>
        applyFilterState(
          isDisabled
            ? filterState.filter(currentType => currentType !== matchType)
            : [...filterState, matchType]
        );

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

export default FilterResults;
