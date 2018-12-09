[@guardian/prosemirror-noting](../README.md) > ["index"](../modules/_index_.md) > [IPluginOptions](../interfaces/_index_.ipluginoptions.md)

# Interface: IPluginOptions

## Hierarchy

**IPluginOptions**

## Index

### Properties

* [adapter](_index_.ipluginoptions.md#adapter)
* [expandRanges](_index_.ipluginoptions.md#expandranges)
* [maxThrottle](_index_.ipluginoptions.md#maxthrottle)
* [throttleInMs](_index_.ipluginoptions.md#throttleinms)

---

## Properties

<a id="adapter"></a>

###  adapter

**● adapter**: *`IValidationAPIAdapter`*

*Defined in [index.ts:109](https://github.com/guardian/prosemirror-typerighter/blob/836cd30/src/ts/index.ts#L109)*

The adapter the plugin uses to asynchonously request validations.

___
<a id="expandranges"></a>

### `<Optional>` expandRanges

**● expandRanges**: *[ExpandRanges](../modules/_index_.md#expandranges)*

*Defined in [index.ts:117](https://github.com/guardian/prosemirror-typerighter/blob/836cd30/src/ts/index.ts#L117)*

A function that receives ranges that have been dirtied since the last validation request, and returns the new ranges to validate. The default implementation expands the dirtied ranges to cover the parent block node.

___
<a id="maxthrottle"></a>

### `<Optional>` maxThrottle

**● maxThrottle**: * `undefined` &#124; `number`
*

*Defined in [index.ts:127](https://github.com/guardian/prosemirror-typerighter/blob/836cd30/src/ts/index.ts#L127)*

The maximum throttle duration.

___
<a id="throttleinms"></a>

### `<Optional>` throttleInMs

**● throttleInMs**: * `undefined` &#124; `number`
*

*Defined in [index.ts:122](https://github.com/guardian/prosemirror-typerighter/blob/836cd30/src/ts/index.ts#L122)*

The throttle duration for validation requests, in ms.

___

