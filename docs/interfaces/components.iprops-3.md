[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [components](../modules/components.md) › [IProps](components.iprops-3.md)

# Interface: IProps

## Hierarchy

* **IProps**

## Index

### Properties

* [applySuggestions](components.iprops-3.md#applysuggestions)
* [indicateHover](components.iprops-3.md#indicatehover)
* [output](components.iprops-3.md#output)
* [selectMatch](components.iprops-3.md#selectmatch)
* [selectedMatch](components.iprops-3.md#selectedmatch)
* [stopHover](components.iprops-3.md#stophover)

## Properties

###  applySuggestions

• **applySuggestions**: *function*

*Defined in [src/ts/components/SidebarMatch.tsx:11](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/SidebarMatch.tsx#L11)*

#### Type declaration:

▸ (`suggestions`: [ApplySuggestionOptions](../modules/reflection-1526.reflection-617.md#applysuggestionoptions)): *void*

**Parameters:**

Name | Type |
------ | ------ |
`suggestions` | [ApplySuggestionOptions](../modules/reflection-1526.reflection-617.md#applysuggestionoptions) |

___

###  indicateHover

• **indicateHover**: *function*

*Defined in [src/ts/components/SidebarMatch.tsx:13](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/SidebarMatch.tsx#L13)*

#### Type declaration:

▸ (`blockId`: string, `_?`: any): *void*

**Parameters:**

Name | Type |
------ | ------ |
`blockId` | string |
`_?` | any |

___

###  output

• **output**: *[IMatch](interfaces.imatch.md)*

*Defined in [src/ts/components/SidebarMatch.tsx:10](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/SidebarMatch.tsx#L10)*

___

###  selectMatch

• **selectMatch**: *function*

*Defined in [src/ts/components/SidebarMatch.tsx:12](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/SidebarMatch.tsx#L12)*

#### Type declaration:

▸ (`matchId`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`matchId` | string |

___

###  selectedMatch

• **selectedMatch**: *string | undefined*

*Defined in [src/ts/components/SidebarMatch.tsx:15](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/SidebarMatch.tsx#L15)*

___

###  stopHover

• **stopHover**: *function*

*Defined in [src/ts/components/SidebarMatch.tsx:14](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/SidebarMatch.tsx#L14)*

#### Type declaration:

▸ (): *void*
