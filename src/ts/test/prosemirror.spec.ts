import { doc, p } from "./helpers/prosemirror";
import { findLeafBlockRanges } from "../utils/prosemirror";

describe("Prosemirror utils", () => {
  describe("", () => {
    it("should get the ranges of all the leaf block nodes in a given node", () => {
      const node = doc(p("Paragraph 1"), p("Paragraph 2"));
      expect(findLeafBlockRanges(node)).toEqual([
        { from: 0, to: 13 },
        { from: 13, to: 26 }
      ]);
    });
  });
});
