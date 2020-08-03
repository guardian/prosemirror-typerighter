[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [services/adapters](../modules/services_adapters.md) › [TyperighterAdapter](services_adapters.typerighteradapter.md)

# Class: TyperighterAdapter

An adapter for the Typerighter service.

## Hierarchy

* **TyperighterAdapter**

## Implements

* [IMatcherAdapter](interfaces.imatcheradapter.md)

## Index

### Constructors

* [constructor](services_adapters.typerighteradapter.md#constructor)

### Methods

* [fetchCategories](services_adapters.typerighteradapter.md#fetchcategories)
* [fetchMatches](services_adapters.typerighteradapter.md#fetchmatches)

## Constructors

###  constructor

\+ **new TyperighterAdapter**(`url`: string, `responseThrottleMs`: number): *[TyperighterAdapter](services_adapters.typerighteradapter.md)*

*Defined in [src/ts/services/adapters/TyperighterAdapter.ts:37](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/services/adapters/TyperighterAdapter.ts#L37)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`url` | string | - |
`responseThrottleMs` | number | 250 |

**Returns:** *[TyperighterAdapter](services_adapters.typerighteradapter.md)*

## Methods

###  fetchCategories

▸ **fetchCategories**(): *Promise‹any›*

*Defined in [src/ts/services/adapters/TyperighterAdapter.ts:82](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/services/adapters/TyperighterAdapter.ts#L82)*

**Returns:** *Promise‹any›*

___

###  fetchMatches

▸ **fetchMatches**(`requestId`: string, `inputs`: [IBlock](../interfaces/interfaces.iblock.md)[], `categoryIds`: string[], `onMatchesReceived`: [TMatchesReceivedCallback](../modules/interfaces.md#tmatchesreceivedcallback), `onRequestError`: [TRequestErrorCallback](../modules/interfaces.md#trequesterrorcallback), `_`: [TRequestCompleteCallback](../modules/interfaces.md#trequestcompletecallback)): *Promise‹void›*

*Defined in [src/ts/services/adapters/TyperighterAdapter.ts:42](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/services/adapters/TyperighterAdapter.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`inputs` | [IBlock](../interfaces/interfaces.iblock.md)[] |
`categoryIds` | string[] |
`onMatchesReceived` | [TMatchesReceivedCallback](../modules/interfaces.md#tmatchesreceivedcallback) |
`onRequestError` | [TRequestErrorCallback](../modules/interfaces.md#trequesterrorcallback) |
`_` | [TRequestCompleteCallback](../modules/interfaces.md#trequestcompletecallback) |

**Returns:** *Promise‹void›*
