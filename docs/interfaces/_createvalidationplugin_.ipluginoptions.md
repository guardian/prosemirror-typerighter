[@guardian/prosemirror-noting](../README.md) > ["createValidationPlugin"](../modules/_createvalidationplugin_.md) > [IPluginOptions](../interfaces/_createvalidationplugin_.ipluginoptions.md)

# Interface: IPluginOptions

## Hierarchy

**IPluginOptions**

## Index

### Properties

* [expandRanges](_createvalidationplugin_.ipluginoptions.md#expandranges)
* [maxThrottle](_createvalidationplugin_.ipluginoptions.md#maxthrottle)
* [throttleInMs](_createvalidationplugin_.ipluginoptions.md#throttleinms)

---

## Properties

<a id="expandranges"></a>

### `<Optional>` expandRanges

**● expandRanges**: *[ExpandRanges](../modules/_createvalidationplugin_.md#expandranges)*

*Defined in [createValidationPlugin.ts:37](https://github.com/guardian/prosemirror-typerighter/blob/57b4475/src/ts/createValidationPlugin.ts#L37)*

A function that receives ranges that have been dirtied since the last validation request, and returns the new ranges to validate. The default implementation expands the dirtied ranges to cover the parent block node.

___
<a id="maxthrottle"></a>

### `<Optional>` maxThrottle

**● maxThrottle**: * `undefined` &#124; `number`
*

*Defined in [createValidationPlugin.ts:47](https://github.com/guardian/prosemirror-typerighter/blob/57b4475/src/ts/createValidationPlugin.ts#L47)*

The maximum throttle duration.

___
<a id="throttleinms"></a>

### `<Optional>` throttleInMs

**● throttleInMs**: * `undefined` &#124; `number`
*

*Defined in [createValidationPlugin.ts:42](https://github.com/guardian/prosemirror-typerighter/blob/57b4475/src/ts/createValidationPlugin.ts#L42)*

The throttle duration for validation requests, in ms.

___

