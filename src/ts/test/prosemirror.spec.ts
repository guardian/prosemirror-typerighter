import builder from "prosemirror-test-builder";
import { createValidationInputsForDocument } from "../utils/prosemirror";

const { doc, p, ul, li } = builder;

describe("Prosemirror utils", () => {
  describe("", () => {
    it("should get the ranges of all the leaf block nodes in a given node", () => {
      const node = doc(
        p("Paragraph 1"),
        p("Paragraph 2"),
        p(ul(li("List item 1"), li("List item 2")))
      );
      expect(createValidationInputsForDocument(node)).toEqual([
        { from: 1, to: 13, str: "Paragraph 1" },
        { from: 14, to: 26, str: "Paragraph 2" },
        {
          from: 29,
          to: 41,
          str: "List item 1"
        },
        {
          from: 42,
          to: 54,
          str: "List item 2"
        }
      ]);
    });
  });
});
