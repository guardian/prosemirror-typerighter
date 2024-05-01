import { Schema, Node } from "prosemirror-model";
import { marks, nodes } from "prosemirror-schema-basic";
import { builders } from "prosemirror-test-builder";
import {
  EditorView,
  DecorationSet,
  Decoration
} from "prosemirror-view";
import { getNewDecorationsForCurrentMatches } from "../../utils/decoration";
import { Match } from "../../interfaces/IMatch";

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

/**
 * We cannot compare document decorations to plugin decorations, as the
 * .ProseMirror-widget class is applied – but we can compare their specs.
 * We compare sets here because the order is arbitrary.
 */
export const getDecorationSpecsFromDoc = (
  view: EditorView
) =>
  getDecorationSpecsFromSet(view.someProp("decorations", f => f(view.state)) as DecorationSet);

export const getDecorationSpecsFromMatches = (matches: Match[], doc: Node) => {
  const decorationSet = getNewDecorationsForCurrentMatches(matches, DecorationSet.empty, doc)
  return getDecorationSpecsFromSet(decorationSet);
}

export const getDecorationSpecsFromSet = (
  set: DecorationSet
) => new Set(set.find().map(_ => _.spec));

export const getDecorationSpecs = (
  decorations: Decoration[]
) => new Set(decorations.map(_ => _.spec));
