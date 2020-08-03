[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [TyperighterAdapter](typerighteradapter.md)

# Class: TyperighterAdapter

An adapter for the Typerighter service.

## Hierarchy

* **TyperighterAdapter**

## Implements

* IMatcherAdapter

## Index

### Constructors

* [constructor](typerighteradapter.md#constructor)

### Methods

* [fetchCategories](typerighteradapter.md#fetchcategories)
* [fetchMatches](typerighteradapter.md#fetchmatches)

## Constructors

###  constructor

\+ **new TyperighterAdapter**(`url`: string, `responseThrottleMs`: number): *[TyperighterAdapter](typerighteradapter.md)*

*Defined in [services/adapters/TyperighterAdapter.ts:37](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/services/adapters/TyperighterAdapter.ts#L37)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`url` | string | - |
`responseThrottleMs` | number | 250 |

**Returns:** *[TyperighterAdapter](typerighteradapter.md)*

## Methods

###  fetchCategories

▸ **fetchCategories**(): *Promise‹any›*

*Defined in [services/adapters/TyperighterAdapter.ts:82](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/services/adapters/TyperighterAdapter.ts#L82)*

**Returns:** *Promise‹any›*

___

###  fetchMatches

▸ **fetchMatches**(`requestId`: string, `inputs`: IBlock[], `categoryIds`: string[], `onMatchesReceived`: TMatchesReceivedCallback, `onRequestError`: TRequestErrorCallback, `_`: TRequestCompleteCallback): *Promise‹void›*

*Defined in [services/adapters/TyperighterAdapter.ts:42](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/services/adapters/TyperighterAdapter.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`inputs` | IBlock[] |
`categoryIds` | string[] |
`onMatchesReceived` | TMatchesReceivedCallback |
`onRequestError` | TRequestErrorCallback |
`_` | TRequestCompleteCallback |

**Returns:** *Promise‹void›*
