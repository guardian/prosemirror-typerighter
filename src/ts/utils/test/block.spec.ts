import { removeSkippedRanges } from "../block";

describe("Block utils", () => {
  describe("removeSkippedRanges", () => {
    it("should remove the passed skipped range from the block text", () => {
      const skipRanges = [{ from: 18, to: 25 }];
      const block = {
        id: "id",
        text: "Example [noted ]text",
        from: 10,
        to: 28,
        skipRanges
      };
      const newBlock = removeSkippedRanges(block);
      expect(newBlock.text).toBe("Example text");
      expect(newBlock.from).toBe(10);
      expect(newBlock.to).toBe(22);
    });

    it("should remove multiple adjacent skipped ranges from the block text", () => {
      const skipRanges = [
        { from: 18, to: 25 },
        { from: 26, to: 32 }
      ];
      const block = {
        id: "id",
        text: "Example [noted][noted ]text",
        from: 10,
        to: 37,
        skipRanges
      };
      const newBlock = removeSkippedRanges(block);

      expect(newBlock.text).toBe("Example text");
      expect(newBlock.from).toBe(10);
      expect(newBlock.to).toBe(22);
    });

    it("should remove multiple non-adjacent skipped ranges from the block text - 1", () => {
      const skipRanges = [
        { from: 18, to: 25 },
        { from: 41, to: 48 }
      ];
      const block = {
        id: "id",
        text: "Example [noted ]text with more [noted ]text",
        from: 10,
        to: 52,
        skipRanges
      };
      const newBlock = removeSkippedRanges(block);
      expect(newBlock.text).toBe("Example text with more text");
      expect(newBlock.from).toBe(10);
      expect(newBlock.to).toBe(37);
    });

    it("should remove multiple non-adjacent skipped ranges from the block text - 2", () => {
      const skipRanges = [
        { from: 40, to: 42 },
        { from: 44, to: 45 },
        { from: 47, to: 48 }
      ];
      const block = {
        id: "1602586488022-from:40-to:214",
        text: "ABCDEFGHIJ",
        from: 40,
        to: 47,
        skipRanges
      };
      const newBlock = removeSkippedRanges(block);

      expect(newBlock.text).toBe("DGJ");
      expect(newBlock.from).toBe(40);
      expect(newBlock.to).toBe(43);
    });

    it("should not care about order", () => {
      const skipRanges = [
        { from: 24, to: 31 },
        { from: 18, to: 24 }
      ];
      const block = {
        id: "id",
        text: "Example [noted][noted ]text",
        from: 10,
        to: 37,
        skipRanges
      };
      const newBlock = removeSkippedRanges(block);
      expect(newBlock.text).toBe("Example text");
      expect(newBlock.from).toBe(10);
      expect(newBlock.to).toBe(22);
    });
    it("should yield the same result if the skipped ranges overlap", () => {
      const skipRanges = [
        { from: 24, to: 31 },
        { from: 18, to: 26 }
      ];
      const block = {
        id: "id",
        text: "Example [noted][noted ]text",
        from: 10,
        to: 37,
        skipRanges
      };
      const newBlock = removeSkippedRanges(block);
      expect(newBlock.text).toBe("Example text");
      expect(newBlock.from).toBe(10);
      expect(newBlock.to).toBe(22);
    });
    it("should trim to the end of the text if the skipped ranges go beyond the block", () => {
      const skipRanges = [
        { from: 17, to: 1000 }
      ];
      const block = {
        id: "id",
        text: "Example[ text",
        from: 10,
        to: 23,
        skipRanges
      };
      const newBlock = removeSkippedRanges(block);
      expect(newBlock.text).toBe("Example");
      expect(newBlock.from).toBe(10);
      expect(newBlock.to).toBe(17);
    });
    it("should trim to the beginning of the text if the skipped ranges precede the block", () => {
      const skipRanges = [
        { from: 0, to: 18 }
      ];
      const block = {
        id: "id",
        text: "Example] text",
        from: 10,
        to: 23,
        skipRanges
      };
      const newBlock = removeSkippedRanges(block);
      expect(newBlock.text).toBe("text");
      expect(newBlock.from).toBe(10);
      expect(newBlock.to).toBe(14);
    });
  });
});
