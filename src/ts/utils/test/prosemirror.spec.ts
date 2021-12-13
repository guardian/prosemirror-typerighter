import builder from "prosemirror-test-builder";
import {
  getBlocksFromDocument,
  getDirtiedRangesFromTransaction,
  nodeContainsText
} from "../prosemirror";
import { flatten } from "prosemirror-utils";
import { doNotSkipRanges } from "../block";
import { createEditor } from "../../test/helpers/createEditor";

const { doc, p, ul, li } = builder;

describe("Prosemirror utils", () => {
  describe("getBlocksFromDocument", () => {
    it("should get the ranges of all the leaf block nodes in a given node", () => {
      const node = doc(
        p("Paragraph 1"),
        p("Paragraph 2"),
        p(ul(li("List item 1"), li("List item 2")))
      );
      expect(getBlocksFromDocument(node, 0, doNotSkipRanges)).toEqual([
        {
          from: 1,
          to: 13,
          text: "Paragraph 1",
          id: "0-from:1-to:13",
          skipRanges: []
        },
        {
          from: 14,
          to: 26,
          text: "Paragraph 2",
          id: "0-from:14-to:26",
          skipRanges: []
        },
        {
          from: 29,
          to: 41,
          text: "List item 1",
          id: "0-from:29-to:41",
          skipRanges: []
        },
        {
          from: 42,
          to: 54,
          text: "List item 2",
          id: "0-from:42-to:54",
          skipRanges: []
        }
      ]);
    });
  });
  describe("getDirtiedRangesFromTransaction", () => {
    it("should get ranges from any replaced text in the transaction", () => {
      const { view, schema } = createEditor(
        `<p>Paragraph 1</p>
        <p>Paragraph 2</p>
        <p><ul><li>List item 1</li><li>List item 2</li></ul></p>`
      );

      const tr = view.state.tr;
      tr.replaceWith(1, 5, schema.text("Replacement text"));
      expect(getDirtiedRangesFromTransaction(view.state.doc, tr)).toEqual([
        { from: 1, to: 17 }
      ]);
    });
    it("should get the ranges (with a to value that's the same as the from value) from any deleted text in the transaction", () => {
      const { view } = createEditor(
        `<p>Paragraph 1</p>
         <p>Paragraph 2</p>`
      );
      const tr = view.state.tr;
      tr.deleteRange(1, 2);
      // Deletions are always represented by a range of length 0, as they have
      // no length in document to which they've been applied.
      expect(getDirtiedRangesFromTransaction(view.state.doc, tr)).toEqual([
        { from: 1, to: 1 }
      ]);
    });
    it("should get ranges from multiple steps", () => {
      const { view } = createEditor(
        `<p>Paragraph 1</p>
         <p>Paragraph 2</p>`
      );
      const tr = view.state.tr;
      tr.deleteRange(1, 2);
      tr.deleteRange(5, 6);

      expect(getDirtiedRangesFromTransaction(view.state.doc, tr)).toEqual([
        { from: 1, to: 1 },
        { from: 5, to: 5 }
      ]);
    });
  });
  describe("flatten", () => {
    it("should flatten a node tree into a single array of nodes and their positions", () => {
      const node = doc(
        p("Paragraph 1"),
        p("Paragraph 2"),
        p(ul(li("List item 1"), li("List item 2")))
      );
      const result = flatten(node);
      expect(result.length).toBe(10);
      expect(result.map(_ => _.pos)).toEqual([
        0,
        1,
        13,
        14,
        26,
        27,
        28,
        29,
        41,
        42
      ]);
    });
    it("should limit the depth of the operation if the descend param is false", () => {
      const node = doc(p(ul(li("List item 1"))));
      expect(flatten(node, false).length).toEqual(1);
    });
  });
  describe("nodeContainsText", () => {
    const testTextInput = (text: string, result: boolean) => {
      expect(nodeContainsText(doc(text))).toBe(result);
      expect(nodeContainsText(doc(p(text)))).toBe(result);
      expect(nodeContainsText(doc(p(p(text))))).toBe(result);
      expect(nodeContainsText(doc(p(""), p(text)))).toBe(result);
      expect(nodeContainsText(doc(ul(li(text))))).toBe(result);
    }

    it("should return true if the document contains any text content", () => {
      testTextInput("Text", true)
    });

    it("should return true if the document contains any whitespace", () => {
      testTextInput(" ", true)
    });

    it("should return false if the document does not contain text content", () => {
      testTextInput("", false)
    });
  });
});
