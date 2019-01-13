[@guardian/prosemirror-noting](../README.md) > ["createValidationPlugin"](../modules/_createvalidationplugin_.md)

# External module: "createValidationPlugin"

## Index

### Interfaces

* [IPluginOptions](../interfaces/_createvalidationplugin_.ipluginoptions.md)

### Type aliases

* [ExpandRanges](_createvalidationplugin_.md#expandranges)

### Functions

* [createValidatorPlugin](_createvalidationplugin_.md#createvalidatorplugin)

---

## Type aliases

<a id="expandranges"></a>

###  ExpandRanges

**Ƭ ExpandRanges**: *`function`*

*Defined in [createValidationPlugin.ts:28](https://github.com/guardian/prosemirror-typerighter/blob/ea379b2/src/ts/createValidationPlugin.ts#L28)*

#### Type declaration
▸(ranges: *`IRange`[]*, doc: *`Node`<`any`>*): `IRange`[]

**Parameters:**

| Name | Type |
| ------ | ------ |
| ranges | `IRange`[] |
| doc | `Node`<`any`> |

**Returns:** `IRange`[]

___

## Functions

<a id="createvalidatorplugin"></a>

### `<Const>` createValidatorPlugin

▸ **createValidatorPlugin**(options?: *[IPluginOptions](../interfaces/_createvalidationplugin_.ipluginoptions.md)*): `object`

*Defined in [createValidationPlugin.ts:58](https://github.com/guardian/prosemirror-typerighter/blob/ea379b2/src/ts/createValidationPlugin.ts#L58)*

Creates a document validator plugin, responsible for issuing validation requests when the document is changed, decorating the document when they are returned, and applying suggestions.

**Parameters:**

| Name | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `Default value` options | [IPluginOptions](../interfaces/_createvalidationplugin_.ipluginoptions.md) |  {} |  The plugin options object. |

**Returns:** `object`

___

