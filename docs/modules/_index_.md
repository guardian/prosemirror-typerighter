[@guardian/prosemirror-noting](../README.md) > ["index"](../modules/_index_.md)

# External module: "index"

## Index

### Interfaces

* [ICommands](../interfaces/_index_.icommands.md)
* [IPluginOptions](../interfaces/_index_.ipluginoptions.md)

### Type aliases

* [ApplySuggestionOptions](_index_.md#applysuggestionoptions)
* [ApplySuggestionsCommand](_index_.md#applysuggestionscommand)
* [ExpandRanges](_index_.md#expandranges)
* [IndicateHoverCommand](_index_.md#indicatehovercommand)
* [SelectValidationCommand](_index_.md#selectvalidationcommand)
* [ValidateDocumentCommand](_index_.md#validatedocumentcommand)
* [ViewHandler](_index_.md#viewhandler)

### Functions

* [createValidatorPlugin](_index_.md#createvalidatorplugin)

---

## Type aliases

<a id="applysuggestionoptions"></a>

###  ApplySuggestionOptions

**Ƭ ApplySuggestionOptions**: *`Array`<`object`>*

*Defined in [index.ts:56](https://github.com/guardian/prosemirror-typerighter/blob/836cd30/src/ts/index.ts#L56)*

___
<a id="applysuggestionscommand"></a>

###  ApplySuggestionsCommand

**Ƭ ApplySuggestionsCommand**: *`function`*

*Defined in [index.ts:64](https://github.com/guardian/prosemirror-typerighter/blob/836cd30/src/ts/index.ts#L64)*

Applies a suggestion from a validation to the document.

#### Type declaration
▸(suggestionOpts: *[ApplySuggestionOptions](_index_.md#applysuggestionoptions)*): `function`

**Parameters:**

| Name | Type |
| ------ | ------ |
| suggestionOpts | [ApplySuggestionOptions](_index_.md#applysuggestionoptions) |

**Returns:** `function`

___
<a id="expandranges"></a>

###  ExpandRanges

**Ƭ ExpandRanges**: *`function`*

*Defined in [index.ts:103](https://github.com/guardian/prosemirror-typerighter/blob/836cd30/src/ts/index.ts#L103)*

#### Type declaration
▸(ranges: *`IRange`[]*, doc: *`Node`<`any`>*): `IRange`[]

**Parameters:**

| Name | Type |
| ------ | ------ |
| ranges | `IRange`[] |
| doc | `Node`<`any`> |

**Returns:** `IRange`[]

___
<a id="indicatehovercommand"></a>

###  IndicateHoverCommand

**Ƭ IndicateHoverCommand**: *`function`*

*Defined in [index.ts:88](https://github.com/guardian/prosemirror-typerighter/blob/836cd30/src/ts/index.ts#L88)*

Indicate new hover information is available. This could include details on hover coords if available (for example, if hovering over a validation decoration) to allow the positioning of e.g. tooltips.

#### Type declaration
▸(validationId: * `string` &#124; `undefined`*, hoverInfo?: * `IStateHoverInfo` &#124; `undefined`*): `function`

**Parameters:**

| Name | Type |
| ------ | ------ |
| validationId |  `string` &#124; `undefined`|
| `Optional` hoverInfo |  `IStateHoverInfo` &#124; `undefined`|

**Returns:** `function`

___
<a id="selectvalidationcommand"></a>

###  SelectValidationCommand

**Ƭ SelectValidationCommand**: *`function`*

*Defined in [index.ts:79](https://github.com/guardian/prosemirror-typerighter/blob/836cd30/src/ts/index.ts#L79)*

Mark a given validation as active.

#### Type declaration
▸(validationId: *`string`*): `function`

**Parameters:**

| Name | Type |
| ------ | ------ |
| validationId | `string` |

**Returns:** `function`

___
<a id="validatedocumentcommand"></a>

###  ValidateDocumentCommand

**Ƭ ValidateDocumentCommand**: *`function`*

*Defined in [index.ts:71](https://github.com/guardian/prosemirror-typerighter/blob/836cd30/src/ts/index.ts#L71)*

Validates an entire document.

#### Type declaration
▸(state: *`EditorState`*, dispatch?: * `undefined` &#124; `function`*): `boolean`

**Parameters:**

| Name | Type |
| ------ | ------ |
| state | `EditorState` |
| `Optional` dispatch |  `undefined` &#124; `function`|

**Returns:** `boolean`

___
<a id="viewhandler"></a>

###  ViewHandler

**Ƭ ViewHandler**: *`function`*

*Defined in [index.ts:44](https://github.com/guardian/prosemirror-typerighter/blob/836cd30/src/ts/index.ts#L44)*

#### Type declaration
▸(plugin: *`Plugin`*, commands: *[ICommands](../interfaces/_index_.icommands.md)*): `function`

**Parameters:**

| Name | Type |
| ------ | ------ |
| plugin | `Plugin` |
| commands | [ICommands](../interfaces/_index_.icommands.md) |

**Returns:** `function`

___

## Functions

<a id="createvalidatorplugin"></a>

### `<Const>` createValidatorPlugin

▸ **createValidatorPlugin**(options: *[IPluginOptions](../interfaces/_index_.ipluginoptions.md)*): `object`

*Defined in [index.ts:138](https://github.com/guardian/prosemirror-typerighter/blob/836cd30/src/ts/index.ts#L138)*

Creates a document validator plugin, responsible for issuing validation requests when the document is changed, decorating the document when they are returned, and applying suggestions.

**Parameters:**

| Name | Type | Description |
| ------ | ------ | ------ |
| options | [IPluginOptions](../interfaces/_index_.ipluginoptions.md) |  The plugin options object. |

**Returns:** `object`

___

