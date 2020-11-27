import React, { useContext, memo } from "react";

import { IMatch } from "../interfaces/IMatch";
import { IMatchTypeToColourMap, getColourForMatch } from "../utils/decoration";
import TelemetryContext from "../contexts/TelemetryContext";
import SidebarMatchContainer from "./SidebarMatchContainer";
import { createScrollToRangeHandler } from "../utils/component";
import Markdown from "./Markdown";

interface IProps {
  match: IMatch;
  matchColours?: IMatchTypeToColourMap;
  selectMatch: (matchId: string) => void;
  indicateHighlight: (blockId: string, _?: any) => void;
  stopHighlight: () => void;
  selectedMatch: string | undefined;
  editorScrollElement: Element;
  getScrollOffset: () => number;
}

/**
 * Display information for a single match
 */

const SidebarMatch = ({
  match,
  matchColours,
  indicateHighlight,
  stopHighlight,
  selectedMatch,
  editorScrollElement,
  getScrollOffset
}: React.PropsWithChildren<IProps>) => {

  const { telemetryAdapter } = useContext(TelemetryContext);

  const color = matchColours
    ? getColourForMatch(match, matchColours, false).borderColour
    : undefined;

  const scrollToRange = createScrollToRangeHandler(
    match,
    getScrollOffset,
    editorScrollElement,
    telemetryAdapter
  );

  const handleMouseEnter = () => {
    indicateHighlight(match.matchId);
  };

  const handleMouseLeave = () => {
    stopHighlight();
  };

  return (
    <li className="Sidebar__list-item">
      <SidebarMatchContainer
        style={{ borderLeft: `2px solid ${color}` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={scrollToRange}
        title="Click to scroll to this match"
        isSelected={selectedMatch === match.matchId}
      >
        <div className={"SidebarMatch__header"}>
          <div className="SidebarMatch__header-label">
            <div>
              <div className="SidebarMatch__header-match-text">
                {match.matchedText}
              </div>
              <div className="SidebarMatch__header-description">
                <Markdown markdown={match.message} />
              </div>
            </div>
          </div>
        </div>
      </SidebarMatchContainer>
    </li>
  );
};

export default memo(SidebarMatch);
