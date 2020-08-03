[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [components](../modules/components.md) › [SidebarMatch](components.sidebarmatch.md)

# Class: SidebarMatch

Display information for a single match

## Hierarchy

* Component‹[IProps](../modules/components.md#iprops), [IState](../interfaces/components.istate.md)›

  ↳ **SidebarMatch**

## Index

### Constructors

* [constructor](components.sidebarmatch.md#constructor)

### Properties

* [base](components.sidebarmatch.md#optional-base)
* [context](components.sidebarmatch.md#context)
* [props](components.sidebarmatch.md#props)
* [contextType](components.sidebarmatch.md#static-optional-contexttype)
* [defaultProps](components.sidebarmatch.md#static-optional-defaultprops)
* [displayName](components.sidebarmatch.md#static-optional-displayname)

### Methods

* [componentDidCatch](components.sidebarmatch.md#optional-componentdidcatch)
* [componentDidMount](components.sidebarmatch.md#optional-componentdidmount)
* [componentDidUpdate](components.sidebarmatch.md#optional-componentdidupdate)
* [componentWillMount](components.sidebarmatch.md#optional-componentwillmount)
* [componentWillReceiveProps](components.sidebarmatch.md#optional-componentwillreceiveprops)
* [componentWillUnmount](components.sidebarmatch.md#optional-componentwillunmount)
* [componentWillUpdate](components.sidebarmatch.md#optional-componentwillupdate)
* [forceUpdate](components.sidebarmatch.md#forceupdate)
* [getChildContext](components.sidebarmatch.md#optional-getchildcontext)
* [getSnapshotBeforeUpdate](components.sidebarmatch.md#optional-getsnapshotbeforeupdate)
* [render](components.sidebarmatch.md#render)
* [setState](components.sidebarmatch.md#setstate)
* [shouldComponentUpdate](components.sidebarmatch.md#optional-shouldcomponentupdate)
* [getDerivedStateFromError](components.sidebarmatch.md#static-optional-getderivedstatefromerror)
* [getDerivedStateFromProps](components.sidebarmatch.md#static-optional-getderivedstatefromprops)

### Object literals

* [state](components.sidebarmatch.md#state)

## Constructors

###  constructor

\+ **new SidebarMatch**(`props?`: P, `context?`: any): *[SidebarMatch](components.sidebarmatch.md)*

*Inherited from [Match](components.match.md).[constructor](components.match.md#constructor)*

Defined in node_modules/preact/src/index.d.ts:122

**Parameters:**

Name | Type |
------ | ------ |
`props?` | P |
`context?` | any |

**Returns:** *[SidebarMatch](components.sidebarmatch.md)*

## Properties

### `Optional` base

• **base**? : *Element | Text*

*Inherited from [Match](components.match.md).[base](components.match.md#optional-base)*

Defined in node_modules/preact/src/index.d.ts:144

___

###  context

• **context**: *any*

*Inherited from [Match](components.match.md).[context](components.match.md#context)*

Defined in node_modules/preact/src/index.d.ts:143

___

###  props

• **props**: *RenderableProps‹[IProps](../modules/components.md#iprops)›*

*Inherited from [Match](components.match.md).[props](components.match.md#props)*

Defined in node_modules/preact/src/index.d.ts:142

___

### `Static` `Optional` contextType

▪ **contextType**? : *Context‹any›*

*Inherited from [Match](components.match.md).[contextType](components.match.md#static-optional-contexttype)*

Defined in node_modules/preact/src/index.d.ts:127

___

### `Static` `Optional` defaultProps

▪ **defaultProps**? : *any*

*Inherited from [Match](components.match.md).[defaultProps](components.match.md#static-optional-defaultprops)*

Defined in node_modules/preact/src/index.d.ts:126

___

### `Static` `Optional` displayName

▪ **displayName**? : *undefined | string*

*Inherited from [Match](components.match.md).[displayName](components.match.md#static-optional-displayname)*

Defined in node_modules/preact/src/index.d.ts:125

## Methods

### `Optional` componentDidCatch

▸ **componentDidCatch**(`error`: any, `errorInfo`: any): *void*

*Inherited from [Match](components.match.md).[componentDidCatch](components.match.md#optional-componentdidcatch)*

Defined in node_modules/preact/src/index.d.ts:119

**Parameters:**

Name | Type |
------ | ------ |
`error` | any |
`errorInfo` | any |

**Returns:** *void*

___

### `Optional` componentDidMount

▸ **componentDidMount**(): *void*

*Inherited from [Match](components.match.md).[componentDidMount](components.match.md#optional-componentdidmount)*

Defined in node_modules/preact/src/index.d.ts:99

**Returns:** *void*

___

### `Optional` componentDidUpdate

▸ **componentDidUpdate**(`previousProps`: Readonly‹[IProps](../modules/components.md#iprops)›, `previousState`: Readonly‹[IState](../interfaces/components.istate.md)›, `snapshot`: any): *void*

*Inherited from [Match](components.match.md).[componentDidUpdate](components.match.md#optional-componentdidupdate)*

Defined in node_modules/preact/src/index.d.ts:114

**Parameters:**

Name | Type |
------ | ------ |
`previousProps` | Readonly‹[IProps](../modules/components.md#iprops)› |
`previousState` | Readonly‹[IState](../interfaces/components.istate.md)› |
`snapshot` | any |

**Returns:** *void*

___

### `Optional` componentWillMount

▸ **componentWillMount**(): *void*

*Inherited from [Match](components.match.md).[componentWillMount](components.match.md#optional-componentwillmount)*

Defined in node_modules/preact/src/index.d.ts:98

**Returns:** *void*

___

### `Optional` componentWillReceiveProps

▸ **componentWillReceiveProps**(`nextProps`: Readonly‹[IProps](../modules/components.md#iprops)›, `nextContext`: any): *void*

*Inherited from [Match](components.match.md).[componentWillReceiveProps](components.match.md#optional-componentwillreceiveprops)*

Defined in node_modules/preact/src/index.d.ts:102

**Parameters:**

Name | Type |
------ | ------ |
`nextProps` | Readonly‹[IProps](../modules/components.md#iprops)› |
`nextContext` | any |

**Returns:** *void*

___

### `Optional` componentWillUnmount

▸ **componentWillUnmount**(): *void*

*Inherited from [Match](components.match.md).[componentWillUnmount](components.match.md#optional-componentwillunmount)*

Defined in node_modules/preact/src/index.d.ts:100

**Returns:** *void*

___

### `Optional` componentWillUpdate

▸ **componentWillUpdate**(`nextProps`: Readonly‹[IProps](../modules/components.md#iprops)›, `nextState`: Readonly‹[IState](../interfaces/components.istate.md)›, `nextContext`: any): *void*

*Inherited from [Match](components.match.md).[componentWillUpdate](components.match.md#optional-componentwillupdate)*

Defined in node_modules/preact/src/index.d.ts:108

**Parameters:**

Name | Type |
------ | ------ |
`nextProps` | Readonly‹[IProps](../modules/components.md#iprops)› |
`nextState` | Readonly‹[IState](../interfaces/components.istate.md)› |
`nextContext` | any |

**Returns:** *void*

___

###  forceUpdate

▸ **forceUpdate**(`callback?`: undefined | function): *void*

*Inherited from [Match](components.match.md).[forceUpdate](components.match.md#forceupdate)*

Defined in node_modules/preact/src/index.d.ts:159

**Parameters:**

Name | Type |
------ | ------ |
`callback?` | undefined &#124; function |

**Returns:** *void*

___

### `Optional` getChildContext

▸ **getChildContext**(): *object*

*Inherited from [Match](components.match.md).[getChildContext](components.match.md#optional-getchildcontext)*

Defined in node_modules/preact/src/index.d.ts:101

**Returns:** *object*

___

### `Optional` getSnapshotBeforeUpdate

▸ **getSnapshotBeforeUpdate**(`oldProps`: Readonly‹[IProps](../modules/components.md#iprops)›, `oldState`: Readonly‹[IState](../interfaces/components.istate.md)›): *any*

*Inherited from [Match](components.match.md).[getSnapshotBeforeUpdate](components.match.md#optional-getsnapshotbeforeupdate)*

Defined in node_modules/preact/src/index.d.ts:113

**Parameters:**

Name | Type |
------ | ------ |
`oldProps` | Readonly‹[IProps](../modules/components.md#iprops)› |
`oldState` | Readonly‹[IState](../interfaces/components.istate.md)› |

**Returns:** *any*

___

###  render

▸ **render**(): *Element‹›*

*Overrides void*

*Defined in [src/ts/components/SidebarMatch.tsx:30](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/SidebarMatch.tsx#L30)*

**Returns:** *Element‹›*

___

###  setState

▸ **setState**‹**K**›(`state`: function | null | object | object, `callback?`: undefined | function): *void*

*Inherited from [Match](components.match.md).[setState](components.match.md#setstate)*

Defined in node_modules/preact/src/index.d.ts:149

**Type parameters:**

▪ **K**: *keyof IState*

**Parameters:**

Name | Type |
------ | ------ |
`state` | function &#124; null &#124; object &#124; object |
`callback?` | undefined &#124; function |

**Returns:** *void*

___

### `Optional` shouldComponentUpdate

▸ **shouldComponentUpdate**(`nextProps`: Readonly‹[IProps](../modules/components.md#iprops)›, `nextState`: Readonly‹[IState](../interfaces/components.istate.md)›, `nextContext`: any): *boolean*

*Inherited from [Match](components.match.md).[shouldComponentUpdate](components.match.md#optional-shouldcomponentupdate)*

Defined in node_modules/preact/src/index.d.ts:103

**Parameters:**

Name | Type |
------ | ------ |
`nextProps` | Readonly‹[IProps](../modules/components.md#iprops)› |
`nextState` | Readonly‹[IState](../interfaces/components.istate.md)› |
`nextContext` | any |

**Returns:** *boolean*

___

### `Static` `Optional` getDerivedStateFromError

▸ **getDerivedStateFromError**(`error`: any): *object | null*

*Inherited from [Match](components.match.md).[getDerivedStateFromError](components.match.md#static-optional-getderivedstatefromerror)*

Defined in node_modules/preact/src/index.d.ts:139

**Parameters:**

Name | Type |
------ | ------ |
`error` | any |

**Returns:** *object | null*

___

### `Static` `Optional` getDerivedStateFromProps

▸ **getDerivedStateFromProps**(`props`: Readonly‹object›, `state`: Readonly‹object›): *object | null*

*Inherited from [Match](components.match.md).[getDerivedStateFromProps](components.match.md#static-optional-getderivedstatefromprops)*

Defined in node_modules/preact/src/index.d.ts:135

**Parameters:**

Name | Type |
------ | ------ |
`props` | Readonly‹object› |
`state` | Readonly‹object› |

**Returns:** *object | null*

## Object literals

###  state

### ▪ **state**: *object*

*Overrides [Match](components.match.md).[state](components.match.md#state)*

*Defined in [src/ts/components/SidebarMatch.tsx:26](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/SidebarMatch.tsx#L26)*

###  isOpen

• **isOpen**: *boolean* = false

*Defined in [src/ts/components/SidebarMatch.tsx:27](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/components/SidebarMatch.tsx#L27)*
