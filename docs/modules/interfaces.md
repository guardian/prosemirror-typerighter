[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [interfaces](interfaces.md)

# Module: interfaces

## Index

### Classes

* [IMatcherAdapter](../classes/interfaces.imatcheradapter.md)

### Interfaces

* [IBlock](../interfaces/interfaces.iblock.md)
* [IBlockResult](../interfaces/interfaces.iblockresult.md)
* [ICategory](../interfaces/interfaces.icategory.md)
* [IMatch](../interfaces/interfaces.imatch.md)
* [IMatchRequestError](../interfaces/interfaces.imatchrequesterror.md)
* [IMatcherResponse](../interfaces/interfaces.imatcherresponse.md)
* [IRange](../interfaces/interfaces.irange.md)
* [ITextSuggestion](../interfaces/interfaces.itextsuggestion.md)
* [IWikiSuggestion](../interfaces/interfaces.iwikisuggestion.md)

### Type aliases

* [IMatchLibrary](interfaces.md#imatchlibrary)
* [ISuggestion](interfaces.md#isuggestion)
* [TMatchesReceivedCallback](interfaces.md#tmatchesreceivedcallback)
* [TRequestCompleteCallback](interfaces.md#trequestcompletecallback)
* [TRequestErrorCallback](interfaces.md#trequesterrorcallback)

## Type aliases

###  IMatchLibrary

Ƭ **IMatchLibrary**: *Array‹Array‹object››*

*Defined in [src/ts/interfaces/IMatch.ts:65](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/interfaces/IMatch.ts#L65)*

___

###  ISuggestion

Ƭ **ISuggestion**: *[ITextSuggestion](../interfaces/interfaces.itextsuggestion.md) | [IWikiSuggestion](../interfaces/interfaces.iwikisuggestion.md)*

*Defined in [src/ts/interfaces/IMatch.ts:19](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/interfaces/IMatch.ts#L19)*

___

###  TMatchesReceivedCallback

Ƭ **TMatchesReceivedCallback**: *function*

*Defined in [src/ts/interfaces/IMatcherAdapter.ts:35](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/interfaces/IMatcherAdapter.ts#L35)*

#### Type declaration:

▸ (`response`: [IMatcherResponse](../interfaces/interfaces.imatcherresponse.md)‹TMatch›): *void*

**Parameters:**

Name | Type |
------ | ------ |
`response` | [IMatcherResponse](../interfaces/interfaces.imatcherresponse.md)‹TMatch› |

___

###  TRequestCompleteCallback

Ƭ **TRequestCompleteCallback**: *function*

*Defined in [src/ts/interfaces/IMatcherAdapter.ts:43](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/interfaces/IMatcherAdapter.ts#L43)*

#### Type declaration:

▸ (`requestId`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |

___

###  TRequestErrorCallback

Ƭ **TRequestErrorCallback**: *function*

*Defined in [src/ts/interfaces/IMatcherAdapter.ts:39](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/interfaces/IMatcherAdapter.ts#L39)*

#### Type declaration:

▸ (`matchRequestError`: [IMatchRequestError](../interfaces/interfaces.imatchrequesterror.md)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`matchRequestError` | [IMatchRequestError](../interfaces/interfaces.imatchrequesterror.md) |
