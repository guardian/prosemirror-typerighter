[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [components](../modules/components.md) › [IProps](components.iprops-5.md)

# Interface: IProps

## Hierarchy

* **IProps**

## Index

### Properties

* [addCategory](components.iprops-5.md#addcategory)
* [fetchCategories](components.iprops-5.md#fetchcategories)
* [getCurrentCategories](components.iprops-5.md#getcurrentcategories)
* [removeCategory](components.iprops-5.md#removecategory)
* [requestMatchesForDocument](components.iprops-5.md#requestmatchesfordocument)
* [setDebugState](components.iprops-5.md#setdebugstate)
* [setRequestOnDocModified](components.iprops-5.md#setrequestondocmodified)
* [store](components.iprops-5.md#store)

## Properties

###  addCategory

• **addCategory**: *function*

*Defined in [src/ts/components/Controls.tsx:14](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Controls.tsx#L14)*

#### Type declaration:

▸ (`id`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

___

###  fetchCategories

• **fetchCategories**: *function*

*Defined in [src/ts/components/Controls.tsx:12](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Controls.tsx#L12)*

#### Type declaration:

▸ (): *Promise‹[ICategory](interfaces.icategory.md)[]›*

___

###  getCurrentCategories

• **getCurrentCategories**: *function*

*Defined in [src/ts/components/Controls.tsx:13](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Controls.tsx#L13)*

#### Type declaration:

▸ (): *[ICategory](interfaces.icategory.md)[]*

___

###  removeCategory

• **removeCategory**: *function*

*Defined in [src/ts/components/Controls.tsx:15](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Controls.tsx#L15)*

#### Type declaration:

▸ (`id`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

___

###  requestMatchesForDocument

• **requestMatchesForDocument**: *function*

*Defined in [src/ts/components/Controls.tsx:11](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Controls.tsx#L11)*

#### Type declaration:

▸ (`requestId`: string, `categoryIds`: string[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`requestId` | string |
`categoryIds` | string[] |

___

###  setDebugState

• **setDebugState**: *function*

*Defined in [src/ts/components/Controls.tsx:9](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Controls.tsx#L9)*

#### Type declaration:

▸ (`debug`: boolean): *void*

**Parameters:**

Name | Type |
------ | ------ |
`debug` | boolean |

___

###  setRequestOnDocModified

• **setRequestOnDocModified**: *function*

*Defined in [src/ts/components/Controls.tsx:10](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Controls.tsx#L10)*

#### Type declaration:

▸ (`r`: boolean): *void*

**Parameters:**

Name | Type |
------ | ------ |
`r` | boolean |

___

###  store

• **store**: *[Store](../classes/state.store.md)‹[IMatch](interfaces.imatch.md)›*

*Defined in [src/ts/components/Controls.tsx:8](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/Controls.tsx#L8)*
