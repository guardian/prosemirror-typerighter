import { IMatch, ISuggestion } from "../interfaces/IMatch";
import { IMatchTypeToColourMap } from "../utils/decoration";
import { ApplySuggestionOptions } from "../commands";
import SidebarMatch from "./SidebarMatch";
import React from "react";

interface IProps {
  matchGroup: Array<IMatch<ISuggestion>>;
  matchColours?: IMatchTypeToColourMap;
  applySuggestions: (suggestions: ApplySuggestionOptions) => void;
  selectMatch: (matchId: string) => void;
  indicateHighlight: (blockId: string, _?: any) => void;
  stopHighlight: () => void;
  selectedMatch: string | undefined;
  editorScrollElement: Element;
  getScrollOffset: () => number;
}

/**
 * Display information for a single match and a group of matches with same ruleId
 */

const SidebarMatchGroup = ({
  matchGroup,
  matchColours,
  applySuggestions,
  indicateHighlight,
  stopHighlight,
  selectedMatch,
  editorScrollElement,
  getScrollOffset,
  selectMatch
}: IProps) => {
  return (
    <>
      {matchGroup.length === 1 ? (
        <>
          <li className="Sidebar__list-item">
            <SidebarMatch
              matchColours={matchColours}
              match={matchGroup[0]}
              selectedMatch={selectedMatch}
              applySuggestions={applySuggestions}
              selectMatch={selectMatch}
              indicateHighlight={indicateHighlight}
              stopHighlight={stopHighlight}
              editorScrollElement={editorScrollElement}
              getScrollOffset={getScrollOffset}
              isGroup={false}
              isSubset={false}
            />
          </li>
        </>
      ) : (
        <>
          <li className="Sidebar__list-item">
            <SidebarMatch
              matchColours={matchColours}
              match={matchGroup[0]}
              selectedMatch={selectedMatch}
              applySuggestions={applySuggestions}
              selectMatch={selectMatch}
              indicateHighlight={indicateHighlight}
              stopHighlight={stopHighlight}
              editorScrollElement={editorScrollElement}
              getScrollOffset={getScrollOffset}
              isGroup
              isSubset={false}
              numberOfGroupedMatches={matchGroup.length}
            >
              <ul className="Sidebar__list">
                {matchGroup.map(match => (
                  <li
                    className="SidebarMatch__subset-list Sidebar__list-item"
                    key={`${match.ruleId}_${match.matchId}`}
                  >
                    <SidebarMatch
                      matchColours={matchColours}
                      match={match}
                      selectedMatch={selectedMatch}
                      applySuggestions={applySuggestions}
                      selectMatch={selectMatch}
                      indicateHighlight={indicateHighlight}
                      stopHighlight={stopHighlight}
                      editorScrollElement={editorScrollElement}
                      getScrollOffset={getScrollOffset}
                      isGroup={false}
                      isSubset
                    />
                  </li>
                ))}
              </ul>
            </SidebarMatch>
          </li>
        </>
      )}
    </>
  );
};

export default SidebarMatchGroup;
