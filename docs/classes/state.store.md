[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [state](../modules/state.md) › [Store](state.store.md)

# Class: Store ‹**TMatch, TStoreEvents**›

A store to allow consumers to subscribe to state updates.

## Type parameters

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

▪ **TStoreEvents**: *[IStoreEvents](../interfaces/state.istoreevents.md)‹TMatch›*

## Hierarchy

* **Store**

## Index

### Constructors

* [constructor](state.store.md#constructor)

### Methods

* [emit](state.store.md#emit)
* [getState](state.store.md#getstate)
* [on](state.store.md#on)
* [removeEventListener](state.store.md#removeeventlistener)

## Constructors

###  constructor

\+ **new Store**(): *[Store](state.store.md)*

*Defined in [src/ts/state/store.ts:40](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L40)*

**Returns:** *[Store](state.store.md)*

## Methods

###  emit

▸ **emit**‹**EventName**›(`eventName`: EventName, ...`args`: [ArgumentTypes](../modules/utils.md#argumenttypes)‹TStoreEvents[EventName]›): *void*

*Defined in [src/ts/state/store.ts:49](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L49)*

Notify our subscribers of a state change.

**Type parameters:**

▪ **EventName**: *[EventNames](../modules/state.md#eventnames)*

**Parameters:**

Name | Type |
------ | ------ |
`eventName` | EventName |
`...args` | [ArgumentTypes](../modules/utils.md#argumenttypes)‹TStoreEvents[EventName]› |

**Returns:** *void*

___

###  getState

▸ **getState**(): *undefined | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

*Defined in [src/ts/state/store.ts:91](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L91)*

Get the current plugin state.

**Returns:** *undefined | [IPluginState](../interfaces/state.ipluginstate.md)‹TMatch›*

___

###  on

▸ **on**‹**EventName**›(`eventName`: EventName, `listener`: function): *void*

*Defined in [src/ts/state/store.ts:79](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L79)*

Subscribe to a store event.

**Type parameters:**

▪ **EventName**: *[EventNames](../modules/state.md#eventnames)*

**Parameters:**

▪ **eventName**: *EventName*

▪ **listener**: *function*

▸ (...`args`: [ArgumentTypes](../modules/utils.md#argumenttypes)‹TStoreEvents[EventName]›): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | [ArgumentTypes](../modules/utils.md#argumenttypes)‹TStoreEvents[EventName]› |

**Returns:** *void*

___

###  removeEventListener

▸ **removeEventListener**‹**EventName**›(`eventName`: EventName, `listener`: TStoreEvents[EventName]): *void*

*Defined in [src/ts/state/store.ts:61](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L61)*

Unsubscribe to a store event.

**Type parameters:**

▪ **EventName**: *[EventNames](../modules/state.md#eventnames)*

**Parameters:**

Name | Type |
------ | ------ |
`eventName` | EventName |
`listener` | TStoreEvents[EventName] |

**Returns:** *void*
