import builder from "prosemirror-test-builder";
import {
  getBlocksFromDocument,
  getReplaceStepRangesFromTransaction
} from "../prosemirror";
import { Transaction } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";
import { flatten } from "prosemirror-utils";
import { doNotSkipRanges } from "../block";

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
  describe("getReplaceStepRangesFromTransaction", () => {
    it("should get ranges from any replace steps in the transaction", () => {
      const node = doc(
        p("Paragraph 1"),
        p("Paragraph 2"),
        p(ul(li("List item 1"), li("List item 2")))
      );
      const tr = new Transaction(node);
      tr.doc = node;
      tr.replaceWith(1, 5, schema.text("Replacement text"));
      expect(getReplaceStepRangesFromTransaction(tr)).toEqual([
        { from: 1, to: 5 }
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
});
