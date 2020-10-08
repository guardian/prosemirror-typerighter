import React, { useContext } from "react";
import { IMatch } from "..";
import SidebarMatchContainer from "./SidebarMatchContainer";
import { getColourForMatch, IMatchTypeToColourMap } from "../utils/decoration";
import { createScrollToRangeHandler } from "../utils/component";
import TelemetryContext from "../contexts/TelemetryContext";

interface IProps {
  match: IMatch;
  matchColours?: IMatchTypeToColourMap;
  indicateHighlight: (blockId: string, _?: any) => void;
  stopHighlight: () => void;
  getScrollOffset: () => number;
  editorScrollElement: Element;
}

const emboldenMatchInMatchContext = (text: string): string => {
  return text.replace("[[", "<strong>").replace("]]", "</strong>");
};

const MatchSnippet = ({
  match,
  matchColours,
  indicateHighlight,
  stopHighlight,
  getScrollOffset,
  editorScrollElement
}: IProps) => {
  const handleMouseEnter = () => {
    indicateHighlight(match.matchId);
  };

  const handleMouseLeave = () => {
    stopHighlight();
  };
  const { telemetryAdapter } = useContext(TelemetryContext);

  const scrollToRange = createScrollToRangeHandler(
    match,
    getScrollOffset,
    editorScrollElement,
    telemetryAdapter
  );

  const color = matchColours
    ? getColourForMatch(match, matchColours, false).borderColour
    : undefined;

  return (
    <>
      <li className="Sidebar__list-item SidebarMatch__subset-list">
        <SidebarMatchContainer
          style={{ borderLeft: `2px solid ${color}` }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={scrollToRange}
          title="Click to scroll to this match"
        >
          <div className={"SidebarMatch__header"}>
            <div className="SidebarMatch__header-label">
              <div>
                <div
                  className="SidebarMatch__header-description"
                  dangerouslySetInnerHTML={{
                    __html: emboldenMatchInMatchContext(match.matchContext)
                  }}
                ></div>
              </div>
            </div>
          </div>
        </SidebarMatchContainer>
      </li>
    </>
  );
};

export default MatchSnippet;
