declare module "prosemirror-test-builder";
declare module "prosemirror-example-setup";

// Taken from: https://gist.github.com/colelawrence/8e7051417b7e87dbf014ee4bb8bdd020
declare module "prosemirror-changeset" {
  type StepMap = import("prosemirror-transform").StepMap;
  type Node = import("prosemirror-model").Node;

  /**
   * :: ([Change], Node) → [Change]
   *
   * Simplifies a set of changes for presentation. This makes the
   * assumption that having both insertions and deletions within a word
   * is confusing, and, when such changes occur without a word boundary
   * between them, they should be expanded to cover the entire set of
   * words (in the new document) they touch. An exception is made for
   * single-character replacements.
   *
   * [simplify.js source](https://github.com/ProseMirror/prosemirror-changeset/blob/11cb7b1fc05357c0bac5c444eab48748e4c8aa3b/src/simplify.js#L51-L67)
   */
  function simplifyChanges(changes: Change[], doc: Node): unknown[];

  /**
   * Stores metadata for a part of a change.
   * [change.js source](https://github.com/ProseMirror/prosemirror-changeset/blob/11cb7b1fc05357c0bac5c444eab48748e4c8aa3b/src/change.js#L2)
   */
  class Span {
    length: number;
    data: any;
    constructor(length: number, data: any);

    cut(length: number): Span;

    static slice(spans: Span[], from: number, to: number): Span[];

    static join(
      a: Span[],
      b: Span[],
      combine: (dataA: any, dataB: any) => any
    ): Span[];

    /** Sum the length of each span .length */
    static len(spans: Span[]): number;

    static none: [];
  }

  /**
   * A replaced range with metadata associated with it.
   * [change.js source](https://github.com/ProseMirror/prosemirror-changeset/blob/11cb7b1fc05357c0bac5c444eab48748e4c8aa3b/src/change.js#L48)
   */
  class Change {
    /** The start of the range deleted/replaced in the old document. */
    fromA: number;
    /** The end of the range in the old document. */
    toA: number;
    /** The start of the range inserted in the new document. */
    fromB: number;
    /** The end of the range in the new document. */
    toB: number;
    /** Data associated with the deleted content. The length of these spans adds up to `this.toA - this.fromA`. */
    deleted: Span[];
    /** Data associated with the inserted content. Length adds up to `this.toB - this.toA`. */
    inserted: Span[];

    constructor(
      fromA: number,
      toA: number,
      fromB: number,
      toB: number,
      deleted: Span[],
      inserted: Span[]
    );

    get lenA(): number;
    get lenB(): number;

    slice(startA: number, endA: number, startB: number, endB: number): Change;

    /** : ([Change], [Change], (any, any) → any) → [Change]
     *
     * This merges two changesets (the end document of x should be the
     * start document of y) into a single one spanning the start of x to
     * the end of y.
     */
    static merge(
      x: Change[],
      y: Change[],
      combine: (dataA: any, dataB: any) => any
    ): Change[];
  }

  type ChangeSetConfig = {
    doc: Node;
    combine: <T>(a: T, b: T) => T;
  };

  /**
   * ::- A change set tracks the changes to a document from a given
   * point in the past. It condenses a number of step maps down to a
   * flat sequence of replacements, and simplifies replacments that
   * partially undo themselves by comparing their content.
   *
   * [changeset.js source](https://github.com/ProseMirror/prosemirror-changeset/blob/11cb7b1fc05357c0bac5c444eab48748e4c8aa3b/src/changeset.js#L6-L10)
   */
  class ChangeSet {
    config: ChangeSetConfig;
    /** Replaced regions. */
    changes: Change[];

    constructor(config: ChangeSetConfig, changes: Change[]);

    /**
     * :: (Node, [StepMap], union<[any], any>) → ChangeSet
     *
     * Computes a new changeset by adding the given step maps and
     * metadata (either as an array, per-map, or as a single value to be
     * associated with all maps) to the current set. Will not mutate the
     * old set.
     *
     * Note that due to simplification that happens after each add,
     * incrementally adding steps might create a different final set
     * than adding all those changes at once, since different document
     * tokens might be matched during simplification depending on the
     * boundaries of the current changed ranges.
     *
     * [changeset.js source](https://github.com/ProseMirror/prosemirror-changeset/blob/11cb7b1fc05357c0bac5c444eab48748e4c8aa3b/src/changeset.js#L17-L28)
     */
    addSteps(newDoc: Node, maps: StepMap[], data: any | any[]): ChangeSet;

    /** The starting document of the change set. */
    get startDoc(): Node;

    /**
     * :: (f: (range: Change) → any) → ChangeSet
     *
     * Map the span's data values in the given set through a function
     * and construct a new set with the resulting data.
     *
     * [changeset.js source](https://github.com/ProseMirror/prosemirror-changeset/blob/11cb7b1fc05357c0bac5c444eab48748e4c8aa3b/src/changeset.js#L92)
     */
    map(f: (range: Change) => any): ChangeSet;

    /**
     * :: (ChangeSet, ?[StepMap]) → ?{from: number, to: number}
     *
     * Compare two changesets and return the range in which they are
     * changed, if any. If the document changed between the maps, pass
     * the maps for the steps that changed it as second argument, and
     * make sure the method is called on the old set and passed the new
     * set. The returned positions will be in new document coordinates.
     *
     * [changeset.js source](https://github.com/ProseMirror/prosemirror-changeset/blob/11cb7b1fc05357c0bac5c444eab48748e4c8aa3b/src/changeset.js#L100-L106)
     */
    changedRange(
      b: ChangeSet,
      maps?: StepMap[]
    ): null | { from: number; to: number };

    /**
     * :: (Node, ?(a: any, b: any) → any) → ChangeSet
     *
     * Create a changeset with the given base object and configuration.
     * The `combine` function is used to compare and combine metadata—it
     * should return null when metadata isn't compatible, and a combined
     * version for a merged range when it is.
     *
     * [changeset.js source](https://github.com/ProseMirror/prosemirror-changeset/blob/11cb7b1fc05357c0bac5c444eab48748e4c8aa3b/src/changeset.js#L130-L137)
     */
    static create(doc: Node, combine?: <T>(a: T, b: T) => T | null): ChangeSet;
  }
}

// Taken from https://github.com/developit/snarkdown/blob/master/snarkdown.d.ts –
// at time of writing the typescript definition file is not yet in the npm release.
declare module "snarkdown" {
  interface Links {
    [index: string]: string;
  }
  export default function(urlStr: string, prevLinks?: Links): string;
}
declare module "*.scss";
