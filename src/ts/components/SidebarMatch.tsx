import React, { useContext, useState } from "react";
import { IMatch } from "../interfaces/IMatch";
import {
  IMatchTypeToColourMap,
  getColourForMatch,
  maybeGetDecorationElement
} from "../utils/decoration";
import { ApplySuggestionOptions } from "../commands";
import { getHtmlFromMarkdown } from "../utils/dom";
import TelemetryContext from "../contexts/TelemetryContext";
// import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
// import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';

interface IProps {
  match: IMatch;
  matchColours?: IMatchTypeToColourMap;
  applySuggestions: (suggestions: ApplySuggestionOptions) => void;
  selectMatch: (matchId: string) => void;
  indicateHighlight: (blockId: string, _?: any) => void;
  stopHighlight: () => void;
  selectedMatch: string | undefined;
  editorScrollElement: Element;
  getScrollOffset: () => number;
  isGroup: boolean;
  isSubset: boolean;
  showAllMatches?: () => JSX.Element;
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
  getScrollOffset,
  isGroup,
  isSubset,
  showAllMatches
}: IProps) => {  
  const [isOpen, setIsOpen] = useState<boolean>(false);


  const { telemetryAdapter } = useContext(TelemetryContext);

  const color = matchColours
    ? getColourForMatch(match, matchColours, false).borderColour
    : undefined;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  const scrollToRange = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();

    telemetryAdapter?.sidebarMatchClicked(match, document.URL);

    if (!editorScrollElement) {
      return;
    }

    const decorationElement = maybeGetDecorationElement(match.matchId);

    if (decorationElement) {
      const scrollToYCoord = decorationElement.offsetTop - getScrollOffset();
      editorScrollElement.scrollTo({
        top: scrollToYCoord,
        behavior: "smooth"
      });
    }
  };

  const handleMouseEnter = () => {
    indicateHighlight(match.matchId);
  };

  const handleMouseLeave = () => {
    stopHighlight();
  };

  return (
    <>
    <div
      className={`SidebarMatch__container ${
        selectedMatch === match.matchId
          ? "SidebarMatch__container--is-selected"
          : ""
      }`}
      style={{ borderLeft: `2px solid ${color}` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={isGroup ? toggleOpen : scrollToRange}
      title={isGroup ? "Click to see all matches" : "Click to scroll to this match"}
    >
      <div
        className={"SidebarMatch__header"}
      >
        <div className="SidebarMatch__header-label">
          <div>
            <div className="SidebarMatch__header-match-text">
              {isSubset ? "" : match.matchedText}
            </div>
            <div
              className="SidebarMatch__header-description"
              dangerouslySetInnerHTML={{
                // __html: getHtmlFromMarkdown(match.message)
                __html: isSubset ? getHtmlFromMarkdown(match.matchContext) : getHtmlFromMarkdown(match.message)
              }}
            ></div>
          </div>
          <div className="SidebarMatch__header-meta">
            {isGroup && (
              <div className="SidebarMatch__header-toggle-status">
                {isOpen ? "-" : "+"}
                {/* {isOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />} */}
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
    {isOpen && (
      <div className="SidebarMatch__content">
        {(isGroup && showAllMatches) && showAllMatches()}
      </div>
    )}
    </>
  );
};

export default SidebarMatch;
