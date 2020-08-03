[@guardian/prosemirror-typerighter](../README.md) › [Globals](../globals.md) › [utils](utils.md)

# Module: utils

## Index

### Type aliases

* [ArgumentTypes](utils.md#argumenttypes)

### Variables

* [DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID](utils.md#const-decoration_attribute_height_marker_id)
* [DECORATION_ATTRIBUTE_ID](utils.md#const-decoration_attribute_id)
* [DECORATION_ATTRIBUTE_IS_CORRECT_ID](utils.md#const-decoration_attribute_is_correct_id)
* [DECORATION_DIRTY](utils.md#const-decoration_dirty)
* [DECORATION_INFLIGHT](utils.md#const-decoration_inflight)
* [DECORATION_MATCH](utils.md#const-decoration_match)
* [DECORATION_MATCH_HEIGHT_MARKER](utils.md#const-decoration_match_height_marker)
* [DECORATION_MATCH_IS_CORRECT](utils.md#const-decoration_match_is_correct)
* [DECORATION_MATCH_IS_SELECTED](utils.md#const-decoration_match_is_selected)

### Functions

* [blockToRange](utils.md#const-blocktorange)
* [compact](utils.md#const-compact)
* [createBlock](utils.md#const-createblock)
* [createBlockId](utils.md#const-createblockid)
* [createDebugDecorationFromRange](utils.md#const-createdebugdecorationfromrange)
* [createDecorationsForMatch](utils.md#const-createdecorationsformatch)
* [createDecorationsForMatches](utils.md#const-createdecorationsformatches)
* [createHeightMarkerElement](utils.md#const-createheightmarkerelement)
* [createIsCorrectElement](utils.md#const-createiscorrectelement)
* [createMatchId](utils.md#const-creatematchid)
* [diffRanges](utils.md#const-diffranges)
* [expandRangeToParentBlockNode](utils.md#const-expandrangetoparentblocknode)
* [expandRangesToParentBlockNode](utils.md#const-expandrangestoparentblocknode)
* [findAncestor](utils.md#findancestor)
* [findChildren](utils.md#const-findchildren)
* [findOverlappingRangeIndex](utils.md#const-findoverlappingrangeindex)
* [findSingleDecoration](utils.md#const-findsingledecoration)
* [flatten](utils.md#const-flatten)
* [getBlocksFromDocument](utils.md#const-getblocksfromdocument)
* [getNewDecorationsForCurrentMatches](utils.md#const-getnewdecorationsforcurrentmatches)
* [getRangesOfParentBlockNodes](utils.md#const-getrangesofparentblocknodes)
* [getReplaceStepRangesFromTransaction](utils.md#const-getreplacesteprangesfromtransaction)
* [getReplaceTransactions](utils.md#const-getreplacetransactions)
* [getStateHoverInfoFromEvent](utils.md#getstatehoverinfofromevent)
* [mapAndMergeRanges](utils.md#const-mapandmergeranges)
* [mapRanges](utils.md#const-mapranges)
* [mergeRange](utils.md#const-mergerange)
* [mergeRanges](utils.md#const-mergeranges)
* [removeDecorationsFromRanges](utils.md#const-removedecorationsfromranges)
* [removeOverlappingRanges](utils.md#const-removeoverlappingranges)

### Object literals

* [DecorationClassMap](utils.md#const-decorationclassmap)
* [MarkTypes](utils.md#const-marktypes)

## Type aliases

###  ArgumentTypes

Ƭ **ArgumentTypes**: *F extends function ? A : never*

*Defined in [src/ts/utils/types.ts:2](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/types.ts#L2)*

## Variables

### `Const` DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID

• **DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID**: *"data-height-marker-id"* = "data-height-marker-id"

*Defined in [src/ts/utils/decoration.ts:24](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L24)*

___

### `Const` DECORATION_ATTRIBUTE_ID

• **DECORATION_ATTRIBUTE_ID**: *"data-match-id"* = "data-match-id"

*Defined in [src/ts/utils/decoration.ts:23](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L23)*

___

### `Const` DECORATION_ATTRIBUTE_IS_CORRECT_ID

• **DECORATION_ATTRIBUTE_IS_CORRECT_ID**: *"data-is-correct-id"* = "data-is-correct-id"

*Defined in [src/ts/utils/decoration.ts:25](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L25)*

___

### `Const` DECORATION_DIRTY

• **DECORATION_DIRTY**: *"DECORATION_DIRTY"* = "DECORATION_DIRTY"

*Defined in [src/ts/utils/decoration.ts:11](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L11)*

___

### `Const` DECORATION_INFLIGHT

• **DECORATION_INFLIGHT**: *"DECORATION_INFLIGHT"* = "DECORATION_INFLIGHT"

*Defined in [src/ts/utils/decoration.ts:12](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L12)*

___

### `Const` DECORATION_MATCH

• **DECORATION_MATCH**: *"DECORATION_MATCH"* = "DECORATION_MATCH"

*Defined in [src/ts/utils/decoration.ts:7](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L7)*

___

### `Const` DECORATION_MATCH_HEIGHT_MARKER

• **DECORATION_MATCH_HEIGHT_MARKER**: *"DECORATION_MATCH_HEIGHT_MARKER"* = "DECORATION_MATCH_HEIGHT_MARKER"

*Defined in [src/ts/utils/decoration.ts:10](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L10)*

___

### `Const` DECORATION_MATCH_IS_CORRECT

• **DECORATION_MATCH_IS_CORRECT**: *"DECORATION_MATCH_IS_CORRECT"* = "DECORATION_MATCH_IS_CORRECT"

*Defined in [src/ts/utils/decoration.ts:8](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L8)*

___

### `Const` DECORATION_MATCH_IS_SELECTED

• **DECORATION_MATCH_IS_SELECTED**: *"DECORATION_MATCH_IS_HOVERING"* = "DECORATION_MATCH_IS_HOVERING"

*Defined in [src/ts/utils/decoration.ts:9](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L9)*

## Functions

### `Const` blockToRange

▸ **blockToRange**(`input`: [IBlock](../interfaces/interfaces.iblock.md)): *[IRange](../interfaces/interfaces.irange.md)*

*Defined in [src/ts/utils/range.ts:128](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/range.ts#L128)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | [IBlock](../interfaces/interfaces.iblock.md) |

**Returns:** *[IRange](../interfaces/interfaces.irange.md)*

___

### `Const` compact

▸ **compact**‹**TValue**›(`value`: TValue | null | undefined | false | ""): *value is TValue*

*Defined in [src/ts/utils/array.ts:1](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/array.ts#L1)*

**Type parameters:**

▪ **TValue**

**Parameters:**

Name | Type |
------ | ------ |
`value` | TValue &#124; null &#124; undefined &#124; false &#124; "" |

**Returns:** *value is TValue*

___

### `Const` createBlock

▸ **createBlock**(`doc`: Node, `range`: [IRange](../interfaces/interfaces.irange.md), `time`: number): *[IBlock](../interfaces/interfaces.iblock.md)*

*Defined in [src/ts/utils/block.ts:4](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/block.ts#L4)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`doc` | Node | - |
`range` | [IRange](../interfaces/interfaces.irange.md) | - |
`time` | number | 0 |

**Returns:** *[IBlock](../interfaces/interfaces.iblock.md)*

___

### `Const` createBlockId

▸ **createBlockId**(`time`: number, `from`: number, `to`: number): *string*

*Defined in [src/ts/utils/block.ts:17](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/block.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`time` | number |
`from` | number |
`to` | number |

**Returns:** *string*

___

### `Const` createDebugDecorationFromRange

▸ **createDebugDecorationFromRange**(`range`: [IRange](../interfaces/interfaces.irange.md), `dirty`: boolean): *Decoration‹any›*

*Defined in [src/ts/utils/decoration.ts:27](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L27)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`range` | [IRange](../interfaces/interfaces.irange.md) | - |
`dirty` | boolean | true |

**Returns:** *Decoration‹any›*

___

### `Const` createDecorationsForMatch

▸ **createDecorationsForMatch**(`match`: [IMatch](../interfaces/interfaces.imatch.md), `isSelected`: boolean, `addWidgetDecorations`: boolean): *Decoration‹any›[]*

*Defined in [src/ts/utils/decoration.ts:113](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L113)*

Create decorations for the given match.

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`match` | [IMatch](../interfaces/interfaces.imatch.md) | - |
`isSelected` | boolean | false |
`addWidgetDecorations` | boolean | true |

**Returns:** *Decoration‹any›[]*

___

### `Const` createDecorationsForMatches

▸ **createDecorationsForMatches**(`matches`: [IMatch](../interfaces/interfaces.imatch.md)[]): *Decoration‹any›[]*

*Defined in [src/ts/utils/decoration.ts:174](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L174)*

**Parameters:**

Name | Type |
------ | ------ |
`matches` | [IMatch](../interfaces/interfaces.imatch.md)[] |

**Returns:** *Decoration‹any›[]*

___

### `Const` createHeightMarkerElement

▸ **createHeightMarkerElement**(`id`: string): *HTMLSpanElement*

*Defined in [src/ts/utils/decoration.ts:92](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L92)*

Create a height marker element. Used to determine the height
of a single line of inline content, which is useful when we're
calculating where to place tooltips as the user hovers over multi-
line spans.

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

**Returns:** *HTMLSpanElement*

___

### `Const` createIsCorrectElement

▸ **createIsCorrectElement**(`id`: string): *HTMLSpanElement*

*Defined in [src/ts/utils/decoration.ts:103](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L103)*

Create an 'isCorrect' element. Displays a little tick to let
users know that this range has been marked as correct.

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

**Returns:** *HTMLSpanElement*

___

### `Const` createMatchId

▸ **createMatchId**(`time`: number, `from`: number, `to`: number, `index`: number): *string*

*Defined in [src/ts/utils/block.ts:20](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/block.ts#L20)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`time` | number | - |
`from` | number | - |
`to` | number | - |
`index` | number | 0 |

**Returns:** *string*

___

### `Const` diffRanges

▸ **diffRanges**(`firstRanges`: [IRange](../interfaces/interfaces.irange.md)[], `secondRanges`: [IRange](../interfaces/interfaces.irange.md)[]): *[IRange](../interfaces/interfaces.irange.md)[]*

*Defined in [src/ts/utils/range.ts:86](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/range.ts#L86)*

Return the first set of ranges with any overlaps removed.

**Parameters:**

Name | Type |
------ | ------ |
`firstRanges` | [IRange](../interfaces/interfaces.irange.md)[] |
`secondRanges` | [IRange](../interfaces/interfaces.irange.md)[] |

**Returns:** *[IRange](../interfaces/interfaces.irange.md)[]*

___

### `Const` expandRangeToParentBlockNode

▸ **expandRangeToParentBlockNode**(`range`: [IRange](../interfaces/interfaces.irange.md), `doc`: Node): *[IRange](../interfaces/interfaces.irange.md) | undefined*

*Defined in [src/ts/utils/range.ts:136](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/range.ts#L136)*

Expand a range in a document to encompass the nearest ancestor block node.

**Parameters:**

Name | Type |
------ | ------ |
`range` | [IRange](../interfaces/interfaces.irange.md) |
`doc` | Node |

**Returns:** *[IRange](../interfaces/interfaces.irange.md) | undefined*

___

### `Const` expandRangesToParentBlockNode

▸ **expandRangesToParentBlockNode**(`ranges`: [IRange](../interfaces/interfaces.irange.md)[], `doc`: Node): *[IRange](../interfaces/interfaces.irange.md)[]*

*Defined in [src/ts/utils/range.ts:184](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/range.ts#L184)*

**Parameters:**

Name | Type |
------ | ------ |
`ranges` | [IRange](../interfaces/interfaces.irange.md)[] |
`doc` | Node |

**Returns:** *[IRange](../interfaces/interfaces.irange.md)[]*

___

###  findAncestor

▸ **findAncestor**(`element`: HTMLElement, `selector`: function): *null | HTMLElement*

*Defined in [src/ts/utils/dom.ts:6](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/dom.ts#L6)*

Find the first ancestor node of the given node that matches the selector.

**Parameters:**

▪ **element**: *HTMLElement*

▪ **selector**: *function*

▸ (`e`: HTMLElement): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`e` | HTMLElement |

**Returns:** *null | HTMLElement*

___

### `Const` findChildren

▸ **findChildren**(`node`: Node, `predicate`: function, `descend`: boolean): *Array‹object›*

*Defined in [src/ts/utils/prosemirror.ts:30](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/prosemirror.ts#L30)*

Find all children in a node that satisfy the given predicate.

**Parameters:**

▪ **node**: *Node*

▪ **predicate**: *function*

▸ (`node`: Node): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`node` | Node |

▪ **descend**: *boolean*

**Returns:** *Array‹object›*

___

### `Const` findOverlappingRangeIndex

▸ **findOverlappingRangeIndex**(`range`: [IRange](../interfaces/interfaces.irange.md), `ranges`: [IRange](../interfaces/interfaces.irange.md)[]): *number*

*Defined in [src/ts/utils/range.ts:12](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/range.ts#L12)*

Find the index of the first range in the given range array that overlaps with the given range.

**Parameters:**

Name | Type |
------ | ------ |
`range` | [IRange](../interfaces/interfaces.irange.md) |
`ranges` | [IRange](../interfaces/interfaces.irange.md)[] |

**Returns:** *number*

___

### `Const` findSingleDecoration

▸ **findSingleDecoration**(`decorationSet`: DecorationSet, `predicate`: function): *Decoration | undefined*

*Defined in [src/ts/utils/decoration.ts:177](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L177)*

**Parameters:**

▪ **decorationSet**: *DecorationSet*

▪ **predicate**: *function*

▸ (`spec`: any): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`spec` | any |

**Returns:** *Decoration | undefined*

___

### `Const` flatten

▸ **flatten**(`node`: Node, `descend`: boolean): *object[]*

*Defined in [src/ts/utils/prosemirror.ts:16](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/prosemirror.ts#L16)*

Flatten a node and its children into a single array of objects, containing
the node and the node's position in the document.

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`node` | Node | - |
`descend` | boolean | true |

**Returns:** *object[]*

___

### `Const` getBlocksFromDocument

▸ **getBlocksFromDocument**(`doc`: Node, `time`: number): *[IBlock](../interfaces/interfaces.iblock.md)[]*

*Defined in [src/ts/utils/prosemirror.ts:38](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/prosemirror.ts#L38)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`doc` | Node | - |
`time` | number | 0 |

**Returns:** *[IBlock](../interfaces/interfaces.iblock.md)[]*

___

### `Const` getNewDecorationsForCurrentMatches

▸ **getNewDecorationsForCurrentMatches**(`outputs`: [IMatch](../interfaces/interfaces.imatch.md)[], `decorationSet`: DecorationSet, `doc`: Node): *DecorationSet‹any›*

*Defined in [src/ts/utils/decoration.ts:76](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L76)*

Given a matcher response and the current decoration set,
returns a new decoration set containing the new matches.

**Parameters:**

Name | Type |
------ | ------ |
`outputs` | [IMatch](../interfaces/interfaces.imatch.md)[] |
`decorationSet` | DecorationSet |
`doc` | Node |

**Returns:** *DecorationSet‹any›*

___

### `Const` getRangesOfParentBlockNodes

▸ **getRangesOfParentBlockNodes**(`ranges`: [IRange](../interfaces/interfaces.irange.md)[], `doc`: Node): *[IRange](../interfaces/interfaces.irange.md)[]*

*Defined in [src/ts/utils/range.ts:161](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/range.ts#L161)*

Expand the given ranges to include their ancestor block nodes.

**Parameters:**

Name | Type |
------ | ------ |
`ranges` | [IRange](../interfaces/interfaces.irange.md)[] |
`doc` | Node |

**Returns:** *[IRange](../interfaces/interfaces.irange.md)[]*

___

### `Const` getReplaceStepRangesFromTransaction

▸ **getReplaceStepRangesFromTransaction**(`tr`: Transaction): *object[]*

*Defined in [src/ts/utils/prosemirror.ts:60](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/prosemirror.ts#L60)*

Get all of the ranges of any replace steps in the given transaction.

**Parameters:**

Name | Type |
------ | ------ |
`tr` | Transaction |

**Returns:** *object[]*

___

### `Const` getReplaceTransactions

▸ **getReplaceTransactions**(`tr`: Transaction): *Step‹any›[]*

*Defined in [src/ts/utils/prosemirror.ts:71](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/prosemirror.ts#L71)*

Get all of the ranges of any replace steps in the given transaction.

**Parameters:**

Name | Type |
------ | ------ |
`tr` | Transaction |

**Returns:** *Step‹any›[]*

___

###  getStateHoverInfoFromEvent

▸ **getStateHoverInfoFromEvent**(`event`: MouseEvent, `containerElement`: Element | null, `heightMarkerElement`: Element | null): *[IStateHoverInfo](../interfaces/state.istatehoverinfo.md) | undefined*

*Defined in [src/ts/utils/dom.ts:25](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/dom.ts#L25)*

Get the dimensions required for our UI code to render a tooltip. We encapsulate this here
to avoid dealing with side effects in the plugin reducer.

**Parameters:**

Name | Type |
------ | ------ |
`event` | MouseEvent |
`containerElement` | Element &#124; null |
`heightMarkerElement` | Element &#124; null |

**Returns:** *[IStateHoverInfo](../interfaces/state.istatehoverinfo.md) | undefined*

___

### `Const` mapAndMergeRanges

▸ **mapAndMergeRanges**‹**Range**›(`ranges`: Range[], `mapping`: Mapping): *Range[]*

*Defined in [src/ts/utils/range.ts:24](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/range.ts#L24)*

**Type parameters:**

▪ **Range**: *[IRange](../interfaces/interfaces.irange.md)*

**Parameters:**

Name | Type |
------ | ------ |
`ranges` | Range[] |
`mapping` | Mapping |

**Returns:** *Range[]*

___

### `Const` mapRanges

▸ **mapRanges**‹**Range**›(`ranges`: Range[], `mapping`: Mapping): *Range[]*

*Defined in [src/ts/utils/range.ts:29](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/range.ts#L29)*

**Type parameters:**

▪ **Range**: *[IRange](../interfaces/interfaces.irange.md)*

**Parameters:**

Name | Type |
------ | ------ |
`ranges` | Range[] |
`mapping` | Mapping |

**Returns:** *Range[]*

___

### `Const` mergeRange

▸ **mergeRange**‹**Range**›(`range1`: Range, `range2`: Range): *Range*

*Defined in [src/ts/utils/range.ts:60](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/range.ts#L60)*

**Type parameters:**

▪ **Range**: *[IRange](../interfaces/interfaces.irange.md)*

**Parameters:**

Name | Type |
------ | ------ |
`range1` | Range |
`range2` | Range |

**Returns:** *Range*

___

### `Const` mergeRanges

▸ **mergeRanges**‹**Range**›(`ranges`: Range[]): *Range[]*

*Defined in [src/ts/utils/range.ts:69](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/range.ts#L69)*

**Type parameters:**

▪ **Range**: *[IRange](../interfaces/interfaces.irange.md)*

**Parameters:**

Name | Type |
------ | ------ |
`ranges` | Range[] |

**Returns:** *Range[]*

___

### `Const` removeDecorationsFromRanges

▸ **removeDecorationsFromRanges**(`decorationSet`: DecorationSet, `ranges`: [IRange](../interfaces/interfaces.irange.md)[], `types`: string[]): *DecorationSet‹any›*

*Defined in [src/ts/utils/decoration.ts:45](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L45)*

Remove decorations from the given ranges. If decorations are found,
expand the search range to include their ranges, too.

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`decorationSet` | DecorationSet | - |
`ranges` | [IRange](../interfaces/interfaces.irange.md)[] | - |
`types` | string[] | [
    DECORATION_MATCH,
    DECORATION_MATCH_HEIGHT_MARKER,
    DECORATION_MATCH_IS_CORRECT
  ] |

**Returns:** *DecorationSet‹any›*

___

### `Const` removeOverlappingRanges

▸ **removeOverlappingRanges**‹**FirstRange**, **SecondRange**›(`firstRanges`: FirstRange[], `secondRanges`: SecondRange[], `predicate?`: undefined | function): *FirstRange[]*

*Defined in [src/ts/utils/range.ts:42](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/range.ts#L42)*

Return the first set of ranges with any members overlapping the second set removed.

**Type parameters:**

▪ **FirstRange**: *[IRange](../interfaces/interfaces.irange.md)*

▪ **SecondRange**: *[IRange](../interfaces/interfaces.irange.md)*

**Parameters:**

Name | Type |
------ | ------ |
`firstRanges` | FirstRange[] |
`secondRanges` | SecondRange[] |
`predicate?` | undefined &#124; function |

**Returns:** *FirstRange[]*

## Object literals

### `Const` DecorationClassMap

### ▪ **DecorationClassMap**: *object*

*Defined in [src/ts/utils/decoration.ts:14](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L14)*

###  [DECORATION_DIRTY]

• **[DECORATION_DIRTY]**: *string* = "MatchDebugDirty"

*Defined in [src/ts/utils/decoration.ts:15](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L15)*

###  [DECORATION_INFLIGHT]

• **[DECORATION_INFLIGHT]**: *string* = "MatchDebugInflight"

*Defined in [src/ts/utils/decoration.ts:16](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L16)*

###  [DECORATION_MATCH]

• **[DECORATION_MATCH]**: *string* = "MatchDecoration"

*Defined in [src/ts/utils/decoration.ts:17](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L17)*

###  [DECORATION_MATCH_HEIGHT_MARKER]

• **[DECORATION_MATCH_HEIGHT_MARKER]**: *string* = "MatchDecoration__height-marker"

*Defined in [src/ts/utils/decoration.ts:18](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L18)*

###  [DECORATION_MATCH_IS_CORRECT]

• **[DECORATION_MATCH_IS_CORRECT]**: *string* = "MatchDecoration--is-correct"

*Defined in [src/ts/utils/decoration.ts:20](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L20)*

###  [DECORATION_MATCH_IS_SELECTED]

• **[DECORATION_MATCH_IS_SELECTED]**: *string* = "MatchDecoration--is-selected"

*Defined in [src/ts/utils/decoration.ts:19](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/decoration.ts#L19)*

___

### `Const` MarkTypes

### ▪ **MarkTypes**: *object*

*Defined in [src/ts/utils/prosemirror.ts:7](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/prosemirror.ts#L7)*

###  legal

• **legal**: *string* = "legal"

*Defined in [src/ts/utils/prosemirror.ts:8](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/prosemirror.ts#L8)*

###  warn

• **warn**: *string* = "warn"

*Defined in [src/ts/utils/prosemirror.ts:9](https://github.com/guardian/prosemirror-typerighter/blob/530a4bd/src/ts/utils/prosemirror.ts#L9)*
