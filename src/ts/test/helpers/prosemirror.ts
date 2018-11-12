// import { undo, redo } from "prosemirror-history";
// import { Slice } from "prosemirror-model";
// import { Selection, TextSelection } from "prosemirror-state";
// import { Fragment } from "prosemirror-model";

// export class TestState {
//   constructor(state, cmds = {}) {
//     this.state = state;
//     this.cmds = cmds;
//     this.clipboard = null;
//   }

//   runCommand(name, ...runArgs) {
//     const cmd = this.cmds[name];
//     if (!cmd) {
//       throw new Error(`Command ${name} not registered with TestState`);
//     }
//     cmd(...runArgs)(this.state, tr => this.apply(tr));
//     return this;
//   }

//   enter(n = 1) {
//     for (let i = 0; i < n; i += 1) {
//       this.apply(this.tr.split(this.selection.from));
//     }
//     return this;
//   }

//   get leftPos() {
//     return Selection.near(this.doc.resolve(this.selection.$anchor.pos - 1), -1);
//   }

//   left(n = 1) {
//     for (let i = 0; i < n; i += 1) {
//       this.setSelection(this.leftPos);
//     }
//     return this;
//   }

//   get rightPos() {
//     return Selection.near(this.doc.resolve(this.selection.$anchor.pos + 1));
//   }

//   right(n = 1) {
//     for (let i = 0; i < n; i += 1) {
//       this.setSelection(this.rightPos);
//     }
//     return this;
//   }

//   undo(n = 1) {
//     for (let i = 0; i < n; i += 1) {
//       undo(this.state, tr => this.apply(tr));
//     }
//     return this;
//   }

//   redo(n = 1) {
//     for (let i = 0; i < n; i += 1) {
//       redo(this.state, tr => this.apply(tr));
//     }
//     return this;
//   }

//   backspace(n = 1) {
//     for (let i = 0; i < n; i += 1) {
//       const { $cursor } = this.selection;

//       const { from, to } = $cursor
//         ? new Selection(this.leftPos.$from, this.selection.$from)
//         : this.selection;

//       this.apply(this.tr.replace(from, to, Slice.empty));
//     }
//     return this;
//   }

//   delete(n = 1) {
//     for (let i = 0; i < n; i += 1) {
//       const { $cursor } = this.selection;

//       const { from, to } = $cursor
//         ? new Selection(this.selection.$from, this.rightPos.$from)
//         : this.selection;

//       this.apply(this.tr.replace(from, to, Slice.empty));
//     }
//     return this;
//   }

//   selectRight(n = 1) {
//     const { $from } = this.state.selection;
//     let { $to } = this.state.selection;
//     for (let i = 0; i < n; i += 1) {
//       const $pos = this.state.doc.resolve($to.pos + 1);
//       $to = Selection.near($pos).$to;
//     }

//     return this.setSelection(new TextSelection($from, $to));
//   }

//   setSelection(sel) {
//     return this.apply(this.tr.setSelection(sel));
//   }

//   replaceSelection(content, paste = false) {
//     let tr = this.tr.replaceSelection(content);
//     if (paste) {
//       tr = tr.setMeta("paste", true);
//     }

//     return this.apply(tr);
//   }

//   deleteSelection() {
//     return this.replaceSelection(Slice.empty);
//   }

//   copy() {
//     this.clipboard = this.selection.content();
//     return this;
//   }

//   cut(n = 1) {
//     for (let i = 0; i < n; i += 1) {
//       this.copy();
//       this.deleteSelection();
//     }
//     return this;
//   }

//   paste(n = 1) {
//     for (let i = 0; i < n; i += 1) {
//       this.replaceSelection(this.clipboard, true);
//     }

//     return this;
//   }

//   type(text) {
//     return this.apply(this.tr.insertText(text));
//   }

//   apply(tr) {
//     this.state = this.state.apply(tr);
//     return this;
//   }

//   get tr() {
//     return this.state.tr;
//   }

//   get doc() {
//     return this.state.doc;
//   }

//   get selection() {
//     return this.state.selection;
//   }
// }

// export const removeTags = _node => {
//   const node = _node.copy(_node.content);
//   delete node.tag;
//   const children = [];
//   for (let i = 0; i < node.content.childCount; i += 1) {
//     const child = node.content.child(i);
//     children.push(removeTags(child));
//   }
//   return node.copy(Fragment.from(children));
// };
