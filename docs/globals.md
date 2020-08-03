[@guardian/prosemirror-typerighter](README.md) › [Globals](globals.md)

# @guardian/prosemirror-typerighter

## Index

### Classes

* [MatcherService](classes/matcherservice.md)
* [TyperighterAdapter](classes/typerighteradapter.md)

### Functions

* [convertTyperighterResponse](globals.md#const-converttyperighterresponse)
* [createBoundCommands](globals.md#const-createboundcommands)
* [createTyperighterPlugin](globals.md#const-createtyperighterplugin)
* [createView](globals.md#const-createview)
* [getBlocksFromDocument](globals.md#const-getblocksfromdocument)

## Functions

### `Const` convertTyperighterResponse

▸ **convertTyperighterResponse**(`requestId`: string, `response`: ITypeRighterResponse): *IMatcherResponse*

*Defined in [services/adapters/TyperighterAdapter.ts:14](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/services/adapters/TyperighterAdapter.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`response` | ITypeRighterResponse |

**Returns:** *IMatcherResponse*

___

### `Const` createBoundCommands

▸ **createBoundCommands**‹**TMatch**›(`view`: EditorView, `getState`: GetState‹TMatch›): *object*

*Defined in [commands.ts:298](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/commands.ts#L298)*

**Type parameters:**

▪ **TMatch**: *IMatch*

**Parameters:**

Name | Type |
------ | ------ |
`view` | EditorView |
`getState` | GetState‹TMatch› |

**Returns:** *object*

* **applyMatcherResponse**: *(Anonymous function)* = bindCommand(applyMatcherResponseCommand)

* **applyRequestComplete**: *(Anonymous function)* = bindCommand(applyRequestCompleteCommand)

* **applyRequestError**: *(Anonymous function)* = bindCommand(applyRequestErrorCommand)

* **indicateHover**: *(Anonymous function)* = bindCommand(indicateHoverCommand)

* **requestMatchesForDirtyRanges**: *(Anonymous function)* = bindCommand(
      requestMatchesForDirtyRangesCommand
    )

* **requestMatchesForDocument**: *(Anonymous function)* = bindCommand(requestMatchesForDocumentCommand)

* **setDebugState**: *(Anonymous function)* = bindCommand(setDebugStateCommand)

* **setRequestOnDocModified**: *(Anonymous function)* = bindCommand(setRequestOnDocModifiedState)

* **stopHover**: *(Anonymous function)* = bindCommand(stopHoverCommand)

* **applyAutoFixableSuggestions**(): *boolean*

* **applySuggestions**(`suggestionOpts`: ApplySuggestionOptions): *boolean*

* **selectMatch**(`blockId`: string): *boolean*

___

### `Const` createTyperighterPlugin

▸ **createTyperighterPlugin**‹**TMatch**›(`options`: IPluginOptions‹TMatch›): *object*

*Defined in [createTyperighterPlugin.ts:47](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/createTyperighterPlugin.ts#L47)*

Creates the plugin. The plugin is responsible for issuing requests when the
document is changed via the supplied servier, decorating the document with matches
when they are are returned, and applying suggestions to the document.

**Type parameters:**

▪ **TMatch**: *IMatch*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`options` | IPluginOptions‹TMatch› | {} | The plugin options object. |

**Returns:** *object*

* **getState**(): *function*

  * (`state`: EditorState): *TPluginState*

* **plugin**: *Plugin‹any, any›*

* **store**: *Store‹IMatch‹ITextSuggestion | IWikiSuggestion›, IStoreEvents‹IMatch‹ITextSuggestion | IWikiSuggestion›››*

___

### `Const` createView

▸ **createView**(`view`: EditorView, `store`: Store‹IMatch›, `matcherService`: [MatcherService](classes/matcherservice.md)‹IMatch›, `commands`: Commands, `sidebarNode`: Element, `controlsNode`: Element, `contactHref?`: undefined | string, `feedbackHref?`: undefined | string): *void*

*Defined in [createView.tsx:15](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/createView.tsx#L15)*

Scaffolding for an example view.

**Parameters:**

Name | Type |
------ | ------ |
`view` | EditorView |
`store` | Store‹IMatch› |
`matcherService` | [MatcherService](classes/matcherservice.md)‹IMatch› |
`commands` | Commands |
`sidebarNode` | Element |
`controlsNode` | Element |
`contactHref?` | undefined &#124; string |
`feedbackHref?` | undefined &#124; string |

**Returns:** *void*

___

### `Const` getBlocksFromDocument

▸ **getBlocksFromDocument**(`doc`: Node, `time`: number): *IBlock[]*

*Defined in [utils/prosemirror.ts:38](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/utils/prosemirror.ts#L38)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`doc` | Node | - |
`time` | number | 0 |

**Returns:** *IBlock[]*
