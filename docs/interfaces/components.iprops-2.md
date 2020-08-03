[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [components](../modules/components.md) › [IProps](components.iprops-2.md)

# Interface: IProps ‹**TMatch**›

## Type parameters

▪ **TMatch**: *[IMatch](interfaces.imatch.md)*

## Hierarchy

* **IProps**

## Index

### Properties

* [applySuggestions](components.iprops-2.md#applysuggestions)
* [containerElement](components.iprops-2.md#optional-containerelement)
* [feedbackHref](components.iprops-2.md#optional-feedbackhref)
* [store](components.iprops-2.md#store)

## Properties

###  applySuggestions

• **applySuggestions**: *function*

*Defined in [src/ts/components/MatchOverlay.tsx:18](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/MatchOverlay.tsx#L18)*

#### Type declaration:

▸ (`opts`: [ApplySuggestionOptions](../modules/reflection-1526.reflection-617.md#applysuggestionoptions)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`opts` | [ApplySuggestionOptions](../modules/reflection-1526.reflection-617.md#applysuggestionoptions) |

___

### `Optional` containerElement

• **containerElement**? : *HTMLElement*

*Defined in [src/ts/components/MatchOverlay.tsx:21](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/MatchOverlay.tsx#L21)*

___

### `Optional` feedbackHref

• **feedbackHref**? : *undefined | string*

*Defined in [src/ts/components/MatchOverlay.tsx:22](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/MatchOverlay.tsx#L22)*

___

###  store

• **store**: *[Store](../classes/state.store.md)‹TMatch, [IStoreEvents](state.istoreevents.md)‹TMatch››*

*Defined in [src/ts/components/MatchOverlay.tsx:17](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/MatchOverlay.tsx#L17)*
