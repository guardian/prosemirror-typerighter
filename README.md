# prosemirror-noting
This plugin adds the ability to have ranges added to the document that expand and contract around dependent on the input. These notes are represented as `marks` in the document.

Very basic demo [here](http://guardian.github.com/prosemirror-noting)

---

## Install
`npm install prosemirror-noting`

## Usage
Add the mark to the schema
```javascript
const mySchema = new Schema({
  nodes,
  marks: Object.assign({}, marks, {
    note: createNoteMark(
      {
        note: "span.note"
      },
      meta => ({
        class: meta.hidden ? "note--collapsed" : "",
        title: "My Title",
        contenteditable: !meta.hidden
      })
    )
  })
});
```
Add the plugin to the state
```javascript
const historyPlugin = history();
const noterPlugin = noter(mySchema.marks.note, doc, historyPlugin);

new EditorView(document.querySelector("#editor"), {
  state: EditorState.create({
    doc: DOMParser.fromSchema(mySchema).parse(
      document.querySelector("#content")
    ),
    plugins: [
      keymap({
        F10: toggleNote("note")
      }),
      historyPlugin,
      noterPlugin
    ]
  })
});
```

And import the css (if needed) from `prosemirror-noting/dist/noting.css`.

## API
### createNoteMark(typeTagMap: string | object, attrGenerator: function): MarkType
Returns a mark to be added to the schema.

- `typeTagMap` - if this is passed with an object it expects a map between a "note type" and a dom tag (e.g. `{ note: "span.note"}`). Otherwise if a string is passed it will expect that string to be simply a tag name and the type will default to a type of `note`. Good for styling.
- `attrGenerator` - this will run when rendering the note to add derived DOM attributes from the meta data.

### toggleNote(type: string = "note", cursorToEnd = false): CommandFunction
Returns a command used for toggling notes based on the cursor position.

- `type` - this will use the type to decide which note type to toggle if there are more than one.
- `cursorToEnd` - this will make the cursor skip to after the note when adding a new note

Toggle note works in the following way:
- Selections
  - Completely inside a note - will slice the note
  - Completely outside a note - will add a note
  - Part inside and part outside - will extend the note
- Cursor
  - Inside a note - will remove the note
  - Outside a note - will start a note

### setNoteMeta(id: string, meta: object): CommandFunction
Returns a command to set the meta for a note id

- `id` - the string id of the note to edit.
- `meta` - an object that will be assigned to the current meta (i.e. will not overwrite keys it does not contain).

### noter(markType: MarkType, historyPlugin: Plugin, onNoteCreate: function = () => {}): Plugin
Returns the plugin to add to prosemirror  
- `markType` - the mark type that is being used in the schema to handle the notes.
- `historyPlugin` - pass the history plugin to handle undo / redo.
- `onNoteCreate` -  a callback that is called when a new note is added to the document.

## Roadmap
- Add in collapsing as a config option, currently there are some overlapping concerns here (`meta.hidden` manually having to be set in the schema setup)
- Better documentation
- Use proper plugin state in order to expose the state of the notes
- Better CSS / decorations
