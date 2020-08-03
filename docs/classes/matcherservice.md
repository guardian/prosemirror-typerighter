[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [MatcherService](matcherservice.md)

# Class: MatcherService ‹**TMatch**›

A matcher service to manage the interaction between the prosemirror-typerighter plugin
and the remote matching service.

## Type parameters

▪ **TMatch**: *IMatch*

## Hierarchy

* **MatcherService**

## Index

### Constructors

* [constructor](matcherservice.md#constructor)

### Methods

* [addCategory](matcherservice.md#addcategory)
* [fetchCategories](matcherservice.md#fetchcategories)
* [fetchMatches](matcherservice.md#fetchmatches)
* [getCurrentCategories](matcherservice.md#getcurrentcategories)
* [removeCategory](matcherservice.md#removecategory)
* [requestFetchMatches](matcherservice.md#requestfetchmatches)

## Constructors

###  constructor

\+ **new MatcherService**(`store`: Store‹TMatch›, `commands`: Commands, `adapter`: IMatcherAdapter‹TMatch›, `initialThrottle`: number): *[MatcherService](matcherservice.md)*

*Defined in [services/MatcherService.ts:20](https://github.com/guardian/prosemirror-typerighter/blob/a7df8ef/src/ts/services/MatcherService.ts#L20)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`store` | Store‹TMatch› | - |
`commands` | Commands | - |
`adapter` | IMatcherAdapter‹TMatch› | - |
`initialThrottle` | number | 2000 |

**Returns:** *[MatcherService](matcherservice.md)*

## Methods

###  addCategory

▸ **addCategory**(`categoryId`: string): *void*

*Defined in [services/MatcherService.ts:47](https://github.com/guardian/prosemirror-typerighter/blob/a7df8ef/src/ts/services/MatcherService.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`categoryId` | string |

**Returns:** *void*

___

###  fetchCategories

▸ **fetchCategories**(): *Promise‹ICategory[]›*

*Defined in [services/MatcherService.ts:40](https://github.com/guardian/prosemirror-typerighter/blob/a7df8ef/src/ts/services/MatcherService.ts#L40)*

Get all of the available categories from the matcher service.

**Returns:** *Promise‹ICategory[]›*

___

###  fetchMatches

▸ **fetchMatches**(`requestId`: string, `blocks`: IBlock[]): *Promise‹void›*

*Defined in [services/MatcherService.ts:64](https://github.com/guardian/prosemirror-typerighter/blob/a7df8ef/src/ts/services/MatcherService.ts#L64)*

Fetch matches for a set of blocks.

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`blocks` | IBlock[] |

**Returns:** *Promise‹void›*

___

###  getCurrentCategories

▸ **getCurrentCategories**(): *ICategory[]*

*Defined in [services/MatcherService.ts:45](https://github.com/guardian/prosemirror-typerighter/blob/a7df8ef/src/ts/services/MatcherService.ts#L45)*

**Returns:** *ICategory[]*

___

###  removeCategory

▸ **removeCategory**(`categoryId`: string): *void*

*Defined in [services/MatcherService.ts:55](https://github.com/guardian/prosemirror-typerighter/blob/a7df8ef/src/ts/services/MatcherService.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`categoryId` | string |

**Returns:** *void*

___

###  requestFetchMatches

▸ **requestFetchMatches**(): *unknown*

*Defined in [services/MatcherService.ts:79](https://github.com/guardian/prosemirror-typerighter/blob/a7df8ef/src/ts/services/MatcherService.ts#L79)*

Request a fetch for matches. If we already have a request in flight,
defer it until the next throttle window.

**Returns:** *unknown*
