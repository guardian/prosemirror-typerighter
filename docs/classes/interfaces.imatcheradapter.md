[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [interfaces](../modules/interfaces.md) › [IMatcherAdapter](interfaces.imatcheradapter.md)

# Class: IMatcherAdapter ‹**TMatch**›

## Type parameters

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

## Hierarchy

* **IMatcherAdapter**

## Implemented by

* [TyperighterAdapter](services_adapters.typerighteradapter.md)

## Index

### Constructors

* [constructor](interfaces.imatcheradapter.md#constructor)

### Properties

* [fetchCategories](interfaces.imatcheradapter.md#fetchcategories)
* [fetchMatches](interfaces.imatcheradapter.md#fetchmatches)

## Constructors

###  constructor

\+ **new IMatcherAdapter**(`apiUrl`: string): *[IMatcherAdapter](interfaces.imatcheradapter.md)*

*Defined in [src/ts/interfaces/IMatcherAdapter.ts:30](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/interfaces/IMatcherAdapter.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`apiUrl` | string |

**Returns:** *[IMatcherAdapter](interfaces.imatcheradapter.md)*

## Properties

###  fetchCategories

• **fetchCategories**: *function*

*Defined in [src/ts/interfaces/IMatcherAdapter.ts:30](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/interfaces/IMatcherAdapter.ts#L30)*

Fetch the currently available matcher categories.

#### Type declaration:

▸ (): *Promise‹[ICategory](../interfaces/interfaces.icategory.md)[]›*

___

###  fetchMatches

• **fetchMatches**: *function*

*Defined in [src/ts/interfaces/IMatcherAdapter.ts:18](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/interfaces/IMatcherAdapter.ts#L18)*

Fetch the matches for the given inputs.

#### Type declaration:

▸ (`requestId`: string, `input`: [IBlock](../interfaces/interfaces.iblock.md)[], `categoryIds`: string[], `onMatchesReceived`: [TMatchesReceivedCallback](../modules/interfaces.md#tmatchesreceivedcallback)‹TMatch›, `onRequestError`: [TRequestErrorCallback](../modules/interfaces.md#trequesterrorcallback), `onRequestComplete`: [TRequestCompleteCallback](../modules/interfaces.md#trequestcompletecallback)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`input` | [IBlock](../interfaces/interfaces.iblock.md)[] |
`categoryIds` | string[] |
`onMatchesReceived` | [TMatchesReceivedCallback](../modules/interfaces.md#tmatchesreceivedcallback)‹TMatch› |
`onRequestError` | [TRequestErrorCallback](../modules/interfaces.md#trequesterrorcallback) |
`onRequestComplete` | [TRequestCompleteCallback](../modules/interfaces.md#trequestcompletecallback) |
