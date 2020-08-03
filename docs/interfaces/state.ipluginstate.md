[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [state](../modules/state.md) › [IPluginState](state.ipluginstate.md)

# Interface: IPluginState ‹**TMatches**›

## Type parameters

▪ **TMatches**: *[IMatch](interfaces.imatch.md)*

## Hierarchy

* **IPluginState**

## Index

### Properties

* [currentMatches](state.ipluginstate.md#currentmatches)
* [debug](state.ipluginstate.md#debug)
* [decorations](state.ipluginstate.md#decorations)
* [dirtiedRanges](state.ipluginstate.md#dirtiedranges)
* [error](state.ipluginstate.md#error)
* [hoverId](state.ipluginstate.md#hoverid)
* [hoverInfo](state.ipluginstate.md#hoverinfo)
* [requestMatchesOnDocModified](state.ipluginstate.md#requestmatchesondocmodified)
* [requestPending](state.ipluginstate.md#requestpending)
* [requestsInFlight](state.ipluginstate.md#requestsinflight)
* [selectedMatch](state.ipluginstate.md#selectedmatch)

## Properties

###  currentMatches

• **currentMatches**: *TMatches[]*

*Defined in [src/ts/state/reducer.ts:107](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L107)*

___

###  debug

• **debug**: *boolean*

*Defined in [src/ts/state/reducer.ts:101](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L101)*

___

###  decorations

• **decorations**: *DecorationSet*

*Defined in [src/ts/state/reducer.ts:105](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L105)*

___

###  dirtiedRanges

• **dirtiedRanges**: *[IRange](interfaces.irange.md)[]*

*Defined in [src/ts/state/reducer.ts:110](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L110)*

___

###  error

• **error**: *string | undefined*

*Defined in [src/ts/state/reducer.ts:126](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L126)*

___

###  hoverId

• **hoverId**: *string | undefined*

*Defined in [src/ts/state/reducer.ts:114](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L114)*

___

###  hoverInfo

• **hoverInfo**: *[IStateHoverInfo](state.istatehoverinfo.md) | undefined*

*Defined in [src/ts/state/reducer.ts:116](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L116)*

___

###  requestMatchesOnDocModified

• **requestMatchesOnDocModified**: *boolean*

*Defined in [src/ts/state/reducer.ts:103](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L103)*

___

###  requestPending

• **requestPending**: *boolean*

*Defined in [src/ts/state/reducer.ts:119](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L119)*

___

###  requestsInFlight

• **requestsInFlight**: *object*

*Defined in [src/ts/state/reducer.ts:122](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L122)*

#### Type declaration:

* \[ **requestId**: *string*\]: [IBlocksInFlightState](state.iblocksinflightstate.md)

___

###  selectedMatch

• **selectedMatch**: *string | undefined*

*Defined in [src/ts/state/reducer.ts:112](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/state/reducer.ts#L112)*
