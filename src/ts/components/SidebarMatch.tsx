import compact from "lodash/compact";

import React, { useState, useContext } from "react";

import { IMatch } from "../interfaces/IMatch";
import {
  IMatchColours,
  getColourForMatch,
  maybeGetDecorationElement
} from "../utils/decoration";
import titleCase from "lodash/startCase";
import { ApplySuggestionOptions } from "../commands";
import SuggestionList from "./SuggestionList";
import { getHtmlFromMarkdown } from "../utils/dom";
import TelemetryContext from "../contexts/TelemetryContext";

interface IProps {
  match: IMatch;
  matchColours: IMatchColours;
  applySuggestions: (suggestions: ApplySuggestionOptions) => void;
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
  applySuggestions,
  indicateHighlight,
  stopHighlight,
  selectedMatch,
  editorScrollElement,
  getScrollOffset
}: IProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const { telemetryAdapter } = useContext(TelemetryContext);

  const color = getColourForMatch(match, matchColours, false).borderColour;
  const hasSuggestions = !!match.suggestions && !!match.suggestions.length;
  const suggestions = compact([
    match.replacement,
    ...(match.suggestions || [])
  ]);

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
    <div
      className={`SidebarMatch__container ${
        selectedMatch === match.matchId
          ? "SidebarMatch__container--is-selected"
          : ""
      }`}
      style={{ borderLeft: `2px solid ${color}` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={scrollToRange}
      title="Click to scroll to this match"
    >
      <div
        className={"SidebarMatch__header"}
        onClick={hasSuggestions ? toggleOpen : undefined}
      >
        <div className="SidebarMatch__header-label">
          <div>
            <div className="SidebarMatch__header-match-text">
              {match.matchedText}
            </div>
            <div
              className="SidebarMatch__header-description"
              dangerouslySetInnerHTML={{
                __html: getHtmlFromMarkdown(match.message)
              }}
            ></div>
          </div>
          <div className="SidebarMatch__header-meta">
            <div className="SidebarMatch__header-category">
              {titleCase(match.category.name)}
            </div>
            {hasSuggestions && (
              <div className="SidebarMatch__header-toggle-status">
                {isOpen ? "-" : "+"}
              </div>
            )}
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="SidebarMatch__content">
          {suggestions.length && (
            <div className="SidebarMatch__suggestion-list">
              <SuggestionList
                applySuggestions={applySuggestions}
                match={match}
                suggestions={suggestions}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarMatch;
