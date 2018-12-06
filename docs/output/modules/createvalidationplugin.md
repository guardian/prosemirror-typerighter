[@guardian/prosemirror-noting](../README.md) > [createValidationPlugin](../modules/createvalidationplugin.md)

# External module: createValidationPlugin

## Index

### Interfaces

* [ICommands](../interfaces/createvalidationplugin.icommands.md)
* [IPluginOptions](../interfaces/createvalidationplugin.ipluginoptions.md)

### Type aliases

* [ApplySuggestionCommand](createvalidationplugin.md#applysuggestioncommand)
* [ValidateDocumentCommand](createvalidationplugin.md#validatedocumentcommand)
* [ViewHandler](createvalidationplugin.md#viewhandler)

### Functions

* [createValidatorPlugin](createvalidationplugin.md#createvalidatorplugin)

---

## Type aliases

<a id="applysuggestioncommand"></a>

###  ApplySuggestionCommand

**Ƭ ApplySuggestionCommand**: *`function`*

*Defined in [index.ts:58](https://github.com/guardian/prosemirror-typerighter/blob/c3b73f4/src/ts/index.ts#L58)*

Applies a suggestion from a validation to the document.

#### Type declaration
▸(validationId: *`string`*, suggestionIndex: *`number`*): `function`

**Parameters:**

| Name | Type |
| ------ | ------ |
| validationId | `string` |
| suggestionIndex | `number` |

**Returns:** `function`

___
<a id="validatedocumentcommand"></a>

###  ValidateDocumentCommand

**Ƭ ValidateDocumentCommand**: *`function`*

*Defined in [index.ts:66](https://github.com/guardian/prosemirror-typerighter/blob/c3b73f4/src/ts/index.ts#L66)*

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

*Defined in [index.ts:43](https://github.com/guardian/prosemirror-typerighter/blob/c3b73f4/src/ts/index.ts#L43)*

#### Type declaration
▸(plugin: *`Plugin`*, commands: *[ICommands](../interfaces/createvalidationplugin.icommands.md)*): `function`

**Parameters:**

| Name | Type |
| ------ | ------ |
| plugin | `Plugin` |
| commands | [ICommands](../interfaces/createvalidationplugin.icommands.md) |

**Returns:** `function`

___

## Functions

<a id="createvalidatorplugin"></a>

### `<Const>` createValidatorPlugin

▸ **createValidatorPlugin**(options: *[IPluginOptions](../interfaces/createvalidationplugin.ipluginoptions.md)*): `object`

*Defined in [index.ts:119](https://github.com/guardian/prosemirror-typerighter/blob/c3b73f4/src/ts/index.ts#L119)*

Creates a document validator plugin, responsible for issuing validation requests when the document is changed, decorating the document when they are returned, and applying suggestions.

**Parameters:**

| Name | Type | Description |
| ------ | ------ | ------ |
| options | [IPluginOptions](../interfaces/createvalidationplugin.ipluginoptions.md) |  The plugin options object. |

**Returns:** `object`

___

