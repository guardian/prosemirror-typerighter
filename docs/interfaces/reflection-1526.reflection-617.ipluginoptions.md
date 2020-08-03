[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [](../modules/reflection-1526.md) › [](../modules/reflection-1526.reflection-617.md) › [IPluginOptions](reflection-1526.reflection-617.ipluginoptions.md)

# Interface: IPluginOptions ‹**TMatch**›

## Type parameters

▪ **TMatch**: *[IMatch](interfaces.imatch.md)*

## Hierarchy

* **IPluginOptions**

## Index

### Properties

* [expandRanges](reflection-1526.reflection-617.ipluginoptions.md#optional-expandranges)
* [matches](reflection-1526.reflection-617.ipluginoptions.md#optional-matches)

## Properties

### `Optional` expandRanges

• **expandRanges**? : *[ExpandRanges](../modules/reflection-1526.reflection-617.md#expandranges)*

*Defined in [src/ts/createTyperighterPlugin.ts:31](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/createTyperighterPlugin.ts#L31)*

A function that receives ranges that have been dirtied since the
last request, and returns the new ranges to find matches for. The
default implementation expands the dirtied ranges to cover the parent
block node.

___

### `Optional` matches

• **matches**? : *TMatch[]*

*Defined in [src/ts/createTyperighterPlugin.ts:36](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/createTyperighterPlugin.ts#L36)*

The initial set of matches to apply to the document, if any.
