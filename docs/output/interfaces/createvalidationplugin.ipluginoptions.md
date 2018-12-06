[@guardian/prosemirror-noting](../README.md) > [createValidationPlugin](../modules/createvalidationplugin.md) > [IPluginOptions](../interfaces/createvalidationplugin.ipluginoptions.md)

# Interface: IPluginOptions

## Hierarchy

**IPluginOptions**

## Index

### Properties

* [adapter](createvalidationplugin.ipluginoptions.md#adapter)
* [createViewHandler](createvalidationplugin.ipluginoptions.md#createviewhandler)
* [expandRanges](createvalidationplugin.ipluginoptions.md#expandranges)
* [maxThrottle](createvalidationplugin.ipluginoptions.md#maxthrottle)
* [throttleInMs](createvalidationplugin.ipluginoptions.md#throttleinms)

---

## Properties

<a id="adapter"></a>

###  adapter

**● adapter**: *`IValidationAPIAdapter`*

*Defined in [index.ts:83](https://github.com/guardian/prosemirror-typerighter/blob/c3b73f4/src/ts/index.ts#L83)*

The adapter the plugin uses to asynchonously request validations.

___
<a id="createviewhandler"></a>

### `<Optional>` createViewHandler

**● createViewHandler**: *[ViewHandler](../modules/createvalidationplugin.md#viewhandler)*

*Defined in [index.ts:90](https://github.com/guardian/prosemirror-typerighter/blob/c3b73f4/src/ts/index.ts#L90)*

The view handler responsible for rendering any UI beyond the inline decorations applied by the plugin. The default implementation shows additional validation information on hover.

___
<a id="expandranges"></a>

### `<Optional>` expandRanges

**● expandRanges**: * `undefined` &#124; `function`
*

*Defined in [index.ts:98](https://github.com/guardian/prosemirror-typerighter/blob/c3b73f4/src/ts/index.ts#L98)*

A function that receives ranges that have been dirtied since the last validation request, and returns the new ranges to validate. The default implementation expands the dirtied ranges to cover the parent block node.

___
<a id="maxthrottle"></a>

### `<Optional>` maxThrottle

**● maxThrottle**: * `undefined` &#124; `number`
*

*Defined in [index.ts:108](https://github.com/guardian/prosemirror-typerighter/blob/c3b73f4/src/ts/index.ts#L108)*

The maximum throttle duration.

___
<a id="throttleinms"></a>

### `<Optional>` throttleInMs

**● throttleInMs**: * `undefined` &#124; `number`
*

*Defined in [index.ts:103](https://github.com/guardian/prosemirror-typerighter/blob/c3b73f4/src/ts/index.ts#L103)*

The throttle duration for validation requests, in ms.

___

