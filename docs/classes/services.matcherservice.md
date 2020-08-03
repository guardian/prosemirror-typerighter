[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [services](../modules/services.md) › [MatcherService](services.matcherservice.md)

# Class: MatcherService ‹**TMatch**›

An example matcher service. Calls to fetchMatches() submit blocks
for processing via the supplied adapter. Matches and errors dispatch
the appropriate Prosemirror commands.

## Type parameters

▪ **TMatch**: *[IMatch](../interfaces/interfaces.imatch.md)*

## Hierarchy

* **MatcherService**

## Index

### Constructors

* [constructor](services.matcherservice.md#constructor)

### Methods

* [addCategory](services.matcherservice.md#addcategory)
* [fetchCategories](services.matcherservice.md#fetchcategories)
* [fetchMatches](services.matcherservice.md#fetchmatches)
* [getCurrentCategories](services.matcherservice.md#getcurrentcategories)
* [removeCategory](services.matcherservice.md#removecategory)
* [requestFetchMatches](services.matcherservice.md#requestfetchmatches)

## Constructors

###  constructor

\+ **new MatcherService**(`store`: [Store](state.store.md)‹TMatch›, `commands`: [Commands](../modules/reflection-1526.reflection-617.md#commands), `adapter`: [IMatcherAdapter](interfaces.imatcheradapter.md)‹TMatch›, `initialThrottle`: number): *[MatcherService](services.matcherservice.md)*

*Defined in [src/ts/services/MatcherService.ts:21](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/services/MatcherService.ts#L21)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`store` | [Store](state.store.md)‹TMatch› | - |
`commands` | [Commands](../modules/reflection-1526.reflection-617.md#commands) | - |
`adapter` | [IMatcherAdapter](interfaces.imatcheradapter.md)‹TMatch› | - |
`initialThrottle` | number | 2000 |

**Returns:** *[MatcherService](services.matcherservice.md)*

## Methods

###  addCategory

▸ **addCategory**(`categoryId`: string): *void*

*Defined in [src/ts/services/MatcherService.ts:48](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/services/MatcherService.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`categoryId` | string |

**Returns:** *void*

___

###  fetchCategories

▸ **fetchCategories**(): *Promise‹[ICategory](../interfaces/interfaces.icategory.md)[]›*

*Defined in [src/ts/services/MatcherService.ts:41](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/services/MatcherService.ts#L41)*

Get all of the available categories from the matcher service.

**Returns:** *Promise‹[ICategory](../interfaces/interfaces.icategory.md)[]›*

___

###  fetchMatches

▸ **fetchMatches**(`requestId`: string, `blocks`: [IBlock](../interfaces/interfaces.iblock.md)[]): *Promise‹void›*

*Defined in [src/ts/services/MatcherService.ts:65](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/services/MatcherService.ts#L65)*

Fetch matches for a set of blocks.

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`blocks` | [IBlock](../interfaces/interfaces.iblock.md)[] |

**Returns:** *Promise‹void›*

___

###  getCurrentCategories

▸ **getCurrentCategories**(): *[ICategory](../interfaces/interfaces.icategory.md)[]*

*Defined in [src/ts/services/MatcherService.ts:46](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/services/MatcherService.ts#L46)*

**Returns:** *[ICategory](../interfaces/interfaces.icategory.md)[]*

___

###  removeCategory

▸ **removeCategory**(`categoryId`: string): *void*

*Defined in [src/ts/services/MatcherService.ts:56](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/services/MatcherService.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`categoryId` | string |

**Returns:** *void*

___

###  requestFetchMatches

▸ **requestFetchMatches**(): *unknown*

*Defined in [src/ts/services/MatcherService.ts:80](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/services/MatcherService.ts#L80)*

Request a fetch for matches. If we already have a request in flight,
defer it until the next throttle window.

**Returns:** *unknown*
