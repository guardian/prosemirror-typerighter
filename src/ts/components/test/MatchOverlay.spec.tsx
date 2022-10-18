import React from "react";
import { render } from "@testing-library/react";
import MatchOverlay from "../MatchOverlay";
import Store from "../../state/store";
import { noop } from "lodash";

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
});
