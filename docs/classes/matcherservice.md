[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [MatcherService](matcherservice.md)

# Class: MatcherService ‹**TMatch**›

An example matcher service. Calls to fetchMatches() submit blocks
for processing via the supplied adapter. Matches and errors dispatch
the appropriate Prosemirror commands.

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

*Defined in [services/MatcherService.ts:21](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/services/MatcherService.ts#L21)*

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

*Defined in [services/MatcherService.ts:48](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/services/MatcherService.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`categoryId` | string |

**Returns:** *void*

___

###  fetchCategories

▸ **fetchCategories**(): *Promise‹ICategory[]›*

*Defined in [services/MatcherService.ts:41](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/services/MatcherService.ts#L41)*

Get all of the available categories from the matcher service.

**Returns:** *Promise‹ICategory[]›*

___

###  fetchMatches

▸ **fetchMatches**(`requestId`: string, `blocks`: IBlock[]): *Promise‹void›*

*Defined in [services/MatcherService.ts:65](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/services/MatcherService.ts#L65)*

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

*Defined in [services/MatcherService.ts:46](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/services/MatcherService.ts#L46)*

**Returns:** *ICategory[]*

___

###  removeCategory

▸ **removeCategory**(`categoryId`: string): *void*

*Defined in [services/MatcherService.ts:56](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/services/MatcherService.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`categoryId` | string |

**Returns:** *void*

___

###  requestFetchMatches

▸ **requestFetchMatches**(): *unknown*

*Defined in [services/MatcherService.ts:80](https://github.com/guardian/prosemirror-typerighter/blob/6b0a3bc/src/ts/services/MatcherService.ts#L80)*

Request a fetch for matches. If we already have a request in flight,
defer it until the next throttle window.

**Returns:** *unknown*
