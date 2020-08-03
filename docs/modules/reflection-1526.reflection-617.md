[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [](reflection-1526.md) › [](reflection-1526.reflection-617.md)

# Module: 

## Index

### Interfaces

* [IPluginOptions](../interfaces/reflection-1526.reflection-617.ipluginoptions.md)

### Type aliases

* [ApplySuggestionOptions](reflection-1526.reflection-617.md#applysuggestionoptions)
* [Command](reflection-1526.reflection-617.md#command)
* [Commands](reflection-1526.reflection-617.md#commands)
* [ExpandRanges](reflection-1526.reflection-617.md#expandranges)
* [GetState](reflection-1526.reflection-617.md#getstate)

### Functions

* [applyAutoFixableSuggestionsCommand](reflection-1526.reflection-617.md#const-applyautofixablesuggestionscommand)
* [applyMatcherResponseCommand](reflection-1526.reflection-617.md#const-applymatcherresponsecommand)
* [applyRequestCompleteCommand](reflection-1526.reflection-617.md#const-applyrequestcompletecommand)
* [applyRequestErrorCommand](reflection-1526.reflection-617.md#const-applyrequesterrorcommand)
* [applySuggestionsCommand](reflection-1526.reflection-617.md#const-applysuggestionscommand)
* [createBoundCommands](reflection-1526.reflection-617.md#const-createboundcommands)
* [createTyperighterPlugin](reflection-1526.reflection-617.md#const-createtyperighterplugin)
* [createView](reflection-1526.reflection-617.md#const-createview)
* [indicateHoverCommand](reflection-1526.reflection-617.md#const-indicatehovercommand)
* [maybeApplySuggestions](reflection-1526.reflection-617.md#const-maybeapplysuggestions)
* [requestMatchesForDirtyRangesCommand](reflection-1526.reflection-617.md#const-requestmatchesfordirtyrangescommand)
* [requestMatchesForDocumentCommand](reflection-1526.reflection-617.md#const-requestmatchesfordocumentcommand)
* [selectMatchCommand](reflection-1526.reflection-617.md#const-selectmatchcommand)
* [setDebugStateCommand](reflection-1526.reflection-617.md#const-setdebugstatecommand)
* [setRequestOnDocModifiedState](reflection-1526.reflection-617.md#const-setrequestondocmodifiedstate)
* [stopHoverCommand](reflection-1526.reflection-617.md#const-stophovercommand)

## Type aliases

###  ApplySuggestionOptions

Ƭ **ApplySuggestionOptions**: *Array‹object›*

*Defined in [src/ts/commands.ts:219](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L219)*

___

###  Command

Ƭ **Command**: *function*

*Defined in [src/ts/commands.ts:30](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L30)*

#### Type declaration:

▸ (`state`: EditorState, `dispatch?`: undefined | function): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`state` | EditorState |
`dispatch?` | undefined &#124; function |

___

###  Commands

Ƭ **Commands**: *ReturnType‹typeof createBoundCommands›*

*Defined in [src/ts/commands.ts:332](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L332)*

The commands available to the plugin consumer.

___

###  ExpandRanges

Ƭ **ExpandRanges**: *function*

*Defined in [src/ts/createTyperighterPlugin.ts:22](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/createTyperighterPlugin.ts#L22)*

#### Type declaration:

▸ (`ranges`: [IRange](../interfaces/interfaces.irange.md)[], `doc`: Node‹any›): *[IRange](../interfaces/interfaces.irange.md)[]*

**Parameters:**

Name | Type |
------ | ------ |
`ranges` | [IRange](../interfaces/interfaces.irange.md)[] |
`doc` | Node‹any› |

___

###  GetState

Ƭ **GetState**: *function*

*Defined in [src/ts/commands.ts:35](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L35)*

#### Type declaration:

▸ (`state`: EditorState): *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

**Parameters:**

Name | Type |
------ | ------ |
`state` | EditorState |

## Functions

### `Const` applyAutoFixableSuggestionsCommand

▸ **applyAutoFixableSuggestionsCommand**‹**TMatch**›(`getState`: [GetState](reflection-1526.reflection-617.md#getstate)‹TMatch›): *[Command](reflection-1526.reflection-617.md#command)*

*Defined in [src/ts/commands.ts:251](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L251)*

Applies the first suggestion for each rule marked as auto-fixable.

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`getState` | [GetState](reflection-1526.reflection-617.md#getstate)‹TMatch› |

**Returns:** *[Command](reflection-1526.reflection-617.md#command)*

___

### `Const` applyMatcherResponseCommand

▸ **applyMatcherResponseCommand**(`matcherResponse`: [IMatcherResponse](../interfaces/interfaces.imatcherresponse.md)): *[Command](reflection-1526.reflection-617.md#command)*

*Defined in [src/ts/commands.ts:168](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L168)*

Apply a successful matcher response to the document.

**Parameters:**

Name | Type |
------ | ------ |
`matcherResponse` | [IMatcherResponse](../interfaces/interfaces.imatcherresponse.md) |

**Returns:** *[Command](reflection-1526.reflection-617.md#command)*

___

### `Const` applyRequestCompleteCommand

▸ **applyRequestCompleteCommand**(`requestId`: string): *[Command](reflection-1526.reflection-617.md#command)*

*Defined in [src/ts/commands.ts:204](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L204)*

Mark the

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |

**Returns:** *[Command](reflection-1526.reflection-617.md#command)*

___

### `Const` applyRequestErrorCommand

▸ **applyRequestErrorCommand**(`matchRequestError`: [IMatchRequestError](../interfaces/interfaces.imatchrequesterror.md)): *[Command](reflection-1526.reflection-617.md#command)*

*Defined in [src/ts/commands.ts:187](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L187)*

Apply an error to the document. Important to ensure
that failed matcher requests are reapplied as dirtied ranges
to be resent on the next request.

**Parameters:**

Name | Type |
------ | ------ |
`matchRequestError` | [IMatchRequestError](../interfaces/interfaces.imatchrequesterror.md) |

**Returns:** *[Command](reflection-1526.reflection-617.md#command)*

___

### `Const` applySuggestionsCommand

▸ **applySuggestionsCommand**‹**TMatch**›(`suggestionOptions`: [ApplySuggestionOptions](reflection-1526.reflection-617.md#applysuggestionoptions), `getState`: [GetState](reflection-1526.reflection-617.md#getstate)‹TMatch›): *[Command](reflection-1526.reflection-617.md#command)*

*Defined in [src/ts/commands.ts:227](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L227)*

Applies a suggestion from a match to the document.

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`suggestionOptions` | [ApplySuggestionOptions](reflection-1526.reflection-617.md#applysuggestionoptions) |
`getState` | [GetState](reflection-1526.reflection-617.md#getstate)‹TMatch› |

**Returns:** *[Command](reflection-1526.reflection-617.md#command)*

___

### `Const` createBoundCommands

▸ **createBoundCommands**‹**TMatch**›(`view`: EditorView, `getState`: [GetState](reflection-1526.reflection-617.md#getstate)‹TMatch›): *object*

*Defined in [src/ts/commands.ts:298](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L298)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`view` | EditorView |
`getState` | [GetState](reflection-1526.reflection-617.md#getstate)‹TMatch› |

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

* **applySuggestions**(`suggestionOpts`: [ApplySuggestionOptions](reflection-1526.reflection-617.md#applysuggestionoptions)): *boolean*

* **selectMatch**(`blockId`: string): *boolean*

___

### `Const` createTyperighterPlugin

▸ **createTyperighterPlugin**‹**TMatch**›(`options`: [IPluginOptions](../interfaces/reflection-1526.reflection-617.ipluginoptions.md)‹TMatch›): *object*

*Defined in [src/ts/createTyperighterPlugin.ts:47](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/createTyperighterPlugin.ts#L47)*

Creates the plugin. The plugin is responsible for issuing requests when the
document is changed via the supplied servier, decorating the document with matches
when they are are returned, and applying suggestions to the document.

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`options` | [IPluginOptions](../interfaces/reflection-1526.reflection-617.ipluginoptions.md)‹TMatch› | {} | The plugin options object. |

**Returns:** *object*

* **getState**(): *function*

  * (`state`: EditorState): *TPluginState*

* **plugin**: *Plugin‹any, any›*

* **store**: *[Store](../classes/state.store.md)‹[IMatch](../interfaces/interfaces.imatch.md)‹[ITextSuggestion](../interfaces/interfaces.itextsuggestion.md) | [IWikiSuggestion](../interfaces/interfaces.iwikisuggestion.md)›, [IStoreEvents](../interfaces/state.istoreevents.md)‹[IMatch](../interfaces/interfaces.imatch.md)‹[ITextSuggestion](../interfaces/interfaces.itextsuggestion.md) | [IWikiSuggestion](../interfaces/interfaces.iwikisuggestion.md)›››*

___

### `Const` createView

▸ **createView**(`view`: EditorView, `store`: [Store](../classes/state.store.md)‹[IMatch](../interfaces/interfaces.imatch.md)›, `matcherService`: [MatcherService](../classes/services.matcherservice.md)‹[IMatch](../interfaces/interfaces.imatch.md)›, `commands`: [Commands](reflection-1526.reflection-617.md#commands), `sidebarNode`: Element, `controlsNode`: Element, `contactHref?`: undefined | string, `feedbackHref?`: undefined | string): *void*

*Defined in [src/ts/createView.tsx:15](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/createView.tsx#L15)*

Scaffolding for an example view.

**Parameters:**

Name | Type |
------ | ------ |
`view` | EditorView |
`store` | [Store](../classes/state.store.md)‹[IMatch](../interfaces/interfaces.imatch.md)› |
`matcherService` | [MatcherService](../classes/services.matcherservice.md)‹[IMatch](../interfaces/interfaces.imatch.md)› |
`commands` | [Commands](reflection-1526.reflection-617.md#commands) |
`sidebarNode` | Element |
`controlsNode` | Element |
`contactHref?` | undefined &#124; string |
`feedbackHref?` | undefined &#124; string |

**Returns:** *void*

___

### `Const` indicateHoverCommand

▸ **indicateHoverCommand**(`matchId`: string, `hoverInfo?`: [IStateHoverInfo](../interfaces/state.istatehoverinfo.md)): *[Command](reflection-1526.reflection-617.md#command)*

*Defined in [src/ts/commands.ts:81](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L81)*

Indicate new hover information is available. This could include
details on hover coords if available (for example, if hovering
over a match decoration) to allow the positioning of e.g. tooltips.

**Parameters:**

Name | Type |
------ | ------ |
`matchId` | string |
`hoverInfo?` | [IStateHoverInfo](../interfaces/state.istatehoverinfo.md) |

**Returns:** *[Command](reflection-1526.reflection-617.md#command)*

___

### `Const` maybeApplySuggestions

▸ **maybeApplySuggestions**(`suggestionsToApply`: Array‹object›, `state`: EditorState, `dispatch?`: undefined | function): *boolean*

*Defined in [src/ts/commands.ts:268](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L268)*

**Parameters:**

Name | Type |
------ | ------ |
`suggestionsToApply` | Array‹object› |
`state` | EditorState |
`dispatch?` | undefined &#124; function |

**Returns:** *boolean*

___

### `Const` requestMatchesForDirtyRangesCommand

▸ **requestMatchesForDirtyRangesCommand**(`requestId`: string, `categoryIds`: string[]): *[Command](reflection-1526.reflection-617.md#command)*

*Defined in [src/ts/commands.ts:60](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L60)*

Request matches for the current set of dirty ranges.

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`categoryIds` | string[] |

**Returns:** *[Command](reflection-1526.reflection-617.md#command)*

___

### `Const` requestMatchesForDocumentCommand

▸ **requestMatchesForDocumentCommand**(`requestId`: string, `categoryIds`: string[]): *[Command](reflection-1526.reflection-617.md#command)*

*Defined in [src/ts/commands.ts:42](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L42)*

Requests matches for an entire document.

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`categoryIds` | string[] |

**Returns:** *[Command](reflection-1526.reflection-617.md#command)*

___

### `Const` selectMatchCommand

▸ **selectMatchCommand**‹**TMatch**›(`matchId`: string, `getState`: [GetState](reflection-1526.reflection-617.md#getstate)‹TMatch›): *[Command](reflection-1526.reflection-617.md#command)*

*Defined in [src/ts/commands.ts:115](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L115)*

Mark a given match as active.

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`matchId` | string |
`getState` | [GetState](reflection-1526.reflection-617.md#getstate)‹TMatch› |

**Returns:** *[Command](reflection-1526.reflection-617.md#command)*

___

### `Const` setDebugStateCommand

▸ **setDebugStateCommand**(`debug`: boolean): *[Command](reflection-1526.reflection-617.md#command)*

*Defined in [src/ts/commands.ts:136](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L136)*

Set the debug state. Enabling debug mode provides additional marks
to reveal dirty ranges and ranges sent for matching.

**Parameters:**

Name | Type |
------ | ------ |
`debug` | boolean |

**Returns:** *[Command](reflection-1526.reflection-617.md#command)*

___

### `Const` setRequestOnDocModifiedState

▸ **setRequestOnDocModifiedState**(`requestMatchesOnDocModified`: boolean): *[Command](reflection-1526.reflection-617.md#command)*

*Defined in [src/ts/commands.ts:151](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L151)*

When enabled, the plugin will queue match requests as soon as the document is modified.

**Parameters:**

Name | Type |
------ | ------ |
`requestMatchesOnDocModified` | boolean |

**Returns:** *[Command](reflection-1526.reflection-617.md#command)*

___

### `Const` stopHoverCommand

▸ **stopHoverCommand**(): *[Command](reflection-1526.reflection-617.md#command)*

*Defined in [src/ts/commands.ts:100](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/commands.ts#L100)*

Indicate that the user is no longer hovering over a
prosemirror-typerighter tooltip.

**Returns:** *[Command](reflection-1526.reflection-617.md#command)*
