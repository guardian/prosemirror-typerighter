[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [TyperighterAdapter](typerighteradapter.md)

# Class: TyperighterAdapter

A MatcherAdapter for the Typerighter remote service.

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

*Defined in [services/adapters/TyperighterAdapter.ts:41](https://github.com/guardian/prosemirror-typerighter/blob/a7df8ef/src/ts/services/adapters/TyperighterAdapter.ts#L41)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`url` | string | - |
`responseThrottleMs` | number | 250 |

**Returns:** *[TyperighterAdapter](typerighteradapter.md)*

## Methods

###  fetchCategories

▸ **fetchCategories**(): *Promise‹any›*

*Defined in [services/adapters/TyperighterAdapter.ts:86](https://github.com/guardian/prosemirror-typerighter/blob/a7df8ef/src/ts/services/adapters/TyperighterAdapter.ts#L86)*

**Returns:** *Promise‹any›*

___

###  fetchMatches

▸ **fetchMatches**(`requestId`: string, `inputs`: IBlock[], `categoryIds`: string[], `onMatchesReceived`: TMatchesReceivedCallback, `onRequestError`: TRequestErrorCallback, `_`: TRequestCompleteCallback): *Promise‹void›*

*Defined in [services/adapters/TyperighterAdapter.ts:46](https://github.com/guardian/prosemirror-typerighter/blob/a7df8ef/src/ts/services/adapters/TyperighterAdapter.ts#L46)*

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
