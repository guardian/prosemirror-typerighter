import { css } from "@emotion/react";
import { space } from "@guardian/src-foundations";
import { chain } from "lodash";
import React, { Fragment, useState } from "react";
import { usePopper } from "react-popper";
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
import {
  TooltipIcon,
  TooltipMessage,
  Update,
  SetState,
  getPopperConfig
} from "./Tooltip";
import { neutral } from "@guardian/src-foundations";

const MatchHeader: React.FunctionComponent<{
  matchColours?: IMatchTypeToColourMap;
  match: IMatch<ISuggestion>;
  matchType: MatchType;
  setTooltipOpaque: SetState<boolean>;
  updatePopper: Update;
  setReferenceElement: SetState<HTMLElement | null>;
  setTooltipMessage: SetState<string>;
  setBorderColor: SetState<string>;
}> = ({
  matchColours,
  match,
  matchType,
  setTooltipOpaque,
  updatePopper,
  setReferenceElement,
  setTooltipMessage,
  setBorderColor,
  children
}) => {
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
            align-items: center;
            padding-right: 8px;
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
              font-size: 1.1rem;
              font-weight: 600;
              padding-left: ${space[2]}px;
              line-height: 30px;
              flex-grow: 1;
            `}
          >
            {iconMap[matchType].description}
          </span>
          <TooltipIcon
            setReferenceElement={setReferenceElement}
            setOpaque={setTooltipOpaque}
            updatePopper={updatePopper}
            updateValues={() => {
              setTooltipMessage(iconMap[matchType].tooltip);
              if (colours) {
                setBorderColor(colours.borderColour);
              }
            }}
          />
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
}

const SidebarMatches = ({
  matches,
  matchColours,
  selectMatch,
  indicateHighlight,
  stopHighlight,
  selectedMatch,
  editorScrollElement,
  getScrollOffset
}: ISidebarProps) => {
  const groupedCurrentMatches = chain(matches)
    .groupBy("ruleId")
    .map((groupedMatches, _) => groupedMatches)
    .value();
  let currentMatchType: MatchType | undefined;

  const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(
    null
  );
  const [tooltipMessage, setTooltipMessage] = useState("");
  const [tooltipOpaque, setTooltipOpaque] = useState(false);
  const [borderColor, setBorderColor] = useState(neutral[86] as string);
  const [
    referenceElement,
    setReferenceElement
  ] = useState<HTMLElement | null>(null);

  const popper = usePopper(
    referenceElement,
    popperElement,
    getPopperConfig(arrowElement)
  );

  return (
    <ul className="Sidebar__list">
      <TooltipMessage
        borderColor={borderColor}
        opaque={tooltipOpaque}
        popper={popper}
        setArrowElement={setArrowElement}
        setPopperElement={setPopperElement}
      >
        <p>{tooltipMessage}</p>
      </TooltipMessage>
      {groupedCurrentMatches.map(group => {
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
              setTooltipOpaque={setTooltipOpaque}
              updatePopper={popper.update}
              setReferenceElement={setReferenceElement}
              setTooltipMessage={setTooltipMessage}
              setBorderColor={setBorderColor}
            >
              {matchElements}
            </MatchHeader>
          );
        }
        return matchElements;
      })}
    </ul>
  );
};

export default SidebarMatches;
