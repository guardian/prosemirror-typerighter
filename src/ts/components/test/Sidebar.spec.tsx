import { describe, expect, it, spyOn } from "bun:test";
import React from "react";
import { render } from "@testing-library/react";
import Store from "../../state/store";
import Sidebar from "../Sidebar";
import MatcherService from "../../services/MatcherService";
import TyperighterChunkedAdapter from "../../services/adapters/TyperighterChunkedAdapter";
import { createBoundCommands } from "../../commands";
import { createEditor } from "../../test/helpers/createEditor";

describe("Sidebar", () => {
  it("should correctly unsubscribe from the Store when it unmounts", () => {
    // Errors do not propagate to the caller of `unmount`, but we can listen to JSDOM's
    // output, which will forward all errors to the NodeJS `console` by default.
    const errorMock = spyOn(console, "error");
    const store = new Store();
    const { view } = createEditor("");
    const matcherService = new MatcherService(
      store,
      new TyperighterChunkedAdapter("noop")
    );

    const { unmount } = render(
      <Sidebar
        store={store}
        matcherService={matcherService}
        commands={createBoundCommands(view)}
        editorScrollElement={document.createElement("div")}
        getScrollOffset={() => 0}
      />
    );

    unmount();

    expect(errorMock.mock.calls.length).toBe(0);
  });
});
