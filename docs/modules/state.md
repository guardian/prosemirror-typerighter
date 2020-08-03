[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [state](state.md)

# Module: state

## Index

### Classes

* [Store](../classes/state.store.md)

### Interfaces

* [IBlockInFlight](../interfaces/state.iblockinflight.md)
* [IBlocksInFlightState](../interfaces/state.iblocksinflightstate.md)
* [IPluginState](../interfaces/state.ipluginstate.md)
* [IStateHoverInfo](../interfaces/state.istatehoverinfo.md)
* [IStoreEvents](../interfaces/state.istoreevents.md)

### Type aliases

* [Action](state.md#action)
* [ActionHandleNewDirtyRanges](state.md#actionhandlenewdirtyranges)
* [ActionNewHoverIdReceived](state.md#actionnewhoveridreceived)
* [ActionRequestComplete](state.md#actionrequestcomplete)
* [ActionRequestError](state.md#actionrequesterror)
* [ActionRequestMatchesForDirtyRanges](state.md#actionrequestmatchesfordirtyranges)
* [ActionRequestMatchesForDocument](state.md#actionrequestmatchesfordocument)
* [ActionRequestMatchesSuccess](state.md#actionrequestmatchessuccess)
* [ActionSelectMatch](state.md#actionselectmatch)
* [ActionSetDebugState](state.md#actionsetdebugstate)
* [ActionSetRequestMatchesOnDocModified](state.md#actionsetrequestmatchesondocmodified)
* [EventNames](state.md#eventnames)
* [STORE_EVENT_NEW_DIRTIED_RANGES](state.md#store_event_new_dirtied_ranges)
* [STORE_EVENT_NEW_MATCHES](state.md#store_event_new_matches)
* [STORE_EVENT_NEW_STATE](state.md#store_event_new_state)
* [TSelectRequestInFlight](state.md#tselectrequestinflight)

### Variables

* [APPLY_NEW_DIRTY_RANGES](state.md#const-apply_new_dirty_ranges)
* [NEW_HOVER_ID](state.md#const-new_hover_id)
* [PROSEMIRROR_TYPERIGHTER_ACTION](state.md#const-prosemirror_typerighter_action)
* [REQUEST_COMPLETE](state.md#const-request_complete)
* [REQUEST_ERROR](state.md#const-request_error)
* [REQUEST_FOR_DIRTY_RANGES](state.md#const-request_for_dirty_ranges)
* [REQUEST_FOR_DOCUMENT](state.md#const-request_for_document)
* [REQUEST_SUCCESS](state.md#const-request_success)
* [SELECT_MATCH](state.md#const-select_match)
* [SET_DEBUG_STATE](state.md#const-set_debug_state)
* [SET_REQUEST_MATCHES_ON_DOC_MODIFIED](state.md#const-set_request_matches_on_doc_modified)
* [STORE_EVENT_NEW_DIRTIED_RANGES](state.md#const-store_event_new_dirtied_ranges)
* [STORE_EVENT_NEW_MATCHES](state.md#const-store_event_new_matches)
* [STORE_EVENT_NEW_STATE](state.md#const-store_event_new_state)

### Functions

* [amendBlockQueriesInFlight](state.md#const-amendblockqueriesinflight)
* [applyNewDirtiedRanges](state.md#const-applynewdirtiedranges)
* [createHandleMatchesRequestForDirtyRanges](state.md#const-createhandlematchesrequestfordirtyranges)
* [createInitialState](state.md#const-createinitialstate)
* [createReducer](state.md#const-createreducer)
* [getNewStateFromTransaction](state.md#const-getnewstatefromtransaction)
* [handleMatchesRequestError](state.md#const-handlematchesrequesterror)
* [handleMatchesRequestForDocument](state.md#const-handlematchesrequestfordocument)
* [handleMatchesRequestSuccess](state.md#const-handlematchesrequestsuccess)
* [handleNewDirtyRanges](state.md#const-handlenewdirtyranges)
* [handleNewHoverId](state.md#const-handlenewhoverid)
* [handleRequestComplete](state.md#const-handlerequestcomplete)
* [handleRequestStart](state.md#const-handlerequeststart)
* [handleSelectMatch](state.md#const-handleselectmatch)
* [handleSetDebugState](state.md#const-handlesetdebugstate)
* [handleSetRequestOnDocModifiedState](state.md#const-handlesetrequestondocmodifiedstate)
* [newHoverIdReceived](state.md#const-newhoveridreceived)
* [requestError](state.md#const-requesterror)
* [requestMatchesComplete](state.md#const-requestmatchescomplete)
* [requestMatchesForDirtyRanges](state.md#const-requestmatchesfordirtyranges)
* [requestMatchesForDocument](state.md#const-requestmatchesfordocument)
* [requestMatchesSuccess](state.md#const-requestmatchessuccess)
* [selectAllAutoFixableMatches](state.md#const-selectallautofixablematches)
* [selectAllBlockQueriesInFlight](state.md#const-selectallblockqueriesinflight)
* [selectBlockQueriesInFlightById](state.md#const-selectblockqueriesinflightbyid)
* [selectBlockQueriesInFlightForSet](state.md#const-selectblockqueriesinflightforset)
* [selectMatch](state.md#const-selectmatch)
* [selectMatchByMatchId](state.md#const-selectmatchbymatchid)
* [selectNewBlockInFlight](state.md#const-selectnewblockinflight)
* [selectPercentRemaining](state.md#const-selectpercentremaining)
* [selectSingleBlockInFlightById](state.md#const-selectsingleblockinflightbyid)
* [selectSuggestionAndRange](state.md#const-selectsuggestionandrange)
* [setDebugState](state.md#const-setdebugstate)
* [setRequestMatchesOnDocModified](state.md#const-setrequestmatchesondocmodified)

## Type aliases

###  Action

Ƭ **Action**: *[ActionNewHoverIdReceived](state.md#actionnewhoveridreceived) | [ActionRequestMatchesSuccess](state.md#actionrequestmatchessuccess)‹TMatch› | [ActionRequestMatchesForDirtyRanges](state.md#actionrequestmatchesfordirtyranges) | [ActionRequestMatchesForDocument](state.md#actionrequestmatchesfordocument) | [ActionRequestError](state.md#actionrequesterror) | [ActionRequestComplete](state.md#actionrequestcomplete) | [ActionSelectMatch](state.md#actionselectmatch) | [ActionHandleNewDirtyRanges](state.md#actionhandlenewdirtyranges) | [ActionSetDebugState](state.md#actionsetdebugstate) | [ActionSetRequestMatchesOnDocModified](state.md#actionsetrequestmatchesondocmodified)*

*Defined in [src/ts/state/actions.ts:113](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L113)*

___

###  ActionHandleNewDirtyRanges

Ƭ **ActionHandleNewDirtyRanges**: *ReturnType‹typeof applyNewDirtiedRanges›*

*Defined in [src/ts/state/actions.ts:87](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L87)*

___

###  ActionNewHoverIdReceived

Ƭ **ActionNewHoverIdReceived**: *ReturnType‹typeof newHoverIdReceived›*

*Defined in [src/ts/state/actions.ts:81](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L81)*

___

###  ActionRequestComplete

Ƭ **ActionRequestComplete**: *ReturnType‹typeof requestMatchesComplete›*

*Defined in [src/ts/state/actions.ts:72](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L72)*

___

###  ActionRequestError

Ƭ **ActionRequestError**: *ReturnType‹typeof requestError›*

*Defined in [src/ts/state/actions.ts:66](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L66)*

___

###  ActionRequestMatchesForDirtyRanges

Ƭ **ActionRequestMatchesForDirtyRanges**: *ReturnType‹typeof requestMatchesForDirtyRanges›*

*Defined in [src/ts/state/actions.ts:35](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L35)*

___

###  ActionRequestMatchesForDocument

Ƭ **ActionRequestMatchesForDocument**: *ReturnType‹typeof requestMatchesForDocument›*

*Defined in [src/ts/state/actions.ts:46](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L46)*

___

###  ActionRequestMatchesSuccess

Ƭ **ActionRequestMatchesSuccess**: *object*

*Defined in [src/ts/state/actions.ts:57](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L57)*

#### Type declaration:

* **payload**(): *object*

  * **response**: *[IMatcherResponse](../interfaces/interfaces.imatcherresponse.md)‹TMatch›*

* **type**: *"REQUEST_SUCCESS"*

___

###  ActionSelectMatch

Ƭ **ActionSelectMatch**: *ReturnType‹typeof selectMatch›*

*Defined in [src/ts/state/actions.ts:95](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L95)*

___

###  ActionSetDebugState

Ƭ **ActionSetDebugState**: *ReturnType‹typeof setDebugState›*

*Defined in [src/ts/state/actions.ts:101](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L101)*

___

###  ActionSetRequestMatchesOnDocModified

Ƭ **ActionSetRequestMatchesOnDocModified**: *ReturnType‹typeof setRequestMatchesOnDocModified›*

*Defined in [src/ts/state/actions.ts:109](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L109)*

___

###  EventNames

Ƭ **EventNames**: *keyof IStoreEvents<IMatch>*

*Defined in [src/ts/state/store.ts:22](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L22)*

___

###  STORE_EVENT_NEW_DIRTIED_RANGES

Ƭ **STORE_EVENT_NEW_DIRTIED_RANGES**: *typeof STORE_EVENT_NEW_DIRTIED_RANGES*

*Defined in [src/ts/state/store.ts:11](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L11)*

___

###  STORE_EVENT_NEW_MATCHES

Ƭ **STORE_EVENT_NEW_MATCHES**: *typeof STORE_EVENT_NEW_MATCHES*

*Defined in [src/ts/state/store.ts:9](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L9)*

___

###  STORE_EVENT_NEW_STATE

Ƭ **STORE_EVENT_NEW_STATE**: *typeof STORE_EVENT_NEW_STATE*

*Defined in [src/ts/state/store.ts:10](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L10)*

___

###  TSelectRequestInFlight

Ƭ **TSelectRequestInFlight**: *Array‹[IBlocksInFlightState](../interfaces/state.iblocksinflightstate.md) & object›*

*Defined in [src/ts/state/selectors.ts:59](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/selectors.ts#L59)*

## Variables

### `Const` APPLY_NEW_DIRTY_RANGES

• **APPLY_NEW_DIRTY_RANGES**: *"HANDLE_NEW_DIRTY_RANGES"* = "HANDLE_NEW_DIRTY_RANGES" as const

*Defined in [src/ts/state/actions.ts:20](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L20)*

___

### `Const` NEW_HOVER_ID

• **NEW_HOVER_ID**: *"NEW_HOVER_ID"* = "NEW_HOVER_ID" as const

*Defined in [src/ts/state/actions.ts:18](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L18)*

___

### `Const` PROSEMIRROR_TYPERIGHTER_ACTION

• **PROSEMIRROR_TYPERIGHTER_ACTION**: *"PROSEMIRROR_TYPERIGHTER_ACTION"* = "PROSEMIRROR_TYPERIGHTER_ACTION"

*Defined in [src/ts/state/reducer.ts:130](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L130)*

___

### `Const` REQUEST_COMPLETE

• **REQUEST_COMPLETE**: *"REQUEST_COMPLETE"* = "REQUEST_COMPLETE" as const

*Defined in [src/ts/state/actions.ts:17](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L17)*

___

### `Const` REQUEST_ERROR

• **REQUEST_ERROR**: *"REQUEST_ERROR"* = "REQUEST_ERROR" as const

*Defined in [src/ts/state/actions.ts:16](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L16)*

___

### `Const` REQUEST_FOR_DIRTY_RANGES

• **REQUEST_FOR_DIRTY_RANGES**: *"REQUEST_START"* = "REQUEST_START" as const

*Defined in [src/ts/state/actions.ts:13](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L13)*

Action types.

___

### `Const` REQUEST_FOR_DOCUMENT

• **REQUEST_FOR_DOCUMENT**: *"REQUEST_FOR_DOCUMENT"* = "REQUEST_FOR_DOCUMENT" as const

*Defined in [src/ts/state/actions.ts:14](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L14)*

___

### `Const` REQUEST_SUCCESS

• **REQUEST_SUCCESS**: *"REQUEST_SUCCESS"* = "REQUEST_SUCCESS" as const

*Defined in [src/ts/state/actions.ts:15](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L15)*

___

### `Const` SELECT_MATCH

• **SELECT_MATCH**: *"SELECT_MATCH"* = "SELECT_MATCH" as const

*Defined in [src/ts/state/actions.ts:19](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L19)*

___

### `Const` SET_DEBUG_STATE

• **SET_DEBUG_STATE**: *"SET_DEBUG_STATE"* = "SET_DEBUG_STATE" as const

*Defined in [src/ts/state/actions.ts:21](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L21)*

___

### `Const` SET_REQUEST_MATCHES_ON_DOC_MODIFIED

• **SET_REQUEST_MATCHES_ON_DOC_MODIFIED**: *"SET_REQUEST_MATCHES_ON_DOC_MODIFIED"* = "SET_REQUEST_MATCHES_ON_DOC_MODIFIED" as const

*Defined in [src/ts/state/actions.ts:22](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L22)*

___

### `Const` STORE_EVENT_NEW_DIRTIED_RANGES

• **STORE_EVENT_NEW_DIRTIED_RANGES**: *"STORE_EVENT_DOCUMENT_DIRTIED"* = "STORE_EVENT_DOCUMENT_DIRTIED"

*Defined in [src/ts/state/store.ts:7](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L7)*

___

### `Const` STORE_EVENT_NEW_MATCHES

• **STORE_EVENT_NEW_MATCHES**: *"STORE_EVENT_NEW_MATCHES"* = "STORE_EVENT_NEW_MATCHES"

*Defined in [src/ts/state/store.ts:5](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L5)*

___

### `Const` STORE_EVENT_NEW_STATE

• **STORE_EVENT_NEW_STATE**: *"STORE_EVENT_NEW_STATE"* = "STORE_EVENT_NEW_STATE"

*Defined in [src/ts/state/store.ts:6](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L6)*

## Functions

### `Const` amendBlockQueriesInFlight

▸ **amendBlockQueriesInFlight**‹**TMatch**›(`state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `requestId`: string, `blockId`: string, `categoryIds`: string[]): *object*

*Defined in [src/ts/state/reducer.ts:406](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L406)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`state` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |
`requestId` | string |
`blockId` | string |
`categoryIds` | string[] |

**Returns:** *object*

* \[ **requestId**: *string*\]: [IBlocksInFlightState](../interfaces/state.iblocksinflightstate.md)

___

### `Const` applyNewDirtiedRanges

▸ **applyNewDirtiedRanges**(`ranges`: [IRange](../interfaces/interfaces.irange.md)[]): *object*

*Defined in [src/ts/state/actions.ts:83](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`ranges` | [IRange](../interfaces/interfaces.irange.md)[] |

**Returns:** *object*

* **type**: *"HANDLE_NEW_DIRTY_RANGES"* = APPLY_NEW_DIRTY_RANGES

* ### **payload**: *object*

  * **ranges**: *[IRange](../interfaces/interfaces.irange.md)[]*

___

### `Const` createHandleMatchesRequestForDirtyRanges

▸ **createHandleMatchesRequestForDirtyRanges**(`expandRanges`: [ExpandRanges](reflection-1526.reflection-617.md#expandranges)): *(Anonymous function)*

*Defined in [src/ts/state/reducer.ts:333](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L333)*

Handle a matches request for the current set of dirty ranges.

**Parameters:**

Name | Type |
------ | ------ |
`expandRanges` | [ExpandRanges](reflection-1526.reflection-617.md#expandranges) |

**Returns:** *(Anonymous function)*

___

### `Const` createInitialState

▸ **createInitialState**‹**TMatch**›(`doc`: Node, `matches`: TMatch[]): *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

*Defined in [src/ts/state/reducer.ts:135](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L135)*

Initial state.

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`doc` | Node | - |
`matches` | TMatch[] | [] |

**Returns:** *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

___

### `Const` createReducer

▸ **createReducer**(`expandRanges`: [ExpandRanges](reflection-1526.reflection-617.md#expandranges)): *(Anonymous function)*

*Defined in [src/ts/state/reducer.ts:152](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L152)*

**Parameters:**

Name | Type |
------ | ------ |
`expandRanges` | [ExpandRanges](reflection-1526.reflection-617.md#expandranges) |

**Returns:** *(Anonymous function)*

___

### `Const` getNewStateFromTransaction

▸ **getNewStateFromTransaction**‹**TMatch**›(`tr`: Transaction, `incomingState`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›): *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

*Defined in [src/ts/state/reducer.ts:203](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L203)*

Get a new plugin state from the incoming transaction.

We need to respond to each transaction in our reducer, whether or not there's
an action present, in order to maintain mappings and respond to user input.

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`tr` | Transaction |
`incomingState` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |

**Returns:** *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

___

### `Const` handleMatchesRequestError

▸ **handleMatchesRequestError**‹**TMatch**›(`tr`: Transaction, `state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `__namedParameters`: object): *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› | object*

*Defined in [src/ts/state/reducer.ts:539](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L539)*

Handle a matches request error.

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

▪ **tr**: *Transaction*

▪ **state**: *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`payload` | object |

**Returns:** *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› | object*

___

### `Const` handleMatchesRequestForDocument

▸ **handleMatchesRequestForDocument**‹**TMatch**›(`tr`: Transaction, `state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `__namedParameters`: object): *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

*Defined in [src/ts/state/reducer.ts:350](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L350)*

Handle a matches request for the entire document.

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

▪ **tr**: *Transaction*

▪ **state**: *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`payload` | object |

**Returns:** *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

___

### `Const` handleMatchesRequestSuccess

▸ **handleMatchesRequestSuccess**‹**TMatch**›(`tr`: Transaction, `state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `__namedParameters`: object): *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

*Defined in [src/ts/state/reducer.ts:452](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L452)*

Handle a response, decorating the document with any matches we've received.

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

▪ **tr**: *Transaction*

▪ **state**: *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`payload` | object |

**Returns:** *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

___

### `Const` handleNewDirtyRanges

▸ **handleNewDirtyRanges**‹**TMatch**›(`tr`: Transaction, `state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `__namedParameters`: object): *object*

*Defined in [src/ts/state/reducer.ts:297](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L297)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

▪ **tr**: *Transaction*

▪ **state**: *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`payload` | object |

**Returns:** *object*

* **currentMatches**: *TMatch[]*

* **decorations**: *DecorationSet‹any›* = newDecorations

* **dirtiedRanges**: *[IRange](../interfaces/interfaces.irange.md)[]* = state.requestMatchesOnDocModified
      ? state.dirtiedRanges.concat(dirtiedRanges)
      : []

* **requestPending**: *boolean* = state.requestMatchesOnDocModified ? true : false

___

### `Const` handleNewHoverId

▸ **handleNewHoverId**‹**TMatch**›(`tr`: Transaction, `state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `action`: [ActionNewHoverIdReceived](state.md#actionnewhoveridreceived)): *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

*Defined in [src/ts/state/reducer.ts:253](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L253)*

Handle the receipt of a new hover id.

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`tr` | Transaction |
`state` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |
`action` | [ActionNewHoverIdReceived](state.md#actionnewhoveridreceived) |

**Returns:** *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

___

### `Const` handleRequestComplete

▸ **handleRequestComplete**‹**TMatch**›(`_`: Transaction, `state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `__namedParameters`: object): *object*

*Defined in [src/ts/state/reducer.ts:607](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L607)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

▪ **_**: *Transaction*

▪ **state**: *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`payload` | object |

**Returns:** *object*

* **requestsInFlight**(): *object*

___

### `Const` handleRequestStart

▸ **handleRequestStart**(`requestId`: string, `blocks`: [IBlock](../interfaces/interfaces.iblock.md)[], `categoryIds`: string[]): *(Anonymous function)*

*Defined in [src/ts/state/reducer.ts:365](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L365)*

Handle a matches request for a given set of blocks.

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`blocks` | [IBlock](../interfaces/interfaces.iblock.md)[] |
`categoryIds` | string[] |

**Returns:** *(Anonymous function)*

___

### `Const` handleSelectMatch

▸ **handleSelectMatch**‹**TMatch**›(`_`: unknown, `state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `action`: [ActionSelectMatch](state.md#actionselectmatch)): *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

*Defined in [src/ts/state/reducer.ts:239](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L239)*

Handle the selection of a hover id.

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`_` | unknown |
`state` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |
`action` | [ActionSelectMatch](state.md#actionselectmatch) |

**Returns:** *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

___

### `Const` handleSetDebugState

▸ **handleSetDebugState**‹**TMatch**›(`_`: Transaction, `state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `__namedParameters`: object): *object*

*Defined in [src/ts/state/reducer.ts:631](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L631)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

▪ **_**: *Transaction*

▪ **state**: *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`payload` | object |

**Returns:** *object*

* **debug**: *boolean*

___

### `Const` handleSetRequestOnDocModifiedState

▸ **handleSetRequestOnDocModifiedState**‹**TMatch**›(`_`: Transaction, `state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `__namedParameters`: object): *object*

*Defined in [src/ts/state/reducer.ts:642](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L642)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

▪ **_**: *Transaction*

▪ **state**: *[IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`payload` | object |

**Returns:** *object*

* **requestMatchesOnDocModified**: *boolean*

___

### `Const` newHoverIdReceived

▸ **newHoverIdReceived**(`matchId`: string | undefined, `hoverInfo?`: [IStateHoverInfo](../interfaces/state.istatehoverinfo.md) | undefined): *object*

*Defined in [src/ts/state/actions.ts:74](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`matchId` | string &#124; undefined |
`hoverInfo?` | [IStateHoverInfo](../interfaces/state.istatehoverinfo.md) &#124; undefined |

**Returns:** *object*

* **type**: *"NEW_HOVER_ID"* = NEW_HOVER_ID

* ### **payload**: *object*

  * **hoverInfo**: *undefined | [IStateHoverInfo](../interfaces/state.istatehoverinfo.md)*

  * **matchId**: *undefined | string*

___

### `Const` requestError

▸ **requestError**(`matchRequestError`: [IMatchRequestError](../interfaces/interfaces.imatchrequesterror.md)): *object*

*Defined in [src/ts/state/actions.ts:62](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`matchRequestError` | [IMatchRequestError](../interfaces/interfaces.imatchrequesterror.md) |

**Returns:** *object*

* **type**: *"REQUEST_ERROR"* = REQUEST_ERROR

* ### **payload**: *object*

  * **matchRequestError**: *[IMatchRequestError](../interfaces/interfaces.imatchrequesterror.md)*

___

### `Const` requestMatchesComplete

▸ **requestMatchesComplete**(`requestId`: string): *object*

*Defined in [src/ts/state/actions.ts:68](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |

**Returns:** *object*

* **type**: *"REQUEST_COMPLETE"* = REQUEST_COMPLETE

* ### **payload**: *object*

  * **requestId**: *string*

___

### `Const` requestMatchesForDirtyRanges

▸ **requestMatchesForDirtyRanges**(`requestId`: string, `categoryIds`: string[]): *object*

*Defined in [src/ts/state/actions.ts:28](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L28)*

Action creators.

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`categoryIds` | string[] |

**Returns:** *object*

* **type**: *"REQUEST_START"* = REQUEST_FOR_DIRTY_RANGES

* ### **payload**: *object*

  * **categoryIds**: *string[]*

  * **requestId**: *string*

___

### `Const` requestMatchesForDocument

▸ **requestMatchesForDocument**(`requestId`: string, `categoryIds`: string[]): *object*

*Defined in [src/ts/state/actions.ts:39](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`categoryIds` | string[] |

**Returns:** *object*

* **type**: *"REQUEST_FOR_DOCUMENT"* = REQUEST_FOR_DOCUMENT

* ### **payload**: *object*

  * **categoryIds**: *string[]*

  * **requestId**: *string*

___

### `Const` requestMatchesSuccess

▸ **requestMatchesSuccess**‹**TBlockMatches**›(`response`: [IMatcherResponse](../interfaces/interfaces.imatcherresponse.md)‹TBlockMatches›): *object*

*Defined in [src/ts/state/actions.ts:50](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L50)*

**Type parameters:**

▪ **TBlockMatches**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`response` | [IMatcherResponse](../interfaces/interfaces.imatcherresponse.md)‹TBlockMatches› |

**Returns:** *object*

* **type**: *"REQUEST_SUCCESS"* = REQUEST_SUCCESS

* ### **payload**: *object*

  * **response**: *[IMatcherResponse](../interfaces/interfaces.imatcherresponse.md)‹TBlockMatches›*

___

### `Const` selectAllAutoFixableMatches

▸ **selectAllAutoFixableMatches**‹**TMatch**›(`state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›): *TMatch[]*

*Defined in [src/ts/state/selectors.ts:119](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/selectors.ts#L119)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`state` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |

**Returns:** *TMatch[]*

___

### `Const` selectAllBlockQueriesInFlight

▸ **selectAllBlockQueriesInFlight**‹**TMatch**›(`state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›): *[IBlockInFlight](../interfaces/state.iblockinflight.md)[]*

*Defined in [src/ts/state/selectors.ts:51](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/selectors.ts#L51)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`state` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |

**Returns:** *[IBlockInFlight](../interfaces/state.iblockinflight.md)[]*

___

### `Const` selectBlockQueriesInFlightById

▸ **selectBlockQueriesInFlightById**‹**TMatch**›(`state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `requestId`: string, `blockIds`: string[]): *[IBlockInFlight](../interfaces/state.iblockinflight.md)[]*

*Defined in [src/ts/state/selectors.ts:40](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/selectors.ts#L40)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`state` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |
`requestId` | string |
`blockIds` | string[] |

**Returns:** *[IBlockInFlight](../interfaces/state.iblockinflight.md)[]*

___

### `Const` selectBlockQueriesInFlightForSet

▸ **selectBlockQueriesInFlightForSet**‹**TMatch**›(`state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `requestId`: string): *[IBlocksInFlightState](../interfaces/state.iblocksinflightstate.md) | undefined*

*Defined in [src/ts/state/selectors.ts:14](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/selectors.ts#L14)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`state` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |
`requestId` | string |

**Returns:** *[IBlocksInFlightState](../interfaces/state.iblocksinflightstate.md) | undefined*

___

### `Const` selectMatch

▸ **selectMatch**(`matchId`: string): *object*

*Defined in [src/ts/state/actions.ts:91](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L91)*

**Parameters:**

Name | Type |
------ | ------ |
`matchId` | string |

**Returns:** *object*

* **type**: *"SELECT_MATCH"* = SELECT_MATCH

* ### **payload**: *object*

  * **matchId**: *string*

___

### `Const` selectMatchByMatchId

▸ **selectMatchByMatchId**‹**TMatch**›(`state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `matchId`: string): *[IMatch](../interfaces/interfaces.imatch.md) | undefined*

*Defined in [src/ts/state/selectors.ts:8](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/selectors.ts#L8)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`state` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |
`matchId` | string |

**Returns:** *[IMatch](../interfaces/interfaces.imatch.md) | undefined*

___

### `Const` selectNewBlockInFlight

▸ **selectNewBlockInFlight**‹**TMatch**›(`oldState`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `newState`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›): *[TSelectRequestInFlight](state.md#tselectrequestinflight)*

*Defined in [src/ts/state/selectors.ts:65](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/selectors.ts#L65)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`oldState` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |
`newState` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |

**Returns:** *[TSelectRequestInFlight](state.md#tselectrequestinflight)*

___

### `Const` selectPercentRemaining

▸ **selectPercentRemaining**‹**TMatch**›(`state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›): *number*

*Defined in [src/ts/state/selectors.ts:80](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/selectors.ts#L80)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`state` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |

**Returns:** *number*

___

### `Const` selectSingleBlockInFlightById

▸ **selectSingleBlockInFlightById**‹**TMatch**›(`state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `requestId`: string, `blockId`: string): *[IBlockInFlight](../interfaces/state.iblockinflight.md) | undefined*

*Defined in [src/ts/state/selectors.ts:23](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/selectors.ts#L23)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`state` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |
`requestId` | string |
`blockId` | string |

**Returns:** *[IBlockInFlight](../interfaces/state.iblockinflight.md) | undefined*

___

### `Const` selectSuggestionAndRange

▸ **selectSuggestionAndRange**‹**TMatch**›(`state`: [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›, `matchId`: string, `suggestionIndex`: number): *null | object*

*Defined in [src/ts/state/selectors.ts:99](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/selectors.ts#L99)*

**Type parameters:**

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

**Parameters:**

Name | Type |
------ | ------ |
`state` | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch› |
`matchId` | string |
`suggestionIndex` | number |

**Returns:** *null | object*

___

### `Const` setDebugState

▸ **setDebugState**(`debug`: boolean): *object*

*Defined in [src/ts/state/actions.ts:97](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`debug` | boolean |

**Returns:** *object*

* **type**: *"SET_DEBUG_STATE"* = SET_DEBUG_STATE

* ### **payload**: *object*

  * **debug**: *boolean*

___

### `Const` setRequestMatchesOnDocModified

▸ **setRequestMatchesOnDocModified**(`requestMatchesOnDocModified`: boolean): *object*

*Defined in [src/ts/state/actions.ts:103](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/actions.ts#L103)*

**Parameters:**

Name | Type |
------ | ------ |
`requestMatchesOnDocModified` | boolean |

**Returns:** *object*

* **type**: *"SET_REQUEST_MATCHES_ON_DOC_MODIFIED"* = SET_REQUEST_MATCHES_ON_DOC_MODIFIED

* ### **payload**: *object*

  * **requestMatchesOnDocModified**: *boolean*
