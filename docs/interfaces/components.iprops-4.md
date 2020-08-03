[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [components](../modules/components.md) › [IProps](components.iprops-4.md)

# Interface: IProps

## Hierarchy

* **IProps**

## Index

### Properties

* [applyAutoFixableSuggestions](components.iprops-4.md#applyautofixablesuggestions)
* [applySuggestions](components.iprops-4.md#applysuggestions)
* [contactHref](components.iprops-4.md#optional-contacthref)
* [indicateHover](components.iprops-4.md#indicatehover)
* [selectMatch](components.iprops-4.md#selectmatch)
* [stopHover](components.iprops-4.md#stophover)
* [store](components.iprops-4.md#store)

## Properties

###  applyAutoFixableSuggestions

• **applyAutoFixableSuggestions**: *function*

*Defined in [src/ts/components/Sidebar.tsx:14](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Sidebar.tsx#L14)*

#### Type declaration:

▸ (): *void*

___

###  applySuggestions

• **applySuggestions**: *function*

*Defined in [src/ts/components/Sidebar.tsx:13](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Sidebar.tsx#L13)*

#### Type declaration:

▸ (`opts`: [ApplySuggestionOptions](../modules/reflection-1526.reflection-617.md#applysuggestionoptions)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`opts` | [ApplySuggestionOptions](../modules/reflection-1526.reflection-617.md#applysuggestionoptions) |

___

### `Optional` contactHref

• **contactHref**? : *undefined | string*

*Defined in [src/ts/components/Sidebar.tsx:18](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Sidebar.tsx#L18)*

___

###  indicateHover

• **indicateHover**: *function*

*Defined in [src/ts/components/Sidebar.tsx:16](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Sidebar.tsx#L16)*

#### Type declaration:

▸ (`matchId`: string, `_?`: any): *void*

**Parameters:**

Name | Type |
------ | ------ |
`matchId` | string |
`_?` | any |

___

###  selectMatch

• **selectMatch**: *function*

*Defined in [src/ts/components/Sidebar.tsx:15](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Sidebar.tsx#L15)*

#### Type declaration:

▸ (`matchId`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`matchId` | string |

___

###  stopHover

• **stopHover**: *function*

*Defined in [src/ts/components/Sidebar.tsx:17](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Sidebar.tsx#L17)*

#### Type declaration:

▸ (): *void*

___

###  store

• **store**: *[Store](../classes/state.store.md)‹[IMatch](interfaces.imatch.md)›*

*Defined in [src/ts/components/Sidebar.tsx:12](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Sidebar.tsx#L12)*
