import { TyperighterTelemetryAdapter } from "..";
import { MappedMatch } from "../interfaces/IMatch";
import { getMatchOffset } from "../utils/decoration";

export const createScrollToRangeHandler = (
  match: MappedMatch,
  getScrollOffset: () => number,
  editorScrollElement: Element,
  telemetryAdapter?: TyperighterTelemetryAdapter
) => (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  e.preventDefault();
  e.stopPropagation();

  telemetryAdapter?.sidebarMatchClicked(match, document.URL);

  if (!editorScrollElement) {
    return;
  }

  const scrollToYCoord = getMatchOffset(match.matchId, editorScrollElement) - getScrollOffset();
  editorScrollElement.scrollTo({
    top: scrollToYCoord,
    behavior: "smooth"
  });
};
