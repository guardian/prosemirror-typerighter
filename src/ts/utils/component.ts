import { IMatch, TyperighterTelemetryAdapter } from "..";
import { maybeGetDecorationElement } from "../utils/decoration";

export const createScrollToRangeHandler = (match: IMatch, getScrollOffset: () => number, editorScrollElement: Element, telemetryAdapter?: TyperighterTelemetryAdapter) => (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
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