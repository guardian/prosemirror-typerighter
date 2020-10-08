import { chain } from "lodash";
import React from "react";
import { IMatch } from "..";
import { IMatchTypeToColourMap } from "../utils/decoration";
import SidebarMatch from "./SidebarMatch";
import SidebarMatchGroup from "./SidebarMatchGroup";

interface IProps {
  matches: IMatch[];
  matchColours?: IMatchTypeToColourMap;
  selectMatch: (matchId: string) => void;
  indicateHighlight: (blockId: string, _?: any) => void;
  stopHighlight: () => void;
  selectedMatch: string | undefined;
  editorScrollElement: Element;
  getScrollOffset: () => number;
  isSummaryView: boolean;
}

const SidebarMatches = ({
  matches,
  matchColours,
  selectMatch,
  indicateHighlight,
  stopHighlight,
  selectedMatch,
  editorScrollElement,
  getScrollOffset,
  isSummaryView
}: IProps) => {
  const groupedCurrentMatches = chain(matches)
    .groupBy("ruleId")
    .map((groupedMatches, _) => groupedMatches)
    .value();

  return (
    <ul className="Sidebar__list">
      {isSummaryView
        ? groupedCurrentMatches.map(group =>
            group.length > 1 ? (
              <SidebarMatchGroup
                matchColours={matchColours}
                matchGroup={group}
                selectedMatch={selectedMatch}
                selectMatch={selectMatch}
                indicateHighlight={indicateHighlight}
                stopHighlight={stopHighlight}
                editorScrollElement={editorScrollElement}
                getScrollOffset={getScrollOffset}
                key={group[0].matchId}
              />
            ) : (
              group[0] && (
                <SidebarMatch
                  matchColours={matchColours}
                  match={group[0]}
                  selectedMatch={selectedMatch}
                  selectMatch={selectMatch}
                  indicateHighlight={indicateHighlight}
                  stopHighlight={stopHighlight}
                  editorScrollElement={editorScrollElement}
                  getScrollOffset={getScrollOffset}
                  key={group[0].matchId}
                />
              )
            )
          )
        : matches.map(match => (
            <SidebarMatch
              matchColours={matchColours}
              match={match}
              selectedMatch={selectedMatch}
              selectMatch={selectMatch}
              indicateHighlight={indicateHighlight}
              stopHighlight={stopHighlight}
              editorScrollElement={editorScrollElement}
              getScrollOffset={getScrollOffset}
              key={match.matchId}
            />
          ))}
    </ul>
  );
};

export default SidebarMatches;
