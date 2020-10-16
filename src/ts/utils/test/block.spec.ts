import { removeSkippedRanges } from "../block";

describe("Block utils", () => {
  describe("removeSkippedRanges", () => {
    it("should remove the passed skipped range from the block text", () => {
      const skippedRanges = [{ from: 18, to: 25 }];
      const block = {
        id: "id",
        text: "Example [noted ]text",
        from: 10,
        to: 28,
        skippedRanges
      };
      const newBlock = removeSkippedRanges(block);
      expect(newBlock.text).toBe("Example text");
      expect(newBlock.from).toBe(10);
      expect(newBlock.to).toBe(22);
    });

    it("should remove multiple adjacent skipped ranges from the block text", () => {
      const skippedRanges = [
        { from: 18, to: 25 },
        { from: 26, to: 32 }
      ];
      const block = {
        id: "id",
        text: "Example [noted][noted ]text",
        from: 10,
        to: 37,
        skippedRanges
      };
      const newBlock = removeSkippedRanges(block);

      expect(newBlock.text).toBe("Example text");
      expect(newBlock.from).toBe(10);
      expect(newBlock.to).toBe(22);
    });

    it("should remove multiple non-adjacent skipped ranges from the block text - 1", () => {
      const skippedRanges = [
        { from: 18, to: 25 },
        { from: 41, to: 48 }
      ];
      const block = {
        id: "id",
        text: "Example [noted ]text with more [noted ]text",
        from: 10,
        to: 52,
        skippedRanges
      };
      const newBlock = removeSkippedRanges(block);
      expect(newBlock.text).toBe("Example text with more text");
      expect(newBlock.from).toBe(10);
      expect(newBlock.to).toBe(37);
    });

    it("should remove multiple non-adjacent skipped ranges from the block text - 2", () => {
      const skippedRanges = [
        { from: 40, to: 42 },
        { from: 44, to: 45 },
        { from: 47, to: 48 }
      ];
      const block = {
        id: "1602586488022-from:40-to:214",
        text: "ABCDEFGHIJ",
        from: 40,
        to: 47,
        skippedRanges
      };
      const newBlock = removeSkippedRanges(block);

      expect(newBlock.text).toBe("DGJ");
      expect(newBlock.from).toBe(40);
      expect(newBlock.to).toBe(43);
    });

    it("should not care about order", () => {
      const skippedRanges = [
        { from: 24, to: 31 },
        { from: 18, to: 24 }
      ];
      const block = {
        id: "id",
        text: "Example [noted][noted ]text",
        from: 10,
        to: 37,
        skippedRanges
      };
      const newBlock = removeSkippedRanges(block);
      expect(newBlock.text).toBe("Example text");
      expect(newBlock.from).toBe(10);
      expect(newBlock.to).toBe(22);
    });
  });
});
