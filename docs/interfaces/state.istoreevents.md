[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [state](../modules/state.md) › [IStoreEvents](state.istoreevents.md)

# Interface: IStoreEvents ‹**TMatch**›

## Type parameters

▪ **TMatch**: *[IMatch](interfaces.imatch.md)*

## Hierarchy

* **IStoreEvents**

## Index

### Properties

* [[STORE_EVENT_NEW_DIRTIED_RANGES]](state.istoreevents.md#[store_event_new_dirtied_ranges])
* [[STORE_EVENT_NEW_MATCHES]](state.istoreevents.md#[store_event_new_matches])
* [[STORE_EVENT_NEW_STATE]](state.istoreevents.md#[store_event_new_state])

## Properties

###  [STORE_EVENT_NEW_DIRTIED_RANGES]

• **[STORE_EVENT_NEW_DIRTIED_RANGES]**: *function*

*Defined in [src/ts/state/store.ts:19](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L19)*

#### Type declaration:

▸ (): *void*

___

###  [STORE_EVENT_NEW_MATCHES]

• **[STORE_EVENT_NEW_MATCHES]**: *function*

*Defined in [src/ts/state/store.ts:14](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L14)*

#### Type declaration:

▸ (`requestId`: string, `blocks`: [IBlock](interfaces.iblock.md)[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`blocks` | [IBlock](interfaces.iblock.md)[] |

___

###  [STORE_EVENT_NEW_STATE]

• **[STORE_EVENT_NEW_STATE]**: *function*

*Defined in [src/ts/state/store.ts:18](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/store.ts#L18)*

#### Type declaration:

▸ (`state`: [IPluginState](state.ipluginstate.md)‹TMatch›): *void*

**Parameters:**

Name | Type |
------ | ------ |
`state` | [IPluginState](state.ipluginstate.md)‹TMatch› |
