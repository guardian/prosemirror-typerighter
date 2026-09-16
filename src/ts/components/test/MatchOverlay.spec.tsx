import React from "react";
import { act, render } from "@testing-library/react";
import MatchOverlay from "../MatchOverlay";
import Store, { STORE_EVENT_NEW_STATE } from "../../state/store";
import { noop } from "lodash";
import { createInitialData, createMatch } from "../../test/helpers/fixtures";

describe("MatchOverlay", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should correctly unsubscribe from the Store when it unmounts", () => {
    // Errors do not propagate to the caller of `unmount`, but we can listen to JSDOM's
    // output, which will forward all errors to the NodeJS `console` by default.
    const errorMock = jest.spyOn(console, 'error');
    const store = new Store();

    const { unmount } = render(
      <MatchOverlay store={store} applySuggestions={noop} stopHover={noop} />
    );

    unmount();

    expect(errorMock.mock.calls.length).toBe(0);
  });

  it("should not throw when positioning the tooltip for a hovered match whose element has no layout rects", async () => {
    // JSDOM never computes layout, so getClientRects() always returns an empty
    // list here - the same condition that occurs in the browser when a match's
    // decoration has just been removed from the document while it is hovered.
    const store = new Store();
    render(
      <MatchOverlay store={store} applySuggestions={noop} stopHover={noop} />
    );

    const match = createMatch(0, 5);
    const matchElement = document.createElement("span");
    matchElement.setAttribute("data-match-id", match.matchId);
    document.body.appendChild(matchElement);

    const { state } = createInitialData();

    const unhandledRejections: unknown[] = [];
    const onUnhandledRejection = (reason: unknown) =>
      unhandledRejections.push(reason);
    process.on("unhandledRejection", onUnhandledRejection);

    try {
      act(() => {
        store.emit(STORE_EVENT_NEW_STATE, {
          ...state,
          currentMatches: [match],
          hoverId: match.matchId,
          hoverRectIndex: 0
        });
      });

      // Allow the debounced "show match" state update, and Popper's async
      // position calculation, to run.
      await act(() => new Promise(resolve => setTimeout(resolve, 300)));

      expect(unhandledRejections).toEqual([]);
    } finally {
      process.off("unhandledRejection", onUnhandledRejection);
    }
  });
});
