import { EditorState } from "prosemirror-state";
import { createDoc, p } from "./helpers/prosemirror";

import createTyperighterPlugin from "../createTyperighterPlugin";
import { createMatch } from "./helpers/fixtures";

const doc = createDoc(p("Example text to check"), p("More text to check"));

describe("createTyperighterPlugin", () => {
  it("should add matches passed to the plugin to the plugin state when the plugin is constructed", () => {
    const matches = [createMatch(1)];
    const { plugin, getState } = createTyperighterPlugin({
      matches
    });
    const editorState = EditorState.create({
      doc,
      plugins: [plugin]
    });
    expect(getState(editorState).currentMatches).toEqual(matches);
  });
  it("should trigger onMatches when matches are found in the document", () => {});
});
