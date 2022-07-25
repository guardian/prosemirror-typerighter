import { css } from "@emotion/react";
import { space } from "@guardian/src-foundations";
import { body } from "@guardian/src-foundations/typography";
import { chain } from "lodash";
import React, { Fragment } from "react";
import { IMatch } from "..";
import { ISuggestion } from "../interfaces/IMatch";
import {
  getColourForMatch,
  getMatchType,
  IMatchTypeToColourMap,
  MatchType
} from "../utils/decoration";
import { iconMap } from "./icons";
import SidebarMatch from "./SidebarMatch";
import SidebarMatchGroup from "./SidebarMatchGroup";

const MatchHeader: React.FunctionComponent<{
  matchColours?: IMatchTypeToColourMap;
  match: IMatch<ISuggestion>;
  matchType: MatchType;
}> = ({ matchColours, match, matchType, children }) => {
  const colours =
    match && matchColours
      ? getColourForMatch(match, matchColours, true)
      : undefined;
  return (
    <Fragment key={match.matchId}>
      <li
        css={css`
          background-color: white;
          position: sticky;
          top: 0;
          z-index: 1;
        `}
      >
        <div
          css={css`
            display: flex;
            height: 30px;
            background-color: ${colours?.backgroundColour};
          `}
        >
          <div
            css={css`
              background-color: ${colours?.borderColour};
              height: 30px;
              width: 30px;
              display: flex;
              justify-content: center;
              align-items: center;
            `}
          >
            {iconMap[matchType].icon}
          </div>
          <span
            css={css`
        ${body.medium()}
        padding-left: ${space[2]}px;
        line-height: 30px;
      `}
          >
            {iconMap[matchType].description}
          </span>
        </div>
      </li>
      {children}
    </Fragment>
  );
};

interface ISidebarProps {
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
}: ISidebarProps) => {
  const groupedCurrentMatches = chain(matches)
    .groupBy("ruleId")
    .map((groupedMatches, _) => groupedMatches)
    .value();
  let currentMatchType: MatchType | undefined;

  return (
    <ul className="Sidebar__list">
      {isSummaryView
        ? groupedCurrentMatches.map(group => {
            const matchElements =
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
              );

            const matchType = group[0] && getMatchType(group[0]);
            const shouldInsertHeader = matchType !== currentMatchType;
            if (shouldInsertHeader) {
              currentMatchType = matchType;
              return (
                <MatchHeader
                  matchColours={matchColours}
                  match={group[0]}
                  matchType={currentMatchType}
                  key={currentMatchType}
                >
                  {matchElements}
                </MatchHeader>
              );
            }
            return matchElements;
          })
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
