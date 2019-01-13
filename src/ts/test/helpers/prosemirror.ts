import { Schema } from "prosemirror-model";
import { marks, nodes } from "prosemirror-schema-basic";
import { builders } from "prosemirror-test-builder";

const schema = new Schema({
  nodes,
  marks
});

const build = builders(schema, {
  p: {
    markType: "paragraph"
  }
});

export const createDoc = build.doc;
export const p = build.p;
