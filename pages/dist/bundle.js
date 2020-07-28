(function () {
  'use strict';

  // ::- Persistent data structure representing an ordered mapping from
  // strings to values, with some convenient update methods.
  function OrderedMap(content) {
    this.content = content;
  }

  OrderedMap.prototype = {
    constructor: OrderedMap,

    find: function(key) {
      for (var i = 0; i < this.content.length; i += 2)
        if (this.content[i] === key) return i
      return -1
    },

    // :: (string) → ?any
    // Retrieve the value stored under `key`, or return undefined when
    // no such key exists.
    get: function(key) {
      var found = this.find(key);
      return found == -1 ? undefined : this.content[found + 1]
    },

    // :: (string, any, ?string) → OrderedMap
    // Create a new map by replacing the value of `key` with a new
    // value, or adding a binding to the end of the map. If `newKey` is
    // given, the key of the binding will be replaced with that key.
    update: function(key, value, newKey) {
      var self = newKey && newKey != key ? this.remove(newKey) : this;
      var found = self.find(key), content = self.content.slice();
      if (found == -1) {
        content.push(newKey || key, value);
      } else {
        content[found + 1] = value;
        if (newKey) content[found] = newKey;
      }
      return new OrderedMap(content)
    },

    // :: (string) → OrderedMap
    // Return a map with the given key removed, if it existed.
    remove: function(key) {
      var found = this.find(key);
      if (found == -1) return this
      var content = this.content.slice();
      content.splice(found, 2);
      return new OrderedMap(content)
    },

    // :: (string, any) → OrderedMap
    // Add a new key to the start of the map.
    addToStart: function(key, value) {
      return new OrderedMap([key, value].concat(this.remove(key).content))
    },

    // :: (string, any) → OrderedMap
    // Add a new key to the end of the map.
    addToEnd: function(key, value) {
      var content = this.remove(key).content.slice();
      content.push(key, value);
      return new OrderedMap(content)
    },

    // :: (string, string, any) → OrderedMap
    // Add a key after the given key. If `place` is not found, the new
    // key is added to the end.
    addBefore: function(place, key, value) {
      var without = this.remove(key), content = without.content.slice();
      var found = without.find(place);
      content.splice(found == -1 ? content.length : found, 0, key, value);
      return new OrderedMap(content)
    },

    // :: ((key: string, value: any))
    // Call the given function for each key/value pair in the map, in
    // order.
    forEach: function(f) {
      for (var i = 0; i < this.content.length; i += 2)
        f(this.content[i], this.content[i + 1]);
    },

    // :: (union<Object, OrderedMap>) → OrderedMap
    // Create a new map by prepending the keys in this map that don't
    // appear in `map` before the keys in `map`.
    prepend: function(map) {
      map = OrderedMap.from(map);
      if (!map.size) return this
      return new OrderedMap(map.content.concat(this.subtract(map).content))
    },

    // :: (union<Object, OrderedMap>) → OrderedMap
    // Create a new map by appending the keys in this map that don't
    // appear in `map` after the keys in `map`.
    append: function(map) {
      map = OrderedMap.from(map);
      if (!map.size) return this
      return new OrderedMap(this.subtract(map).content.concat(map.content))
    },

    // :: (union<Object, OrderedMap>) → OrderedMap
    // Create a map containing all the keys in this map that don't
    // appear in `map`.
    subtract: function(map) {
      var result = this;
      map = OrderedMap.from(map);
      for (var i = 0; i < map.content.length; i += 2)
        result = result.remove(map.content[i]);
      return result
    },

    // :: number
    // The amount of keys in this map.
    get size() {
      return this.content.length >> 1
    }
  };

  // :: (?union<Object, OrderedMap>) → OrderedMap
  // Return a map with the given content. If null, create an empty
  // map. If given an ordered map, return that map itself. If given an
  // object, create a map from the object's properties.
  OrderedMap.from = function(value) {
    if (value instanceof OrderedMap) return value
    var content = [];
    if (value) for (var prop in value) content.push(prop, value[prop]);
    return new OrderedMap(content)
  };

  var orderedmap = OrderedMap;

  function findDiffStart(a, b, pos) {
    for (var i = 0;; i++) {
      if (i == a.childCount || i == b.childCount)
        { return a.childCount == b.childCount ? null : pos }

      var childA = a.child(i), childB = b.child(i);
      if (childA == childB) { pos += childA.nodeSize; continue }

      if (!childA.sameMarkup(childB)) { return pos }

      if (childA.isText && childA.text != childB.text) {
        for (var j = 0; childA.text[j] == childB.text[j]; j++)
          { pos++; }
        return pos
      }
      if (childA.content.size || childB.content.size) {
        var inner = findDiffStart(childA.content, childB.content, pos + 1);
        if (inner != null) { return inner }
      }
      pos += childA.nodeSize;
    }
  }

  function findDiffEnd(a, b, posA, posB) {
    for (var iA = a.childCount, iB = b.childCount;;) {
      if (iA == 0 || iB == 0)
        { return iA == iB ? null : {a: posA, b: posB} }

      var childA = a.child(--iA), childB = b.child(--iB), size = childA.nodeSize;
      if (childA == childB) {
        posA -= size; posB -= size;
        continue
      }

      if (!childA.sameMarkup(childB)) { return {a: posA, b: posB} }

      if (childA.isText && childA.text != childB.text) {
        var same = 0, minSize = Math.min(childA.text.length, childB.text.length);
        while (same < minSize && childA.text[childA.text.length - same - 1] == childB.text[childB.text.length - same - 1]) {
          same++; posA--; posB--;
        }
        return {a: posA, b: posB}
      }
      if (childA.content.size || childB.content.size) {
        var inner = findDiffEnd(childA.content, childB.content, posA - 1, posB - 1);
        if (inner) { return inner }
      }
      posA -= size; posB -= size;
    }
  }

  // ::- A fragment represents a node's collection of child nodes.
  //
  // Like nodes, fragments are persistent data structures, and you
  // should not mutate them or their content. Rather, you create new
  // instances whenever needed. The API tries to make this easy.
  var Fragment = function Fragment(content, size) {
    this.content = content;
    // :: number
    // The size of the fragment, which is the total of the size of its
    // content nodes.
    this.size = size || 0;
    if (size == null) { for (var i = 0; i < content.length; i++)
      { this.size += content[i].nodeSize; } }
  };

  var prototypeAccessors = { firstChild: { configurable: true },lastChild: { configurable: true },childCount: { configurable: true } };

  // :: (number, number, (node: Node, start: number, parent: Node, index: number) → ?bool, ?number)
  // Invoke a callback for all descendant nodes between the given two
  // positions (relative to start of this fragment). Doesn't descend
  // into a node when the callback returns `false`.
  Fragment.prototype.nodesBetween = function nodesBetween (from, to, f, nodeStart, parent) {
      if ( nodeStart === void 0 ) nodeStart = 0;

    for (var i = 0, pos = 0; pos < to; i++) {
      var child = this.content[i], end = pos + child.nodeSize;
      if (end > from && f(child, nodeStart + pos, parent, i) !== false && child.content.size) {
        var start = pos + 1;
        child.nodesBetween(Math.max(0, from - start),
                           Math.min(child.content.size, to - start),
                           f, nodeStart + start);
      }
      pos = end;
    }
  };

  // :: ((node: Node, pos: number, parent: Node) → ?bool)
  // Call the given callback for every descendant node. The callback
  // may return `false` to prevent traversal of a given node's children.
  Fragment.prototype.descendants = function descendants (f) {
    this.nodesBetween(0, this.size, f);
  };

  // : (number, number, ?string, ?string) → string
  Fragment.prototype.textBetween = function textBetween (from, to, blockSeparator, leafText) {
    var text = "", separated = true;
    this.nodesBetween(from, to, function (node, pos) {
      if (node.isText) {
        text += node.text.slice(Math.max(from, pos) - pos, to - pos);
        separated = !blockSeparator;
      } else if (node.isLeaf && leafText) {
        text += leafText;
        separated = !blockSeparator;
      } else if (!separated && node.isBlock) {
        text += blockSeparator;
        separated = true;
      }
    }, 0);
    return text
  };

  // :: (Fragment) → Fragment
  // Create a new fragment containing the combined content of this
  // fragment and the other.
  Fragment.prototype.append = function append (other) {
    if (!other.size) { return this }
    if (!this.size) { return other }
    var last = this.lastChild, first = other.firstChild, content = this.content.slice(), i = 0;
    if (last.isText && last.sameMarkup(first)) {
      content[content.length - 1] = last.withText(last.text + first.text);
      i = 1;
    }
    for (; i < other.content.length; i++) { content.push(other.content[i]); }
    return new Fragment(content, this.size + other.size)
  };

  // :: (number, ?number) → Fragment
  // Cut out the sub-fragment between the two given positions.
  Fragment.prototype.cut = function cut (from, to) {
    if (to == null) { to = this.size; }
    if (from == 0 && to == this.size) { return this }
    var result = [], size = 0;
    if (to > from) { for (var i = 0, pos = 0; pos < to; i++) {
      var child = this.content[i], end = pos + child.nodeSize;
      if (end > from) {
        if (pos < from || end > to) {
          if (child.isText)
            { child = child.cut(Math.max(0, from - pos), Math.min(child.text.length, to - pos)); }
          else
            { child = child.cut(Math.max(0, from - pos - 1), Math.min(child.content.size, to - pos - 1)); }
        }
        result.push(child);
        size += child.nodeSize;
      }
      pos = end;
    } }
    return new Fragment(result, size)
  };

  Fragment.prototype.cutByIndex = function cutByIndex (from, to) {
    if (from == to) { return Fragment.empty }
    if (from == 0 && to == this.content.length) { return this }
    return new Fragment(this.content.slice(from, to))
  };

  // :: (number, Node) → Fragment
  // Create a new fragment in which the node at the given index is
  // replaced by the given node.
  Fragment.prototype.replaceChild = function replaceChild (index, node) {
    var current = this.content[index];
    if (current == node) { return this }
    var copy = this.content.slice();
    var size = this.size + node.nodeSize - current.nodeSize;
    copy[index] = node;
    return new Fragment(copy, size)
  };

  // : (Node) → Fragment
  // Create a new fragment by prepending the given node to this
  // fragment.
  Fragment.prototype.addToStart = function addToStart (node) {
    return new Fragment([node].concat(this.content), this.size + node.nodeSize)
  };

  // : (Node) → Fragment
  // Create a new fragment by appending the given node to this
  // fragment.
  Fragment.prototype.addToEnd = function addToEnd (node) {
    return new Fragment(this.content.concat(node), this.size + node.nodeSize)
  };

  // :: (Fragment) → bool
  // Compare this fragment to another one.
  Fragment.prototype.eq = function eq (other) {
    if (this.content.length != other.content.length) { return false }
    for (var i = 0; i < this.content.length; i++)
      { if (!this.content[i].eq(other.content[i])) { return false } }
    return true
  };

  // :: ?Node
  // The first child of the fragment, or `null` if it is empty.
  prototypeAccessors.firstChild.get = function () { return this.content.length ? this.content[0] : null };

  // :: ?Node
  // The last child of the fragment, or `null` if it is empty.
  prototypeAccessors.lastChild.get = function () { return this.content.length ? this.content[this.content.length - 1] : null };

  // :: number
  // The number of child nodes in this fragment.
  prototypeAccessors.childCount.get = function () { return this.content.length };

  // :: (number) → Node
  // Get the child node at the given index. Raise an error when the
  // index is out of range.
  Fragment.prototype.child = function child (index) {
    var found = this.content[index];
    if (!found) { throw new RangeError("Index " + index + " out of range for " + this) }
    return found
  };

  // :: (number) → ?Node
  // Get the child node at the given index, if it exists.
  Fragment.prototype.maybeChild = function maybeChild (index) {
    return this.content[index]
  };

  // :: ((node: Node, offset: number, index: number))
  // Call `f` for every child node, passing the node, its offset
  // into this parent node, and its index.
  Fragment.prototype.forEach = function forEach (f) {
    for (var i = 0, p = 0; i < this.content.length; i++) {
      var child = this.content[i];
      f(child, p, i);
      p += child.nodeSize;
    }
  };

  // :: (Fragment) → ?number
  // Find the first position at which this fragment and another
  // fragment differ, or `null` if they are the same.
  Fragment.prototype.findDiffStart = function findDiffStart$1 (other, pos) {
      if ( pos === void 0 ) pos = 0;

    return findDiffStart(this, other, pos)
  };

  // :: (Fragment) → ?{a: number, b: number}
  // Find the first position, searching from the end, at which this
  // fragment and the given fragment differ, or `null` if they are the
  // same. Since this position will not be the same in both nodes, an
  // object with two separate positions is returned.
  Fragment.prototype.findDiffEnd = function findDiffEnd$1 (other, pos, otherPos) {
      if ( pos === void 0 ) pos = this.size;
      if ( otherPos === void 0 ) otherPos = other.size;

    return findDiffEnd(this, other, pos, otherPos)
  };

  // : (number, ?number) → {index: number, offset: number}
  // Find the index and inner offset corresponding to a given relative
  // position in this fragment. The result object will be reused
  // (overwritten) the next time the function is called. (Not public.)
  Fragment.prototype.findIndex = function findIndex (pos, round) {
      if ( round === void 0 ) round = -1;

    if (pos == 0) { return retIndex(0, pos) }
    if (pos == this.size) { return retIndex(this.content.length, pos) }
    if (pos > this.size || pos < 0) { throw new RangeError(("Position " + pos + " outside of fragment (" + (this) + ")")) }
    for (var i = 0, curPos = 0;; i++) {
      var cur = this.child(i), end = curPos + cur.nodeSize;
      if (end >= pos) {
        if (end == pos || round > 0) { return retIndex(i + 1, end) }
        return retIndex(i, curPos)
      }
      curPos = end;
    }
  };

  // :: () → string
  // Return a debugging string that describes this fragment.
  Fragment.prototype.toString = function toString () { return "<" + this.toStringInner() + ">" };

  Fragment.prototype.toStringInner = function toStringInner () { return this.content.join(", ") };

  // :: () → ?Object
  // Create a JSON-serializeable representation of this fragment.
  Fragment.prototype.toJSON = function toJSON () {
    return this.content.length ? this.content.map(function (n) { return n.toJSON(); }) : null
  };

  // :: (Schema, ?Object) → Fragment
  // Deserialize a fragment from its JSON representation.
  Fragment.fromJSON = function fromJSON (schema, value) {
    if (!value) { return Fragment.empty }
    if (!Array.isArray(value)) { throw new RangeError("Invalid input for Fragment.fromJSON") }
    return new Fragment(value.map(schema.nodeFromJSON))
  };

  // :: ([Node]) → Fragment
  // Build a fragment from an array of nodes. Ensures that adjacent
  // text nodes with the same marks are joined together.
  Fragment.fromArray = function fromArray (array) {
    if (!array.length) { return Fragment.empty }
    var joined, size = 0;
    for (var i = 0; i < array.length; i++) {
      var node = array[i];
      size += node.nodeSize;
      if (i && node.isText && array[i - 1].sameMarkup(node)) {
        if (!joined) { joined = array.slice(0, i); }
        joined[joined.length - 1] = node.withText(joined[joined.length - 1].text + node.text);
      } else if (joined) {
        joined.push(node);
      }
    }
    return new Fragment(joined || array, size)
  };

  // :: (?union<Fragment, Node, [Node]>) → Fragment
  // Create a fragment from something that can be interpreted as a set
  // of nodes. For `null`, it returns the empty fragment. For a
  // fragment, the fragment itself. For a node or array of nodes, a
  // fragment containing those nodes.
  Fragment.from = function from (nodes) {
    if (!nodes) { return Fragment.empty }
    if (nodes instanceof Fragment) { return nodes }
    if (Array.isArray(nodes)) { return this.fromArray(nodes) }
    if (nodes.attrs) { return new Fragment([nodes], nodes.nodeSize) }
    throw new RangeError("Can not convert " + nodes + " to a Fragment" +
                         (nodes.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""))
  };

  Object.defineProperties( Fragment.prototype, prototypeAccessors );

  var found = {index: 0, offset: 0};
  function retIndex(index, offset) {
    found.index = index;
    found.offset = offset;
    return found
  }

  // :: Fragment
  // An empty fragment. Intended to be reused whenever a node doesn't
  // contain anything (rather than allocating a new empty fragment for
  // each leaf node).
  Fragment.empty = new Fragment([], 0);

  function compareDeep(a, b) {
    if (a === b) { return true }
    if (!(a && typeof a == "object") ||
        !(b && typeof b == "object")) { return false }
    var array = Array.isArray(a);
    if (Array.isArray(b) != array) { return false }
    if (array) {
      if (a.length != b.length) { return false }
      for (var i = 0; i < a.length; i++) { if (!compareDeep(a[i], b[i])) { return false } }
    } else {
      for (var p in a) { if (!(p in b) || !compareDeep(a[p], b[p])) { return false } }
      for (var p$1 in b) { if (!(p$1 in a)) { return false } }
    }
    return true
  }

  // ::- A mark is a piece of information that can be attached to a node,
  // such as it being emphasized, in code font, or a link. It has a type
  // and optionally a set of attributes that provide further information
  // (such as the target of the link). Marks are created through a
  // `Schema`, which controls which types exist and which
  // attributes they have.
  var Mark = function Mark(type, attrs) {
    // :: MarkType
    // The type of this mark.
    this.type = type;
    // :: Object
    // The attributes associated with this mark.
    this.attrs = attrs;
  };

  // :: ([Mark]) → [Mark]
  // Given a set of marks, create a new set which contains this one as
  // well, in the right position. If this mark is already in the set,
  // the set itself is returned. If any marks that are set to be
  // [exclusive](#model.MarkSpec.excludes) with this mark are present,
  // those are replaced by this one.
  Mark.prototype.addToSet = function addToSet (set) {
    var copy, placed = false;
    for (var i = 0; i < set.length; i++) {
      var other = set[i];
      if (this.eq(other)) { return set }
      if (this.type.excludes(other.type)) {
        if (!copy) { copy = set.slice(0, i); }
      } else if (other.type.excludes(this.type)) {
        return set
      } else {
        if (!placed && other.type.rank > this.type.rank) {
          if (!copy) { copy = set.slice(0, i); }
          copy.push(this);
          placed = true;
        }
        if (copy) { copy.push(other); }
      }
    }
    if (!copy) { copy = set.slice(); }
    if (!placed) { copy.push(this); }
    return copy
  };

  // :: ([Mark]) → [Mark]
  // Remove this mark from the given set, returning a new set. If this
  // mark is not in the set, the set itself is returned.
  Mark.prototype.removeFromSet = function removeFromSet (set) {
    for (var i = 0; i < set.length; i++)
      { if (this.eq(set[i]))
        { return set.slice(0, i).concat(set.slice(i + 1)) } }
    return set
  };

  // :: ([Mark]) → bool
  // Test whether this mark is in the given set of marks.
  Mark.prototype.isInSet = function isInSet (set) {
    for (var i = 0; i < set.length; i++)
      { if (this.eq(set[i])) { return true } }
    return false
  };

  // :: (Mark) → bool
  // Test whether this mark has the same type and attributes as
  // another mark.
  Mark.prototype.eq = function eq (other) {
    return this == other ||
      (this.type == other.type && compareDeep(this.attrs, other.attrs))
  };

  // :: () → Object
  // Convert this mark to a JSON-serializeable representation.
  Mark.prototype.toJSON = function toJSON () {
    var obj = {type: this.type.name};
    for (var _ in this.attrs) {
      obj.attrs = this.attrs;
      break
    }
    return obj
  };

  // :: (Schema, Object) → Mark
  Mark.fromJSON = function fromJSON (schema, json) {
    if (!json) { throw new RangeError("Invalid input for Mark.fromJSON") }
    var type = schema.marks[json.type];
    if (!type) { throw new RangeError(("There is no mark type " + (json.type) + " in this schema")) }
    return type.create(json.attrs)
  };

  // :: ([Mark], [Mark]) → bool
  // Test whether two sets of marks are identical.
  Mark.sameSet = function sameSet (a, b) {
    if (a == b) { return true }
    if (a.length != b.length) { return false }
    for (var i = 0; i < a.length; i++)
      { if (!a[i].eq(b[i])) { return false } }
    return true
  };

  // :: (?union<Mark, [Mark]>) → [Mark]
  // Create a properly sorted mark set from null, a single mark, or an
  // unsorted array of marks.
  Mark.setFrom = function setFrom (marks) {
    if (!marks || marks.length == 0) { return Mark.none }
    if (marks instanceof Mark) { return [marks] }
    var copy = marks.slice();
    copy.sort(function (a, b) { return a.type.rank - b.type.rank; });
    return copy
  };

  // :: [Mark] The empty set of marks.
  Mark.none = [];

  // ReplaceError:: class extends Error
  // Error type raised by [`Node.replace`](#model.Node.replace) when
  // given an invalid replacement.

  function ReplaceError(message) {
    var err = Error.call(this, message);
    err.__proto__ = ReplaceError.prototype;
    return err
  }

  ReplaceError.prototype = Object.create(Error.prototype);
  ReplaceError.prototype.constructor = ReplaceError;
  ReplaceError.prototype.name = "ReplaceError";

  // ::- A slice represents a piece cut out of a larger document. It
  // stores not only a fragment, but also the depth up to which nodes on
  // both side are ‘open’ (cut through).
  var Slice = function Slice(content, openStart, openEnd) {
    // :: Fragment The slice's content.
    this.content = content;
    // :: number The open depth at the start.
    this.openStart = openStart;
    // :: number The open depth at the end.
    this.openEnd = openEnd;
  };

  var prototypeAccessors$1 = { size: { configurable: true } };

  // :: number
  // The size this slice would add when inserted into a document.
  prototypeAccessors$1.size.get = function () {
    return this.content.size - this.openStart - this.openEnd
  };

  Slice.prototype.insertAt = function insertAt (pos, fragment) {
    var content = insertInto(this.content, pos + this.openStart, fragment, null);
    return content && new Slice(content, this.openStart, this.openEnd)
  };

  Slice.prototype.removeBetween = function removeBetween (from, to) {
    return new Slice(removeRange(this.content, from + this.openStart, to + this.openStart), this.openStart, this.openEnd)
  };

  // :: (Slice) → bool
  // Tests whether this slice is equal to another slice.
  Slice.prototype.eq = function eq (other) {
    return this.content.eq(other.content) && this.openStart == other.openStart && this.openEnd == other.openEnd
  };

  Slice.prototype.toString = function toString () {
    return this.content + "(" + this.openStart + "," + this.openEnd + ")"
  };

  // :: () → ?Object
  // Convert a slice to a JSON-serializable representation.
  Slice.prototype.toJSON = function toJSON () {
    if (!this.content.size) { return null }
    var json = {content: this.content.toJSON()};
    if (this.openStart > 0) { json.openStart = this.openStart; }
    if (this.openEnd > 0) { json.openEnd = this.openEnd; }
    return json
  };

  // :: (Schema, ?Object) → Slice
  // Deserialize a slice from its JSON representation.
  Slice.fromJSON = function fromJSON (schema, json) {
    if (!json) { return Slice.empty }
    var openStart = json.openStart || 0, openEnd = json.openEnd || 0;
    if (typeof openStart != "number" || typeof openEnd != "number")
      { throw new RangeError("Invalid input for Slice.fromJSON") }
    return new Slice(Fragment.fromJSON(schema, json.content), json.openStart || 0, json.openEnd || 0)
  };

  // :: (Fragment, ?bool) → Slice
  // Create a slice from a fragment by taking the maximum possible
  // open value on both side of the fragment.
  Slice.maxOpen = function maxOpen (fragment, openIsolating) {
      if ( openIsolating === void 0 ) openIsolating=true;

    var openStart = 0, openEnd = 0;
    for (var n = fragment.firstChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.firstChild) { openStart++; }
    for (var n$1 = fragment.lastChild; n$1 && !n$1.isLeaf && (openIsolating || !n$1.type.spec.isolating); n$1 = n$1.lastChild) { openEnd++; }
    return new Slice(fragment, openStart, openEnd)
  };

  Object.defineProperties( Slice.prototype, prototypeAccessors$1 );

  function removeRange(content, from, to) {
    var ref = content.findIndex(from);
    var index = ref.index;
    var offset = ref.offset;
    var child = content.maybeChild(index);
    var ref$1 = content.findIndex(to);
    var indexTo = ref$1.index;
    var offsetTo = ref$1.offset;
    if (offset == from || child.isText) {
      if (offsetTo != to && !content.child(indexTo).isText) { throw new RangeError("Removing non-flat range") }
      return content.cut(0, from).append(content.cut(to))
    }
    if (index != indexTo) { throw new RangeError("Removing non-flat range") }
    return content.replaceChild(index, child.copy(removeRange(child.content, from - offset - 1, to - offset - 1)))
  }

  function insertInto(content, dist, insert, parent) {
    var ref = content.findIndex(dist);
    var index = ref.index;
    var offset = ref.offset;
    var child = content.maybeChild(index);
    if (offset == dist || child.isText) {
      if (parent && !parent.canReplace(index, index, insert)) { return null }
      return content.cut(0, dist).append(insert).append(content.cut(dist))
    }
    var inner = insertInto(child.content, dist - offset - 1, insert);
    return inner && content.replaceChild(index, child.copy(inner))
  }

  // :: Slice
  // The empty slice.
  Slice.empty = new Slice(Fragment.empty, 0, 0);

  function replace($from, $to, slice) {
    if (slice.openStart > $from.depth)
      { throw new ReplaceError("Inserted content deeper than insertion position") }
    if ($from.depth - slice.openStart != $to.depth - slice.openEnd)
      { throw new ReplaceError("Inconsistent open depths") }
    return replaceOuter($from, $to, slice, 0)
  }

  function replaceOuter($from, $to, slice, depth) {
    var index = $from.index(depth), node = $from.node(depth);
    if (index == $to.index(depth) && depth < $from.depth - slice.openStart) {
      var inner = replaceOuter($from, $to, slice, depth + 1);
      return node.copy(node.content.replaceChild(index, inner))
    } else if (!slice.content.size) {
      return close(node, replaceTwoWay($from, $to, depth))
    } else if (!slice.openStart && !slice.openEnd && $from.depth == depth && $to.depth == depth) { // Simple, flat case
      var parent = $from.parent, content = parent.content;
      return close(parent, content.cut(0, $from.parentOffset).append(slice.content).append(content.cut($to.parentOffset)))
    } else {
      var ref = prepareSliceForReplace(slice, $from);
      var start = ref.start;
      var end = ref.end;
      return close(node, replaceThreeWay($from, start, end, $to, depth))
    }
  }

  function checkJoin(main, sub) {
    if (!sub.type.compatibleContent(main.type))
      { throw new ReplaceError("Cannot join " + sub.type.name + " onto " + main.type.name) }
  }

  function joinable($before, $after, depth) {
    var node = $before.node(depth);
    checkJoin(node, $after.node(depth));
    return node
  }

  function addNode(child, target) {
    var last = target.length - 1;
    if (last >= 0 && child.isText && child.sameMarkup(target[last]))
      { target[last] = child.withText(target[last].text + child.text); }
    else
      { target.push(child); }
  }

  function addRange($start, $end, depth, target) {
    var node = ($end || $start).node(depth);
    var startIndex = 0, endIndex = $end ? $end.index(depth) : node.childCount;
    if ($start) {
      startIndex = $start.index(depth);
      if ($start.depth > depth) {
        startIndex++;
      } else if ($start.textOffset) {
        addNode($start.nodeAfter, target);
        startIndex++;
      }
    }
    for (var i = startIndex; i < endIndex; i++) { addNode(node.child(i), target); }
    if ($end && $end.depth == depth && $end.textOffset)
      { addNode($end.nodeBefore, target); }
  }

  function close(node, content) {
    if (!node.type.validContent(content))
      { throw new ReplaceError("Invalid content for node " + node.type.name) }
    return node.copy(content)
  }

  function replaceThreeWay($from, $start, $end, $to, depth) {
    var openStart = $from.depth > depth && joinable($from, $start, depth + 1);
    var openEnd = $to.depth > depth && joinable($end, $to, depth + 1);

    var content = [];
    addRange(null, $from, depth, content);
    if (openStart && openEnd && $start.index(depth) == $end.index(depth)) {
      checkJoin(openStart, openEnd);
      addNode(close(openStart, replaceThreeWay($from, $start, $end, $to, depth + 1)), content);
    } else {
      if (openStart)
        { addNode(close(openStart, replaceTwoWay($from, $start, depth + 1)), content); }
      addRange($start, $end, depth, content);
      if (openEnd)
        { addNode(close(openEnd, replaceTwoWay($end, $to, depth + 1)), content); }
    }
    addRange($to, null, depth, content);
    return new Fragment(content)
  }

  function replaceTwoWay($from, $to, depth) {
    var content = [];
    addRange(null, $from, depth, content);
    if ($from.depth > depth) {
      var type = joinable($from, $to, depth + 1);
      addNode(close(type, replaceTwoWay($from, $to, depth + 1)), content);
    }
    addRange($to, null, depth, content);
    return new Fragment(content)
  }

  function prepareSliceForReplace(slice, $along) {
    var extra = $along.depth - slice.openStart, parent = $along.node(extra);
    var node = parent.copy(slice.content);
    for (var i = extra - 1; i >= 0; i--)
      { node = $along.node(i).copy(Fragment.from(node)); }
    return {start: node.resolveNoCache(slice.openStart + extra),
            end: node.resolveNoCache(node.content.size - slice.openEnd - extra)}
  }

  // ::- You can [_resolve_](#model.Node.resolve) a position to get more
  // information about it. Objects of this class represent such a
  // resolved position, providing various pieces of context information,
  // and some helper methods.
  //
  // Throughout this interface, methods that take an optional `depth`
  // parameter will interpret undefined as `this.depth` and negative
  // numbers as `this.depth + value`.
  var ResolvedPos = function ResolvedPos(pos, path, parentOffset) {
    // :: number The position that was resolved.
    this.pos = pos;
    this.path = path;
    // :: number
    // The number of levels the parent node is from the root. If this
    // position points directly into the root node, it is 0. If it
    // points into a top-level paragraph, 1, and so on.
    this.depth = path.length / 3 - 1;
    // :: number The offset this position has into its parent node.
    this.parentOffset = parentOffset;
  };

  var prototypeAccessors$2 = { parent: { configurable: true },doc: { configurable: true },textOffset: { configurable: true },nodeAfter: { configurable: true },nodeBefore: { configurable: true } };

  ResolvedPos.prototype.resolveDepth = function resolveDepth (val) {
    if (val == null) { return this.depth }
    if (val < 0) { return this.depth + val }
    return val
  };

  // :: Node
  // The parent node that the position points into. Note that even if
  // a position points into a text node, that node is not considered
  // the parent—text nodes are ‘flat’ in this model, and have no content.
  prototypeAccessors$2.parent.get = function () { return this.node(this.depth) };

  // :: Node
  // The root node in which the position was resolved.
  prototypeAccessors$2.doc.get = function () { return this.node(0) };

  // :: (?number) → Node
  // The ancestor node at the given level. `p.node(p.depth)` is the
  // same as `p.parent`.
  ResolvedPos.prototype.node = function node (depth) { return this.path[this.resolveDepth(depth) * 3] };

  // :: (?number) → number
  // The index into the ancestor at the given level. If this points at
  // the 3rd node in the 2nd paragraph on the top level, for example,
  // `p.index(0)` is 1 and `p.index(1)` is 2.
  ResolvedPos.prototype.index = function index (depth) { return this.path[this.resolveDepth(depth) * 3 + 1] };

  // :: (?number) → number
  // The index pointing after this position into the ancestor at the
  // given level.
  ResolvedPos.prototype.indexAfter = function indexAfter (depth) {
    depth = this.resolveDepth(depth);
    return this.index(depth) + (depth == this.depth && !this.textOffset ? 0 : 1)
  };

  // :: (?number) → number
  // The (absolute) position at the start of the node at the given
  // level.
  ResolvedPos.prototype.start = function start (depth) {
    depth = this.resolveDepth(depth);
    return depth == 0 ? 0 : this.path[depth * 3 - 1] + 1
  };

  // :: (?number) → number
  // The (absolute) position at the end of the node at the given
  // level.
  ResolvedPos.prototype.end = function end (depth) {
    depth = this.resolveDepth(depth);
    return this.start(depth) + this.node(depth).content.size
  };

  // :: (?number) → number
  // The (absolute) position directly before the wrapping node at the
  // given level, or, when `depth` is `this.depth + 1`, the original
  // position.
  ResolvedPos.prototype.before = function before (depth) {
    depth = this.resolveDepth(depth);
    if (!depth) { throw new RangeError("There is no position before the top-level node") }
    return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1]
  };

  // :: (?number) → number
  // The (absolute) position directly after the wrapping node at the
  // given level, or the original position when `depth` is `this.depth + 1`.
  ResolvedPos.prototype.after = function after (depth) {
    depth = this.resolveDepth(depth);
    if (!depth) { throw new RangeError("There is no position after the top-level node") }
    return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1] + this.path[depth * 3].nodeSize
  };

  // :: number
  // When this position points into a text node, this returns the
  // distance between the position and the start of the text node.
  // Will be zero for positions that point between nodes.
  prototypeAccessors$2.textOffset.get = function () { return this.pos - this.path[this.path.length - 1] };

  // :: ?Node
  // Get the node directly after the position, if any. If the position
  // points into a text node, only the part of that node after the
  // position is returned.
  prototypeAccessors$2.nodeAfter.get = function () {
    var parent = this.parent, index = this.index(this.depth);
    if (index == parent.childCount) { return null }
    var dOff = this.pos - this.path[this.path.length - 1], child = parent.child(index);
    return dOff ? parent.child(index).cut(dOff) : child
  };

  // :: ?Node
  // Get the node directly before the position, if any. If the
  // position points into a text node, only the part of that node
  // before the position is returned.
  prototypeAccessors$2.nodeBefore.get = function () {
    var index = this.index(this.depth);
    var dOff = this.pos - this.path[this.path.length - 1];
    if (dOff) { return this.parent.child(index).cut(0, dOff) }
    return index == 0 ? null : this.parent.child(index - 1)
  };

  // :: () → [Mark]
  // Get the marks at this position, factoring in the surrounding
  // marks' [`inclusive`](#model.MarkSpec.inclusive) property. If the
  // position is at the start of a non-empty node, the marks of the
  // node after it (if any) are returned.
  ResolvedPos.prototype.marks = function marks () {
    var parent = this.parent, index = this.index();

    // In an empty parent, return the empty array
    if (parent.content.size == 0) { return Mark.none }

    // When inside a text node, just return the text node's marks
    if (this.textOffset) { return parent.child(index).marks }

    var main = parent.maybeChild(index - 1), other = parent.maybeChild(index);
    // If the `after` flag is true of there is no node before, make
    // the node after this position the main reference.
    if (!main) { var tmp = main; main = other; other = tmp; }

    // Use all marks in the main node, except those that have
    // `inclusive` set to false and are not present in the other node.
    var marks = main.marks;
    for (var i = 0; i < marks.length; i++)
      { if (marks[i].type.spec.inclusive === false && (!other || !marks[i].isInSet(other.marks)))
        { marks = marks[i--].removeFromSet(marks); } }

    return marks
  };

  // :: (ResolvedPos) → ?[Mark]
  // Get the marks after the current position, if any, except those
  // that are non-inclusive and not present at position `$end`. This
  // is mostly useful for getting the set of marks to preserve after a
  // deletion. Will return `null` if this position is at the end of
  // its parent node or its parent node isn't a textblock (in which
  // case no marks should be preserved).
  ResolvedPos.prototype.marksAcross = function marksAcross ($end) {
    var after = this.parent.maybeChild(this.index());
    if (!after || !after.isInline) { return null }

    var marks = after.marks, next = $end.parent.maybeChild($end.index());
    for (var i = 0; i < marks.length; i++)
      { if (marks[i].type.spec.inclusive === false && (!next || !marks[i].isInSet(next.marks)))
        { marks = marks[i--].removeFromSet(marks); } }
    return marks
  };

  // :: (number) → number
  // The depth up to which this position and the given (non-resolved)
  // position share the same parent nodes.
  ResolvedPos.prototype.sharedDepth = function sharedDepth (pos) {
    for (var depth = this.depth; depth > 0; depth--)
      { if (this.start(depth) <= pos && this.end(depth) >= pos) { return depth } }
    return 0
  };

  // :: (?ResolvedPos, ?(Node) → bool) → ?NodeRange
  // Returns a range based on the place where this position and the
  // given position diverge around block content. If both point into
  // the same textblock, for example, a range around that textblock
  // will be returned. If they point into different blocks, the range
  // around those blocks in their shared ancestor is returned. You can
  // pass in an optional predicate that will be called with a parent
  // node to see if a range into that parent is acceptable.
  ResolvedPos.prototype.blockRange = function blockRange (other, pred) {
      if ( other === void 0 ) other = this;

    if (other.pos < this.pos) { return other.blockRange(this) }
    for (var d = this.depth - (this.parent.inlineContent || this.pos == other.pos ? 1 : 0); d >= 0; d--)
      { if (other.pos <= this.end(d) && (!pred || pred(this.node(d))))
        { return new NodeRange(this, other, d) } }
  };

  // :: (ResolvedPos) → bool
  // Query whether the given position shares the same parent node.
  ResolvedPos.prototype.sameParent = function sameParent (other) {
    return this.pos - this.parentOffset == other.pos - other.parentOffset
  };

  // :: (ResolvedPos) → ResolvedPos
  // Return the greater of this and the given position.
  ResolvedPos.prototype.max = function max (other) {
    return other.pos > this.pos ? other : this
  };

  // :: (ResolvedPos) → ResolvedPos
  // Return the smaller of this and the given position.
  ResolvedPos.prototype.min = function min (other) {
    return other.pos < this.pos ? other : this
  };

  ResolvedPos.prototype.toString = function toString () {
    var str = "";
    for (var i = 1; i <= this.depth; i++)
      { str += (str ? "/" : "") + this.node(i).type.name + "_" + this.index(i - 1); }
    return str + ":" + this.parentOffset
  };

  ResolvedPos.resolve = function resolve (doc, pos) {
    if (!(pos >= 0 && pos <= doc.content.size)) { throw new RangeError("Position " + pos + " out of range") }
    var path = [];
    var start = 0, parentOffset = pos;
    for (var node = doc;;) {
      var ref = node.content.findIndex(parentOffset);
        var index = ref.index;
        var offset = ref.offset;
      var rem = parentOffset - offset;
      path.push(node, index, start + offset);
      if (!rem) { break }
      node = node.child(index);
      if (node.isText) { break }
      parentOffset = rem - 1;
      start += offset + 1;
    }
    return new ResolvedPos(pos, path, parentOffset)
  };

  ResolvedPos.resolveCached = function resolveCached (doc, pos) {
    for (var i = 0; i < resolveCache.length; i++) {
      var cached = resolveCache[i];
      if (cached.pos == pos && cached.doc == doc) { return cached }
    }
    var result = resolveCache[resolveCachePos] = ResolvedPos.resolve(doc, pos);
    resolveCachePos = (resolveCachePos + 1) % resolveCacheSize;
    return result
  };

  Object.defineProperties( ResolvedPos.prototype, prototypeAccessors$2 );

  var resolveCache = [], resolveCachePos = 0, resolveCacheSize = 12;

  // ::- Represents a flat range of content, i.e. one that starts and
  // ends in the same node.
  var NodeRange = function NodeRange($from, $to, depth) {
    // :: ResolvedPos A resolved position along the start of the
    // content. May have a `depth` greater than this object's `depth`
    // property, since these are the positions that were used to
    // compute the range, not re-resolved positions directly at its
    // boundaries.
    this.$from = $from;
    // :: ResolvedPos A position along the end of the content. See
    // caveat for [`$from`](#model.NodeRange.$from).
    this.$to = $to;
    // :: number The depth of the node that this range points into.
    this.depth = depth;
  };

  var prototypeAccessors$1$1 = { start: { configurable: true },end: { configurable: true },parent: { configurable: true },startIndex: { configurable: true },endIndex: { configurable: true } };

  // :: number The position at the start of the range.
  prototypeAccessors$1$1.start.get = function () { return this.$from.before(this.depth + 1) };
  // :: number The position at the end of the range.
  prototypeAccessors$1$1.end.get = function () { return this.$to.after(this.depth + 1) };

  // :: Node The parent node that the range points into.
  prototypeAccessors$1$1.parent.get = function () { return this.$from.node(this.depth) };
  // :: number The start index of the range in the parent node.
  prototypeAccessors$1$1.startIndex.get = function () { return this.$from.index(this.depth) };
  // :: number The end index of the range in the parent node.
  prototypeAccessors$1$1.endIndex.get = function () { return this.$to.indexAfter(this.depth) };

  Object.defineProperties( NodeRange.prototype, prototypeAccessors$1$1 );

  var emptyAttrs = Object.create(null);

  // ::- This class represents a node in the tree that makes up a
  // ProseMirror document. So a document is an instance of `Node`, with
  // children that are also instances of `Node`.
  //
  // Nodes are persistent data structures. Instead of changing them, you
  // create new ones with the content you want. Old ones keep pointing
  // at the old document shape. This is made cheaper by sharing
  // structure between the old and new data as much as possible, which a
  // tree shape like this (without back pointers) makes easy.
  //
  // **Do not** directly mutate the properties of a `Node` object. See
  // [the guide](/docs/guide/#doc) for more information.
  var Node$1 = function Node(type, attrs, content, marks) {
    // :: NodeType
    // The type of node that this is.
    this.type = type;

    // :: Object
    // An object mapping attribute names to values. The kind of
    // attributes allowed and required are
    // [determined](#model.NodeSpec.attrs) by the node type.
    this.attrs = attrs;

    // :: Fragment
    // A container holding the node's children.
    this.content = content || Fragment.empty;

    // :: [Mark]
    // The marks (things like whether it is emphasized or part of a
    // link) applied to this node.
    this.marks = marks || Mark.none;
  };

  var prototypeAccessors$3 = { nodeSize: { configurable: true },childCount: { configurable: true },textContent: { configurable: true },firstChild: { configurable: true },lastChild: { configurable: true },isBlock: { configurable: true },isTextblock: { configurable: true },inlineContent: { configurable: true },isInline: { configurable: true },isText: { configurable: true },isLeaf: { configurable: true },isAtom: { configurable: true } };

  // text:: ?string
  // For text nodes, this contains the node's text content.

  // :: number
  // The size of this node, as defined by the integer-based [indexing
  // scheme](/docs/guide/#doc.indexing). For text nodes, this is the
  // amount of characters. For other leaf nodes, it is one. For
  // non-leaf nodes, it is the size of the content plus two (the start
  // and end token).
  prototypeAccessors$3.nodeSize.get = function () { return this.isLeaf ? 1 : 2 + this.content.size };

  // :: number
  // The number of children that the node has.
  prototypeAccessors$3.childCount.get = function () { return this.content.childCount };

  // :: (number) → Node
  // Get the child node at the given index. Raises an error when the
  // index is out of range.
  Node$1.prototype.child = function child (index) { return this.content.child(index) };

  // :: (number) → ?Node
  // Get the child node at the given index, if it exists.
  Node$1.prototype.maybeChild = function maybeChild (index) { return this.content.maybeChild(index) };

  // :: ((node: Node, offset: number, index: number))
  // Call `f` for every child node, passing the node, its offset
  // into this parent node, and its index.
  Node$1.prototype.forEach = function forEach (f) { this.content.forEach(f); };

  // :: (number, number, (node: Node, pos: number, parent: Node, index: number) → ?bool, ?number)
  // Invoke a callback for all descendant nodes recursively between
  // the given two positions that are relative to start of this node's
  // content. The callback is invoked with the node, its
  // parent-relative position, its parent node, and its child index.
  // When the callback returns false for a given node, that node's
  // children will not be recursed over. The last parameter can be
  // used to specify a starting position to count from.
  Node$1.prototype.nodesBetween = function nodesBetween (from, to, f, startPos) {
      if ( startPos === void 0 ) startPos = 0;

    this.content.nodesBetween(from, to, f, startPos, this);
  };

  // :: ((node: Node, pos: number, parent: Node) → ?bool)
  // Call the given callback for every descendant node. Doesn't
  // descend into a node when the callback returns `false`.
  Node$1.prototype.descendants = function descendants (f) {
    this.nodesBetween(0, this.content.size, f);
  };

  // :: string
  // Concatenates all the text nodes found in this fragment and its
  // children.
  prototypeAccessors$3.textContent.get = function () { return this.textBetween(0, this.content.size, "") };

  // :: (number, number, ?string, ?string) → string
  // Get all text between positions `from` and `to`. When
  // `blockSeparator` is given, it will be inserted whenever a new
  // block node is started. When `leafText` is given, it'll be
  // inserted for every non-text leaf node encountered.
  Node$1.prototype.textBetween = function textBetween (from, to, blockSeparator, leafText) {
    return this.content.textBetween(from, to, blockSeparator, leafText)
  };

  // :: ?Node
  // Returns this node's first child, or `null` if there are no
  // children.
  prototypeAccessors$3.firstChild.get = function () { return this.content.firstChild };

  // :: ?Node
  // Returns this node's last child, or `null` if there are no
  // children.
  prototypeAccessors$3.lastChild.get = function () { return this.content.lastChild };

  // :: (Node) → bool
  // Test whether two nodes represent the same piece of document.
  Node$1.prototype.eq = function eq (other) {
    return this == other || (this.sameMarkup(other) && this.content.eq(other.content))
  };

  // :: (Node) → bool
  // Compare the markup (type, attributes, and marks) of this node to
  // those of another. Returns `true` if both have the same markup.
  Node$1.prototype.sameMarkup = function sameMarkup (other) {
    return this.hasMarkup(other.type, other.attrs, other.marks)
  };

  // :: (NodeType, ?Object, ?[Mark]) → bool
  // Check whether this node's markup correspond to the given type,
  // attributes, and marks.
  Node$1.prototype.hasMarkup = function hasMarkup (type, attrs, marks) {
    return this.type == type &&
      compareDeep(this.attrs, attrs || type.defaultAttrs || emptyAttrs) &&
      Mark.sameSet(this.marks, marks || Mark.none)
  };

  // :: (?Fragment) → Node
  // Create a new node with the same markup as this node, containing
  // the given content (or empty, if no content is given).
  Node$1.prototype.copy = function copy (content) {
      if ( content === void 0 ) content = null;

    if (content == this.content) { return this }
    return new this.constructor(this.type, this.attrs, content, this.marks)
  };

  // :: ([Mark]) → Node
  // Create a copy of this node, with the given set of marks instead
  // of the node's own marks.
  Node$1.prototype.mark = function mark (marks) {
    return marks == this.marks ? this : new this.constructor(this.type, this.attrs, this.content, marks)
  };

  // :: (number, ?number) → Node
  // Create a copy of this node with only the content between the
  // given positions. If `to` is not given, it defaults to the end of
  // the node.
  Node$1.prototype.cut = function cut (from, to) {
    if (from == 0 && to == this.content.size) { return this }
    return this.copy(this.content.cut(from, to))
  };

  // :: (number, ?number) → Slice
  // Cut out the part of the document between the given positions, and
  // return it as a `Slice` object.
  Node$1.prototype.slice = function slice (from, to, includeParents) {
      if ( to === void 0 ) to = this.content.size;
      if ( includeParents === void 0 ) includeParents = false;

    if (from == to) { return Slice.empty }

    var $from = this.resolve(from), $to = this.resolve(to);
    var depth = includeParents ? 0 : $from.sharedDepth(to);
    var start = $from.start(depth), node = $from.node(depth);
    var content = node.content.cut($from.pos - start, $to.pos - start);
    return new Slice(content, $from.depth - depth, $to.depth - depth)
  };

  // :: (number, number, Slice) → Node
  // Replace the part of the document between the given positions with
  // the given slice. The slice must 'fit', meaning its open sides
  // must be able to connect to the surrounding content, and its
  // content nodes must be valid children for the node they are placed
  // into. If any of this is violated, an error of type
  // [`ReplaceError`](#model.ReplaceError) is thrown.
  Node$1.prototype.replace = function replace$1 (from, to, slice) {
    return replace(this.resolve(from), this.resolve(to), slice)
  };

  // :: (number) → ?Node
  // Find the node directly after the given position.
  Node$1.prototype.nodeAt = function nodeAt (pos) {
    for (var node = this;;) {
      var ref = node.content.findIndex(pos);
        var index = ref.index;
        var offset = ref.offset;
      node = node.maybeChild(index);
      if (!node) { return null }
      if (offset == pos || node.isText) { return node }
      pos -= offset + 1;
    }
  };

  // :: (number) → {node: ?Node, index: number, offset: number}
  // Find the (direct) child node after the given offset, if any,
  // and return it along with its index and offset relative to this
  // node.
  Node$1.prototype.childAfter = function childAfter (pos) {
    var ref = this.content.findIndex(pos);
      var index = ref.index;
      var offset = ref.offset;
    return {node: this.content.maybeChild(index), index: index, offset: offset}
  };

  // :: (number) → {node: ?Node, index: number, offset: number}
  // Find the (direct) child node before the given offset, if any,
  // and return it along with its index and offset relative to this
  // node.
  Node$1.prototype.childBefore = function childBefore (pos) {
    if (pos == 0) { return {node: null, index: 0, offset: 0} }
    var ref = this.content.findIndex(pos);
      var index = ref.index;
      var offset = ref.offset;
    if (offset < pos) { return {node: this.content.child(index), index: index, offset: offset} }
    var node = this.content.child(index - 1);
    return {node: node, index: index - 1, offset: offset - node.nodeSize}
  };

  // :: (number) → ResolvedPos
  // Resolve the given position in the document, returning an
  // [object](#model.ResolvedPos) with information about its context.
  Node$1.prototype.resolve = function resolve (pos) { return ResolvedPos.resolveCached(this, pos) };

  Node$1.prototype.resolveNoCache = function resolveNoCache (pos) { return ResolvedPos.resolve(this, pos) };

  // :: (number, number, MarkType) → bool
  // Test whether a mark of the given type occurs in this document
  // between the two given positions.
  Node$1.prototype.rangeHasMark = function rangeHasMark (from, to, type) {
    var found = false;
    if (to > from) { this.nodesBetween(from, to, function (node) {
      if (type.isInSet(node.marks)) { found = true; }
      return !found
    }); }
    return found
  };

  // :: bool
  // True when this is a block (non-inline node)
  prototypeAccessors$3.isBlock.get = function () { return this.type.isBlock };

  // :: bool
  // True when this is a textblock node, a block node with inline
  // content.
  prototypeAccessors$3.isTextblock.get = function () { return this.type.isTextblock };

  // :: bool
  // True when this node allows inline content.
  prototypeAccessors$3.inlineContent.get = function () { return this.type.inlineContent };

  // :: bool
  // True when this is an inline node (a text node or a node that can
  // appear among text).
  prototypeAccessors$3.isInline.get = function () { return this.type.isInline };

  // :: bool
  // True when this is a text node.
  prototypeAccessors$3.isText.get = function () { return this.type.isText };

  // :: bool
  // True when this is a leaf node.
  prototypeAccessors$3.isLeaf.get = function () { return this.type.isLeaf };

  // :: bool
  // True when this is an atom, i.e. when it does not have directly
  // editable content. This is usually the same as `isLeaf`, but can
  // be configured with the [`atom` property](#model.NodeSpec.atom) on
  // a node's spec (typically used when the node is displayed as an
  // uneditable [node view](#view.NodeView)).
  prototypeAccessors$3.isAtom.get = function () { return this.type.isAtom };

  // :: () → string
  // Return a string representation of this node for debugging
  // purposes.
  Node$1.prototype.toString = function toString () {
    if (this.type.spec.toDebugString) { return this.type.spec.toDebugString(this) }
    var name = this.type.name;
    if (this.content.size)
      { name += "(" + this.content.toStringInner() + ")"; }
    return wrapMarks(this.marks, name)
  };

  // :: (number) → ContentMatch
  // Get the content match in this node at the given index.
  Node$1.prototype.contentMatchAt = function contentMatchAt (index) {
    var match = this.type.contentMatch.matchFragment(this.content, 0, index);
    if (!match) { throw new Error("Called contentMatchAt on a node with invalid content") }
    return match
  };

  // :: (number, number, ?Fragment, ?number, ?number) → bool
  // Test whether replacing the range between `from` and `to` (by
  // child index) with the given replacement fragment (which defaults
  // to the empty fragment) would leave the node's content valid. You
  // can optionally pass `start` and `end` indices into the
  // replacement fragment.
  Node$1.prototype.canReplace = function canReplace (from, to, replacement, start, end) {
      if ( replacement === void 0 ) replacement = Fragment.empty;
      if ( start === void 0 ) start = 0;
      if ( end === void 0 ) end = replacement.childCount;

    var one = this.contentMatchAt(from).matchFragment(replacement, start, end);
    var two = one && one.matchFragment(this.content, to);
    if (!two || !two.validEnd) { return false }
    for (var i = start; i < end; i++) { if (!this.type.allowsMarks(replacement.child(i).marks)) { return false } }
    return true
  };

  // :: (number, number, NodeType, ?[Mark]) → bool
  // Test whether replacing the range `from` to `to` (by index) with a
  // node of the given type would leave the node's content valid.
  Node$1.prototype.canReplaceWith = function canReplaceWith (from, to, type, marks) {
    if (marks && !this.type.allowsMarks(marks)) { return false }
    var start = this.contentMatchAt(from).matchType(type);
    var end = start && start.matchFragment(this.content, to);
    return end ? end.validEnd : false
  };

  // :: (Node) → bool
  // Test whether the given node's content could be appended to this
  // node. If that node is empty, this will only return true if there
  // is at least one node type that can appear in both nodes (to avoid
  // merging completely incompatible nodes).
  Node$1.prototype.canAppend = function canAppend (other) {
    if (other.content.size) { return this.canReplace(this.childCount, this.childCount, other.content) }
    else { return this.type.compatibleContent(other.type) }
  };

  // Unused. Left for backwards compatibility.
  Node$1.prototype.defaultContentType = function defaultContentType (at) {
    return this.contentMatchAt(at).defaultType
  };

  // :: ()
  // Check whether this node and its descendants conform to the
  // schema, and raise error when they do not.
  Node$1.prototype.check = function check () {
    if (!this.type.validContent(this.content))
      { throw new RangeError(("Invalid content for node " + (this.type.name) + ": " + (this.content.toString().slice(0, 50)))) }
    this.content.forEach(function (node) { return node.check(); });
  };

  // :: () → Object
  // Return a JSON-serializeable representation of this node.
  Node$1.prototype.toJSON = function toJSON () {
    var obj = {type: this.type.name};
    for (var _ in this.attrs) {
      obj.attrs = this.attrs;
      break
    }
    if (this.content.size)
      { obj.content = this.content.toJSON(); }
    if (this.marks.length)
      { obj.marks = this.marks.map(function (n) { return n.toJSON(); }); }
    return obj
  };

  // :: (Schema, Object) → Node
  // Deserialize a node from its JSON representation.
  Node$1.fromJSON = function fromJSON (schema, json) {
    if (!json) { throw new RangeError("Invalid input for Node.fromJSON") }
    var marks = null;
    if (json.marks) {
      if (!Array.isArray(json.marks)) { throw new RangeError("Invalid mark data for Node.fromJSON") }
      marks = json.marks.map(schema.markFromJSON);
    }
    if (json.type == "text") {
      if (typeof json.text != "string") { throw new RangeError("Invalid text node in JSON") }
      return schema.text(json.text, marks)
    }
    var content = Fragment.fromJSON(schema, json.content);
    return schema.nodeType(json.type).create(json.attrs, content, marks)
  };

  Object.defineProperties( Node$1.prototype, prototypeAccessors$3 );

  var TextNode = /*@__PURE__*/(function (Node) {
    function TextNode(type, attrs, content, marks) {
      Node.call(this, type, attrs, null, marks);

      if (!content) { throw new RangeError("Empty text nodes are not allowed") }

      this.text = content;
    }

    if ( Node ) TextNode.__proto__ = Node;
    TextNode.prototype = Object.create( Node && Node.prototype );
    TextNode.prototype.constructor = TextNode;

    var prototypeAccessors$1 = { textContent: { configurable: true },nodeSize: { configurable: true } };

    TextNode.prototype.toString = function toString () {
      if (this.type.spec.toDebugString) { return this.type.spec.toDebugString(this) }
      return wrapMarks(this.marks, JSON.stringify(this.text))
    };

    prototypeAccessors$1.textContent.get = function () { return this.text };

    TextNode.prototype.textBetween = function textBetween (from, to) { return this.text.slice(from, to) };

    prototypeAccessors$1.nodeSize.get = function () { return this.text.length };

    TextNode.prototype.mark = function mark (marks) {
      return marks == this.marks ? this : new TextNode(this.type, this.attrs, this.text, marks)
    };

    TextNode.prototype.withText = function withText (text) {
      if (text == this.text) { return this }
      return new TextNode(this.type, this.attrs, text, this.marks)
    };

    TextNode.prototype.cut = function cut (from, to) {
      if ( from === void 0 ) from = 0;
      if ( to === void 0 ) to = this.text.length;

      if (from == 0 && to == this.text.length) { return this }
      return this.withText(this.text.slice(from, to))
    };

    TextNode.prototype.eq = function eq (other) {
      return this.sameMarkup(other) && this.text == other.text
    };

    TextNode.prototype.toJSON = function toJSON () {
      var base = Node.prototype.toJSON.call(this);
      base.text = this.text;
      return base
    };

    Object.defineProperties( TextNode.prototype, prototypeAccessors$1 );

    return TextNode;
  }(Node$1));

  function wrapMarks(marks, str) {
    for (var i = marks.length - 1; i >= 0; i--)
      { str = marks[i].type.name + "(" + str + ")"; }
    return str
  }

  // ::- Instances of this class represent a match state of a node
  // type's [content expression](#model.NodeSpec.content), and can be
  // used to find out whether further content matches here, and whether
  // a given position is a valid end of the node.
  var ContentMatch = function ContentMatch(validEnd) {
    // :: bool
    // True when this match state represents a valid end of the node.
    this.validEnd = validEnd;
    this.next = [];
    this.wrapCache = [];
  };

  var prototypeAccessors$4 = { inlineContent: { configurable: true },defaultType: { configurable: true },edgeCount: { configurable: true } };

  ContentMatch.parse = function parse (string, nodeTypes) {
    var stream = new TokenStream(string, nodeTypes);
    if (stream.next == null) { return ContentMatch.empty }
    var expr = parseExpr(stream);
    if (stream.next) { stream.err("Unexpected trailing text"); }
    var match = dfa(nfa(expr));
    checkForDeadEnds(match, stream);
    return match
  };

  // :: (NodeType) → ?ContentMatch
  // Match a node type, returning a match after that node if
  // successful.
  ContentMatch.prototype.matchType = function matchType (type) {
    for (var i = 0; i < this.next.length; i += 2)
      { if (this.next[i] == type) { return this.next[i + 1] } }
    return null
  };

  // :: (Fragment, ?number, ?number) → ?ContentMatch
  // Try to match a fragment. Returns the resulting match when
  // successful.
  ContentMatch.prototype.matchFragment = function matchFragment (frag, start, end) {
      if ( start === void 0 ) start = 0;
      if ( end === void 0 ) end = frag.childCount;

    var cur = this;
    for (var i = start; cur && i < end; i++)
      { cur = cur.matchType(frag.child(i).type); }
    return cur
  };

  prototypeAccessors$4.inlineContent.get = function () {
    var first = this.next[0];
    return first ? first.isInline : false
  };

  // :: ?NodeType
  // Get the first matching node type at this match position that can
  // be generated.
  prototypeAccessors$4.defaultType.get = function () {
    for (var i = 0; i < this.next.length; i += 2) {
      var type = this.next[i];
      if (!(type.isText || type.hasRequiredAttrs())) { return type }
    }
  };

  ContentMatch.prototype.compatible = function compatible (other) {
    for (var i = 0; i < this.next.length; i += 2)
      { for (var j = 0; j < other.next.length; j += 2)
        { if (this.next[i] == other.next[j]) { return true } } }
    return false
  };

  // :: (Fragment, bool, ?number) → ?Fragment
  // Try to match the given fragment, and if that fails, see if it can
  // be made to match by inserting nodes in front of it. When
  // successful, return a fragment of inserted nodes (which may be
  // empty if nothing had to be inserted). When `toEnd` is true, only
  // return a fragment if the resulting match goes to the end of the
  // content expression.
  ContentMatch.prototype.fillBefore = function fillBefore (after, toEnd, startIndex) {
      if ( toEnd === void 0 ) toEnd = false;
      if ( startIndex === void 0 ) startIndex = 0;

    var seen = [this];
    function search(match, types) {
      var finished = match.matchFragment(after, startIndex);
      if (finished && (!toEnd || finished.validEnd))
        { return Fragment.from(types.map(function (tp) { return tp.createAndFill(); })) }

      for (var i = 0; i < match.next.length; i += 2) {
        var type = match.next[i], next = match.next[i + 1];
        if (!(type.isText || type.hasRequiredAttrs()) && seen.indexOf(next) == -1) {
          seen.push(next);
          var found = search(next, types.concat(type));
          if (found) { return found }
        }
      }
    }

    return search(this, [])
  };

  // :: (NodeType) → ?[NodeType]
  // Find a set of wrapping node types that would allow a node of the
  // given type to appear at this position. The result may be empty
  // (when it fits directly) and will be null when no such wrapping
  // exists.
  ContentMatch.prototype.findWrapping = function findWrapping (target) {
    for (var i = 0; i < this.wrapCache.length; i += 2)
      { if (this.wrapCache[i] == target) { return this.wrapCache[i + 1] } }
    var computed = this.computeWrapping(target);
    this.wrapCache.push(target, computed);
    return computed
  };

  ContentMatch.prototype.computeWrapping = function computeWrapping (target) {
    var seen = Object.create(null), active = [{match: this, type: null, via: null}];
    while (active.length) {
      var current = active.shift(), match = current.match;
      if (match.matchType(target)) {
        var result = [];
        for (var obj = current; obj.type; obj = obj.via)
          { result.push(obj.type); }
        return result.reverse()
      }
      for (var i = 0; i < match.next.length; i += 2) {
        var type = match.next[i];
        if (!type.isLeaf && !type.hasRequiredAttrs() && !(type.name in seen) && (!current.type || match.next[i + 1].validEnd)) {
          active.push({match: type.contentMatch, type: type, via: current});
          seen[type.name] = true;
        }
      }
    }
  };

  // :: number
  // The number of outgoing edges this node has in the finite
  // automaton that describes the content expression.
  prototypeAccessors$4.edgeCount.get = function () {
    return this.next.length >> 1
  };

  // :: (number) → {type: NodeType, next: ContentMatch}
  // Get the _n_​th outgoing edge from this node in the finite
  // automaton that describes the content expression.
  ContentMatch.prototype.edge = function edge (n) {
    var i = n << 1;
    if (i >= this.next.length) { throw new RangeError(("There's no " + n + "th edge in this content match")) }
    return {type: this.next[i], next: this.next[i + 1]}
  };

  ContentMatch.prototype.toString = function toString () {
    var seen = [];
    function scan(m) {
      seen.push(m);
      for (var i = 1; i < m.next.length; i += 2)
        { if (seen.indexOf(m.next[i]) == -1) { scan(m.next[i]); } }
    }
    scan(this);
    return seen.map(function (m, i) {
      var out = i + (m.validEnd ? "*" : " ") + " ";
      for (var i$1 = 0; i$1 < m.next.length; i$1 += 2)
        { out += (i$1 ? ", " : "") + m.next[i$1].name + "->" + seen.indexOf(m.next[i$1 + 1]); }
      return out
    }).join("\n")
  };

  Object.defineProperties( ContentMatch.prototype, prototypeAccessors$4 );

  ContentMatch.empty = new ContentMatch(true);

  var TokenStream = function TokenStream(string, nodeTypes) {
    this.string = string;
    this.nodeTypes = nodeTypes;
    this.inline = null;
    this.pos = 0;
    this.tokens = string.split(/\s*(?=\b|\W|$)/);
    if (this.tokens[this.tokens.length - 1] == "") { this.tokens.pop(); }
    if (this.tokens[0] == "") { this.tokens.unshift(); }
  };

  var prototypeAccessors$1$2 = { next: { configurable: true } };

  prototypeAccessors$1$2.next.get = function () { return this.tokens[this.pos] };

  TokenStream.prototype.eat = function eat (tok) { return this.next == tok && (this.pos++ || true) };

  TokenStream.prototype.err = function err (str) { throw new SyntaxError(str + " (in content expression '" + this.string + "')") };

  Object.defineProperties( TokenStream.prototype, prototypeAccessors$1$2 );

  function parseExpr(stream) {
    var exprs = [];
    do { exprs.push(parseExprSeq(stream)); }
    while (stream.eat("|"))
    return exprs.length == 1 ? exprs[0] : {type: "choice", exprs: exprs}
  }

  function parseExprSeq(stream) {
    var exprs = [];
    do { exprs.push(parseExprSubscript(stream)); }
    while (stream.next && stream.next != ")" && stream.next != "|")
    return exprs.length == 1 ? exprs[0] : {type: "seq", exprs: exprs}
  }

  function parseExprSubscript(stream) {
    var expr = parseExprAtom(stream);
    for (;;) {
      if (stream.eat("+"))
        { expr = {type: "plus", expr: expr}; }
      else if (stream.eat("*"))
        { expr = {type: "star", expr: expr}; }
      else if (stream.eat("?"))
        { expr = {type: "opt", expr: expr}; }
      else if (stream.eat("{"))
        { expr = parseExprRange(stream, expr); }
      else { break }
    }
    return expr
  }

  function parseNum(stream) {
    if (/\D/.test(stream.next)) { stream.err("Expected number, got '" + stream.next + "'"); }
    var result = Number(stream.next);
    stream.pos++;
    return result
  }

  function parseExprRange(stream, expr) {
    var min = parseNum(stream), max = min;
    if (stream.eat(",")) {
      if (stream.next != "}") { max = parseNum(stream); }
      else { max = -1; }
    }
    if (!stream.eat("}")) { stream.err("Unclosed braced range"); }
    return {type: "range", min: min, max: max, expr: expr}
  }

  function resolveName(stream, name) {
    var types = stream.nodeTypes, type = types[name];
    if (type) { return [type] }
    var result = [];
    for (var typeName in types) {
      var type$1 = types[typeName];
      if (type$1.groups.indexOf(name) > -1) { result.push(type$1); }
    }
    if (result.length == 0) { stream.err("No node type or group '" + name + "' found"); }
    return result
  }

  function parseExprAtom(stream) {
    if (stream.eat("(")) {
      var expr = parseExpr(stream);
      if (!stream.eat(")")) { stream.err("Missing closing paren"); }
      return expr
    } else if (!/\W/.test(stream.next)) {
      var exprs = resolveName(stream, stream.next).map(function (type) {
        if (stream.inline == null) { stream.inline = type.isInline; }
        else if (stream.inline != type.isInline) { stream.err("Mixing inline and block content"); }
        return {type: "name", value: type}
      });
      stream.pos++;
      return exprs.length == 1 ? exprs[0] : {type: "choice", exprs: exprs}
    } else {
      stream.err("Unexpected token '" + stream.next + "'");
    }
  }

  // The code below helps compile a regular-expression-like language
  // into a deterministic finite automaton. For a good introduction to
  // these concepts, see https://swtch.com/~rsc/regexp/regexp1.html

  // : (Object) → [[{term: ?any, to: number}]]
  // Construct an NFA from an expression as returned by the parser. The
  // NFA is represented as an array of states, which are themselves
  // arrays of edges, which are `{term, to}` objects. The first state is
  // the entry state and the last node is the success state.
  //
  // Note that unlike typical NFAs, the edge ordering in this one is
  // significant, in that it is used to contruct filler content when
  // necessary.
  function nfa(expr) {
    var nfa = [[]];
    connect(compile(expr, 0), node());
    return nfa

    function node() { return nfa.push([]) - 1 }
    function edge(from, to, term) {
      var edge = {term: term, to: to};
      nfa[from].push(edge);
      return edge
    }
    function connect(edges, to) { edges.forEach(function (edge) { return edge.to = to; }); }

    function compile(expr, from) {
      if (expr.type == "choice") {
        return expr.exprs.reduce(function (out, expr) { return out.concat(compile(expr, from)); }, [])
      } else if (expr.type == "seq") {
        for (var i = 0;; i++) {
          var next = compile(expr.exprs[i], from);
          if (i == expr.exprs.length - 1) { return next }
          connect(next, from = node());
        }
      } else if (expr.type == "star") {
        var loop = node();
        edge(from, loop);
        connect(compile(expr.expr, loop), loop);
        return [edge(loop)]
      } else if (expr.type == "plus") {
        var loop$1 = node();
        connect(compile(expr.expr, from), loop$1);
        connect(compile(expr.expr, loop$1), loop$1);
        return [edge(loop$1)]
      } else if (expr.type == "opt") {
        return [edge(from)].concat(compile(expr.expr, from))
      } else if (expr.type == "range") {
        var cur = from;
        for (var i$1 = 0; i$1 < expr.min; i$1++) {
          var next$1 = node();
          connect(compile(expr.expr, cur), next$1);
          cur = next$1;
        }
        if (expr.max == -1) {
          connect(compile(expr.expr, cur), cur);
        } else {
          for (var i$2 = expr.min; i$2 < expr.max; i$2++) {
            var next$2 = node();
            edge(cur, next$2);
            connect(compile(expr.expr, cur), next$2);
            cur = next$2;
          }
        }
        return [edge(cur)]
      } else if (expr.type == "name") {
        return [edge(from, null, expr.value)]
      }
    }
  }

  function cmp(a, b) { return b - a }

  // Get the set of nodes reachable by null edges from `node`. Omit
  // nodes with only a single null-out-edge, since they may lead to
  // needless duplicated nodes.
  function nullFrom(nfa, node) {
    var result = [];
    scan(node);
    return result.sort(cmp)

    function scan(node) {
      var edges = nfa[node];
      if (edges.length == 1 && !edges[0].term) { return scan(edges[0].to) }
      result.push(node);
      for (var i = 0; i < edges.length; i++) {
        var ref = edges[i];
        var term = ref.term;
        var to = ref.to;
        if (!term && result.indexOf(to) == -1) { scan(to); }
      }
    }
  }

  // : ([[{term: ?any, to: number}]]) → ContentMatch
  // Compiles an NFA as produced by `nfa` into a DFA, modeled as a set
  // of state objects (`ContentMatch` instances) with transitions
  // between them.
  function dfa(nfa) {
    var labeled = Object.create(null);
    return explore(nullFrom(nfa, 0))

    function explore(states) {
      var out = [];
      states.forEach(function (node) {
        nfa[node].forEach(function (ref) {
          var term = ref.term;
          var to = ref.to;

          if (!term) { return }
          var known = out.indexOf(term), set = known > -1 && out[known + 1];
          nullFrom(nfa, to).forEach(function (node) {
            if (!set) { out.push(term, set = []); }
            if (set.indexOf(node) == -1) { set.push(node); }
          });
        });
      });
      var state = labeled[states.join(",")] = new ContentMatch(states.indexOf(nfa.length - 1) > -1);
      for (var i = 0; i < out.length; i += 2) {
        var states$1 = out[i + 1].sort(cmp);
        state.next.push(out[i], labeled[states$1.join(",")] || explore(states$1));
      }
      return state
    }
  }

  function checkForDeadEnds(match, stream) {
    for (var i = 0, work = [match]; i < work.length; i++) {
      var state = work[i], dead = !state.validEnd, nodes = [];
      for (var j = 0; j < state.next.length; j += 2) {
        var node = state.next[j], next = state.next[j + 1];
        nodes.push(node.name);
        if (dead && !(node.isText || node.hasRequiredAttrs())) { dead = false; }
        if (work.indexOf(next) == -1) { work.push(next); }
      }
      if (dead) { stream.err("Only non-generatable nodes (" + nodes.join(", ") + ") in a required position"); }
    }
  }

  // For node types where all attrs have a default value (or which don't
  // have any attributes), build up a single reusable default attribute
  // object, and use it for all nodes that don't specify specific
  // attributes.
  function defaultAttrs(attrs) {
    var defaults = Object.create(null);
    for (var attrName in attrs) {
      var attr = attrs[attrName];
      if (!attr.hasDefault) { return null }
      defaults[attrName] = attr.default;
    }
    return defaults
  }

  function computeAttrs(attrs, value) {
    var built = Object.create(null);
    for (var name in attrs) {
      var given = value && value[name];
      if (given === undefined) {
        var attr = attrs[name];
        if (attr.hasDefault) { given = attr.default; }
        else { throw new RangeError("No value supplied for attribute " + name) }
      }
      built[name] = given;
    }
    return built
  }

  function initAttrs(attrs) {
    var result = Object.create(null);
    if (attrs) { for (var name in attrs) { result[name] = new Attribute(attrs[name]); } }
    return result
  }

  // ::- Node types are objects allocated once per `Schema` and used to
  // [tag](#model.Node.type) `Node` instances. They contain information
  // about the node type, such as its name and what kind of node it
  // represents.
  var NodeType = function NodeType(name, schema, spec) {
    // :: string
    // The name the node type has in this schema.
    this.name = name;

    // :: Schema
    // A link back to the `Schema` the node type belongs to.
    this.schema = schema;

    // :: NodeSpec
    // The spec that this type is based on
    this.spec = spec;

    this.groups = spec.group ? spec.group.split(" ") : [];
    this.attrs = initAttrs(spec.attrs);

    this.defaultAttrs = defaultAttrs(this.attrs);

    // :: ContentMatch
    // The starting match of the node type's content expression.
    this.contentMatch = null;

    // : ?[MarkType]
    // The set of marks allowed in this node. `null` means all marks
    // are allowed.
    this.markSet = null;

    // :: bool
    // True if this node type has inline content.
    this.inlineContent = null;

    // :: bool
    // True if this is a block type
    this.isBlock = !(spec.inline || name == "text");

    // :: bool
    // True if this is the text node type.
    this.isText = name == "text";
  };

  var prototypeAccessors$5 = { isInline: { configurable: true },isTextblock: { configurable: true },isLeaf: { configurable: true },isAtom: { configurable: true } };

  // :: bool
  // True if this is an inline type.
  prototypeAccessors$5.isInline.get = function () { return !this.isBlock };

  // :: bool
  // True if this is a textblock type, a block that contains inline
  // content.
  prototypeAccessors$5.isTextblock.get = function () { return this.isBlock && this.inlineContent };

  // :: bool
  // True for node types that allow no content.
  prototypeAccessors$5.isLeaf.get = function () { return this.contentMatch == ContentMatch.empty };

  // :: bool
  // True when this node is an atom, i.e. when it does not have
  // directly editable content.
  prototypeAccessors$5.isAtom.get = function () { return this.isLeaf || this.spec.atom };

  NodeType.prototype.hasRequiredAttrs = function hasRequiredAttrs (ignore) {
    for (var n in this.attrs)
      { if (this.attrs[n].isRequired && (!ignore || !(n in ignore))) { return true } }
    return false
  };

  NodeType.prototype.compatibleContent = function compatibleContent (other) {
    return this == other || this.contentMatch.compatible(other.contentMatch)
  };

  NodeType.prototype.computeAttrs = function computeAttrs$1 (attrs) {
    if (!attrs && this.defaultAttrs) { return this.defaultAttrs }
    else { return computeAttrs(this.attrs, attrs) }
  };

  // :: (?Object, ?union<Fragment, Node, [Node]>, ?[Mark]) → Node
  // Create a `Node` of this type. The given attributes are
  // checked and defaulted (you can pass `null` to use the type's
  // defaults entirely, if no required attributes exist). `content`
  // may be a `Fragment`, a node, an array of nodes, or
  // `null`. Similarly `marks` may be `null` to default to the empty
  // set of marks.
  NodeType.prototype.create = function create (attrs, content, marks) {
    if (this.isText) { throw new Error("NodeType.create can't construct text nodes") }
    return new Node$1(this, this.computeAttrs(attrs), Fragment.from(content), Mark.setFrom(marks))
  };

  // :: (?Object, ?union<Fragment, Node, [Node]>, ?[Mark]) → Node
  // Like [`create`](#model.NodeType.create), but check the given content
  // against the node type's content restrictions, and throw an error
  // if it doesn't match.
  NodeType.prototype.createChecked = function createChecked (attrs, content, marks) {
    content = Fragment.from(content);
    if (!this.validContent(content))
      { throw new RangeError("Invalid content for node " + this.name) }
    return new Node$1(this, this.computeAttrs(attrs), content, Mark.setFrom(marks))
  };

  // :: (?Object, ?union<Fragment, Node, [Node]>, ?[Mark]) → ?Node
  // Like [`create`](#model.NodeType.create), but see if it is necessary to
  // add nodes to the start or end of the given fragment to make it
  // fit the node. If no fitting wrapping can be found, return null.
  // Note that, due to the fact that required nodes can always be
  // created, this will always succeed if you pass null or
  // `Fragment.empty` as content.
  NodeType.prototype.createAndFill = function createAndFill (attrs, content, marks) {
    attrs = this.computeAttrs(attrs);
    content = Fragment.from(content);
    if (content.size) {
      var before = this.contentMatch.fillBefore(content);
      if (!before) { return null }
      content = before.append(content);
    }
    var after = this.contentMatch.matchFragment(content).fillBefore(Fragment.empty, true);
    if (!after) { return null }
    return new Node$1(this, attrs, content.append(after), Mark.setFrom(marks))
  };

  // :: (Fragment) → bool
  // Returns true if the given fragment is valid content for this node
  // type with the given attributes.
  NodeType.prototype.validContent = function validContent (content) {
    var result = this.contentMatch.matchFragment(content);
    if (!result || !result.validEnd) { return false }
    for (var i = 0; i < content.childCount; i++)
      { if (!this.allowsMarks(content.child(i).marks)) { return false } }
    return true
  };

  // :: (MarkType) → bool
  // Check whether the given mark type is allowed in this node.
  NodeType.prototype.allowsMarkType = function allowsMarkType (markType) {
    return this.markSet == null || this.markSet.indexOf(markType) > -1
  };

  // :: ([Mark]) → bool
  // Test whether the given set of marks are allowed in this node.
  NodeType.prototype.allowsMarks = function allowsMarks (marks) {
    if (this.markSet == null) { return true }
    for (var i = 0; i < marks.length; i++) { if (!this.allowsMarkType(marks[i].type)) { return false } }
    return true
  };

  // :: ([Mark]) → [Mark]
  // Removes the marks that are not allowed in this node from the given set.
  NodeType.prototype.allowedMarks = function allowedMarks (marks) {
    if (this.markSet == null) { return marks }
    var copy;
    for (var i = 0; i < marks.length; i++) {
      if (!this.allowsMarkType(marks[i].type)) {
        if (!copy) { copy = marks.slice(0, i); }
      } else if (copy) {
        copy.push(marks[i]);
      }
    }
    return !copy ? marks : copy.length ? copy : Mark.empty
  };

  NodeType.compile = function compile (nodes, schema) {
    var result = Object.create(null);
    nodes.forEach(function (name, spec) { return result[name] = new NodeType(name, schema, spec); });

    var topType = schema.spec.topNode || "doc";
    if (!result[topType]) { throw new RangeError("Schema is missing its top node type ('" + topType + "')") }
    if (!result.text) { throw new RangeError("Every schema needs a 'text' type") }
    for (var _ in result.text.attrs) { throw new RangeError("The text node type should not have attributes") }

    return result
  };

  Object.defineProperties( NodeType.prototype, prototypeAccessors$5 );

  // Attribute descriptors

  var Attribute = function Attribute(options) {
    this.hasDefault = Object.prototype.hasOwnProperty.call(options, "default");
    this.default = options.default;
  };

  var prototypeAccessors$1$3 = { isRequired: { configurable: true } };

  prototypeAccessors$1$3.isRequired.get = function () {
    return !this.hasDefault
  };

  Object.defineProperties( Attribute.prototype, prototypeAccessors$1$3 );

  // Marks

  // ::- Like nodes, marks (which are associated with nodes to signify
  // things like emphasis or being part of a link) are
  // [tagged](#model.Mark.type) with type objects, which are
  // instantiated once per `Schema`.
  var MarkType = function MarkType(name, rank, schema, spec) {
    // :: string
    // The name of the mark type.
    this.name = name;

    // :: Schema
    // The schema that this mark type instance is part of.
    this.schema = schema;

    // :: MarkSpec
    // The spec on which the type is based.
    this.spec = spec;

    this.attrs = initAttrs(spec.attrs);

    this.rank = rank;
    this.excluded = null;
    var defaults = defaultAttrs(this.attrs);
    this.instance = defaults && new Mark(this, defaults);
  };

  // :: (?Object) → Mark
  // Create a mark of this type. `attrs` may be `null` or an object
  // containing only some of the mark's attributes. The others, if
  // they have defaults, will be added.
  MarkType.prototype.create = function create (attrs) {
    if (!attrs && this.instance) { return this.instance }
    return new Mark(this, computeAttrs(this.attrs, attrs))
  };

  MarkType.compile = function compile (marks, schema) {
    var result = Object.create(null), rank = 0;
    marks.forEach(function (name, spec) { return result[name] = new MarkType(name, rank++, schema, spec); });
    return result
  };

  // :: ([Mark]) → [Mark]
  // When there is a mark of this type in the given set, a new set
  // without it is returned. Otherwise, the input set is returned.
  MarkType.prototype.removeFromSet = function removeFromSet (set) {
    for (var i = 0; i < set.length; i++)
      { if (set[i].type == this)
        { return set.slice(0, i).concat(set.slice(i + 1)) } }
    return set
  };

  // :: ([Mark]) → ?Mark
  // Tests whether there is a mark of this type in the given set.
  MarkType.prototype.isInSet = function isInSet (set) {
    for (var i = 0; i < set.length; i++)
      { if (set[i].type == this) { return set[i] } }
  };

  // :: (MarkType) → bool
  // Queries whether a given mark type is
  // [excluded](#model.MarkSpec.excludes) by this one.
  MarkType.prototype.excludes = function excludes (other) {
    return this.excluded.indexOf(other) > -1
  };

  // SchemaSpec:: interface
  // An object describing a schema, as passed to the [`Schema`](#model.Schema)
  // constructor.
  //
  //   nodes:: union<Object<NodeSpec>, OrderedMap<NodeSpec>>
  //   The node types in this schema. Maps names to
  //   [`NodeSpec`](#model.NodeSpec) objects that describe the node type
  //   associated with that name. Their order is significant—it
  //   determines which [parse rules](#model.NodeSpec.parseDOM) take
  //   precedence by default, and which nodes come first in a given
  //   [group](#model.NodeSpec.group).
  //
  //   marks:: ?union<Object<MarkSpec>, OrderedMap<MarkSpec>>
  //   The mark types that exist in this schema. The order in which they
  //   are provided determines the order in which [mark
  //   sets](#model.Mark.addToSet) are sorted and in which [parse
  //   rules](#model.MarkSpec.parseDOM) are tried.
  //
  //   topNode:: ?string
  //   The name of the default top-level node for the schema. Defaults
  //   to `"doc"`.

  // NodeSpec:: interface
  //
  //   content:: ?string
  //   The content expression for this node, as described in the [schema
  //   guide](/docs/guide/#schema.content_expressions). When not given,
  //   the node does not allow any content.
  //
  //   marks:: ?string
  //   The marks that are allowed inside of this node. May be a
  //   space-separated string referring to mark names or groups, `"_"`
  //   to explicitly allow all marks, or `""` to disallow marks. When
  //   not given, nodes with inline content default to allowing all
  //   marks, other nodes default to not allowing marks.
  //
  //   group:: ?string
  //   The group or space-separated groups to which this node belongs,
  //   which can be referred to in the content expressions for the
  //   schema.
  //
  //   inline:: ?bool
  //   Should be set to true for inline nodes. (Implied for text nodes.)
  //
  //   atom:: ?bool
  //   Can be set to true to indicate that, though this isn't a [leaf
  //   node](#model.NodeType.isLeaf), it doesn't have directly editable
  //   content and should be treated as a single unit in the view.
  //
  //   attrs:: ?Object<AttributeSpec>
  //   The attributes that nodes of this type get.
  //
  //   selectable:: ?bool
  //   Controls whether nodes of this type can be selected as a [node
  //   selection](#state.NodeSelection). Defaults to true for non-text
  //   nodes.
  //
  //   draggable:: ?bool
  //   Determines whether nodes of this type can be dragged without
  //   being selected. Defaults to false.
  //
  //   code:: ?bool
  //   Can be used to indicate that this node contains code, which
  //   causes some commands to behave differently.
  //
  //   defining:: ?bool
  //   Determines whether this node is considered an important parent
  //   node during replace operations (such as paste). Non-defining (the
  //   default) nodes get dropped when their entire content is replaced,
  //   whereas defining nodes persist and wrap the inserted content.
  //   Likewise, in _inserted_ content the defining parents of the
  //   content are preserved when possible. Typically,
  //   non-default-paragraph textblock types, and possibly list items,
  //   are marked as defining.
  //
  //   isolating:: ?bool
  //   When enabled (default is false), the sides of nodes of this type
  //   count as boundaries that regular editing operations, like
  //   backspacing or lifting, won't cross. An example of a node that
  //   should probably have this enabled is a table cell.
  //
  //   toDOM:: ?(node: Node) → DOMOutputSpec
  //   Defines the default way a node of this type should be serialized
  //   to DOM/HTML (as used by
  //   [`DOMSerializer.fromSchema`](#model.DOMSerializer^fromSchema)).
  //   Should return a DOM node or an [array
  //   structure](#model.DOMOutputSpec) that describes one, with an
  //   optional number zero (“hole”) in it to indicate where the node's
  //   content should be inserted.
  //
  //   For text nodes, the default is to create a text DOM node. Though
  //   it is possible to create a serializer where text is rendered
  //   differently, this is not supported inside the editor, so you
  //   shouldn't override that in your text node spec.
  //
  //   parseDOM:: ?[ParseRule]
  //   Associates DOM parser information with this node, which can be
  //   used by [`DOMParser.fromSchema`](#model.DOMParser^fromSchema) to
  //   automatically derive a parser. The `node` field in the rules is
  //   implied (the name of this node will be filled in automatically).
  //   If you supply your own parser, you do not need to also specify
  //   parsing rules in your schema.
  //
  //   toDebugString:: ?(node: Node) -> string
  //   Defines the default way a node of this type should be serialized
  //   to a string representation for debugging (e.g. in error messages).

  // MarkSpec:: interface
  //
  //   attrs:: ?Object<AttributeSpec>
  //   The attributes that marks of this type get.
  //
  //   inclusive:: ?bool
  //   Whether this mark should be active when the cursor is positioned
  //   at its end (or at its start when that is also the start of the
  //   parent node). Defaults to true.
  //
  //   excludes:: ?string
  //   Determines which other marks this mark can coexist with. Should
  //   be a space-separated strings naming other marks or groups of marks.
  //   When a mark is [added](#model.Mark.addToSet) to a set, all marks
  //   that it excludes are removed in the process. If the set contains
  //   any mark that excludes the new mark but is not, itself, excluded
  //   by the new mark, the mark can not be added an the set. You can
  //   use the value `"_"` to indicate that the mark excludes all
  //   marks in the schema.
  //
  //   Defaults to only being exclusive with marks of the same type. You
  //   can set it to an empty string (or any string not containing the
  //   mark's own name) to allow multiple marks of a given type to
  //   coexist (as long as they have different attributes).
  //
  //   group:: ?string
  //   The group or space-separated groups to which this mark belongs.
  //
  //   spanning:: ?bool
  //   Determines whether marks of this type can span multiple adjacent
  //   nodes when serialized to DOM/HTML. Defaults to true.
  //
  //   toDOM:: ?(mark: Mark, inline: bool) → DOMOutputSpec
  //   Defines the default way marks of this type should be serialized
  //   to DOM/HTML. When the resulting spec contains a hole, that is
  //   where the marked content is placed. Otherwise, it is appended to
  //   the top node.
  //
  //   parseDOM:: ?[ParseRule]
  //   Associates DOM parser information with this mark (see the
  //   corresponding [node spec field](#model.NodeSpec.parseDOM)). The
  //   `mark` field in the rules is implied.

  // AttributeSpec:: interface
  //
  // Used to [define](#model.NodeSpec.attrs) attributes on nodes or
  // marks.
  //
  //   default:: ?any
  //   The default value for this attribute, to use when no explicit
  //   value is provided. Attributes that have no default must be
  //   provided whenever a node or mark of a type that has them is
  //   created.

  // ::- A document schema. Holds [node](#model.NodeType) and [mark
  // type](#model.MarkType) objects for the nodes and marks that may
  // occur in conforming documents, and provides functionality for
  // creating and deserializing such documents.
  var Schema = function Schema(spec) {
    // :: SchemaSpec
    // The [spec](#model.SchemaSpec) on which the schema is based,
    // with the added guarantee that its `nodes` and `marks`
    // properties are
    // [`OrderedMap`](https://github.com/marijnh/orderedmap) instances
    // (not raw objects).
    this.spec = {};
    for (var prop in spec) { this.spec[prop] = spec[prop]; }
    this.spec.nodes = orderedmap.from(spec.nodes);
    this.spec.marks = orderedmap.from(spec.marks);

    // :: Object<NodeType>
    // An object mapping the schema's node names to node type objects.
    this.nodes = NodeType.compile(this.spec.nodes, this);

    // :: Object<MarkType>
    // A map from mark names to mark type objects.
    this.marks = MarkType.compile(this.spec.marks, this);

    var contentExprCache = Object.create(null);
    for (var prop$1 in this.nodes) {
      if (prop$1 in this.marks)
        { throw new RangeError(prop$1 + " can not be both a node and a mark") }
      var type = this.nodes[prop$1], contentExpr = type.spec.content || "", markExpr = type.spec.marks;
      type.contentMatch = contentExprCache[contentExpr] ||
        (contentExprCache[contentExpr] = ContentMatch.parse(contentExpr, this.nodes));
      type.inlineContent = type.contentMatch.inlineContent;
      type.markSet = markExpr == "_" ? null :
        markExpr ? gatherMarks(this, markExpr.split(" ")) :
        markExpr == "" || !type.inlineContent ? [] : null;
    }
    for (var prop$2 in this.marks) {
      var type$1 = this.marks[prop$2], excl = type$1.spec.excludes;
      type$1.excluded = excl == null ? [type$1] : excl == "" ? [] : gatherMarks(this, excl.split(" "));
    }

    this.nodeFromJSON = this.nodeFromJSON.bind(this);
    this.markFromJSON = this.markFromJSON.bind(this);

    // :: NodeType
    // The type of the [default top node](#model.SchemaSpec.topNode)
    // for this schema.
    this.topNodeType = this.nodes[this.spec.topNode || "doc"];

    // :: Object
    // An object for storing whatever values modules may want to
    // compute and cache per schema. (If you want to store something
    // in it, try to use property names unlikely to clash.)
    this.cached = Object.create(null);
    this.cached.wrappings = Object.create(null);
  };

  // :: (union<string, NodeType>, ?Object, ?union<Fragment, Node, [Node]>, ?[Mark]) → Node
  // Create a node in this schema. The `type` may be a string or a
  // `NodeType` instance. Attributes will be extended
  // with defaults, `content` may be a `Fragment`,
  // `null`, a `Node`, or an array of nodes.
  Schema.prototype.node = function node (type, attrs, content, marks) {
    if (typeof type == "string")
      { type = this.nodeType(type); }
    else if (!(type instanceof NodeType))
      { throw new RangeError("Invalid node type: " + type) }
    else if (type.schema != this)
      { throw new RangeError("Node type from different schema used (" + type.name + ")") }

    return type.createChecked(attrs, content, marks)
  };

  // :: (string, ?[Mark]) → Node
  // Create a text node in the schema. Empty text nodes are not
  // allowed.
  Schema.prototype.text = function text (text$1, marks) {
    var type = this.nodes.text;
    return new TextNode(type, type.defaultAttrs, text$1, Mark.setFrom(marks))
  };

  // :: (union<string, MarkType>, ?Object) → Mark
  // Create a mark with the given type and attributes.
  Schema.prototype.mark = function mark (type, attrs) {
    if (typeof type == "string") { type = this.marks[type]; }
    return type.create(attrs)
  };

  // :: (Object) → Node
  // Deserialize a node from its JSON representation. This method is
  // bound.
  Schema.prototype.nodeFromJSON = function nodeFromJSON (json) {
    return Node$1.fromJSON(this, json)
  };

  // :: (Object) → Mark
  // Deserialize a mark from its JSON representation. This method is
  // bound.
  Schema.prototype.markFromJSON = function markFromJSON (json) {
    return Mark.fromJSON(this, json)
  };

  Schema.prototype.nodeType = function nodeType (name) {
    var found = this.nodes[name];
    if (!found) { throw new RangeError("Unknown node type: " + name) }
    return found
  };

  function gatherMarks(schema, marks) {
    var found = [];
    for (var i = 0; i < marks.length; i++) {
      var name = marks[i], mark = schema.marks[name], ok = mark;
      if (mark) {
        found.push(mark);
      } else {
        for (var prop in schema.marks) {
          var mark$1 = schema.marks[prop];
          if (name == "_" || (mark$1.spec.group && mark$1.spec.group.split(" ").indexOf(name) > -1))
            { found.push(ok = mark$1); }
        }
      }
      if (!ok) { throw new SyntaxError("Unknown mark type: '" + marks[i] + "'") }
    }
    return found
  }

  // ParseOptions:: interface
  // These are the options recognized by the
  // [`parse`](#model.DOMParser.parse) and
  // [`parseSlice`](#model.DOMParser.parseSlice) methods.
  //
  //   preserveWhitespace:: ?union<bool, "full">
  //   By default, whitespace is collapsed as per HTML's rules. Pass
  //   `true` to preserve whitespace, but normalize newlines to
  //   spaces, and `"full"` to preserve whitespace entirely.
  //
  //   findPositions:: ?[{node: dom.Node, offset: number}]
  //   When given, the parser will, beside parsing the content,
  //   record the document positions of the given DOM positions. It
  //   will do so by writing to the objects, adding a `pos` property
  //   that holds the document position. DOM positions that are not
  //   in the parsed content will not be written to.
  //
  //   from:: ?number
  //   The child node index to start parsing from.
  //
  //   to:: ?number
  //   The child node index to stop parsing at.
  //
  //   topNode:: ?Node
  //   By default, the content is parsed into the schema's default
  //   [top node type](#model.Schema.topNodeType). You can pass this
  //   option to use the type and attributes from a different node
  //   as the top container.
  //
  //   topMatch:: ?ContentMatch
  //   Provide the starting content match that content parsed into the
  //   top node is matched against.
  //
  //   context:: ?ResolvedPos
  //   A set of additional nodes to count as
  //   [context](#model.ParseRule.context) when parsing, above the
  //   given [top node](#model.ParseOptions.topNode).

  // ParseRule:: interface
  // A value that describes how to parse a given DOM node or inline
  // style as a ProseMirror node or mark.
  //
  //   tag:: ?string
  //   A CSS selector describing the kind of DOM elements to match. A
  //   single rule should have _either_ a `tag` or a `style` property.
  //
  //   namespace:: ?string
  //   The namespace to match. This should be used with `tag`.
  //   Nodes are only matched when the namespace matches or this property
  //   is null.
  //
  //   style:: ?string
  //   A CSS property name to match. When given, this rule matches
  //   inline styles that list that property. May also have the form
  //   `"property=value"`, in which case the rule only matches if the
  //   propery's value exactly matches the given value. (For more
  //   complicated filters, use [`getAttrs`](#model.ParseRule.getAttrs)
  //   and return false to indicate that the match failed.)
  //
  //   priority:: ?number
  //   Can be used to change the order in which the parse rules in a
  //   schema are tried. Those with higher priority come first. Rules
  //   without a priority are counted as having priority 50. This
  //   property is only meaningful in a schema—when directly
  //   constructing a parser, the order of the rule array is used.
  //
  //   context:: ?string
  //   When given, restricts this rule to only match when the current
  //   context—the parent nodes into which the content is being
  //   parsed—matches this expression. Should contain one or more node
  //   names or node group names followed by single or double slashes.
  //   For example `"paragraph/"` means the rule only matches when the
  //   parent node is a paragraph, `"blockquote/paragraph/"` restricts
  //   it to be in a paragraph that is inside a blockquote, and
  //   `"section//"` matches any position inside a section—a double
  //   slash matches any sequence of ancestor nodes. To allow multiple
  //   different contexts, they can be separated by a pipe (`|`)
  //   character, as in `"blockquote/|list_item/"`.
  //
  //   node:: ?string
  //   The name of the node type to create when this rule matches. Only
  //   valid for rules with a `tag` property, not for style rules. Each
  //   rule should have one of a `node`, `mark`, or `ignore` property
  //   (except when it appears in a [node](#model.NodeSpec.parseDOM) or
  //   [mark spec](#model.MarkSpec.parseDOM), in which case the `node`
  //   or `mark` property will be derived from its position).
  //
  //   mark:: ?string
  //   The name of the mark type to wrap the matched content in.
  //
  //   ignore:: ?bool
  //   When true, ignore content that matches this rule.
  //
  //   skip:: ?bool
  //   When true, ignore the node that matches this rule, but do parse
  //   its content.
  //
  //   attrs:: ?Object
  //   Attributes for the node or mark created by this rule. When
  //   `getAttrs` is provided, it takes precedence.
  //
  //   getAttrs:: ?(union<dom.Node, string>) → ?union<Object, false>
  //   A function used to compute the attributes for the node or mark
  //   created by this rule. Can also be used to describe further
  //   conditions the DOM element or style must match. When it returns
  //   `false`, the rule won't match. When it returns null or undefined,
  //   that is interpreted as an empty/default set of attributes.
  //
  //   Called with a DOM Element for `tag` rules, and with a string (the
  //   style's value) for `style` rules.
  //
  //   contentElement:: ?union<string, (dom.Node) → dom.Node>
  //   For `tag` rules that produce non-leaf nodes or marks, by default
  //   the content of the DOM element is parsed as content of the mark
  //   or node. If the child nodes are in a descendent node, this may be
  //   a CSS selector string that the parser must use to find the actual
  //   content element, or a function that returns the actual content
  //   element to the parser.
  //
  //   getContent:: ?(dom.Node, schema: Schema) → Fragment
  //   Can be used to override the content of a matched node. When
  //   present, instead of parsing the node's child nodes, the result of
  //   this function is used.
  //
  //   preserveWhitespace:: ?union<bool, "full">
  //   Controls whether whitespace should be preserved when parsing the
  //   content inside the matched element. `false` means whitespace may
  //   be collapsed, `true` means that whitespace should be preserved
  //   but newlines normalized to spaces, and `"full"` means that
  //   newlines should also be preserved.

  // ::- A DOM parser represents a strategy for parsing DOM content into
  // a ProseMirror document conforming to a given schema. Its behavior
  // is defined by an array of [rules](#model.ParseRule).
  var DOMParser = function DOMParser(schema, rules) {
    var this$1 = this;

    // :: Schema
    // The schema into which the parser parses.
    this.schema = schema;
    // :: [ParseRule]
    // The set of [parse rules](#model.ParseRule) that the parser
    // uses, in order of precedence.
    this.rules = rules;
    this.tags = [];
    this.styles = [];

    rules.forEach(function (rule) {
      if (rule.tag) { this$1.tags.push(rule); }
      else if (rule.style) { this$1.styles.push(rule); }
    });
  };

  // :: (dom.Node, ?ParseOptions) → Node
  // Parse a document from the content of a DOM node.
  DOMParser.prototype.parse = function parse (dom, options) {
      if ( options === void 0 ) options = {};

    var context = new ParseContext(this, options, false);
    context.addAll(dom, null, options.from, options.to);
    return context.finish()
  };

  // :: (dom.Node, ?ParseOptions) → Slice
  // Parses the content of the given DOM node, like
  // [`parse`](#model.DOMParser.parse), and takes the same set of
  // options. But unlike that method, which produces a whole node,
  // this one returns a slice that is open at the sides, meaning that
  // the schema constraints aren't applied to the start of nodes to
  // the left of the input and the end of nodes at the end.
  DOMParser.prototype.parseSlice = function parseSlice (dom, options) {
      if ( options === void 0 ) options = {};

    var context = new ParseContext(this, options, true);
    context.addAll(dom, null, options.from, options.to);
    return Slice.maxOpen(context.finish())
  };

  DOMParser.prototype.matchTag = function matchTag (dom, context) {
    for (var i = 0; i < this.tags.length; i++) {
      var rule = this.tags[i];
      if (matches(dom, rule.tag) &&
          (rule.namespace === undefined || dom.namespaceURI == rule.namespace) &&
          (!rule.context || context.matchesContext(rule.context))) {
        if (rule.getAttrs) {
          var result = rule.getAttrs(dom);
          if (result === false) { continue }
          rule.attrs = result;
        }
        return rule
      }
    }
  };

  DOMParser.prototype.matchStyle = function matchStyle (prop, value, context) {
    for (var i = 0; i < this.styles.length; i++) {
      var rule = this.styles[i];
      if (rule.style.indexOf(prop) != 0 ||
          rule.context && !context.matchesContext(rule.context) ||
          // Test that the style string either precisely matches the prop,
          // or has an '=' sign after the prop, followed by the given
          // value.
          rule.style.length > prop.length &&
          (rule.style.charCodeAt(prop.length) != 61 || rule.style.slice(prop.length + 1) != value))
        { continue }
      if (rule.getAttrs) {
        var result = rule.getAttrs(value);
        if (result === false) { continue }
        rule.attrs = result;
      }
      return rule
    }
  };

  // : (Schema) → [ParseRule]
  DOMParser.schemaRules = function schemaRules (schema) {
    var result = [];
    function insert(rule) {
      var priority = rule.priority == null ? 50 : rule.priority, i = 0;
      for (; i < result.length; i++) {
        var next = result[i], nextPriority = next.priority == null ? 50 : next.priority;
        if (nextPriority < priority) { break }
      }
      result.splice(i, 0, rule);
    }

    var loop = function ( name ) {
      var rules = schema.marks[name].spec.parseDOM;
      if (rules) { rules.forEach(function (rule) {
        insert(rule = copy(rule));
        rule.mark = name;
      }); }
    };

      for (var name in schema.marks) loop( name );
    var loop$1 = function ( name ) {
      var rules$1 = schema.nodes[name$1].spec.parseDOM;
      if (rules$1) { rules$1.forEach(function (rule) {
        insert(rule = copy(rule));
        rule.node = name$1;
      }); }
    };

      for (var name$1 in schema.nodes) loop$1();
    return result
  };

  // :: (Schema) → DOMParser
  // Construct a DOM parser using the parsing rules listed in a
  // schema's [node specs](#model.NodeSpec.parseDOM), reordered by
  // [priority](#model.ParseRule.priority).
  DOMParser.fromSchema = function fromSchema (schema) {
    return schema.cached.domParser ||
      (schema.cached.domParser = new DOMParser(schema, DOMParser.schemaRules(schema)))
  };

  // : Object<bool> The block-level tags in HTML5
  var blockTags = {
    address: true, article: true, aside: true, blockquote: true, canvas: true,
    dd: true, div: true, dl: true, fieldset: true, figcaption: true, figure: true,
    footer: true, form: true, h1: true, h2: true, h3: true, h4: true, h5: true,
    h6: true, header: true, hgroup: true, hr: true, li: true, noscript: true, ol: true,
    output: true, p: true, pre: true, section: true, table: true, tfoot: true, ul: true
  };

  // : Object<bool> The tags that we normally ignore.
  var ignoreTags = {
    head: true, noscript: true, object: true, script: true, style: true, title: true
  };

  // : Object<bool> List tags.
  var listTags = {ol: true, ul: true};

  // Using a bitfield for node context options
  var OPT_PRESERVE_WS = 1, OPT_PRESERVE_WS_FULL = 2, OPT_OPEN_LEFT = 4;

  function wsOptionsFor(preserveWhitespace) {
    return (preserveWhitespace ? OPT_PRESERVE_WS : 0) | (preserveWhitespace === "full" ? OPT_PRESERVE_WS_FULL : 0)
  }

  var NodeContext = function NodeContext(type, attrs, marks, solid, match, options) {
    this.type = type;
    this.attrs = attrs;
    this.solid = solid;
    this.match = match || (options & OPT_OPEN_LEFT ? null : type.contentMatch);
    this.options = options;
    this.content = [];
    this.marks = marks;
    this.activeMarks = Mark.none;
  };

  NodeContext.prototype.findWrapping = function findWrapping (node) {
    if (!this.match) {
      if (!this.type) { return [] }
      var fill = this.type.contentMatch.fillBefore(Fragment.from(node));
      if (fill) {
        this.match = this.type.contentMatch.matchFragment(fill);
      } else {
        var start = this.type.contentMatch, wrap;
        if (wrap = start.findWrapping(node.type)) {
          this.match = start;
          return wrap
        } else {
          return null
        }
      }
    }
    return this.match.findWrapping(node.type)
  };

  NodeContext.prototype.finish = function finish (openEnd) {
    if (!(this.options & OPT_PRESERVE_WS)) { // Strip trailing whitespace
      var last = this.content[this.content.length - 1], m;
      if (last && last.isText && (m = /[ \t\r\n\u000c]+$/.exec(last.text))) {
        if (last.text.length == m[0].length) { this.content.pop(); }
        else { this.content[this.content.length - 1] = last.withText(last.text.slice(0, last.text.length - m[0].length)); }
      }
    }
    var content = Fragment.from(this.content);
    if (!openEnd && this.match)
      { content = content.append(this.match.fillBefore(Fragment.empty, true)); }
    return this.type ? this.type.create(this.attrs, content, this.marks) : content
  };

  var ParseContext = function ParseContext(parser, options, open) {
    // : DOMParser The parser we are using.
    this.parser = parser;
    // : Object The options passed to this parse.
    this.options = options;
    this.isOpen = open;
    this.pendingMarks = [];
    var topNode = options.topNode, topContext;
    var topOptions = wsOptionsFor(options.preserveWhitespace) | (open ? OPT_OPEN_LEFT : 0);
    if (topNode)
      { topContext = new NodeContext(topNode.type, topNode.attrs, Mark.none, true,
                                   options.topMatch || topNode.type.contentMatch, topOptions); }
    else if (open)
      { topContext = new NodeContext(null, null, Mark.none, true, null, topOptions); }
    else
      { topContext = new NodeContext(parser.schema.topNodeType, null, Mark.none, true, null, topOptions); }
    this.nodes = [topContext];
    // : [Mark] The current set of marks
    this.open = 0;
    this.find = options.findPositions;
    this.needsBlock = false;
  };

  var prototypeAccessors$6 = { top: { configurable: true },currentPos: { configurable: true } };

  prototypeAccessors$6.top.get = function () {
    return this.nodes[this.open]
  };

  // : (dom.Node)
  // Add a DOM node to the content. Text is inserted as text node,
  // otherwise, the node is passed to `addElement` or, if it has a
  // `style` attribute, `addElementWithStyles`.
  ParseContext.prototype.addDOM = function addDOM (dom) {
    if (dom.nodeType == 3) {
      this.addTextNode(dom);
    } else if (dom.nodeType == 1) {
      var style = dom.getAttribute("style");
      var marks = style ? this.readStyles(parseStyles(style)) : null;
      if (marks != null) { for (var i = 0; i < marks.length; i++) { this.addPendingMark(marks[i]); } }
      this.addElement(dom);
      if (marks != null) { for (var i$1 = 0; i$1 < marks.length; i$1++) { this.removePendingMark(marks[i$1]); } }
    }
  };

  ParseContext.prototype.addTextNode = function addTextNode (dom) {
    var value = dom.nodeValue;
    var top = this.top;
    if ((top.type ? top.type.inlineContent : top.content.length && top.content[0].isInline) || /[^ \t\r\n\u000c]/.test(value)) {
      if (!(top.options & OPT_PRESERVE_WS)) {
        value = value.replace(/[ \t\r\n\u000c]+/g, " ");
        // If this starts with whitespace, and there is no node before it, or
        // a hard break, or a text node that ends with whitespace, strip the
        // leading space.
        if (/^[ \t\r\n\u000c]/.test(value) && this.open == this.nodes.length - 1) {
          var nodeBefore = top.content[top.content.length - 1];
          var domNodeBefore = dom.previousSibling;
          if (!nodeBefore ||
              (domNodeBefore && domNodeBefore.nodeName == 'BR') ||
              (nodeBefore.isText && /[ \t\r\n\u000c]$/.test(nodeBefore.text)))
            { value = value.slice(1); }
        }
      } else if (!(top.options & OPT_PRESERVE_WS_FULL)) {
        value = value.replace(/\r?\n|\r/g, " ");
      }
      if (value) { this.insertNode(this.parser.schema.text(value)); }
      this.findInText(dom);
    } else {
      this.findInside(dom);
    }
  };

  // : (dom.Element)
  // Try to find a handler for the given tag and use that to parse. If
  // none is found, the element's content nodes are added directly.
  ParseContext.prototype.addElement = function addElement (dom) {
    var name = dom.nodeName.toLowerCase();
    if (listTags.hasOwnProperty(name)) { normalizeList(dom); }
    var rule = (this.options.ruleFromNode && this.options.ruleFromNode(dom)) || this.parser.matchTag(dom, this);
    if (rule ? rule.ignore : ignoreTags.hasOwnProperty(name)) {
      this.findInside(dom);
    } else if (!rule || rule.skip) {
      if (rule && rule.skip.nodeType) { dom = rule.skip; }
      var sync, top = this.top, oldNeedsBlock = this.needsBlock;
      if (blockTags.hasOwnProperty(name)) {
        sync = true;
        if (!top.type) { this.needsBlock = true; }
      } else if (!dom.firstChild) {
        this.leafFallback(dom);
        return
      }
      this.addAll(dom);
      if (sync) { this.sync(top); }
      this.needsBlock = oldNeedsBlock;
    } else {
      this.addElementByRule(dom, rule);
    }
  };

  // Called for leaf DOM nodes that would otherwise be ignored
  ParseContext.prototype.leafFallback = function leafFallback (dom) {
    if (dom.nodeName == "BR" && this.top.type && this.top.type.inlineContent)
      { this.addTextNode(dom.ownerDocument.createTextNode("\n")); }
  };

  // Run any style parser associated with the node's styles. Either
  // return an array of marks, or null to indicate some of the styles
  // had a rule with `ignore` set.
  ParseContext.prototype.readStyles = function readStyles (styles) {
    var marks = Mark.none;
    for (var i = 0; i < styles.length; i += 2) {
      var rule = this.parser.matchStyle(styles[i], styles[i + 1], this);
      if (!rule) { continue }
      if (rule.ignore) { return null }
      marks = this.parser.schema.marks[rule.mark].create(rule.attrs).addToSet(marks);
    }
    return marks
  };

  // : (dom.Element, ParseRule) → bool
  // Look up a handler for the given node. If none are found, return
  // false. Otherwise, apply it, use its return value to drive the way
  // the node's content is wrapped, and return true.
  ParseContext.prototype.addElementByRule = function addElementByRule (dom, rule) {
      var this$1 = this;

    var sync, nodeType, markType, mark;
    if (rule.node) {
      nodeType = this.parser.schema.nodes[rule.node];
      if (!nodeType.isLeaf) {
        sync = this.enter(nodeType, rule.attrs, rule.preserveWhitespace);
      } else if (!this.insertNode(nodeType.create(rule.attrs))) {
        this.leafFallback(dom);
      }
    } else {
      markType = this.parser.schema.marks[rule.mark];
      mark = markType.create(rule.attrs);
      this.addPendingMark(mark);
    }
    var startIn = this.top;

    if (nodeType && nodeType.isLeaf) {
      this.findInside(dom);
    } else if (rule.getContent) {
      this.findInside(dom);
      rule.getContent(dom, this.parser.schema).forEach(function (node) { return this$1.insertNode(node); });
    } else {
      var contentDOM = rule.contentElement;
      if (typeof contentDOM == "string") { contentDOM = dom.querySelector(contentDOM); }
      else if (typeof contentDOM == "function") { contentDOM = contentDOM(dom); }
      if (!contentDOM) { contentDOM = dom; }
      this.findAround(dom, contentDOM, true);
      this.addAll(contentDOM, sync);
    }
    if (sync) { this.sync(startIn); this.open--; }
    if (mark) { this.removePendingMark(mark); }
  };

  // : (dom.Node, ?NodeBuilder, ?number, ?number)
  // Add all child nodes between `startIndex` and `endIndex` (or the
  // whole node, if not given). If `sync` is passed, use it to
  // synchronize after every block element.
  ParseContext.prototype.addAll = function addAll (parent, sync, startIndex, endIndex) {
    var index = startIndex || 0;
    for (var dom = startIndex ? parent.childNodes[startIndex] : parent.firstChild,
             end = endIndex == null ? null : parent.childNodes[endIndex];
         dom != end; dom = dom.nextSibling, ++index) {
      this.findAtPoint(parent, index);
      this.addDOM(dom);
      if (sync && blockTags.hasOwnProperty(dom.nodeName.toLowerCase()))
        { this.sync(sync); }
    }
    this.findAtPoint(parent, index);
  };

  // Try to find a way to fit the given node type into the current
  // context. May add intermediate wrappers and/or leave non-solid
  // nodes that we're in.
  ParseContext.prototype.findPlace = function findPlace (node) {
    var route, sync;
    for (var depth = this.open; depth >= 0; depth--) {
      var cx = this.nodes[depth];
      var found = cx.findWrapping(node);
      if (found && (!route || route.length > found.length)) {
        route = found;
        sync = cx;
        if (!found.length) { break }
      }
      if (cx.solid) { break }
    }
    if (!route) { return false }
    this.sync(sync);
    for (var i = 0; i < route.length; i++)
      { this.enterInner(route[i], null, false); }
    return true
  };

  // : (Node) → ?Node
  // Try to insert the given node, adjusting the context when needed.
  ParseContext.prototype.insertNode = function insertNode (node) {
    if (node.isInline && this.needsBlock && !this.top.type) {
      var block = this.textblockFromContext();
      if (block) { this.enterInner(block); }
    }
    if (this.findPlace(node)) {
      this.closeExtra();
      var top = this.top;
      this.applyPendingMarks(top);
      if (top.match) { top.match = top.match.matchType(node.type); }
      var marks = top.activeMarks;
      for (var i = 0; i < node.marks.length; i++)
        { if (!top.type || top.type.allowsMarkType(node.marks[i].type))
          { marks = node.marks[i].addToSet(marks); } }
      top.content.push(node.mark(marks));
      return true
    }
    return false
  };

  ParseContext.prototype.applyPendingMarks = function applyPendingMarks (top) {
    for (var i = 0; i < this.pendingMarks.length; i++) {
      var mark = this.pendingMarks[i];
      if ((!top.type || top.type.allowsMarkType(mark.type)) && !mark.isInSet(top.activeMarks)) {
        top.activeMarks = mark.addToSet(top.activeMarks);
        this.pendingMarks.splice(i--, 1);
      }
    }
  };

  // : (NodeType, ?Object) → bool
  // Try to start a node of the given type, adjusting the context when
  // necessary.
  ParseContext.prototype.enter = function enter (type, attrs, preserveWS) {
    var ok = this.findPlace(type.create(attrs));
    if (ok) {
      this.applyPendingMarks(this.top);
      this.enterInner(type, attrs, true, preserveWS);
    }
    return ok
  };

  // Open a node of the given type
  ParseContext.prototype.enterInner = function enterInner (type, attrs, solid, preserveWS) {
    this.closeExtra();
    var top = this.top;
    top.match = top.match && top.match.matchType(type, attrs);
    var options = preserveWS == null ? top.options & ~OPT_OPEN_LEFT : wsOptionsFor(preserveWS);
    if ((top.options & OPT_OPEN_LEFT) && top.content.length == 0) { options |= OPT_OPEN_LEFT; }
    this.nodes.push(new NodeContext(type, attrs, top.activeMarks, solid, null, options));
    this.open++;
  };

  // Make sure all nodes above this.open are finished and added to
  // their parents
  ParseContext.prototype.closeExtra = function closeExtra (openEnd) {
    var i = this.nodes.length - 1;
    if (i > this.open) {
      for (; i > this.open; i--) { this.nodes[i - 1].content.push(this.nodes[i].finish(openEnd)); }
      this.nodes.length = this.open + 1;
    }
  };

  ParseContext.prototype.finish = function finish () {
    this.open = 0;
    this.closeExtra(this.isOpen);
    return this.nodes[0].finish(this.isOpen || this.options.topOpen)
  };

  ParseContext.prototype.sync = function sync (to) {
    for (var i = this.open; i >= 0; i--) { if (this.nodes[i] == to) {
      this.open = i;
      return
    } }
  };

  ParseContext.prototype.addPendingMark = function addPendingMark (mark) {
    this.pendingMarks.push(mark);
  };

  ParseContext.prototype.removePendingMark = function removePendingMark (mark) {
    var found = this.pendingMarks.lastIndexOf(mark);
    if (found > -1) {
      this.pendingMarks.splice(found, 1);
    } else {
      var top = this.top;
      top.activeMarks = mark.removeFromSet(top.activeMarks);
    }
  };

  prototypeAccessors$6.currentPos.get = function () {
    this.closeExtra();
    var pos = 0;
    for (var i = this.open; i >= 0; i--) {
      var content = this.nodes[i].content;
      for (var j = content.length - 1; j >= 0; j--)
        { pos += content[j].nodeSize; }
      if (i) { pos++; }
    }
    return pos
  };

  ParseContext.prototype.findAtPoint = function findAtPoint (parent, offset) {
    if (this.find) { for (var i = 0; i < this.find.length; i++) {
      if (this.find[i].node == parent && this.find[i].offset == offset)
        { this.find[i].pos = this.currentPos; }
    } }
  };

  ParseContext.prototype.findInside = function findInside (parent) {
    if (this.find) { for (var i = 0; i < this.find.length; i++) {
      if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node))
        { this.find[i].pos = this.currentPos; }
    } }
  };

  ParseContext.prototype.findAround = function findAround (parent, content, before) {
    if (parent != content && this.find) { for (var i = 0; i < this.find.length; i++) {
      if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node)) {
        var pos = content.compareDocumentPosition(this.find[i].node);
        if (pos & (before ? 2 : 4))
          { this.find[i].pos = this.currentPos; }
      }
    } }
  };

  ParseContext.prototype.findInText = function findInText (textNode) {
    if (this.find) { for (var i = 0; i < this.find.length; i++) {
      if (this.find[i].node == textNode)
        { this.find[i].pos = this.currentPos - (textNode.nodeValue.length - this.find[i].offset); }
    } }
  };

  // : (string) → bool
  // Determines whether the given [context
  // string](#ParseRule.context) matches this context.
  ParseContext.prototype.matchesContext = function matchesContext (context) {
      var this$1 = this;

    if (context.indexOf("|") > -1)
      { return context.split(/\s*\|\s*/).some(this.matchesContext, this) }

    var parts = context.split("/");
    var option = this.options.context;
    var useRoot = !this.isOpen && (!option || option.parent.type == this.nodes[0].type);
    var minDepth = -(option ? option.depth + 1 : 0) + (useRoot ? 0 : 1);
    var match = function (i, depth) {
      for (; i >= 0; i--) {
        var part = parts[i];
        if (part == "") {
          if (i == parts.length - 1 || i == 0) { continue }
          for (; depth >= minDepth; depth--)
            { if (match(i - 1, depth)) { return true } }
          return false
        } else {
          var next = depth > 0 || (depth == 0 && useRoot) ? this$1.nodes[depth].type
              : option && depth >= minDepth ? option.node(depth - minDepth).type
              : null;
          if (!next || (next.name != part && next.groups.indexOf(part) == -1))
            { return false }
          depth--;
        }
      }
      return true
    };
    return match(parts.length - 1, this.open)
  };

  ParseContext.prototype.textblockFromContext = function textblockFromContext () {
    var $context = this.options.context;
    if ($context) { for (var d = $context.depth; d >= 0; d--) {
      var deflt = $context.node(d).contentMatchAt($context.indexAfter(d)).defaultType;
      if (deflt && deflt.isTextblock && deflt.defaultAttrs) { return deflt }
    } }
    for (var name in this.parser.schema.nodes) {
      var type = this.parser.schema.nodes[name];
      if (type.isTextblock && type.defaultAttrs) { return type }
    }
  };

  Object.defineProperties( ParseContext.prototype, prototypeAccessors$6 );

  // Kludge to work around directly nested list nodes produced by some
  // tools and allowed by browsers to mean that the nested list is
  // actually part of the list item above it.
  function normalizeList(dom) {
    for (var child = dom.firstChild, prevItem = null; child; child = child.nextSibling) {
      var name = child.nodeType == 1 ? child.nodeName.toLowerCase() : null;
      if (name && listTags.hasOwnProperty(name) && prevItem) {
        prevItem.appendChild(child);
        child = prevItem;
      } else if (name == "li") {
        prevItem = child;
      } else if (name) {
        prevItem = null;
      }
    }
  }

  // Apply a CSS selector.
  function matches(dom, selector) {
    return (dom.matches || dom.msMatchesSelector || dom.webkitMatchesSelector || dom.mozMatchesSelector).call(dom, selector)
  }

  // : (string) → [string]
  // Tokenize a style attribute into property/value pairs.
  function parseStyles(style) {
    var re = /\s*([\w-]+)\s*:\s*([^;]+)/g, m, result = [];
    while (m = re.exec(style)) { result.push(m[1], m[2].trim()); }
    return result
  }

  function copy(obj) {
    var copy = {};
    for (var prop in obj) { copy[prop] = obj[prop]; }
    return copy
  }

  // DOMOutputSpec:: interface
  // A description of a DOM structure. Can be either a string, which is
  // interpreted as a text node, a DOM node, which is interpreted as
  // itself, or an array.
  //
  // An array describes a DOM element. The first value in the array
  // should be a string—the name of the DOM element. If the second
  // element is plain object, it is interpreted as a set of attributes
  // for the element. Any elements after that (including the 2nd if it's
  // not an attribute object) are interpreted as children of the DOM
  // elements, and must either be valid `DOMOutputSpec` values, or the
  // number zero.
  //
  // The number zero (pronounced “hole”) is used to indicate the place
  // where a node's child nodes should be inserted. If it occurs in an
  // output spec, it should be the only child element in its parent
  // node.

  // ::- A DOM serializer knows how to convert ProseMirror nodes and
  // marks of various types to DOM nodes.
  var DOMSerializer = function DOMSerializer(nodes, marks) {
    // :: Object<(node: Node) → DOMOutputSpec>
    // The node serialization functions.
    this.nodes = nodes || {};
    // :: Object<?(mark: Mark, inline: bool) → DOMOutputSpec>
    // The mark serialization functions.
    this.marks = marks || {};
  };

  // :: (Fragment, ?Object) → dom.DocumentFragment
  // Serialize the content of this fragment to a DOM fragment. When
  // not in the browser, the `document` option, containing a DOM
  // document, should be passed so that the serializer can create
  // nodes.
  DOMSerializer.prototype.serializeFragment = function serializeFragment (fragment, options, target) {
      var this$1 = this;
      if ( options === void 0 ) options = {};

    if (!target) { target = doc(options).createDocumentFragment(); }

    var top = target, active = null;
    fragment.forEach(function (node) {
      if (active || node.marks.length) {
        if (!active) { active = []; }
        var keep = 0, rendered = 0;
        while (keep < active.length && rendered < node.marks.length) {
          var next = node.marks[rendered];
          if (!this$1.marks[next.type.name]) { rendered++; continue }
          if (!next.eq(active[keep]) || next.type.spec.spanning === false) { break }
          keep += 2; rendered++;
        }
        while (keep < active.length) {
          top = active.pop();
          active.pop();
        }
        while (rendered < node.marks.length) {
          var add = node.marks[rendered++];
          var markDOM = this$1.serializeMark(add, node.isInline, options);
          if (markDOM) {
            active.push(add, top);
            top.appendChild(markDOM.dom);
            top = markDOM.contentDOM || markDOM.dom;
          }
        }
      }
      top.appendChild(this$1.serializeNode(node, options));
    });

    return target
  };

  // :: (Node, ?Object) → dom.Node
  // Serialize this node to a DOM node. This can be useful when you
  // need to serialize a part of a document, as opposed to the whole
  // document. To serialize a whole document, use
  // [`serializeFragment`](#model.DOMSerializer.serializeFragment) on
  // its [content](#model.Node.content).
  DOMSerializer.prototype.serializeNode = function serializeNode (node, options) {
      if ( options === void 0 ) options = {};

    var ref =
        DOMSerializer.renderSpec(doc(options), this.nodes[node.type.name](node));
      var dom = ref.dom;
      var contentDOM = ref.contentDOM;
    if (contentDOM) {
      if (node.isLeaf)
        { throw new RangeError("Content hole not allowed in a leaf node spec") }
      if (options.onContent)
        { options.onContent(node, contentDOM, options); }
      else
        { this.serializeFragment(node.content, options, contentDOM); }
    }
    return dom
  };

  DOMSerializer.prototype.serializeNodeAndMarks = function serializeNodeAndMarks (node, options) {
      if ( options === void 0 ) options = {};

    var dom = this.serializeNode(node, options);
    for (var i = node.marks.length - 1; i >= 0; i--) {
      var wrap = this.serializeMark(node.marks[i], node.isInline, options);
      if (wrap) {
  (wrap.contentDOM || wrap.dom).appendChild(dom);
        dom = wrap.dom;
      }
    }
    return dom
  };

  DOMSerializer.prototype.serializeMark = function serializeMark (mark, inline, options) {
      if ( options === void 0 ) options = {};

    var toDOM = this.marks[mark.type.name];
    return toDOM && DOMSerializer.renderSpec(doc(options), toDOM(mark, inline))
  };

  // :: (dom.Document, DOMOutputSpec) → {dom: dom.Node, contentDOM: ?dom.Node}
  // Render an [output spec](#model.DOMOutputSpec) to a DOM node. If
  // the spec has a hole (zero) in it, `contentDOM` will point at the
  // node with the hole.
  DOMSerializer.renderSpec = function renderSpec (doc, structure) {
    if (typeof structure == "string")
      { return {dom: doc.createTextNode(structure)} }
    if (structure.nodeType != null)
      { return {dom: structure} }
    var dom = doc.createElement(structure[0]), contentDOM = null;
    var attrs = structure[1], start = 1;
    if (attrs && typeof attrs == "object" && attrs.nodeType == null && !Array.isArray(attrs)) {
      start = 2;
      for (var name in attrs) {
        if (attrs[name] != null) { dom.setAttribute(name, attrs[name]); }
      }
    }
    for (var i = start; i < structure.length; i++) {
      var child = structure[i];
      if (child === 0) {
        if (i < structure.length - 1 || i > start)
          { throw new RangeError("Content hole must be the only child of its parent node") }
        return {dom: dom, contentDOM: dom}
      } else {
        var ref = DOMSerializer.renderSpec(doc, child);
          var inner = ref.dom;
          var innerContent = ref.contentDOM;
        dom.appendChild(inner);
        if (innerContent) {
          if (contentDOM) { throw new RangeError("Multiple content holes") }
          contentDOM = innerContent;
        }
      }
    }
    return {dom: dom, contentDOM: contentDOM}
  };

  // :: (Schema) → DOMSerializer
  // Build a serializer using the [`toDOM`](#model.NodeSpec.toDOM)
  // properties in a schema's node and mark specs.
  DOMSerializer.fromSchema = function fromSchema (schema) {
    return schema.cached.domSerializer ||
      (schema.cached.domSerializer = new DOMSerializer(this.nodesFromSchema(schema), this.marksFromSchema(schema)))
  };

  // : (Schema) → Object<(node: Node) → DOMOutputSpec>
  // Gather the serializers in a schema's node specs into an object.
  // This can be useful as a base to build a custom serializer from.
  DOMSerializer.nodesFromSchema = function nodesFromSchema (schema) {
    var result = gatherToDOM(schema.nodes);
    if (!result.text) { result.text = function (node) { return node.text; }; }
    return result
  };

  // : (Schema) → Object<(mark: Mark) → DOMOutputSpec>
  // Gather the serializers in a schema's mark specs into an object.
  DOMSerializer.marksFromSchema = function marksFromSchema (schema) {
    return gatherToDOM(schema.marks)
  };

  function gatherToDOM(obj) {
    var result = {};
    for (var name in obj) {
      var toDOM = obj[name].spec.toDOM;
      if (toDOM) { result[name] = toDOM; }
    }
    return result
  }

  function doc(options) {
    // declare global: window
    return options.document || window.document
  }

  var index_es = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ContentMatch: ContentMatch,
    DOMParser: DOMParser,
    DOMSerializer: DOMSerializer,
    Fragment: Fragment,
    Mark: Mark,
    MarkType: MarkType,
    Node: Node$1,
    NodeRange: NodeRange,
    NodeType: NodeType,
    ReplaceError: ReplaceError,
    ResolvedPos: ResolvedPos,
    Schema: Schema,
    Slice: Slice
  });

  // Mappable:: interface
  // There are several things that positions can be mapped through.
  // Such objects conform to this interface.
  //
  //   map:: (pos: number, assoc: ?number) → number
  //   Map a position through this object. When given, `assoc` (should
  //   be -1 or 1, defaults to 1) determines with which side the
  //   position is associated, which determines in which direction to
  //   move when a chunk of content is inserted at the mapped position.
  //
  //   mapResult:: (pos: number, assoc: ?number) → MapResult
  //   Map a position, and return an object containing additional
  //   information about the mapping. The result's `deleted` field tells
  //   you whether the position was deleted (completely enclosed in a
  //   replaced range) during the mapping. When content on only one side
  //   is deleted, the position itself is only considered deleted when
  //   `assoc` points in the direction of the deleted content.

  // Recovery values encode a range index and an offset. They are
  // represented as numbers, because tons of them will be created when
  // mapping, for example, a large number of decorations. The number's
  // lower 16 bits provide the index, the remaining bits the offset.
  //
  // Note: We intentionally don't use bit shift operators to en- and
  // decode these, since those clip to 32 bits, which we might in rare
  // cases want to overflow. A 64-bit float can represent 48-bit
  // integers precisely.

  var lower16 = 0xffff;
  var factor16 = Math.pow(2, 16);

  function makeRecover(index, offset) { return index + offset * factor16 }
  function recoverIndex(value) { return value & lower16 }
  function recoverOffset(value) { return (value - (value & lower16)) / factor16 }

  // ::- An object representing a mapped position with extra
  // information.
  var MapResult = function MapResult(pos, deleted, recover) {
    if ( deleted === void 0 ) deleted = false;
    if ( recover === void 0 ) recover = null;

    // :: number The mapped version of the position.
    this.pos = pos;
    // :: bool Tells you whether the position was deleted, that is,
    // whether the step removed its surroundings from the document.
    this.deleted = deleted;
    this.recover = recover;
  };

  // :: class extends Mappable
  // A map describing the deletions and insertions made by a step, which
  // can be used to find the correspondence between positions in the
  // pre-step version of a document and the same position in the
  // post-step version.
  var StepMap = function StepMap(ranges, inverted) {
    if ( inverted === void 0 ) inverted = false;

    this.ranges = ranges;
    this.inverted = inverted;
  };

  StepMap.prototype.recover = function recover (value) {
    var diff = 0, index = recoverIndex(value);
    if (!this.inverted) { for (var i = 0; i < index; i++)
      { diff += this.ranges[i * 3 + 2] - this.ranges[i * 3 + 1]; } }
    return this.ranges[index * 3] + diff + recoverOffset(value)
  };

  // : (number, ?number) → MapResult
  StepMap.prototype.mapResult = function mapResult (pos, assoc) {
    if ( assoc === void 0 ) assoc = 1;
   return this._map(pos, assoc, false) };

  // : (number, ?number) → number
  StepMap.prototype.map = function map (pos, assoc) {
    if ( assoc === void 0 ) assoc = 1;
   return this._map(pos, assoc, true) };

  StepMap.prototype._map = function _map (pos, assoc, simple) {
    var diff = 0, oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
    for (var i = 0; i < this.ranges.length; i += 3) {
      var start = this.ranges[i] - (this.inverted ? diff : 0);
      if (start > pos) { break }
      var oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex], end = start + oldSize;
      if (pos <= end) {
        var side = !oldSize ? assoc : pos == start ? -1 : pos == end ? 1 : assoc;
        var result = start + diff + (side < 0 ? 0 : newSize);
        if (simple) { return result }
        var recover = makeRecover(i / 3, pos - start);
        return new MapResult(result, assoc < 0 ? pos != start : pos != end, recover)
      }
      diff += newSize - oldSize;
    }
    return simple ? pos + diff : new MapResult(pos + diff)
  };

  StepMap.prototype.touches = function touches (pos, recover) {
    var diff = 0, index = recoverIndex(recover);
    var oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
    for (var i = 0; i < this.ranges.length; i += 3) {
      var start = this.ranges[i] - (this.inverted ? diff : 0);
      if (start > pos) { break }
      var oldSize = this.ranges[i + oldIndex], end = start + oldSize;
      if (pos <= end && i == index * 3) { return true }
      diff += this.ranges[i + newIndex] - oldSize;
    }
    return false
  };

  // :: ((oldStart: number, oldEnd: number, newStart: number, newEnd: number))
  // Calls the given function on each of the changed ranges included in
  // this map.
  StepMap.prototype.forEach = function forEach (f) {
    var oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
    for (var i = 0, diff = 0; i < this.ranges.length; i += 3) {
      var start = this.ranges[i], oldStart = start - (this.inverted ? diff : 0), newStart = start + (this.inverted ? 0 : diff);
      var oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex];
      f(oldStart, oldStart + oldSize, newStart, newStart + newSize);
      diff += newSize - oldSize;
    }
  };

  // :: () → StepMap
  // Create an inverted version of this map. The result can be used to
  // map positions in the post-step document to the pre-step document.
  StepMap.prototype.invert = function invert () {
    return new StepMap(this.ranges, !this.inverted)
  };

  StepMap.prototype.toString = function toString () {
    return (this.inverted ? "-" : "") + JSON.stringify(this.ranges)
  };

  // :: (n: number) → StepMap
  // Create a map that moves all positions by offset `n` (which may be
  // negative). This can be useful when applying steps meant for a
  // sub-document to a larger document, or vice-versa.
  StepMap.offset = function offset (n) {
    return n == 0 ? StepMap.empty : new StepMap(n < 0 ? [0, -n, 0] : [0, 0, n])
  };

  StepMap.empty = new StepMap([]);

  // :: class extends Mappable
  // A mapping represents a pipeline of zero or more [step
  // maps](#transform.StepMap). It has special provisions for losslessly
  // handling mapping positions through a series of steps in which some
  // steps are inverted versions of earlier steps. (This comes up when
  // ‘[rebasing](/docs/guide/#transform.rebasing)’ steps for
  // collaboration or history management.)
  var Mapping = function Mapping(maps, mirror, from, to) {
    // :: [StepMap]
    // The step maps in this mapping.
    this.maps = maps || [];
    // :: number
    // The starting position in the `maps` array, used when `map` or
    // `mapResult` is called.
    this.from = from || 0;
    // :: number
    // The end position in the `maps` array.
    this.to = to == null ? this.maps.length : to;
    this.mirror = mirror;
  };

  // :: (?number, ?number) → Mapping
  // Create a mapping that maps only through a part of this one.
  Mapping.prototype.slice = function slice (from, to) {
      if ( from === void 0 ) from = 0;
      if ( to === void 0 ) to = this.maps.length;

    return new Mapping(this.maps, this.mirror, from, to)
  };

  Mapping.prototype.copy = function copy () {
    return new Mapping(this.maps.slice(), this.mirror && this.mirror.slice(), this.from, this.to)
  };

  // :: (StepMap, ?number)
  // Add a step map to the end of this mapping. If `mirrors` is
  // given, it should be the index of the step map that is the mirror
  // image of this one.
  Mapping.prototype.appendMap = function appendMap (map, mirrors) {
    this.to = this.maps.push(map);
    if (mirrors != null) { this.setMirror(this.maps.length - 1, mirrors); }
  };

  // :: (Mapping)
  // Add all the step maps in a given mapping to this one (preserving
  // mirroring information).
  Mapping.prototype.appendMapping = function appendMapping (mapping) {
    for (var i = 0, startSize = this.maps.length; i < mapping.maps.length; i++) {
      var mirr = mapping.getMirror(i);
      this.appendMap(mapping.maps[i], mirr != null && mirr < i ? startSize + mirr : null);
    }
  };

  // :: (number) → ?number
  // Finds the offset of the step map that mirrors the map at the
  // given offset, in this mapping (as per the second argument to
  // `appendMap`).
  Mapping.prototype.getMirror = function getMirror (n) {
    if (this.mirror) { for (var i = 0; i < this.mirror.length; i++)
      { if (this.mirror[i] == n) { return this.mirror[i + (i % 2 ? -1 : 1)] } } }
  };

  Mapping.prototype.setMirror = function setMirror (n, m) {
    if (!this.mirror) { this.mirror = []; }
    this.mirror.push(n, m);
  };

  // :: (Mapping)
  // Append the inverse of the given mapping to this one.
  Mapping.prototype.appendMappingInverted = function appendMappingInverted (mapping) {
    for (var i = mapping.maps.length - 1, totalSize = this.maps.length + mapping.maps.length; i >= 0; i--) {
      var mirr = mapping.getMirror(i);
      this.appendMap(mapping.maps[i].invert(), mirr != null && mirr > i ? totalSize - mirr - 1 : null);
    }
  };

  // :: () → Mapping
  // Create an inverted version of this mapping.
  Mapping.prototype.invert = function invert () {
    var inverse = new Mapping;
    inverse.appendMappingInverted(this);
    return inverse
  };

  // : (number, ?number) → number
  // Map a position through this mapping.
  Mapping.prototype.map = function map (pos, assoc) {
      if ( assoc === void 0 ) assoc = 1;

    if (this.mirror) { return this._map(pos, assoc, true) }
    for (var i = this.from; i < this.to; i++)
      { pos = this.maps[i].map(pos, assoc); }
    return pos
  };

  // : (number, ?number) → MapResult
  // Map a position through this mapping, returning a mapping
  // result.
  Mapping.prototype.mapResult = function mapResult (pos, assoc) {
    if ( assoc === void 0 ) assoc = 1;
   return this._map(pos, assoc, false) };

  Mapping.prototype._map = function _map (pos, assoc, simple) {
    var deleted = false, recoverables = null;

    for (var i = this.from; i < this.to; i++) {
      var map = this.maps[i], rec = recoverables && recoverables[i];
      if (rec != null && map.touches(pos, rec)) {
        pos = map.recover(rec);
        continue
      }

      var result = map.mapResult(pos, assoc);
      if (result.recover != null) {
        var corr = this.getMirror(i);
        if (corr != null && corr > i && corr < this.to) {
          if (result.deleted) {
            i = corr;
            pos = this.maps[corr].recover(result.recover);
            continue
          } else {
  (recoverables || (recoverables = Object.create(null)))[corr] = result.recover;
          }
        }
      }

      if (result.deleted) { deleted = true; }
      pos = result.pos;
    }

    return simple ? pos : new MapResult(pos, deleted)
  };

  function TransformError(message) {
    var err = Error.call(this, message);
    err.__proto__ = TransformError.prototype;
    return err
  }

  TransformError.prototype = Object.create(Error.prototype);
  TransformError.prototype.constructor = TransformError;
  TransformError.prototype.name = "TransformError";

  // ::- Abstraction to build up and track an array of
  // [steps](#transform.Step) representing a document transformation.
  //
  // Most transforming methods return the `Transform` object itself, so
  // that they can be chained.
  var Transform = function Transform(doc) {
    // :: Node
    // The current document (the result of applying the steps in the
    // transform).
    this.doc = doc;
    // :: [Step]
    // The steps in this transform.
    this.steps = [];
    // :: [Node]
    // The documents before each of the steps.
    this.docs = [];
    // :: Mapping
    // A mapping with the maps for each of the steps in this transform.
    this.mapping = new Mapping;
  };

  var prototypeAccessors$7 = { before: { configurable: true },docChanged: { configurable: true } };

  // :: Node The starting document.
  prototypeAccessors$7.before.get = function () { return this.docs.length ? this.docs[0] : this.doc };

  // :: (step: Step) → this
  // Apply a new step in this transform, saving the result. Throws an
  // error when the step fails.
  Transform.prototype.step = function step (object) {
    var result = this.maybeStep(object);
    if (result.failed) { throw new TransformError(result.failed) }
    return this
  };

  // :: (Step) → StepResult
  // Try to apply a step in this transformation, ignoring it if it
  // fails. Returns the step result.
  Transform.prototype.maybeStep = function maybeStep (step) {
    var result = step.apply(this.doc);
    if (!result.failed) { this.addStep(step, result.doc); }
    return result
  };

  // :: bool
  // True when the document has been changed (when there are any
  // steps).
  prototypeAccessors$7.docChanged.get = function () {
    return this.steps.length > 0
  };

  Transform.prototype.addStep = function addStep (step, doc) {
    this.docs.push(this.doc);
    this.steps.push(step);
    this.mapping.appendMap(step.getMap());
    this.doc = doc;
  };

  Object.defineProperties( Transform.prototype, prototypeAccessors$7 );

  function mustOverride() { throw new Error("Override me") }

  var stepsByID = Object.create(null);

  // ::- A step object represents an atomic change. It generally applies
  // only to the document it was created for, since the positions
  // stored in it will only make sense for that document.
  //
  // New steps are defined by creating classes that extend `Step`,
  // overriding the `apply`, `invert`, `map`, `getMap` and `fromJSON`
  // methods, and registering your class with a unique
  // JSON-serialization identifier using
  // [`Step.jsonID`](#transform.Step^jsonID).
  var Step = function Step () {};

  Step.prototype.apply = function apply (_doc) { return mustOverride() };

  // :: () → StepMap
  // Get the step map that represents the changes made by this step,
  // and which can be used to transform between positions in the old
  // and the new document.
  Step.prototype.getMap = function getMap () { return StepMap.empty };

  // :: (doc: Node) → Step
  // Create an inverted version of this step. Needs the document as it
  // was before the step as argument.
  Step.prototype.invert = function invert (_doc) { return mustOverride() };

  // :: (mapping: Mappable) → ?Step
  // Map this step through a mappable thing, returning either a
  // version of that step with its positions adjusted, or `null` if
  // the step was entirely deleted by the mapping.
  Step.prototype.map = function map (_mapping) { return mustOverride() };

  // :: (other: Step) → ?Step
  // Try to merge this step with another one, to be applied directly
  // after it. Returns the merged step when possible, null if the
  // steps can't be merged.
  Step.prototype.merge = function merge (_other) { return null };

  // :: () → Object
  // Create a JSON-serializeable representation of this step. When
  // defining this for a custom subclass, make sure the result object
  // includes the step type's [JSON id](#transform.Step^jsonID) under
  // the `stepType` property.
  Step.prototype.toJSON = function toJSON () { return mustOverride() };

  // :: (Schema, Object) → Step
  // Deserialize a step from its JSON representation. Will call
  // through to the step class' own implementation of this method.
  Step.fromJSON = function fromJSON (schema, json) {
    if (!json || !json.stepType) { throw new RangeError("Invalid input for Step.fromJSON") }
    var type = stepsByID[json.stepType];
    if (!type) { throw new RangeError(("No step type " + (json.stepType) + " defined")) }
    return type.fromJSON(schema, json)
  };

  // :: (string, constructor<Step>)
  // To be able to serialize steps to JSON, each step needs a string
  // ID to attach to its JSON representation. Use this method to
  // register an ID for your step classes. Try to pick something
  // that's unlikely to clash with steps from other modules.
  Step.jsonID = function jsonID (id, stepClass) {
    if (id in stepsByID) { throw new RangeError("Duplicate use of step JSON ID " + id) }
    stepsByID[id] = stepClass;
    stepClass.prototype.jsonID = id;
    return stepClass
  };

  // ::- The result of [applying](#transform.Step.apply) a step. Contains either a
  // new document or a failure value.
  var StepResult = function StepResult(doc, failed) {
    // :: ?Node The transformed document.
    this.doc = doc;
    // :: ?string Text providing information about a failed step.
    this.failed = failed;
  };

  // :: (Node) → StepResult
  // Create a successful step result.
  StepResult.ok = function ok (doc) { return new StepResult(doc, null) };

  // :: (string) → StepResult
  // Create a failed step result.
  StepResult.fail = function fail (message) { return new StepResult(null, message) };

  // :: (Node, number, number, Slice) → StepResult
  // Call [`Node.replace`](#model.Node.replace) with the given
  // arguments. Create a successful result if it succeeds, and a
  // failed one if it throws a `ReplaceError`.
  StepResult.fromReplace = function fromReplace (doc, from, to, slice) {
    try {
      return StepResult.ok(doc.replace(from, to, slice))
    } catch (e) {
      if (e instanceof ReplaceError) { return StepResult.fail(e.message) }
      throw e
    }
  };

  // ::- Replace a part of the document with a slice of new content.
  var ReplaceStep = /*@__PURE__*/(function (Step) {
    function ReplaceStep(from, to, slice, structure) {
      Step.call(this);
      this.from = from;
      this.to = to;
      this.slice = slice;
      this.structure = !!structure;
    }

    if ( Step ) ReplaceStep.__proto__ = Step;
    ReplaceStep.prototype = Object.create( Step && Step.prototype );
    ReplaceStep.prototype.constructor = ReplaceStep;

    ReplaceStep.prototype.apply = function apply (doc) {
      if (this.structure && contentBetween(doc, this.from, this.to))
        { return StepResult.fail("Structure replace would overwrite content") }
      return StepResult.fromReplace(doc, this.from, this.to, this.slice)
    };

    ReplaceStep.prototype.getMap = function getMap () {
      return new StepMap([this.from, this.to - this.from, this.slice.size])
    };

    ReplaceStep.prototype.invert = function invert (doc) {
      return new ReplaceStep(this.from, this.from + this.slice.size, doc.slice(this.from, this.to))
    };

    ReplaceStep.prototype.map = function map (mapping) {
      var from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted) { return null }
      return new ReplaceStep(from.pos, Math.max(from.pos, to.pos), this.slice)
    };

    ReplaceStep.prototype.merge = function merge (other) {
      if (!(other instanceof ReplaceStep) || other.structure != this.structure) { return null }

      if (this.from + this.slice.size == other.from && !this.slice.openEnd && !other.slice.openStart) {
        var slice = this.slice.size + other.slice.size == 0 ? Slice.empty
            : new Slice(this.slice.content.append(other.slice.content), this.slice.openStart, other.slice.openEnd);
        return new ReplaceStep(this.from, this.to + (other.to - other.from), slice, this.structure)
      } else if (other.to == this.from && !this.slice.openStart && !other.slice.openEnd) {
        var slice$1 = this.slice.size + other.slice.size == 0 ? Slice.empty
            : new Slice(other.slice.content.append(this.slice.content), other.slice.openStart, this.slice.openEnd);
        return new ReplaceStep(other.from, this.to, slice$1, this.structure)
      } else {
        return null
      }
    };

    ReplaceStep.prototype.toJSON = function toJSON () {
      var json = {stepType: "replace", from: this.from, to: this.to};
      if (this.slice.size) { json.slice = this.slice.toJSON(); }
      if (this.structure) { json.structure = true; }
      return json
    };

    ReplaceStep.fromJSON = function fromJSON (schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        { throw new RangeError("Invalid input for ReplaceStep.fromJSON") }
      return new ReplaceStep(json.from, json.to, Slice.fromJSON(schema, json.slice), !!json.structure)
    };

    return ReplaceStep;
  }(Step));

  Step.jsonID("replace", ReplaceStep);

  // ::- Replace a part of the document with a slice of content, but
  // preserve a range of the replaced content by moving it into the
  // slice.
  var ReplaceAroundStep = /*@__PURE__*/(function (Step) {
    function ReplaceAroundStep(from, to, gapFrom, gapTo, slice, insert, structure) {
      Step.call(this);
      this.from = from;
      this.to = to;
      this.gapFrom = gapFrom;
      this.gapTo = gapTo;
      this.slice = slice;
      this.insert = insert;
      this.structure = !!structure;
    }

    if ( Step ) ReplaceAroundStep.__proto__ = Step;
    ReplaceAroundStep.prototype = Object.create( Step && Step.prototype );
    ReplaceAroundStep.prototype.constructor = ReplaceAroundStep;

    ReplaceAroundStep.prototype.apply = function apply (doc) {
      if (this.structure && (contentBetween(doc, this.from, this.gapFrom) ||
                             contentBetween(doc, this.gapTo, this.to)))
        { return StepResult.fail("Structure gap-replace would overwrite content") }

      var gap = doc.slice(this.gapFrom, this.gapTo);
      if (gap.openStart || gap.openEnd)
        { return StepResult.fail("Gap is not a flat range") }
      var inserted = this.slice.insertAt(this.insert, gap.content);
      if (!inserted) { return StepResult.fail("Content does not fit in gap") }
      return StepResult.fromReplace(doc, this.from, this.to, inserted)
    };

    ReplaceAroundStep.prototype.getMap = function getMap () {
      return new StepMap([this.from, this.gapFrom - this.from, this.insert,
                          this.gapTo, this.to - this.gapTo, this.slice.size - this.insert])
    };

    ReplaceAroundStep.prototype.invert = function invert (doc) {
      var gap = this.gapTo - this.gapFrom;
      return new ReplaceAroundStep(this.from, this.from + this.slice.size + gap,
                                   this.from + this.insert, this.from + this.insert + gap,
                                   doc.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from),
                                   this.gapFrom - this.from, this.structure)
    };

    ReplaceAroundStep.prototype.map = function map (mapping) {
      var from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      var gapFrom = mapping.map(this.gapFrom, -1), gapTo = mapping.map(this.gapTo, 1);
      if ((from.deleted && to.deleted) || gapFrom < from.pos || gapTo > to.pos) { return null }
      return new ReplaceAroundStep(from.pos, to.pos, gapFrom, gapTo, this.slice, this.insert, this.structure)
    };

    ReplaceAroundStep.prototype.toJSON = function toJSON () {
      var json = {stepType: "replaceAround", from: this.from, to: this.to,
                  gapFrom: this.gapFrom, gapTo: this.gapTo, insert: this.insert};
      if (this.slice.size) { json.slice = this.slice.toJSON(); }
      if (this.structure) { json.structure = true; }
      return json
    };

    ReplaceAroundStep.fromJSON = function fromJSON (schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number" ||
          typeof json.gapFrom != "number" || typeof json.gapTo != "number" || typeof json.insert != "number")
        { throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON") }
      return new ReplaceAroundStep(json.from, json.to, json.gapFrom, json.gapTo,
                                   Slice.fromJSON(schema, json.slice), json.insert, !!json.structure)
    };

    return ReplaceAroundStep;
  }(Step));

  Step.jsonID("replaceAround", ReplaceAroundStep);

  function contentBetween(doc, from, to) {
    var $from = doc.resolve(from), dist = to - from, depth = $from.depth;
    while (dist > 0 && depth > 0 && $from.indexAfter(depth) == $from.node(depth).childCount) {
      depth--;
      dist--;
    }
    if (dist > 0) {
      var next = $from.node(depth).maybeChild($from.indexAfter(depth));
      while (dist > 0) {
        if (!next || next.isLeaf) { return true }
        next = next.firstChild;
        dist--;
      }
    }
    return false
  }

  function canCut(node, start, end) {
    return (start == 0 || node.canReplace(start, node.childCount)) &&
      (end == node.childCount || node.canReplace(0, end))
  }

  // :: (NodeRange) → ?number
  // Try to find a target depth to which the content in the given range
  // can be lifted. Will not go across
  // [isolating](#model.NodeSpec.isolating) parent nodes.
  function liftTarget(range) {
    var parent = range.parent;
    var content = parent.content.cutByIndex(range.startIndex, range.endIndex);
    for (var depth = range.depth;; --depth) {
      var node = range.$from.node(depth);
      var index = range.$from.index(depth), endIndex = range.$to.indexAfter(depth);
      if (depth < range.depth && node.canReplace(index, endIndex, content))
        { return depth }
      if (depth == 0 || node.type.spec.isolating || !canCut(node, index, endIndex)) { break }
    }
  }

  // :: (NodeRange, number) → this
  // Split the content in the given range off from its parent, if there
  // is sibling content before or after it, and move it up the tree to
  // the depth specified by `target`. You'll probably want to use
  // [`liftTarget`](#transform.liftTarget) to compute `target`, to make
  // sure the lift is valid.
  Transform.prototype.lift = function(range, target) {
    var $from = range.$from;
    var $to = range.$to;
    var depth = range.depth;

    var gapStart = $from.before(depth + 1), gapEnd = $to.after(depth + 1);
    var start = gapStart, end = gapEnd;

    var before = Fragment.empty, openStart = 0;
    for (var d = depth, splitting = false; d > target; d--)
      { if (splitting || $from.index(d) > 0) {
        splitting = true;
        before = Fragment.from($from.node(d).copy(before));
        openStart++;
      } else {
        start--;
      } }
    var after = Fragment.empty, openEnd = 0;
    for (var d$1 = depth, splitting$1 = false; d$1 > target; d$1--)
      { if (splitting$1 || $to.after(d$1 + 1) < $to.end(d$1)) {
        splitting$1 = true;
        after = Fragment.from($to.node(d$1).copy(after));
        openEnd++;
      } else {
        end++;
      } }

    return this.step(new ReplaceAroundStep(start, end, gapStart, gapEnd,
                                           new Slice(before.append(after), openStart, openEnd),
                                           before.size - openStart, true))
  };

  // :: (NodeRange, NodeType, ?Object, ?NodeRange) → ?[{type: NodeType, attrs: ?Object}]
  // Try to find a valid way to wrap the content in the given range in a
  // node of the given type. May introduce extra nodes around and inside
  // the wrapper node, if necessary. Returns null if no valid wrapping
  // could be found. When `innerRange` is given, that range's content is
  // used as the content to fit into the wrapping, instead of the
  // content of `range`.
  function findWrapping(range, nodeType, attrs, innerRange) {
    if ( innerRange === void 0 ) innerRange = range;

    var around = findWrappingOutside(range, nodeType);
    var inner = around && findWrappingInside(innerRange, nodeType);
    if (!inner) { return null }
    return around.map(withAttrs).concat({type: nodeType, attrs: attrs}).concat(inner.map(withAttrs))
  }

  function withAttrs(type) { return {type: type, attrs: null} }

  function findWrappingOutside(range, type) {
    var parent = range.parent;
    var startIndex = range.startIndex;
    var endIndex = range.endIndex;
    var around = parent.contentMatchAt(startIndex).findWrapping(type);
    if (!around) { return null }
    var outer = around.length ? around[0] : type;
    return parent.canReplaceWith(startIndex, endIndex, outer) ? around : null
  }

  function findWrappingInside(range, type) {
    var parent = range.parent;
    var startIndex = range.startIndex;
    var endIndex = range.endIndex;
    var inner = parent.child(startIndex);
    var inside = type.contentMatch.findWrapping(inner.type);
    if (!inside) { return null }
    var lastType = inside.length ? inside[inside.length - 1] : type;
    var innerMatch = lastType.contentMatch;
    for (var i = startIndex; innerMatch && i < endIndex; i++)
      { innerMatch = innerMatch.matchType(parent.child(i).type); }
    if (!innerMatch || !innerMatch.validEnd) { return null }
    return inside
  }

  // :: (NodeRange, [{type: NodeType, attrs: ?Object}]) → this
  // Wrap the given [range](#model.NodeRange) in the given set of wrappers.
  // The wrappers are assumed to be valid in this position, and should
  // probably be computed with [`findWrapping`](#transform.findWrapping).
  Transform.prototype.wrap = function(range, wrappers) {
    var content = Fragment.empty;
    for (var i = wrappers.length - 1; i >= 0; i--)
      { content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content)); }

    var start = range.start, end = range.end;
    return this.step(new ReplaceAroundStep(start, end, start, end, new Slice(content, 0, 0), wrappers.length, true))
  };

  // :: (number, ?number, NodeType, ?Object) → this
  // Set the type of all textblocks (partly) between `from` and `to` to
  // the given node type with the given attributes.
  Transform.prototype.setBlockType = function(from, to, type, attrs) {
    var this$1 = this;
    if ( to === void 0 ) to = from;

    if (!type.isTextblock) { throw new RangeError("Type given to setBlockType should be a textblock") }
    var mapFrom = this.steps.length;
    this.doc.nodesBetween(from, to, function (node, pos) {
      if (node.isTextblock && !node.hasMarkup(type, attrs) && canChangeType(this$1.doc, this$1.mapping.slice(mapFrom).map(pos), type)) {
        // Ensure all markup that isn't allowed in the new node type is cleared
        this$1.clearIncompatible(this$1.mapping.slice(mapFrom).map(pos, 1), type);
        var mapping = this$1.mapping.slice(mapFrom);
        var startM = mapping.map(pos, 1), endM = mapping.map(pos + node.nodeSize, 1);
        this$1.step(new ReplaceAroundStep(startM, endM, startM + 1, endM - 1,
                                        new Slice(Fragment.from(type.create(attrs, null, node.marks)), 0, 0), 1, true));
        return false
      }
    });
    return this
  };

  function canChangeType(doc, pos, type) {
    var $pos = doc.resolve(pos), index = $pos.index();
    return $pos.parent.canReplaceWith(index, index + 1, type)
  }

  // :: (number, ?NodeType, ?Object, ?[Mark]) → this
  // Change the type, attributes, and/or marks of the node at `pos`.
  // When `type` isn't given, the existing node type is preserved,
  Transform.prototype.setNodeMarkup = function(pos, type, attrs, marks) {
    var node = this.doc.nodeAt(pos);
    if (!node) { throw new RangeError("No node at given position") }
    if (!type) { type = node.type; }
    var newNode = type.create(attrs, null, marks || node.marks);
    if (node.isLeaf)
      { return this.replaceWith(pos, pos + node.nodeSize, newNode) }

    if (!type.validContent(node.content))
      { throw new RangeError("Invalid content for node type " + type.name) }

    return this.step(new ReplaceAroundStep(pos, pos + node.nodeSize, pos + 1, pos + node.nodeSize - 1,
                                           new Slice(Fragment.from(newNode), 0, 0), 1, true))
  };

  // :: (Node, number, number, ?[?{type: NodeType, attrs: ?Object}]) → bool
  // Check whether splitting at the given position is allowed.
  function canSplit(doc, pos, depth, typesAfter) {
    if ( depth === void 0 ) depth = 1;

    var $pos = doc.resolve(pos), base = $pos.depth - depth;
    var innerType = (typesAfter && typesAfter[typesAfter.length - 1]) || $pos.parent;
    if (base < 0 || $pos.parent.type.spec.isolating ||
        !$pos.parent.canReplace($pos.index(), $pos.parent.childCount) ||
        !innerType.type.validContent($pos.parent.content.cutByIndex($pos.index(), $pos.parent.childCount)))
      { return false }
    for (var d = $pos.depth - 1, i = depth - 2; d > base; d--, i--) {
      var node = $pos.node(d), index$1 = $pos.index(d);
      if (node.type.spec.isolating) { return false }
      var rest = node.content.cutByIndex(index$1, node.childCount);
      var after = (typesAfter && typesAfter[i]) || node;
      if (after != node) { rest = rest.replaceChild(0, after.type.create(after.attrs)); }
      if (!node.canReplace(index$1 + 1, node.childCount) || !after.type.validContent(rest))
        { return false }
    }
    var index = $pos.indexAfter(base);
    var baseType = typesAfter && typesAfter[0];
    return $pos.node(base).canReplaceWith(index, index, baseType ? baseType.type : $pos.node(base + 1).type)
  }

  // :: (number, ?number, ?[?{type: NodeType, attrs: ?Object}]) → this
  // Split the node at the given position, and optionally, if `depth` is
  // greater than one, any number of nodes above that. By default, the
  // parts split off will inherit the node type of the original node.
  // This can be changed by passing an array of types and attributes to
  // use after the split.
  Transform.prototype.split = function(pos, depth, typesAfter) {
    if ( depth === void 0 ) depth = 1;

    var $pos = this.doc.resolve(pos), before = Fragment.empty, after = Fragment.empty;
    for (var d = $pos.depth, e = $pos.depth - depth, i = depth - 1; d > e; d--, i--) {
      before = Fragment.from($pos.node(d).copy(before));
      var typeAfter = typesAfter && typesAfter[i];
      after = Fragment.from(typeAfter ? typeAfter.type.create(typeAfter.attrs, after) : $pos.node(d).copy(after));
    }
    return this.step(new ReplaceStep(pos, pos, new Slice(before.append(after), depth, depth), true))
  };

  // :: (Node, number) → bool
  // Test whether the blocks before and after a given position can be
  // joined.
  function canJoin(doc, pos) {
    var $pos = doc.resolve(pos), index = $pos.index();
    return joinable$1($pos.nodeBefore, $pos.nodeAfter) &&
      $pos.parent.canReplace(index, index + 1)
  }

  function joinable$1(a, b) {
    return a && b && !a.isLeaf && a.canAppend(b)
  }

  // :: (Node, number, ?number) → ?number
  // Find an ancestor of the given position that can be joined to the
  // block before (or after if `dir` is positive). Returns the joinable
  // point, if any.
  function joinPoint(doc, pos, dir) {
    if ( dir === void 0 ) dir = -1;

    var $pos = doc.resolve(pos);
    for (var d = $pos.depth;; d--) {
      var before = (void 0), after = (void 0);
      if (d == $pos.depth) {
        before = $pos.nodeBefore;
        after = $pos.nodeAfter;
      } else if (dir > 0) {
        before = $pos.node(d + 1);
        after = $pos.node(d).maybeChild($pos.index(d) + 1);
      } else {
        before = $pos.node(d).maybeChild($pos.index(d) - 1);
        after = $pos.node(d + 1);
      }
      if (before && !before.isTextblock && joinable$1(before, after)) { return pos }
      if (d == 0) { break }
      pos = dir < 0 ? $pos.before(d) : $pos.after(d);
    }
  }

  // :: (number, ?number) → this
  // Join the blocks around the given position. If depth is 2, their
  // last and first siblings are also joined, and so on.
  Transform.prototype.join = function(pos, depth) {
    if ( depth === void 0 ) depth = 1;

    var step = new ReplaceStep(pos - depth, pos + depth, Slice.empty, true);
    return this.step(step)
  };

  // :: (Node, number, NodeType) → ?number
  // Try to find a point where a node of the given type can be inserted
  // near `pos`, by searching up the node hierarchy when `pos` itself
  // isn't a valid place but is at the start or end of a node. Return
  // null if no position was found.
  function insertPoint(doc, pos, nodeType) {
    var $pos = doc.resolve(pos);
    if ($pos.parent.canReplaceWith($pos.index(), $pos.index(), nodeType)) { return pos }

    if ($pos.parentOffset == 0)
      { for (var d = $pos.depth - 1; d >= 0; d--) {
        var index = $pos.index(d);
        if ($pos.node(d).canReplaceWith(index, index, nodeType)) { return $pos.before(d + 1) }
        if (index > 0) { return null }
      } }
    if ($pos.parentOffset == $pos.parent.content.size)
      { for (var d$1 = $pos.depth - 1; d$1 >= 0; d$1--) {
        var index$1 = $pos.indexAfter(d$1);
        if ($pos.node(d$1).canReplaceWith(index$1, index$1, nodeType)) { return $pos.after(d$1 + 1) }
        if (index$1 < $pos.node(d$1).childCount) { return null }
      } }
  }

  // :: (Node, number, Slice) → ?number
  // Finds a position at or around the given position where the given
  // slice can be inserted. Will look at parent nodes' nearest boundary
  // and try there, even if the original position wasn't directly at the
  // start or end of that node. Returns null when no position was found.
  function dropPoint(doc, pos, slice) {
    var $pos = doc.resolve(pos);
    if (!slice.content.size) { return pos }
    var content = slice.content;
    for (var i = 0; i < slice.openStart; i++) { content = content.firstChild.content; }
    for (var pass = 1; pass <= (slice.openStart == 0 && slice.size ? 2 : 1); pass++) {
      for (var d = $pos.depth; d >= 0; d--) {
        var bias = d == $pos.depth ? 0 : $pos.pos <= ($pos.start(d + 1) + $pos.end(d + 1)) / 2 ? -1 : 1;
        var insertPos = $pos.index(d) + (bias > 0 ? 1 : 0);
        if (pass == 1
            ? $pos.node(d).canReplace(insertPos, insertPos, content)
            : $pos.node(d).contentMatchAt(insertPos).findWrapping(content.firstChild.type))
          { return bias == 0 ? $pos.pos : bias < 0 ? $pos.before(d + 1) : $pos.after(d + 1) }
      }
    }
    return null
  }

  function mapFragment(fragment, f, parent) {
    var mapped = [];
    for (var i = 0; i < fragment.childCount; i++) {
      var child = fragment.child(i);
      if (child.content.size) { child = child.copy(mapFragment(child.content, f, child)); }
      if (child.isInline) { child = f(child, parent, i); }
      mapped.push(child);
    }
    return Fragment.fromArray(mapped)
  }

  // ::- Add a mark to all inline content between two positions.
  var AddMarkStep = /*@__PURE__*/(function (Step) {
    function AddMarkStep(from, to, mark) {
      Step.call(this);
      this.from = from;
      this.to = to;
      this.mark = mark;
    }

    if ( Step ) AddMarkStep.__proto__ = Step;
    AddMarkStep.prototype = Object.create( Step && Step.prototype );
    AddMarkStep.prototype.constructor = AddMarkStep;

    AddMarkStep.prototype.apply = function apply (doc) {
      var this$1 = this;

      var oldSlice = doc.slice(this.from, this.to), $from = doc.resolve(this.from);
      var parent = $from.node($from.sharedDepth(this.to));
      var slice = new Slice(mapFragment(oldSlice.content, function (node, parent) {
        if (!parent.type.allowsMarkType(this$1.mark.type)) { return node }
        return node.mark(this$1.mark.addToSet(node.marks))
      }, parent), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc, this.from, this.to, slice)
    };

    AddMarkStep.prototype.invert = function invert () {
      return new RemoveMarkStep(this.from, this.to, this.mark)
    };

    AddMarkStep.prototype.map = function map (mapping) {
      var from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos) { return null }
      return new AddMarkStep(from.pos, to.pos, this.mark)
    };

    AddMarkStep.prototype.merge = function merge (other) {
      if (other instanceof AddMarkStep &&
          other.mark.eq(this.mark) &&
          this.from <= other.to && this.to >= other.from)
        { return new AddMarkStep(Math.min(this.from, other.from),
                               Math.max(this.to, other.to), this.mark) }
    };

    AddMarkStep.prototype.toJSON = function toJSON () {
      return {stepType: "addMark", mark: this.mark.toJSON(),
              from: this.from, to: this.to}
    };

    AddMarkStep.fromJSON = function fromJSON (schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        { throw new RangeError("Invalid input for AddMarkStep.fromJSON") }
      return new AddMarkStep(json.from, json.to, schema.markFromJSON(json.mark))
    };

    return AddMarkStep;
  }(Step));

  Step.jsonID("addMark", AddMarkStep);

  // ::- Remove a mark from all inline content between two positions.
  var RemoveMarkStep = /*@__PURE__*/(function (Step) {
    function RemoveMarkStep(from, to, mark) {
      Step.call(this);
      this.from = from;
      this.to = to;
      this.mark = mark;
    }

    if ( Step ) RemoveMarkStep.__proto__ = Step;
    RemoveMarkStep.prototype = Object.create( Step && Step.prototype );
    RemoveMarkStep.prototype.constructor = RemoveMarkStep;

    RemoveMarkStep.prototype.apply = function apply (doc) {
      var this$1 = this;

      var oldSlice = doc.slice(this.from, this.to);
      var slice = new Slice(mapFragment(oldSlice.content, function (node) {
        return node.mark(this$1.mark.removeFromSet(node.marks))
      }), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc, this.from, this.to, slice)
    };

    RemoveMarkStep.prototype.invert = function invert () {
      return new AddMarkStep(this.from, this.to, this.mark)
    };

    RemoveMarkStep.prototype.map = function map (mapping) {
      var from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos) { return null }
      return new RemoveMarkStep(from.pos, to.pos, this.mark)
    };

    RemoveMarkStep.prototype.merge = function merge (other) {
      if (other instanceof RemoveMarkStep &&
          other.mark.eq(this.mark) &&
          this.from <= other.to && this.to >= other.from)
        { return new RemoveMarkStep(Math.min(this.from, other.from),
                                  Math.max(this.to, other.to), this.mark) }
    };

    RemoveMarkStep.prototype.toJSON = function toJSON () {
      return {stepType: "removeMark", mark: this.mark.toJSON(),
              from: this.from, to: this.to}
    };

    RemoveMarkStep.fromJSON = function fromJSON (schema, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        { throw new RangeError("Invalid input for RemoveMarkStep.fromJSON") }
      return new RemoveMarkStep(json.from, json.to, schema.markFromJSON(json.mark))
    };

    return RemoveMarkStep;
  }(Step));

  Step.jsonID("removeMark", RemoveMarkStep);

  // :: (number, number, Mark) → this
  // Add the given mark to the inline content between `from` and `to`.
  Transform.prototype.addMark = function(from, to, mark) {
    var this$1 = this;

    var removed = [], added = [], removing = null, adding = null;
    this.doc.nodesBetween(from, to, function (node, pos, parent) {
      if (!node.isInline) { return }
      var marks = node.marks;
      if (!mark.isInSet(marks) && parent.type.allowsMarkType(mark.type)) {
        var start = Math.max(pos, from), end = Math.min(pos + node.nodeSize, to);
        var newSet = mark.addToSet(marks);

        for (var i = 0; i < marks.length; i++) {
          if (!marks[i].isInSet(newSet)) {
            if (removing && removing.to == start && removing.mark.eq(marks[i]))
              { removing.to = end; }
            else
              { removed.push(removing = new RemoveMarkStep(start, end, marks[i])); }
          }
        }

        if (adding && adding.to == start)
          { adding.to = end; }
        else
          { added.push(adding = new AddMarkStep(start, end, mark)); }
      }
    });

    removed.forEach(function (s) { return this$1.step(s); });
    added.forEach(function (s) { return this$1.step(s); });
    return this
  };

  // :: (number, number, ?union<Mark, MarkType>) → this
  // Remove marks from inline nodes between `from` and `to`. When `mark`
  // is a single mark, remove precisely that mark. When it is a mark type,
  // remove all marks of that type. When it is null, remove all marks of
  // any type.
  Transform.prototype.removeMark = function(from, to, mark) {
    var this$1 = this;
    if ( mark === void 0 ) mark = null;

    var matched = [], step = 0;
    this.doc.nodesBetween(from, to, function (node, pos) {
      if (!node.isInline) { return }
      step++;
      var toRemove = null;
      if (mark instanceof MarkType) {
        var found = mark.isInSet(node.marks);
        if (found) { toRemove = [found]; }
      } else if (mark) {
        if (mark.isInSet(node.marks)) { toRemove = [mark]; }
      } else {
        toRemove = node.marks;
      }
      if (toRemove && toRemove.length) {
        var end = Math.min(pos + node.nodeSize, to);
        for (var i = 0; i < toRemove.length; i++) {
          var style = toRemove[i], found$1 = (void 0);
          for (var j = 0; j < matched.length; j++) {
            var m = matched[j];
            if (m.step == step - 1 && style.eq(matched[j].style)) { found$1 = m; }
          }
          if (found$1) {
            found$1.to = end;
            found$1.step = step;
          } else {
            matched.push({style: style, from: Math.max(pos, from), to: end, step: step});
          }
        }
      }
    });
    matched.forEach(function (m) { return this$1.step(new RemoveMarkStep(m.from, m.to, m.style)); });
    return this
  };

  // :: (number, NodeType, ?ContentMatch) → this
  // Removes all marks and nodes from the content of the node at `pos`
  // that don't match the given new parent node type. Accepts an
  // optional starting [content match](#model.ContentMatch) as third
  // argument.
  Transform.prototype.clearIncompatible = function(pos, parentType, match) {
    if ( match === void 0 ) match = parentType.contentMatch;

    var node = this.doc.nodeAt(pos);
    var delSteps = [], cur = pos + 1;
    for (var i = 0; i < node.childCount; i++) {
      var child = node.child(i), end = cur + child.nodeSize;
      var allowed = match.matchType(child.type, child.attrs);
      if (!allowed) {
        delSteps.push(new ReplaceStep(cur, end, Slice.empty));
      } else {
        match = allowed;
        for (var j = 0; j < child.marks.length; j++) { if (!parentType.allowsMarkType(child.marks[j].type))
          { this.step(new RemoveMarkStep(cur, end, child.marks[j])); } }
      }
      cur = end;
    }
    if (!match.validEnd) {
      var fill = match.fillBefore(Fragment.empty, true);
      this.replace(cur, cur, new Slice(fill, 0, 0));
    }
    for (var i$1 = delSteps.length - 1; i$1 >= 0; i$1--) { this.step(delSteps[i$1]); }
    return this
  };

  // :: (Node, number, ?number, ?Slice) → ?Step
  // ‘Fit’ a slice into a given position in the document, producing a
  // [step](#transform.Step) that inserts it. Will return null if
  // there's no meaningful way to insert the slice here, or inserting it
  // would be a no-op (an empty slice over an empty range).
  function replaceStep(doc, from, to, slice) {
    if ( to === void 0 ) to = from;
    if ( slice === void 0 ) slice = Slice.empty;

    if (from == to && !slice.size) { return null }

    var $from = doc.resolve(from), $to = doc.resolve(to);
    // Optimization -- avoid work if it's obvious that it's not needed.
    if (fitsTrivially($from, $to, slice)) { return new ReplaceStep(from, to, slice) }
    var placed = placeSlice($from, slice);

    var fittedLeft = fitLeft($from, placed);
    var fitted = fitRight($from, $to, fittedLeft);
    if (!fitted) { return null }
    if (fittedLeft.size != fitted.size && canMoveText($from, $to, fittedLeft)) {
      var d = $to.depth, after = $to.after(d);
      while (d > 1 && after == $to.end(--d)) { ++after; }
      var fittedAfter = fitRight($from, doc.resolve(after), fittedLeft);
      if (fittedAfter)
        { return new ReplaceAroundStep(from, after, to, $to.end(), fittedAfter, fittedLeft.size) }
    }
    return fitted.size || from != to ? new ReplaceStep(from, to, fitted) : null
  }

  // :: (number, ?number, ?Slice) → this
  // Replace the part of the document between `from` and `to` with the
  // given `slice`.
  Transform.prototype.replace = function(from, to, slice) {
    if ( to === void 0 ) to = from;
    if ( slice === void 0 ) slice = Slice.empty;

    var step = replaceStep(this.doc, from, to, slice);
    if (step) { this.step(step); }
    return this
  };

  // :: (number, number, union<Fragment, Node, [Node]>) → this
  // Replace the given range with the given content, which may be a
  // fragment, node, or array of nodes.
  Transform.prototype.replaceWith = function(from, to, content) {
    return this.replace(from, to, new Slice(Fragment.from(content), 0, 0))
  };

  // :: (number, number) → this
  // Delete the content between the given positions.
  Transform.prototype.delete = function(from, to) {
    return this.replace(from, to, Slice.empty)
  };

  // :: (number, union<Fragment, Node, [Node]>) → this
  // Insert the given content at the given position.
  Transform.prototype.insert = function(pos, content) {
    return this.replaceWith(pos, pos, content)
  };



  function fitLeftInner($from, depth, placed, placedBelow) {
    var content = Fragment.empty, openEnd = 0, placedHere = placed[depth];
    if ($from.depth > depth) {
      var inner = fitLeftInner($from, depth + 1, placed, placedBelow || placedHere);
      openEnd = inner.openEnd + 1;
      content = Fragment.from($from.node(depth + 1).copy(inner.content));
    }

    if (placedHere) {
      content = content.append(placedHere.content);
      openEnd = placedHere.openEnd;
    }
    if (placedBelow) {
      content = content.append($from.node(depth).contentMatchAt($from.indexAfter(depth)).fillBefore(Fragment.empty, true));
      openEnd = 0;
    }

    return {content: content, openEnd: openEnd}
  }

  function fitLeft($from, placed) {
    var ref = fitLeftInner($from, 0, placed, false);
    var content = ref.content;
    var openEnd = ref.openEnd;
    return new Slice(content, $from.depth, openEnd || 0)
  }

  function fitRightJoin(content, parent, $from, $to, depth, openStart, openEnd) {
    var match, count = content.childCount, matchCount = count - (openEnd > 0 ? 1 : 0);
    var parentNode = openStart < 0 ? parent : $from.node(depth);
    if (openStart < 0)
      { match = parentNode.contentMatchAt(matchCount); }
    else if (count == 1 && openEnd > 0)
      { match = parentNode.contentMatchAt(openStart ? $from.index(depth) : $from.indexAfter(depth)); }
    else
      { match = parentNode.contentMatchAt($from.indexAfter(depth))
        .matchFragment(content, count > 0 && openStart ? 1 : 0, matchCount); }

    var toNode = $to.node(depth);
    if (openEnd > 0 && depth < $to.depth) {
      var after = toNode.content.cutByIndex($to.indexAfter(depth)).addToStart(content.lastChild);
      var joinable$1 = match.fillBefore(after, true);
      // Can't insert content if there's a single node stretched across this gap
      if (joinable$1 && joinable$1.size && openStart > 0 && count == 1) { joinable$1 = null; }

      if (joinable$1) {
        var inner = fitRightJoin(content.lastChild.content, content.lastChild, $from, $to,
                                 depth + 1, count == 1 ? openStart - 1 : -1, openEnd - 1);
        if (inner) {
          var last = content.lastChild.copy(inner);
          if (joinable$1.size)
            { return content.cutByIndex(0, count - 1).append(joinable$1).addToEnd(last) }
          else
            { return content.replaceChild(count - 1, last) }
        }
      }
    }
    if (openEnd > 0)
      { match = match.matchType((count == 1 && openStart > 0 ? $from.node(depth + 1) : content.lastChild).type); }

    // If we're here, the next level can't be joined, so we see what
    // happens if we leave it open.
    var toIndex = $to.index(depth);
    if (toIndex == toNode.childCount && !toNode.type.compatibleContent(parent.type)) { return null }
    var joinable = match.fillBefore(toNode.content, true, toIndex);
    for (var i = toIndex; joinable && i < toNode.content.childCount; i++)
      { if (!parentNode.type.allowsMarks(toNode.content.child(i).marks)) { joinable = null; } }
    if (!joinable) { return null }

    if (openEnd > 0) {
      var closed = fitRightClosed(content.lastChild, openEnd - 1, $from, depth + 1,
                                  count == 1 ? openStart - 1 : -1);
      content = content.replaceChild(count - 1, closed);
    }
    content = content.append(joinable);
    if ($to.depth > depth)
      { content = content.addToEnd(fitRightSeparate($to, depth + 1)); }
    return content
  }

  function fitRightClosed(node, openEnd, $from, depth, openStart) {
    var match, content = node.content, count = content.childCount;
    if (openStart >= 0)
      { match = $from.node(depth).contentMatchAt($from.indexAfter(depth))
        .matchFragment(content, openStart > 0 ? 1 : 0, count); }
    else
      { match = node.contentMatchAt(count); }

    if (openEnd > 0) {
      var closed = fitRightClosed(content.lastChild, openEnd - 1, $from, depth + 1,
                                  count == 1 ? openStart - 1 : -1);
      content = content.replaceChild(count - 1, closed);
    }

    return node.copy(content.append(match.fillBefore(Fragment.empty, true)))
  }

  function fitRightSeparate($to, depth) {
    var node = $to.node(depth);
    var fill = node.contentMatchAt(0).fillBefore(node.content, true, $to.index(depth));
    if ($to.depth > depth) { fill = fill.addToEnd(fitRightSeparate($to, depth + 1)); }
    return node.copy(fill)
  }

  function normalizeSlice(content, openStart, openEnd) {
    while (openStart > 0 && openEnd > 0 && content.childCount == 1) {
      content = content.firstChild.content;
      openStart--;
      openEnd--;
    }
    return new Slice(content, openStart, openEnd)
  }

  // : (ResolvedPos, ResolvedPos, number, Slice) → Slice
  function fitRight($from, $to, slice) {
    var fitted = fitRightJoin(slice.content, $from.node(0), $from, $to, 0, slice.openStart, slice.openEnd);
    if (!fitted) { return null }
    return normalizeSlice(fitted, slice.openStart, $to.depth)
  }

  function fitsTrivially($from, $to, slice) {
    return !slice.openStart && !slice.openEnd && $from.start() == $to.start() &&
      $from.parent.canReplace($from.index(), $to.index(), slice.content)
  }

  function canMoveText($from, $to, slice) {
    if (!$to.parent.isTextblock) { return false }

    var parent = slice.openEnd ? nodeRight(slice.content, slice.openEnd)
        : $from.node($from.depth - (slice.openStart - slice.openEnd));
    if (!parent.isTextblock) { return false }
    for (var i = $to.index(); i < $to.parent.childCount; i++)
      { if (!parent.type.allowsMarks($to.parent.child(i).marks)) { return false } }
    var match;
    if (slice.openEnd) {
      match = parent.contentMatchAt(parent.childCount);
    } else {
      match = parent.contentMatchAt(parent.childCount);
      if (slice.size) { match = match.matchFragment(slice.content, slice.openStart ? 1 : 0); }
    }
    match = match.matchFragment($to.parent.content, $to.index());
    return match && match.validEnd
  }

  function nodeRight(content, depth) {
    for (var i = 1; i < depth; i++) { content = content.lastChild.content; }
    return content.lastChild
  }

  // Algorithm for 'placing' the elements of a slice into a gap:
  //
  // We consider the content of each node that is open to the left to be
  // independently placeable. I.e. in <p("foo"), p("bar")>, when the
  // paragraph on the left is open, "foo" can be placed (somewhere on
  // the left side of the replacement gap) independently from p("bar").
  //
  // So placeSlice splits up a slice into a number of sub-slices,
  // along with information on where they can be placed on the given
  // left-side edge. It works by walking the open side of the slice,
  // from the inside out, and trying to find a landing spot for each
  // element, by simultaneously scanning over the gap side. When no
  // place is found for an open node's content, it is left in that node.

  // : (ResolvedPos, Slice) → [{content: Fragment, openEnd: number, depth: number}]
  function placeSlice($from, slice) {
    var frontier = new Frontier($from);
    for (var pass = 1; slice.size && pass <= 3; pass++) {
      var value = frontier.placeSlice(slice.content, slice.openStart, slice.openEnd, pass);
      if (pass == 3 && value != slice && value.size) { pass = 0; } // Restart if the 3rd pass made progress but left content
      slice = value;
    }
    while (frontier.open.length) { frontier.closeNode(); }
    return frontier.placed
  }

  // Helper class that models the open side of the insert position,
  // keeping track of the content match and already inserted content
  // at each depth.
  var Frontier = function Frontier($pos) {
    // : [{parent: Node, match: ContentMatch, content: Fragment, wrapper: bool, openEnd: number, depth: number}]
    this.open = [];
    for (var d = 0; d <= $pos.depth; d++) {
      var parent = $pos.node(d), match = parent.contentMatchAt($pos.indexAfter(d));
      this.open.push({parent: parent, match: match, content: Fragment.empty, wrapper: false, openEnd: 0, depth: d});
    }
    this.placed = [];
  };

  // : (Fragment, number, number, number, ?Node) → Slice
  // Tries to place the content of the given slice, and returns a
  // slice containing unplaced content.
  //
  // pass 1: try to fit directly
  // pass 2: allow wrapper nodes to be introduced
  // pass 3: allow unwrapping of nodes that aren't open
  Frontier.prototype.placeSlice = function placeSlice (fragment, openStart, openEnd, pass, parent) {
    if (openStart > 0) {
      var first = fragment.firstChild;
      var inner = this.placeSlice(first.content, Math.max(0, openStart - 1),
                                  openEnd && fragment.childCount == 1 ? openEnd - 1 : 0,
                                  pass, first);
      if (inner.content != first.content) {
        if (inner.content.size) {
          fragment = fragment.replaceChild(0, first.copy(inner.content));
          openStart = inner.openStart + 1;
        } else {
          if (fragment.childCount == 1) { openEnd = 0; }
          fragment = fragment.cutByIndex(1);
          openStart = 0;
        }
      }
    }
    var result = this.placeContent(fragment, openStart, openEnd, pass, parent);
    if (pass > 2 && result.size && openStart == 0) {
      var child = result.content.firstChild, single = result.content.childCount == 1;
      this.placeContent(child.content, 0, openEnd && single ? openEnd - 1 : 0, pass, child);
      result = single ? Fragment.empty : new Slice(result.content.cutByIndex(1), 0, openEnd);
    }
    return result
  };

  Frontier.prototype.placeContent = function placeContent (fragment, openStart, openEnd, pass, parent) {
    var i = 0;
    // Go over the fragment's children
    for (; i < fragment.childCount; i++) {
      var child = fragment.child(i), placed = false, last = i == fragment.childCount - 1;
      // Try each open node in turn, starting from the innermost
      for (var d = this.open.length - 1; d >= 0; d--) {
        var open = this.open[d], wrap = (void 0);

        // If pass > 1, it is allowed to wrap the node to help find a
        // fit, so if findWrapping returns something, we add open
        // nodes to the frontier for that wrapping.
        if (pass > 1 && (wrap = open.match.findWrapping(child.type)) &&
            !(parent && wrap.length && wrap[wrap.length - 1] == parent.type)) {
          while (this.open.length - 1 > d) { this.closeNode(); }
          for (var w = 0; w < wrap.length; w++) {
            open.match = open.match.matchType(wrap[w]);
            d++;
            open = {parent: wrap[w].create(),
                    match: wrap[w].contentMatch,
                    content: Fragment.empty, wrapper: true, openEnd: 0, depth: d + w};
            this.open.push(open);
          }
        }

        // See if the child fits here
        var match = open.match.matchType(child.type);
        if (!match) {
          var fill = open.match.fillBefore(Fragment.from(child));
          if (fill) {
            for (var j = 0; j < fill.childCount; j++) {
              var ch = fill.child(j);
              this.addNode(open, ch, 0);
              match = open.match.matchFragment(ch);
            }
          } else if (parent && open.match.matchType(parent.type)) {
            // Don't continue looking further up if the parent node
            // would fit here.
            break
          } else {
            continue
          }
        }

        // Close open nodes above this one, since we're starting to
        // add to this.
        while (this.open.length - 1 > d) { this.closeNode(); }
        // Strip marks from the child or close its start when necessary
        child = child.mark(open.parent.type.allowedMarks(child.marks));
        if (openStart) {
          child = closeNodeStart(child, openStart, last ? openEnd : 0);
          openStart = 0;
        }
        // Add the child to this open node and adjust its metadata
        this.addNode(open, child, last ? openEnd : 0);
        open.match = match;
        if (last) { openEnd = 0; }
        placed = true;
        break
      }
      // As soon as we've failed to place a node we stop looking at
      // later nodes
      if (!placed) { break }
    }
    // Close the current open node if it's not the the root and we
    // either placed up to the end of the node or the the current
    // slice depth's node type matches the open node's type
    if (this.open.length > 1 &&
        (i > 0 && i == fragment.childCount ||
         parent && this.open[this.open.length - 1].parent.type == parent.type))
      { this.closeNode(); }

    return new Slice(fragment.cutByIndex(i), openStart, openEnd)
  };

  Frontier.prototype.addNode = function addNode (open, node, openEnd) {
    open.content = closeFragmentEnd(open.content, open.openEnd).addToEnd(node);
    open.openEnd = openEnd;
  };

  Frontier.prototype.closeNode = function closeNode () {
    var open = this.open.pop();
    if (open.content.size == 0) ; else if (open.wrapper) {
      this.addNode(this.open[this.open.length - 1], open.parent.copy(open.content), open.openEnd + 1);
    } else {
      this.placed[open.depth] = {depth: open.depth, content: open.content, openEnd: open.openEnd};
    }
  };

  function closeNodeStart(node, openStart, openEnd) {
    var content = node.content;
    if (openStart > 1) {
      var first = closeNodeStart(node.firstChild, openStart - 1, node.childCount == 1 ? openEnd - 1 : 0);
      content = node.content.replaceChild(0, first);
    }
    var fill = node.type.contentMatch.fillBefore(content, openEnd == 0);
    return node.copy(fill.append(content))
  }

  function closeNodeEnd(node, depth) {
    var content = node.content;
    if (depth > 1) {
      var last = closeNodeEnd(node.lastChild, depth - 1);
      content = node.content.replaceChild(node.childCount - 1, last);
    }
    var fill = node.contentMatchAt(node.childCount).fillBefore(Fragment.empty, true);
    return node.copy(content.append(fill))
  }

  function closeFragmentEnd(fragment, depth) {
    return depth ? fragment.replaceChild(fragment.childCount - 1, closeNodeEnd(fragment.lastChild, depth)) : fragment
  }

  // :: (number, number, Slice) → this
  // Replace a range of the document with a given slice, using `from`,
  // `to`, and the slice's [`openStart`](#model.Slice.openStart) property
  // as hints, rather than fixed start and end points. This method may
  // grow the replaced area or close open nodes in the slice in order to
  // get a fit that is more in line with WYSIWYG expectations, by
  // dropping fully covered parent nodes of the replaced region when
  // they are marked [non-defining](#model.NodeSpec.defining), or
  // including an open parent node from the slice that _is_ marked as
  // [defining](#model.NodeSpec.defining).
  //
  // This is the method, for example, to handle paste. The similar
  // [`replace`](#transform.Transform.replace) method is a more
  // primitive tool which will _not_ move the start and end of its given
  // range, and is useful in situations where you need more precise
  // control over what happens.
  Transform.prototype.replaceRange = function(from, to, slice) {
    if (!slice.size) { return this.deleteRange(from, to) }

    var $from = this.doc.resolve(from), $to = this.doc.resolve(to);
    if (fitsTrivially($from, $to, slice))
      { return this.step(new ReplaceStep(from, to, slice)) }

    var targetDepths = coveredDepths($from, this.doc.resolve(to));
    // Can't replace the whole document, so remove 0 if it's present
    if (targetDepths[targetDepths.length - 1] == 0) { targetDepths.pop(); }
    // Negative numbers represent not expansion over the whole node at
    // that depth, but replacing from $from.before(-D) to $to.pos.
    var preferredTarget = -($from.depth + 1);
    targetDepths.unshift(preferredTarget);
    // This loop picks a preferred target depth, if one of the covering
    // depths is not outside of a defining node, and adds negative
    // depths for any depth that has $from at its start and does not
    // cross a defining node.
    for (var d = $from.depth, pos = $from.pos - 1; d > 0; d--, pos--) {
      var spec = $from.node(d).type.spec;
      if (spec.defining || spec.isolating) { break }
      if (targetDepths.indexOf(d) > -1) { preferredTarget = d; }
      else if ($from.before(d) == pos) { targetDepths.splice(1, 0, -d); }
    }
    // Try to fit each possible depth of the slice into each possible
    // target depth, starting with the preferred depths.
    var preferredTargetIndex = targetDepths.indexOf(preferredTarget);

    var leftNodes = [], preferredDepth = slice.openStart;
    for (var content = slice.content, i = 0;; i++) {
      var node = content.firstChild;
      leftNodes.push(node);
      if (i == slice.openStart) { break }
      content = node.content;
    }
    // Back up if the node directly above openStart, or the node above
    // that separated only by a non-defining textblock node, is defining.
    if (preferredDepth > 0 && leftNodes[preferredDepth - 1].type.spec.defining &&
        $from.node(preferredTargetIndex).type != leftNodes[preferredDepth - 1].type)
      { preferredDepth -= 1; }
    else if (preferredDepth >= 2 && leftNodes[preferredDepth - 1].isTextblock && leftNodes[preferredDepth - 2].type.spec.defining &&
             $from.node(preferredTargetIndex).type != leftNodes[preferredDepth - 2].type)
      { preferredDepth -= 2; }

    for (var j = slice.openStart; j >= 0; j--) {
      var openDepth = (j + preferredDepth + 1) % (slice.openStart + 1);
      var insert = leftNodes[openDepth];
      if (!insert) { continue }
      for (var i$1 = 0; i$1 < targetDepths.length; i$1++) {
        // Loop over possible expansion levels, starting with the
        // preferred one
        var targetDepth = targetDepths[(i$1 + preferredTargetIndex) % targetDepths.length], expand = true;
        if (targetDepth < 0) { expand = false; targetDepth = -targetDepth; }
        var parent = $from.node(targetDepth - 1), index = $from.index(targetDepth - 1);
        if (parent.canReplaceWith(index, index, insert.type, insert.marks))
          { return this.replace($from.before(targetDepth), expand ? $to.after(targetDepth) : to,
                              new Slice(closeFragment(slice.content, 0, slice.openStart, openDepth),
                                        openDepth, slice.openEnd)) }
      }
    }

    var startSteps = this.steps.length;
    for (var i$2 = targetDepths.length - 1; i$2 >= 0; i$2--) {
      this.replace(from, to, slice);
      if (this.steps.length > startSteps) { break }
      var depth = targetDepths[i$2];
      if (i$2 < 0) { continue }
      from = $from.before(depth); to = $to.after(depth);
    }
    return this
  };

  function closeFragment(fragment, depth, oldOpen, newOpen, parent) {
    if (depth < oldOpen) {
      var first = fragment.firstChild;
      fragment = fragment.replaceChild(0, first.copy(closeFragment(first.content, depth + 1, oldOpen, newOpen, first)));
    }
    if (depth > newOpen) {
      var match = parent.contentMatchAt(0);
      var start = match.fillBefore(fragment).append(fragment);
      fragment = start.append(match.matchFragment(start).fillBefore(Fragment.empty, true));
    }
    return fragment
  }

  // :: (number, number, Node) → this
  // Replace the given range with a node, but use `from` and `to` as
  // hints, rather than precise positions. When from and to are the same
  // and are at the start or end of a parent node in which the given
  // node doesn't fit, this method may _move_ them out towards a parent
  // that does allow the given node to be placed. When the given range
  // completely covers a parent node, this method may completely replace
  // that parent node.
  Transform.prototype.replaceRangeWith = function(from, to, node) {
    if (!node.isInline && from == to && this.doc.resolve(from).parent.content.size) {
      var point = insertPoint(this.doc, from, node.type);
      if (point != null) { from = to = point; }
    }
    return this.replaceRange(from, to, new Slice(Fragment.from(node), 0, 0))
  };

  // :: (number, number) → this
  // Delete the given range, expanding it to cover fully covered
  // parent nodes until a valid replace is found.
  Transform.prototype.deleteRange = function(from, to) {
    var $from = this.doc.resolve(from), $to = this.doc.resolve(to);
    var covered = coveredDepths($from, $to);
    for (var i = 0; i < covered.length; i++) {
      var depth = covered[i], last = i == covered.length - 1;
      if ((last && depth == 0) || $from.node(depth).type.contentMatch.validEnd)
        { return this.delete($from.start(depth), $to.end(depth)) }
      if (depth > 0 && (last || $from.node(depth - 1).canReplace($from.index(depth - 1), $to.indexAfter(depth - 1))))
        { return this.delete($from.before(depth), $to.after(depth)) }
    }
    for (var d = 1; d <= $from.depth; d++) {
      if (from - $from.start(d) == $from.depth - d && to > $from.end(d) && $to.end(d) - to != $to.depth - d)
        { return this.delete($from.before(d), to) }
    }
    return this.delete(from, to)
  };

  // : (ResolvedPos, ResolvedPos) → [number]
  // Returns an array of all depths for which $from - $to spans the
  // whole content of the nodes at that depth.
  function coveredDepths($from, $to) {
    var result = [], minDepth = Math.min($from.depth, $to.depth);
    for (var d = minDepth; d >= 0; d--) {
      var start = $from.start(d);
      if (start < $from.pos - ($from.depth - d) ||
          $to.end(d) > $to.pos + ($to.depth - d) ||
          $from.node(d).type.spec.isolating ||
          $to.node(d).type.spec.isolating) { break }
      if (start == $to.start(d)) { result.push(d); }
    }
    return result
  }

  var index_es$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    AddMarkStep: AddMarkStep,
    MapResult: MapResult,
    Mapping: Mapping,
    RemoveMarkStep: RemoveMarkStep,
    ReplaceAroundStep: ReplaceAroundStep,
    ReplaceStep: ReplaceStep,
    Step: Step,
    StepMap: StepMap,
    StepResult: StepResult,
    Transform: Transform,
    TransformError: TransformError,
    canJoin: canJoin,
    canSplit: canSplit,
    dropPoint: dropPoint,
    findWrapping: findWrapping,
    insertPoint: insertPoint,
    joinPoint: joinPoint,
    liftTarget: liftTarget,
    replaceStep: replaceStep
  });

  var classesById = Object.create(null);

  // ::- Superclass for editor selections. Every selection type should
  // extend this. Should not be instantiated directly.
  var Selection = function Selection($anchor, $head, ranges) {
    // :: [SelectionRange]
    // The ranges covered by the selection.
    this.ranges = ranges || [new SelectionRange($anchor.min($head), $anchor.max($head))];
    // :: ResolvedPos
    // The resolved anchor of the selection (the side that stays in
    // place when the selection is modified).
    this.$anchor = $anchor;
    // :: ResolvedPos
    // The resolved head of the selection (the side that moves when
    // the selection is modified).
    this.$head = $head;
  };

  var prototypeAccessors$8 = { anchor: { configurable: true },head: { configurable: true },from: { configurable: true },to: { configurable: true },$from: { configurable: true },$to: { configurable: true },empty: { configurable: true } };

  // :: number
  // The selection's anchor, as an unresolved position.
  prototypeAccessors$8.anchor.get = function () { return this.$anchor.pos };

  // :: number
  // The selection's head.
  prototypeAccessors$8.head.get = function () { return this.$head.pos };

  // :: number
  // The lower bound of the selection's main range.
  prototypeAccessors$8.from.get = function () { return this.$from.pos };

  // :: number
  // The upper bound of the selection's main range.
  prototypeAccessors$8.to.get = function () { return this.$to.pos };

  // :: ResolvedPos
  // The resolved lowerbound of the selection's main range.
  prototypeAccessors$8.$from.get = function () {
    return this.ranges[0].$from
  };

  // :: ResolvedPos
  // The resolved upper bound of the selection's main range.
  prototypeAccessors$8.$to.get = function () {
    return this.ranges[0].$to
  };

  // :: bool
  // Indicates whether the selection contains any content.
  prototypeAccessors$8.empty.get = function () {
    var ranges = this.ranges;
    for (var i = 0; i < ranges.length; i++)
      { if (ranges[i].$from.pos != ranges[i].$to.pos) { return false } }
    return true
  };

  // eq:: (Selection) → bool
  // Test whether the selection is the same as another selection.

  // map:: (doc: Node, mapping: Mappable) → Selection
  // Map this selection through a [mappable](#transform.Mappable) thing. `doc`
  // should be the new document to which we are mapping.

  // :: () → Slice
  // Get the content of this selection as a slice.
  Selection.prototype.content = function content () {
    return this.$from.node(0).slice(this.from, this.to, true)
  };

  // :: (Transaction, ?Slice)
  // Replace the selection with a slice or, if no slice is given,
  // delete the selection. Will append to the given transaction.
  Selection.prototype.replace = function replace (tr, content) {
      if ( content === void 0 ) content = Slice.empty;

    // Put the new selection at the position after the inserted
    // content. When that ended in an inline node, search backwards,
    // to get the position after that node. If not, search forward.
    var lastNode = content.content.lastChild, lastParent = null;
    for (var i = 0; i < content.openEnd; i++) {
      lastParent = lastNode;
      lastNode = lastNode.lastChild;
    }

    var mapFrom = tr.steps.length, ranges = this.ranges;
    for (var i$1 = 0; i$1 < ranges.length; i$1++) {
      var ref = ranges[i$1];
        var $from = ref.$from;
        var $to = ref.$to;
        var mapping = tr.mapping.slice(mapFrom);
      tr.replaceRange(mapping.map($from.pos), mapping.map($to.pos), i$1 ? Slice.empty : content);
      if (i$1 == 0)
        { selectionToInsertionEnd(tr, mapFrom, (lastNode ? lastNode.isInline : lastParent && lastParent.isTextblock) ? -1 : 1); }
    }
  };

  // :: (Transaction, Node)
  // Replace the selection with the given node, appending the changes
  // to the given transaction.
  Selection.prototype.replaceWith = function replaceWith (tr, node) {
    var mapFrom = tr.steps.length, ranges = this.ranges;
    for (var i = 0; i < ranges.length; i++) {
      var ref = ranges[i];
        var $from = ref.$from;
        var $to = ref.$to;
        var mapping = tr.mapping.slice(mapFrom);
      var from = mapping.map($from.pos), to = mapping.map($to.pos);
      if (i) {
        tr.deleteRange(from, to);
      } else {
        tr.replaceRangeWith(from, to, node);
        selectionToInsertionEnd(tr, mapFrom, node.isInline ? -1 : 1);
      }
    }
  };

  // toJSON:: () → Object
  // Convert the selection to a JSON representation. When implementing
  // this for a custom selection class, make sure to give the object a
  // `type` property whose value matches the ID under which you
  // [registered](#state.Selection^jsonID) your class.

  // :: (ResolvedPos, number, ?bool) → ?Selection
  // Find a valid cursor or leaf node selection starting at the given
  // position and searching back if `dir` is negative, and forward if
  // positive. When `textOnly` is true, only consider cursor
  // selections. Will return null when no valid selection position is
  // found.
  Selection.findFrom = function findFrom ($pos, dir, textOnly) {
    var inner = $pos.parent.inlineContent ? new TextSelection($pos)
        : findSelectionIn($pos.node(0), $pos.parent, $pos.pos, $pos.index(), dir, textOnly);
    if (inner) { return inner }

    for (var depth = $pos.depth - 1; depth >= 0; depth--) {
      var found = dir < 0
          ? findSelectionIn($pos.node(0), $pos.node(depth), $pos.before(depth + 1), $pos.index(depth), dir, textOnly)
          : findSelectionIn($pos.node(0), $pos.node(depth), $pos.after(depth + 1), $pos.index(depth) + 1, dir, textOnly);
      if (found) { return found }
    }
  };

  // :: (ResolvedPos, ?number) → Selection
  // Find a valid cursor or leaf node selection near the given
  // position. Searches forward first by default, but if `bias` is
  // negative, it will search backwards first.
  Selection.near = function near ($pos, bias) {
      if ( bias === void 0 ) bias = 1;

    return this.findFrom($pos, bias) || this.findFrom($pos, -bias) || new AllSelection($pos.node(0))
  };

  // :: (Node) → Selection
  // Find the cursor or leaf node selection closest to the start of
  // the given document. Will return an
  // [`AllSelection`](#state.AllSelection) if no valid position
  // exists.
  Selection.atStart = function atStart (doc) {
    return findSelectionIn(doc, doc, 0, 0, 1) || new AllSelection(doc)
  };

  // :: (Node) → Selection
  // Find the cursor or leaf node selection closest to the end of the
  // given document.
  Selection.atEnd = function atEnd (doc) {
    return findSelectionIn(doc, doc, doc.content.size, doc.childCount, -1) || new AllSelection(doc)
  };

  // :: (Node, Object) → Selection
  // Deserialize the JSON representation of a selection. Must be
  // implemented for custom classes (as a static class method).
  Selection.fromJSON = function fromJSON (doc, json) {
    if (!json || !json.type) { throw new RangeError("Invalid input for Selection.fromJSON") }
    var cls = classesById[json.type];
    if (!cls) { throw new RangeError(("No selection type " + (json.type) + " defined")) }
    return cls.fromJSON(doc, json)
  };

  // :: (string, constructor<Selection>)
  // To be able to deserialize selections from JSON, custom selection
  // classes must register themselves with an ID string, so that they
  // can be disambiguated. Try to pick something that's unlikely to
  // clash with classes from other modules.
  Selection.jsonID = function jsonID (id, selectionClass) {
    if (id in classesById) { throw new RangeError("Duplicate use of selection JSON ID " + id) }
    classesById[id] = selectionClass;
    selectionClass.prototype.jsonID = id;
    return selectionClass
  };

  // :: () → SelectionBookmark
  // Get a [bookmark](#state.SelectionBookmark) for this selection,
  // which is a value that can be mapped without having access to a
  // current document, and later resolved to a real selection for a
  // given document again. (This is used mostly by the history to
  // track and restore old selections.) The default implementation of
  // this method just converts the selection to a text selection and
  // returns the bookmark for that.
  Selection.prototype.getBookmark = function getBookmark () {
    return TextSelection.between(this.$anchor, this.$head).getBookmark()
  };

  Object.defineProperties( Selection.prototype, prototypeAccessors$8 );

  // :: bool
  // Controls whether, when a selection of this type is active in the
  // browser, the selected range should be visible to the user. Defaults
  // to `true`.
  Selection.prototype.visible = true;

  // SelectionBookmark:: interface
  // A lightweight, document-independent representation of a selection.
  // You can define a custom bookmark type for a custom selection class
  // to make the history handle it well.
  //
  //   map:: (mapping: Mapping) → SelectionBookmark
  //   Map the bookmark through a set of changes.
  //
  //   resolve:: (doc: Node) → Selection
  //   Resolve the bookmark to a real selection again. This may need to
  //   do some error checking and may fall back to a default (usually
  //   [`TextSelection.between`](#state.TextSelection^between)) if
  //   mapping made the bookmark invalid.

  // ::- Represents a selected range in a document.
  var SelectionRange = function SelectionRange($from, $to) {
    // :: ResolvedPos
    // The lower bound of the range.
    this.$from = $from;
    // :: ResolvedPos
    // The upper bound of the range.
    this.$to = $to;
  };

  // ::- A text selection represents a classical editor selection, with
  // a head (the moving side) and anchor (immobile side), both of which
  // point into textblock nodes. It can be empty (a regular cursor
  // position).
  var TextSelection = /*@__PURE__*/(function (Selection) {
    function TextSelection($anchor, $head) {
      if ( $head === void 0 ) $head = $anchor;

      Selection.call(this, $anchor, $head);
    }

    if ( Selection ) TextSelection.__proto__ = Selection;
    TextSelection.prototype = Object.create( Selection && Selection.prototype );
    TextSelection.prototype.constructor = TextSelection;

    var prototypeAccessors$1 = { $cursor: { configurable: true } };

    // :: ?ResolvedPos
    // Returns a resolved position if this is a cursor selection (an
    // empty text selection), and null otherwise.
    prototypeAccessors$1.$cursor.get = function () { return this.$anchor.pos == this.$head.pos ? this.$head : null };

    TextSelection.prototype.map = function map (doc, mapping) {
      var $head = doc.resolve(mapping.map(this.head));
      if (!$head.parent.inlineContent) { return Selection.near($head) }
      var $anchor = doc.resolve(mapping.map(this.anchor));
      return new TextSelection($anchor.parent.inlineContent ? $anchor : $head, $head)
    };

    TextSelection.prototype.replace = function replace (tr, content) {
      if ( content === void 0 ) content = Slice.empty;

      Selection.prototype.replace.call(this, tr, content);
      if (content == Slice.empty) {
        var marks = this.$from.marksAcross(this.$to);
        if (marks) { tr.ensureMarks(marks); }
      }
    };

    TextSelection.prototype.eq = function eq (other) {
      return other instanceof TextSelection && other.anchor == this.anchor && other.head == this.head
    };

    TextSelection.prototype.getBookmark = function getBookmark () {
      return new TextBookmark(this.anchor, this.head)
    };

    TextSelection.prototype.toJSON = function toJSON () {
      return {type: "text", anchor: this.anchor, head: this.head}
    };

    TextSelection.fromJSON = function fromJSON (doc, json) {
      if (typeof json.anchor != "number" || typeof json.head != "number")
        { throw new RangeError("Invalid input for TextSelection.fromJSON") }
      return new TextSelection(doc.resolve(json.anchor), doc.resolve(json.head))
    };

    // :: (Node, number, ?number) → TextSelection
    // Create a text selection from non-resolved positions.
    TextSelection.create = function create (doc, anchor, head) {
      if ( head === void 0 ) head = anchor;

      var $anchor = doc.resolve(anchor);
      return new this($anchor, head == anchor ? $anchor : doc.resolve(head))
    };

    // :: (ResolvedPos, ResolvedPos, ?number) → Selection
    // Return a text selection that spans the given positions or, if
    // they aren't text positions, find a text selection near them.
    // `bias` determines whether the method searches forward (default)
    // or backwards (negative number) first. Will fall back to calling
    // [`Selection.near`](#state.Selection^near) when the document
    // doesn't contain a valid text position.
    TextSelection.between = function between ($anchor, $head, bias) {
      var dPos = $anchor.pos - $head.pos;
      if (!bias || dPos) { bias = dPos >= 0 ? 1 : -1; }
      if (!$head.parent.inlineContent) {
        var found = Selection.findFrom($head, bias, true) || Selection.findFrom($head, -bias, true);
        if (found) { $head = found.$head; }
        else { return Selection.near($head, bias) }
      }
      if (!$anchor.parent.inlineContent) {
        if (dPos == 0) {
          $anchor = $head;
        } else {
          $anchor = (Selection.findFrom($anchor, -bias, true) || Selection.findFrom($anchor, bias, true)).$anchor;
          if (($anchor.pos < $head.pos) != (dPos < 0)) { $anchor = $head; }
        }
      }
      return new TextSelection($anchor, $head)
    };

    Object.defineProperties( TextSelection.prototype, prototypeAccessors$1 );

    return TextSelection;
  }(Selection));

  Selection.jsonID("text", TextSelection);

  var TextBookmark = function TextBookmark(anchor, head) {
    this.anchor = anchor;
    this.head = head;
  };
  TextBookmark.prototype.map = function map (mapping) {
    return new TextBookmark(mapping.map(this.anchor), mapping.map(this.head))
  };
  TextBookmark.prototype.resolve = function resolve (doc) {
    return TextSelection.between(doc.resolve(this.anchor), doc.resolve(this.head))
  };

  // ::- A node selection is a selection that points at a single node.
  // All nodes marked [selectable](#model.NodeSpec.selectable) can be
  // the target of a node selection. In such a selection, `from` and
  // `to` point directly before and after the selected node, `anchor`
  // equals `from`, and `head` equals `to`..
  var NodeSelection = /*@__PURE__*/(function (Selection) {
    function NodeSelection($pos) {
      var node = $pos.nodeAfter;
      var $end = $pos.node(0).resolve($pos.pos + node.nodeSize);
      Selection.call(this, $pos, $end);
      // :: Node The selected node.
      this.node = node;
    }

    if ( Selection ) NodeSelection.__proto__ = Selection;
    NodeSelection.prototype = Object.create( Selection && Selection.prototype );
    NodeSelection.prototype.constructor = NodeSelection;

    NodeSelection.prototype.map = function map (doc, mapping) {
      var ref = mapping.mapResult(this.anchor);
      var deleted = ref.deleted;
      var pos = ref.pos;
      var $pos = doc.resolve(pos);
      if (deleted) { return Selection.near($pos) }
      return new NodeSelection($pos)
    };

    NodeSelection.prototype.content = function content () {
      return new Slice(Fragment.from(this.node), 0, 0)
    };

    NodeSelection.prototype.eq = function eq (other) {
      return other instanceof NodeSelection && other.anchor == this.anchor
    };

    NodeSelection.prototype.toJSON = function toJSON () {
      return {type: "node", anchor: this.anchor}
    };

    NodeSelection.prototype.getBookmark = function getBookmark () { return new NodeBookmark(this.anchor) };

    NodeSelection.fromJSON = function fromJSON (doc, json) {
      if (typeof json.anchor != "number")
        { throw new RangeError("Invalid input for NodeSelection.fromJSON") }
      return new NodeSelection(doc.resolve(json.anchor))
    };

    // :: (Node, number) → NodeSelection
    // Create a node selection from non-resolved positions.
    NodeSelection.create = function create (doc, from) {
      return new this(doc.resolve(from))
    };

    // :: (Node) → bool
    // Determines whether the given node may be selected as a node
    // selection.
    NodeSelection.isSelectable = function isSelectable (node) {
      return !node.isText && node.type.spec.selectable !== false
    };

    return NodeSelection;
  }(Selection));

  NodeSelection.prototype.visible = false;

  Selection.jsonID("node", NodeSelection);

  var NodeBookmark = function NodeBookmark(anchor) {
    this.anchor = anchor;
  };
  NodeBookmark.prototype.map = function map (mapping) {
    var ref = mapping.mapResult(this.anchor);
      var deleted = ref.deleted;
      var pos = ref.pos;
    return deleted ? new TextBookmark(pos, pos) : new NodeBookmark(pos)
  };
  NodeBookmark.prototype.resolve = function resolve (doc) {
    var $pos = doc.resolve(this.anchor), node = $pos.nodeAfter;
    if (node && NodeSelection.isSelectable(node)) { return new NodeSelection($pos) }
    return Selection.near($pos)
  };

  // ::- A selection type that represents selecting the whole document
  // (which can not necessarily be expressed with a text selection, when
  // there are for example leaf block nodes at the start or end of the
  // document).
  var AllSelection = /*@__PURE__*/(function (Selection) {
    function AllSelection(doc) {
      Selection.call(this, doc.resolve(0), doc.resolve(doc.content.size));
    }

    if ( Selection ) AllSelection.__proto__ = Selection;
    AllSelection.prototype = Object.create( Selection && Selection.prototype );
    AllSelection.prototype.constructor = AllSelection;

    AllSelection.prototype.toJSON = function toJSON () { return {type: "all"} };

    AllSelection.fromJSON = function fromJSON (doc) { return new AllSelection(doc) };

    AllSelection.prototype.map = function map (doc) { return new AllSelection(doc) };

    AllSelection.prototype.eq = function eq (other) { return other instanceof AllSelection };

    AllSelection.prototype.getBookmark = function getBookmark () { return AllBookmark };

    return AllSelection;
  }(Selection));

  Selection.jsonID("all", AllSelection);

  var AllBookmark = {
    map: function map() { return this },
    resolve: function resolve(doc) { return new AllSelection(doc) }
  };

  // FIXME we'll need some awareness of text direction when scanning for selections

  // Try to find a selection inside the given node. `pos` points at the
  // position where the search starts. When `text` is true, only return
  // text selections.
  function findSelectionIn(doc, node, pos, index, dir, text) {
    if (node.inlineContent) { return TextSelection.create(doc, pos) }
    for (var i = index - (dir > 0 ? 0 : 1); dir > 0 ? i < node.childCount : i >= 0; i += dir) {
      var child = node.child(i);
      if (!child.isAtom) {
        var inner = findSelectionIn(doc, child, pos + dir, dir < 0 ? child.childCount : 0, dir, text);
        if (inner) { return inner }
      } else if (!text && NodeSelection.isSelectable(child)) {
        return NodeSelection.create(doc, pos - (dir < 0 ? child.nodeSize : 0))
      }
      pos += child.nodeSize * dir;
    }
  }

  function selectionToInsertionEnd(tr, startLen, bias) {
    var last = tr.steps.length - 1;
    if (last < startLen) { return }
    var step = tr.steps[last];
    if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep)) { return }
    var map = tr.mapping.maps[last], end;
    map.forEach(function (_from, _to, _newFrom, newTo) { if (end == null) { end = newTo; } });
    tr.setSelection(Selection.near(tr.doc.resolve(end), bias));
  }

  var UPDATED_SEL = 1, UPDATED_MARKS = 2, UPDATED_SCROLL = 4;

  // ::- An editor state transaction, which can be applied to a state to
  // create an updated state. Use
  // [`EditorState.tr`](#state.EditorState.tr) to create an instance.
  //
  // Transactions track changes to the document (they are a subclass of
  // [`Transform`](#transform.Transform)), but also other state changes,
  // like selection updates and adjustments of the set of [stored
  // marks](#state.EditorState.storedMarks). In addition, you can store
  // metadata properties in a transaction, which are extra pieces of
  // information that client code or plugins can use to describe what a
  // transacion represents, so that they can update their [own
  // state](#state.StateField) accordingly.
  //
  // The [editor view](#view.EditorView) uses a few metadata properties:
  // it will attach a property `"pointer"` with the value `true` to
  // selection transactions directly caused by mouse or touch input, and
  // a `"uiEvent"` property of that may be `"paste"`, `"cut"`, or `"drop"`.
  var Transaction = /*@__PURE__*/(function (Transform) {
    function Transaction(state) {
      Transform.call(this, state.doc);
      // :: number
      // The timestamp associated with this transaction, in the same
      // format as `Date.now()`.
      this.time = Date.now();
      this.curSelection = state.selection;
      // The step count for which the current selection is valid.
      this.curSelectionFor = 0;
      // :: ?[Mark]
      // The stored marks set by this transaction, if any.
      this.storedMarks = state.storedMarks;
      // Bitfield to track which aspects of the state were updated by
      // this transaction.
      this.updated = 0;
      // Object used to store metadata properties for the transaction.
      this.meta = Object.create(null);
    }

    if ( Transform ) Transaction.__proto__ = Transform;
    Transaction.prototype = Object.create( Transform && Transform.prototype );
    Transaction.prototype.constructor = Transaction;

    var prototypeAccessors = { selection: { configurable: true },selectionSet: { configurable: true },storedMarksSet: { configurable: true },isGeneric: { configurable: true },scrolledIntoView: { configurable: true } };

    // :: Selection
    // The transaction's current selection. This defaults to the editor
    // selection [mapped](#state.Selection.map) through the steps in the
    // transaction, but can be overwritten with
    // [`setSelection`](#state.Transaction.setSelection).
    prototypeAccessors.selection.get = function () {
      if (this.curSelectionFor < this.steps.length) {
        this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor));
        this.curSelectionFor = this.steps.length;
      }
      return this.curSelection
    };

    // :: (Selection) → Transaction
    // Update the transaction's current selection. Will determine the
    // selection that the editor gets when the transaction is applied.
    Transaction.prototype.setSelection = function setSelection (selection) {
      if (selection.$from.doc != this.doc)
        { throw new RangeError("Selection passed to setSelection must point at the current document") }
      this.curSelection = selection;
      this.curSelectionFor = this.steps.length;
      this.updated = (this.updated | UPDATED_SEL) & ~UPDATED_MARKS;
      this.storedMarks = null;
      return this
    };

    // :: bool
    // Whether the selection was explicitly updated by this transaction.
    prototypeAccessors.selectionSet.get = function () {
      return (this.updated & UPDATED_SEL) > 0
    };

    // :: (?[Mark]) → Transaction
    // Set the current stored marks.
    Transaction.prototype.setStoredMarks = function setStoredMarks (marks) {
      this.storedMarks = marks;
      this.updated |= UPDATED_MARKS;
      return this
    };

    // :: ([Mark]) → Transaction
    // Make sure the current stored marks or, if that is null, the marks
    // at the selection, match the given set of marks. Does nothing if
    // this is already the case.
    Transaction.prototype.ensureMarks = function ensureMarks (marks) {
      if (!Mark.sameSet(this.storedMarks || this.selection.$from.marks(), marks))
        { this.setStoredMarks(marks); }
      return this
    };

    // :: (Mark) → Transaction
    // Add a mark to the set of stored marks.
    Transaction.prototype.addStoredMark = function addStoredMark (mark) {
      return this.ensureMarks(mark.addToSet(this.storedMarks || this.selection.$head.marks()))
    };

    // :: (union<Mark, MarkType>) → Transaction
    // Remove a mark or mark type from the set of stored marks.
    Transaction.prototype.removeStoredMark = function removeStoredMark (mark) {
      return this.ensureMarks(mark.removeFromSet(this.storedMarks || this.selection.$head.marks()))
    };

    // :: bool
    // Whether the stored marks were explicitly set for this transaction.
    prototypeAccessors.storedMarksSet.get = function () {
      return (this.updated & UPDATED_MARKS) > 0
    };

    Transaction.prototype.addStep = function addStep (step, doc) {
      Transform.prototype.addStep.call(this, step, doc);
      this.updated = this.updated & ~UPDATED_MARKS;
      this.storedMarks = null;
    };

    // :: (number) → Transaction
    // Update the timestamp for the transaction.
    Transaction.prototype.setTime = function setTime (time) {
      this.time = time;
      return this
    };

    // :: (Slice) → Transaction
    // Replace the current selection with the given slice.
    Transaction.prototype.replaceSelection = function replaceSelection (slice) {
      this.selection.replace(this, slice);
      return this
    };

    // :: (Node, ?bool) → Transaction
    // Replace the selection with the given node. When `inheritMarks` is
    // true and the content is inline, it inherits the marks from the
    // place where it is inserted.
    Transaction.prototype.replaceSelectionWith = function replaceSelectionWith (node, inheritMarks) {
      var selection = this.selection;
      if (inheritMarks !== false)
        { node = node.mark(this.storedMarks || (selection.empty ? selection.$from.marks() : (selection.$from.marksAcross(selection.$to) || Mark.none))); }
      selection.replaceWith(this, node);
      return this
    };

    // :: () → Transaction
    // Delete the selection.
    Transaction.prototype.deleteSelection = function deleteSelection () {
      this.selection.replace(this);
      return this
    };

    // :: (string, from: ?number, to: ?number) → Transaction
    // Replace the given range, or the selection if no range is given,
    // with a text node containing the given string.
    Transaction.prototype.insertText = function insertText (text, from, to) {
      if ( to === void 0 ) to = from;

      var schema = this.doc.type.schema;
      if (from == null) {
        if (!text) { return this.deleteSelection() }
        return this.replaceSelectionWith(schema.text(text), true)
      } else {
        if (!text) { return this.deleteRange(from, to) }
        var marks = this.storedMarks;
        if (!marks) {
          var $from = this.doc.resolve(from);
          marks = to == from ? $from.marks() : $from.marksAcross(this.doc.resolve(to));
        }
        this.replaceRangeWith(from, to, schema.text(text, marks));
        if (!this.selection.empty) { this.setSelection(Selection.near(this.selection.$to)); }
        return this
      }
    };

    // :: (union<string, Plugin, PluginKey>, any) → Transaction
    // Store a metadata property in this transaction, keyed either by
    // name or by plugin.
    Transaction.prototype.setMeta = function setMeta (key, value) {
      this.meta[typeof key == "string" ? key : key.key] = value;
      return this
    };

    // :: (union<string, Plugin, PluginKey>) → any
    // Retrieve a metadata property for a given name or plugin.
    Transaction.prototype.getMeta = function getMeta (key) {
      return this.meta[typeof key == "string" ? key : key.key]
    };

    // :: bool
    // Returns true if this transaction doesn't contain any metadata,
    // and can thus safely be extended.
    prototypeAccessors.isGeneric.get = function () {
      for (var _ in this.meta) { return false }
      return true
    };

    // :: () → Transaction
    // Indicate that the editor should scroll the selection into view
    // when updated to the state produced by this transaction.
    Transaction.prototype.scrollIntoView = function scrollIntoView () {
      this.updated |= UPDATED_SCROLL;
      return this
    };

    prototypeAccessors.scrolledIntoView.get = function () {
      return (this.updated & UPDATED_SCROLL) > 0
    };

    Object.defineProperties( Transaction.prototype, prototypeAccessors );

    return Transaction;
  }(Transform));

  function bind(f, self) {
    return !self || !f ? f : f.bind(self)
  }

  var FieldDesc = function FieldDesc(name, desc, self) {
    this.name = name;
    this.init = bind(desc.init, self);
    this.apply = bind(desc.apply, self);
  };

  var baseFields = [
    new FieldDesc("doc", {
      init: function init(config) { return config.doc || config.schema.topNodeType.createAndFill() },
      apply: function apply(tr) { return tr.doc }
    }),

    new FieldDesc("selection", {
      init: function init(config, instance) { return config.selection || Selection.atStart(instance.doc) },
      apply: function apply(tr) { return tr.selection }
    }),

    new FieldDesc("storedMarks", {
      init: function init(config) { return config.storedMarks || null },
      apply: function apply(tr, _marks, _old, state) { return state.selection.$cursor ? tr.storedMarks : null }
    }),

    new FieldDesc("scrollToSelection", {
      init: function init() { return 0 },
      apply: function apply(tr, prev) { return tr.scrolledIntoView ? prev + 1 : prev }
    })
  ];

  // Object wrapping the part of a state object that stays the same
  // across transactions. Stored in the state's `config` property.
  var Configuration = function Configuration(schema, plugins) {
    var this$1 = this;

    this.schema = schema;
    this.fields = baseFields.concat();
    this.plugins = [];
    this.pluginsByKey = Object.create(null);
    if (plugins) { plugins.forEach(function (plugin) {
      if (this$1.pluginsByKey[plugin.key])
        { throw new RangeError("Adding different instances of a keyed plugin (" + plugin.key + ")") }
      this$1.plugins.push(plugin);
      this$1.pluginsByKey[plugin.key] = plugin;
      if (plugin.spec.state)
        { this$1.fields.push(new FieldDesc(plugin.key, plugin.spec.state, plugin)); }
    }); }
  };

  // ::- The state of a ProseMirror editor is represented by an object
  // of this type. A state is a persistent data structure—it isn't
  // updated, but rather a new state value is computed from an old one
  // using the [`apply`](#state.EditorState.apply) method.
  //
  // A state holds a number of built-in fields, and plugins can
  // [define](#state.PluginSpec.state) additional fields.
  var EditorState = function EditorState(config) {
    this.config = config;
  };

  var prototypeAccessors$1$4 = { schema: { configurable: true },plugins: { configurable: true },tr: { configurable: true } };

  // doc:: Node
  // The current document.

  // selection:: Selection
  // The selection.

  // storedMarks:: ?[Mark]
  // A set of marks to apply to the next input. Will be null when
  // no explicit marks have been set.

  // :: Schema
  // The schema of the state's document.
  prototypeAccessors$1$4.schema.get = function () {
    return this.config.schema
  };

  // :: [Plugin]
  // The plugins that are active in this state.
  prototypeAccessors$1$4.plugins.get = function () {
    return this.config.plugins
  };

  // :: (Transaction) → EditorState
  // Apply the given transaction to produce a new state.
  EditorState.prototype.apply = function apply (tr) {
    return this.applyTransaction(tr).state
  };

  // : (Transaction) → bool
  EditorState.prototype.filterTransaction = function filterTransaction (tr, ignore) {
      if ( ignore === void 0 ) ignore = -1;

    for (var i = 0; i < this.config.plugins.length; i++) { if (i != ignore) {
      var plugin = this.config.plugins[i];
      if (plugin.spec.filterTransaction && !plugin.spec.filterTransaction.call(plugin, tr, this))
        { return false }
    } }
    return true
  };

  // :: (Transaction) → {state: EditorState, transactions: [Transaction]}
  // Verbose variant of [`apply`](#state.EditorState.apply) that
  // returns the precise transactions that were applied (which might
  // be influenced by the [transaction
  // hooks](#state.PluginSpec.filterTransaction) of
  // plugins) along with the new state.
  EditorState.prototype.applyTransaction = function applyTransaction (rootTr) {
    if (!this.filterTransaction(rootTr)) { return {state: this, transactions: []} }

    var trs = [rootTr], newState = this.applyInner(rootTr), seen = null;
    // This loop repeatedly gives plugins a chance to respond to
    // transactions as new transactions are added, making sure to only
    // pass the transactions the plugin did not see before.
     for (;;) {
      var haveNew = false;
      for (var i = 0; i < this.config.plugins.length; i++) {
        var plugin = this.config.plugins[i];
        if (plugin.spec.appendTransaction) {
          var n = seen ? seen[i].n : 0, oldState = seen ? seen[i].state : this;
          var tr = n < trs.length &&
              plugin.spec.appendTransaction.call(plugin, n ? trs.slice(n) : trs, oldState, newState);
          if (tr && newState.filterTransaction(tr, i)) {
            tr.setMeta("appendedTransaction", rootTr);
            if (!seen) {
              seen = [];
              for (var j = 0; j < this.config.plugins.length; j++)
                { seen.push(j < i ? {state: newState, n: trs.length} : {state: this, n: 0}); }
            }
            trs.push(tr);
            newState = newState.applyInner(tr);
            haveNew = true;
          }
          if (seen) { seen[i] = {state: newState, n: trs.length}; }
        }
      }
      if (!haveNew) { return {state: newState, transactions: trs} }
    }
  };

  // : (Transaction) → EditorState
  EditorState.prototype.applyInner = function applyInner (tr) {
    if (!tr.before.eq(this.doc)) { throw new RangeError("Applying a mismatched transaction") }
    var newInstance = new EditorState(this.config), fields = this.config.fields;
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      newInstance[field.name] = field.apply(tr, this[field.name], this, newInstance);
    }
    for (var i$1 = 0; i$1 < applyListeners.length; i$1++) { applyListeners[i$1](this, tr, newInstance); }
    return newInstance
  };

  // :: Transaction
  // Start a [transaction](#state.Transaction) from this state.
  prototypeAccessors$1$4.tr.get = function () { return new Transaction(this) };

  // :: (Object) → EditorState
  // Create a new state.
  //
  // config::- Configuration options. Must contain `schema` or `doc` (or both).
  //
  //    schema:: ?Schema
  //    The schema to use.
  //
  //    doc:: ?Node
  //    The starting document.
  //
  //    selection:: ?Selection
  //    A valid selection in the document.
  //
  //    storedMarks:: ?[Mark]
  //    The initial set of [stored marks](#state.EditorState.storedMarks).
  //
  //    plugins:: ?[Plugin]
  //    The plugins that should be active in this state.
  EditorState.create = function create (config) {
    var $config = new Configuration(config.schema || config.doc.type.schema, config.plugins);
    var instance = new EditorState($config);
    for (var i = 0; i < $config.fields.length; i++)
      { instance[$config.fields[i].name] = $config.fields[i].init(config, instance); }
    return instance
  };

  // :: (Object) → EditorState
  // Create a new state based on this one, but with an adjusted set of
  // active plugins. State fields that exist in both sets of plugins
  // are kept unchanged. Those that no longer exist are dropped, and
  // those that are new are initialized using their
  // [`init`](#state.StateField.init) method, passing in the new
  // configuration object..
  //
  // config::- configuration options
  //
  //   schema:: ?Schema
  //   New schema to use.
  //
  //   plugins:: ?[Plugin]
  //   New set of active plugins.
  EditorState.prototype.reconfigure = function reconfigure (config) {
    var $config = new Configuration(config.schema || this.schema, config.plugins);
    var fields = $config.fields, instance = new EditorState($config);
    for (var i = 0; i < fields.length; i++) {
      var name = fields[i].name;
      instance[name] = this.hasOwnProperty(name) ? this[name] : fields[i].init(config, instance);
    }
    return instance
  };

  // :: (?union<Object<Plugin>, string, number>) → Object
  // Serialize this state to JSON. If you want to serialize the state
  // of plugins, pass an object mapping property names to use in the
  // resulting JSON object to plugin objects. The argument may also be
  // a string or number, in which case it is ignored, to support the
  // way `JSON.stringify` calls `toString` methods.
  EditorState.prototype.toJSON = function toJSON (pluginFields) {
    var result = {doc: this.doc.toJSON(), selection: this.selection.toJSON()};
    if (this.storedMarks) { result.storedMarks = this.storedMarks.map(function (m) { return m.toJSON(); }); }
    if (pluginFields && typeof pluginFields == 'object') { for (var prop in pluginFields) {
      if (prop == "doc" || prop == "selection")
        { throw new RangeError("The JSON fields `doc` and `selection` are reserved") }
      var plugin = pluginFields[prop], state = plugin.spec.state;
      if (state && state.toJSON) { result[prop] = state.toJSON.call(plugin, this[plugin.key]); }
    } }
    return result
  };

  // :: (Object, Object, ?Object<Plugin>) → EditorState
  // Deserialize a JSON representation of a state. `config` should
  // have at least a `schema` field, and should contain array of
  // plugins to initialize the state with. `pluginFields` can be used
  // to deserialize the state of plugins, by associating plugin
  // instances with the property names they use in the JSON object.
  //
  // config::- configuration options
  //
  //   schema:: Schema
  //   The schema to use.
  //
  //   plugins:: ?[Plugin]
  //   The set of active plugins.
  EditorState.fromJSON = function fromJSON (config, json, pluginFields) {
    if (!json) { throw new RangeError("Invalid input for EditorState.fromJSON") }
    if (!config.schema) { throw new RangeError("Required config field 'schema' missing") }
    var $config = new Configuration(config.schema, config.plugins);
    var instance = new EditorState($config);
    $config.fields.forEach(function (field) {
      if (field.name == "doc") {
        instance.doc = Node$1.fromJSON(config.schema, json.doc);
      } else if (field.name == "selection") {
        instance.selection = Selection.fromJSON(instance.doc, json.selection);
      } else if (field.name == "storedMarks") {
        if (json.storedMarks) { instance.storedMarks = json.storedMarks.map(config.schema.markFromJSON); }
      } else {
        if (pluginFields) { for (var prop in pluginFields) {
          var plugin = pluginFields[prop], state = plugin.spec.state;
          if (plugin.key == field.name && state && state.fromJSON &&
              Object.prototype.hasOwnProperty.call(json, prop)) {
            // This field belongs to a plugin mapped to a JSON field, read it from there.
            instance[field.name] = state.fromJSON.call(plugin, config, json[prop], instance);
            return
          }
        } }
        instance[field.name] = field.init(config, instance);
      }
    });
    return instance
  };

  // Kludge to allow the view to track mappings between different
  // instances of a state.
  //
  // FIXME this is no longer needed as of prosemirror-view 1.9.0,
  // though due to backwards-compat we should probably keep it around
  // for a while (if only as a no-op)
  EditorState.addApplyListener = function addApplyListener (f) {
    applyListeners.push(f);
  };
  EditorState.removeApplyListener = function removeApplyListener (f) {
    var found = applyListeners.indexOf(f);
    if (found > -1) { applyListeners.splice(found, 1); }
  };

  Object.defineProperties( EditorState.prototype, prototypeAccessors$1$4 );

  var applyListeners = [];

  // PluginSpec:: interface
  //
  // This is the type passed to the [`Plugin`](#state.Plugin)
  // constructor. It provides a definition for a plugin.
  //
  //   props:: ?EditorProps
  //   The [view props](#view.EditorProps) added by this plugin. Props
  //   that are functions will be bound to have the plugin instance as
  //   their `this` binding.
  //
  //   state:: ?StateField<any>
  //   Allows a plugin to define a [state field](#state.StateField), an
  //   extra slot in the state object in which it can keep its own data.
  //
  //   key:: ?PluginKey
  //   Can be used to make this a keyed plugin. You can have only one
  //   plugin with a given key in a given state, but it is possible to
  //   access the plugin's configuration and state through the key,
  //   without having access to the plugin instance object.
  //
  //   view:: ?(EditorView) → Object
  //   When the plugin needs to interact with the editor view, or
  //   set something up in the DOM, use this field. The function
  //   will be called when the plugin's state is associated with an
  //   editor view.
  //
  //     return::-
  //     Should return an object with the following optional
  //     properties:
  //
  //       update:: ?(view: EditorView, prevState: EditorState)
  //       Called whenever the view's state is updated.
  //
  //       destroy:: ?()
  //       Called when the view is destroyed or receives a state
  //       with different plugins.
  //
  //   filterTransaction:: ?(Transaction, EditorState) → bool
  //   When present, this will be called before a transaction is
  //   applied by the state, allowing the plugin to cancel it (by
  //   returning false).
  //
  //   appendTransaction:: ?(transactions: [Transaction], oldState: EditorState, newState: EditorState) → ?Transaction
  //   Allows the plugin to append another transaction to be applied
  //   after the given array of transactions. When another plugin
  //   appends a transaction after this was called, it is called again
  //   with the new state and new transactions—but only the new
  //   transactions, i.e. it won't be passed transactions that it
  //   already saw.

  function bindProps(obj, self, target) {
    for (var prop in obj) {
      var val = obj[prop];
      if (val instanceof Function) { val = val.bind(self); }
      else if (prop == "handleDOMEvents") { val = bindProps(val, self, {}); }
      target[prop] = val;
    }
    return target
  }

  // ::- Plugins bundle functionality that can be added to an editor.
  // They are part of the [editor state](#state.EditorState) and
  // may influence that state and the view that contains it.
  var Plugin = function Plugin(spec) {
    // :: EditorProps
    // The [props](#view.EditorProps) exported by this plugin.
    this.props = {};
    if (spec.props) { bindProps(spec.props, this, this.props); }
    // :: Object
    // The plugin's [spec object](#state.PluginSpec).
    this.spec = spec;
    this.key = spec.key ? spec.key.key : createKey("plugin");
  };

  // :: (EditorState) → any
  // Extract the plugin's state field from an editor state.
  Plugin.prototype.getState = function getState (state) { return state[this.key] };

  // StateField:: interface<T>
  // A plugin spec may provide a state field (under its
  // [`state`](#state.PluginSpec.state) property) of this type, which
  // describes the state it wants to keep. Functions provided here are
  // always called with the plugin instance as their `this` binding.
  //
  //   init:: (config: Object, instance: EditorState) → T
  //   Initialize the value of the field. `config` will be the object
  //   passed to [`EditorState.create`](#state.EditorState^create). Note
  //   that `instance` is a half-initialized state instance, and will
  //   not have values for plugin fields initialized after this one.
  //
  //   apply:: (tr: Transaction, value: T, oldState: EditorState, newState: EditorState) → T
  //   Apply the given transaction to this state field, producing a new
  //   field value. Note that the `newState` argument is again a partially
  //   constructed state does not yet contain the state from plugins
  //   coming after this one.
  //
  //   toJSON:: ?(value: T) → *
  //   Convert this field to JSON. Optional, can be left off to disable
  //   JSON serialization for the field.
  //
  //   fromJSON:: ?(config: Object, value: *, state: EditorState) → T
  //   Deserialize the JSON representation of this field. Note that the
  //   `state` argument is again a half-initialized state.

  var keys = Object.create(null);

  function createKey(name) {
    if (name in keys) { return name + "$" + ++keys[name] }
    keys[name] = 0;
    return name + "$"
  }

  // ::- A key is used to [tag](#state.PluginSpec.key)
  // plugins in a way that makes it possible to find them, given an
  // editor state. Assigning a key does mean only one plugin of that
  // type can be active in a state.
  var PluginKey = function PluginKey(name) {
  if ( name === void 0 ) name = "key";
   this.key = createKey(name); };

  // :: (EditorState) → ?Plugin
  // Get the active plugin with this key, if any, from an editor
  // state.
  PluginKey.prototype.get = function get (state) { return state.config.pluginsByKey[this.key] };

  // :: (EditorState) → ?any
  // Get the plugin's state from an editor state.
  PluginKey.prototype.getState = function getState (state) { return state[this.key] };

  var index_es$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    AllSelection: AllSelection,
    EditorState: EditorState,
    NodeSelection: NodeSelection,
    Plugin: Plugin,
    PluginKey: PluginKey,
    Selection: Selection,
    SelectionRange: SelectionRange,
    TextSelection: TextSelection,
    Transaction: Transaction
  });

  var result = {};

  if (typeof navigator != "undefined" && typeof document != "undefined") {
    var ie_edge = /Edge\/(\d+)/.exec(navigator.userAgent);
    var ie_upto10 = /MSIE \d/.test(navigator.userAgent);
    var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);

    result.mac = /Mac/.test(navigator.platform);
    var ie = result.ie = !!(ie_upto10 || ie_11up || ie_edge);
    result.ie_version = ie_upto10 ? document.documentMode || 6 : ie_11up ? +ie_11up[1] : ie_edge ? +ie_edge[1] : null;
    result.gecko = !ie && /gecko\/(\d+)/i.test(navigator.userAgent);
    result.gecko_version = result.gecko && +(/Firefox\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1];
    var chrome = !ie && /Chrome\/(\d+)/.exec(navigator.userAgent);
    result.chrome = !!chrome;
    result.chrome_version = chrome && +chrome[1];
    result.ios = !ie && /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
    result.android = /Android \d/.test(navigator.userAgent);
    result.webkit = !ie && 'WebkitAppearance' in document.documentElement.style;
    result.safari = /Apple Computer/.test(navigator.vendor);
    result.webkit_version = result.webkit && +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1];
  }

  var domIndex = function(node) {
    for (var index = 0;; index++) {
      node = node.previousSibling;
      if (!node) { return index }
    }
  };

  var parentNode = function(node) {
    var parent = node.parentNode;
    return parent && parent.nodeType == 11 ? parent.host : parent
  };

  var textRange = function(node, from, to) {
    var range = document.createRange();
    range.setEnd(node, to == null ? node.nodeValue.length : to);
    range.setStart(node, from || 0);
    return range
  };

  // Scans forward and backward through DOM positions equivalent to the
  // given one to see if the two are in the same place (i.e. after a
  // text node vs at the end of that text node)
  var isEquivalentPosition = function(node, off, targetNode, targetOff) {
    return targetNode && (scanFor(node, off, targetNode, targetOff, -1) ||
                          scanFor(node, off, targetNode, targetOff, 1))
  };

  var atomElements = /^(img|br|input|textarea|hr)$/i;

  function scanFor(node, off, targetNode, targetOff, dir) {
    for (;;) {
      if (node == targetNode && off == targetOff) { return true }
      if (off == (dir < 0 ? 0 : nodeSize(node))) {
        var parent = node.parentNode;
        if (parent.nodeType != 1 || hasBlockDesc(node) || atomElements.test(node.nodeName) || node.contentEditable == "false")
          { return false }
        off = domIndex(node) + (dir < 0 ? 0 : 1);
        node = parent;
      } else if (node.nodeType == 1) {
        node = node.childNodes[off + (dir < 0 ? -1 : 0)];
        off = dir < 0 ? nodeSize(node) : 0;
      } else {
        return false
      }
    }
  }

  function nodeSize(node) {
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length
  }

  function hasBlockDesc(dom) {
    var desc;
    for (var cur = dom; cur; cur = cur.parentNode) { if (desc = cur.pmViewDesc) { break } }
    return desc && desc.node && desc.node.isBlock && (desc.dom == dom || desc.contentDOM == dom)
  }

  // Work around Chrome issue https://bugs.chromium.org/p/chromium/issues/detail?id=447523
  // (isCollapsed inappropriately returns true in shadow dom)
  var selectionCollapsed = function(domSel) {
    var collapsed = domSel.isCollapsed;
    if (collapsed && result.chrome && domSel.rangeCount && !domSel.getRangeAt(0).collapsed)
      { collapsed = false; }
    return collapsed
  };

  function keyEvent(keyCode, key) {
    var event = document.createEvent("Event");
    event.initEvent("keydown", true, true);
    event.keyCode = keyCode;
    event.key = event.code = key;
    return event
  }

  function windowRect(win) {
    return {left: 0, right: win.innerWidth,
            top: 0, bottom: win.innerHeight}
  }

  function getSide(value, side) {
    return typeof value == "number" ? value : value[side]
  }

  function scrollRectIntoView(view, rect, startDOM) {
    var scrollThreshold = view.someProp("scrollThreshold") || 0, scrollMargin = view.someProp("scrollMargin") || 5;
    var doc = view.dom.ownerDocument, win = doc.defaultView;
    for (var parent = startDOM || view.dom;; parent = parentNode(parent)) {
      if (!parent) { break }
      if (parent.nodeType != 1) { continue }
      var atTop = parent == doc.body || parent.nodeType != 1;
      var bounding = atTop ? windowRect(win) : parent.getBoundingClientRect();
      var moveX = 0, moveY = 0;
      if (rect.top < bounding.top + getSide(scrollThreshold, "top"))
        { moveY = -(bounding.top - rect.top + getSide(scrollMargin, "top")); }
      else if (rect.bottom > bounding.bottom - getSide(scrollThreshold, "bottom"))
        { moveY = rect.bottom - bounding.bottom + getSide(scrollMargin, "bottom"); }
      if (rect.left < bounding.left + getSide(scrollThreshold, "left"))
        { moveX = -(bounding.left - rect.left + getSide(scrollMargin, "left")); }
      else if (rect.right > bounding.right - getSide(scrollThreshold, "right"))
        { moveX = rect.right - bounding.right + getSide(scrollMargin, "right"); }
      if (moveX || moveY) {
        if (atTop) {
          win.scrollBy(moveX, moveY);
        } else {
          if (moveY) { parent.scrollTop += moveY; }
          if (moveX) { parent.scrollLeft += moveX; }
        }
      }
      if (atTop) { break }
    }
  }

  // Store the scroll position of the editor's parent nodes, along with
  // the top position of an element near the top of the editor, which
  // will be used to make sure the visible viewport remains stable even
  // when the size of the content above changes.
  function storeScrollPos(view) {
    var rect = view.dom.getBoundingClientRect(), startY = Math.max(0, rect.top);
    var refDOM, refTop;
    for (var x = (rect.left + rect.right) / 2, y = startY + 1;
         y < Math.min(innerHeight, rect.bottom); y += 5) {
      var dom = view.root.elementFromPoint(x, y);
      if (dom == view.dom || !view.dom.contains(dom)) { continue }
      var localRect = dom.getBoundingClientRect();
      if (localRect.top >= startY - 20) {
        refDOM = dom;
        refTop = localRect.top;
        break
      }
    }
    return {refDOM: refDOM, refTop: refTop, stack: scrollStack(view.dom)}
  }

  function scrollStack(dom) {
    var stack = [], doc = dom.ownerDocument;
    for (; dom; dom = parentNode(dom)) {
      stack.push({dom: dom, top: dom.scrollTop, left: dom.scrollLeft});
      if (dom == doc) { break }
    }
    return stack
  }

  // Reset the scroll position of the editor's parent nodes to that what
  // it was before, when storeScrollPos was called.
  function resetScrollPos(ref) {
    var refDOM = ref.refDOM;
    var refTop = ref.refTop;
    var stack = ref.stack;

    var newRefTop = refDOM ? refDOM.getBoundingClientRect().top : 0;
    restoreScrollStack(stack, newRefTop == 0 ? 0 : newRefTop - refTop);
  }

  function restoreScrollStack(stack, dTop) {
    for (var i = 0; i < stack.length; i++) {
      var ref = stack[i];
      var dom = ref.dom;
      var top = ref.top;
      var left = ref.left;
      if (dom.scrollTop != top + dTop) { dom.scrollTop = top + dTop; }
      if (dom.scrollLeft != left) { dom.scrollLeft = left; }
    }
  }

  var preventScrollSupported = null;
  // Feature-detects support for .focus({preventScroll: true}), and uses
  // a fallback kludge when not supported.
  function focusPreventScroll(dom) {
    if (dom.setActive) { return dom.setActive() } // in IE
    if (preventScrollSupported) { return dom.focus(preventScrollSupported) }

    var stored = scrollStack(dom);
    dom.focus(preventScrollSupported == null ? {
      get preventScroll() {
        preventScrollSupported = {preventScroll: true};
        return true
      }
    } : undefined);
    if (!preventScrollSupported) {
      preventScrollSupported = false;
      restoreScrollStack(stored, 0);
    }
  }

  function findOffsetInNode(node, coords) {
    var closest, dxClosest = 2e8, coordsClosest, offset = 0;
    var rowBot = coords.top, rowTop = coords.top;
    for (var child = node.firstChild, childIndex = 0; child; child = child.nextSibling, childIndex++) {
      var rects = (void 0);
      if (child.nodeType == 1) { rects = child.getClientRects(); }
      else if (child.nodeType == 3) { rects = textRange(child).getClientRects(); }
      else { continue }

      for (var i = 0; i < rects.length; i++) {
        var rect = rects[i];
        if (rect.top <= rowBot && rect.bottom >= rowTop) {
          rowBot = Math.max(rect.bottom, rowBot);
          rowTop = Math.min(rect.top, rowTop);
          var dx = rect.left > coords.left ? rect.left - coords.left
              : rect.right < coords.left ? coords.left - rect.right : 0;
          if (dx < dxClosest) {
            closest = child;
            dxClosest = dx;
            coordsClosest = dx && closest.nodeType == 3 ? {left: rect.right < coords.left ? rect.right : rect.left, top: coords.top} : coords;
            if (child.nodeType == 1 && dx)
              { offset = childIndex + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0); }
            continue
          }
        }
        if (!closest && (coords.left >= rect.right && coords.top >= rect.top ||
                         coords.left >= rect.left && coords.top >= rect.bottom))
          { offset = childIndex + 1; }
      }
    }
    if (closest && closest.nodeType == 3) { return findOffsetInText(closest, coordsClosest) }
    if (!closest || (dxClosest && closest.nodeType == 1)) { return {node: node, offset: offset} }
    return findOffsetInNode(closest, coordsClosest)
  }

  function findOffsetInText(node, coords) {
    var len = node.nodeValue.length;
    var range = document.createRange();
    for (var i = 0; i < len; i++) {
      range.setEnd(node, i + 1);
      range.setStart(node, i);
      var rect = singleRect(range, 1);
      if (rect.top == rect.bottom) { continue }
      if (inRect(coords, rect))
        { return {node: node, offset: i + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0)} }
    }
    return {node: node, offset: 0}
  }

  function inRect(coords, rect) {
    return coords.left >= rect.left - 1 && coords.left <= rect.right + 1&&
      coords.top >= rect.top - 1 && coords.top <= rect.bottom + 1
  }

  function targetKludge(dom, coords) {
    var parent = dom.parentNode;
    if (parent && /^li$/i.test(parent.nodeName) && coords.left < dom.getBoundingClientRect().left)
      { return parent }
    return dom
  }

  function posFromElement(view, elt, coords) {
    var ref = findOffsetInNode(elt, coords);
    var node = ref.node;
    var offset = ref.offset;
    var bias = -1;
    if (node.nodeType == 1 && !node.firstChild) {
      var rect = node.getBoundingClientRect();
      bias = rect.left != rect.right && coords.left > (rect.left + rect.right) / 2 ? 1 : -1;
    }
    return view.docView.posFromDOM(node, offset, bias)
  }

  function posFromCaret(view, node, offset, coords) {
    // Browser (in caretPosition/RangeFromPoint) will agressively
    // normalize towards nearby inline nodes. Since we are interested in
    // positions between block nodes too, we first walk up the hierarchy
    // of nodes to see if there are block nodes that the coordinates
    // fall outside of. If so, we take the position before/after that
    // block. If not, we call `posFromDOM` on the raw node/offset.
    var outside = -1;
    for (var cur = node;;) {
      if (cur == view.dom) { break }
      var desc = view.docView.nearestDesc(cur, true);
      if (!desc) { return null }
      if (desc.node.isBlock && desc.parent) {
        var rect = desc.dom.getBoundingClientRect();
        if (rect.left > coords.left || rect.top > coords.top) { outside = desc.posBefore; }
        else if (rect.right < coords.left || rect.bottom < coords.top) { outside = desc.posAfter; }
        else { break }
      }
      cur = desc.dom.parentNode;
    }
    return outside > -1 ? outside : view.docView.posFromDOM(node, offset)
  }

  function elementFromPoint(element, coords, box) {
    var len = element.childNodes.length;
    if (len && box.top < box.bottom) {
      for (var startI = Math.max(0, Math.min(len - 1, Math.floor(len * (coords.top - box.top) / (box.bottom - box.top)) - 2)), i = startI;;) {
        var child = element.childNodes[i];
        if (child.nodeType == 1) {
          var rects = child.getClientRects();
          for (var j = 0; j < rects.length; j++) {
            var rect = rects[j];
            if (inRect(coords, rect)) { return elementFromPoint(child, coords, rect) }
          }
        }
        if ((i = (i + 1) % len) == startI) { break }
      }
    }
    return element
  }

  // Given an x,y position on the editor, get the position in the document.
  function posAtCoords(view, coords) {
    var assign, assign$1;

    var root = view.root, node, offset;
    if (root.caretPositionFromPoint) {
      try { // Firefox throws for this call in hard-to-predict circumstances (#994)
        var pos$1 = root.caretPositionFromPoint(coords.left, coords.top);
        if (pos$1) { ((assign = pos$1, node = assign.offsetNode, offset = assign.offset)); }
      } catch (_) {}
    }
    if (!node && root.caretRangeFromPoint) {
      var range = root.caretRangeFromPoint(coords.left, coords.top);
      if (range) { ((assign$1 = range, node = assign$1.startContainer, offset = assign$1.startOffset)); }
    }

    var elt = root.elementFromPoint(coords.left, coords.top + 1), pos;
    if (!elt || !view.dom.contains(elt.nodeType != 1 ? elt.parentNode : elt)) {
      var box = view.dom.getBoundingClientRect();
      if (!inRect(coords, box)) { return null }
      elt = elementFromPoint(view.dom, coords, box);
      if (!elt) { return null }
    }
    elt = targetKludge(elt, coords);
    if (node) {
      if (result.gecko && node.nodeType == 1) {
        // Firefox will sometimes return offsets into <input> nodes, which
        // have no actual children, from caretPositionFromPoint (#953)
        offset = Math.min(offset, node.childNodes.length);
        // It'll also move the returned position before image nodes,
        // even if those are behind it.
        if (offset < node.childNodes.length) {
          var next = node.childNodes[offset], box$1;
          if (next.nodeName == "IMG" && (box$1 = next.getBoundingClientRect()).right <= coords.left &&
              box$1.bottom > coords.top)
            { offset++; }
        }
      }
      // Suspiciously specific kludge to work around caret*FromPoint
      // never returning a position at the end of the document
      if (node == view.dom && offset == node.childNodes.length - 1 && node.lastChild.nodeType == 1 &&
          coords.top > node.lastChild.getBoundingClientRect().bottom)
        { pos = view.state.doc.content.size; }
      // Ignore positions directly after a BR, since caret*FromPoint
      // 'round up' positions that would be more accurately placed
      // before the BR node.
      else if (offset == 0 || node.nodeType != 1 || node.childNodes[offset - 1].nodeName != "BR")
        { pos = posFromCaret(view, node, offset, coords); }
    }
    if (pos == null) { pos = posFromElement(view, elt, coords); }

    var desc = view.docView.nearestDesc(elt, true);
    return {pos: pos, inside: desc ? desc.posAtStart - desc.border : -1}
  }

  function singleRect(object, bias) {
    var rects = object.getClientRects();
    return !rects.length ? object.getBoundingClientRect() : rects[bias < 0 ? 0 : rects.length - 1]
  }

  // : (EditorView, number) → {left: number, top: number, right: number, bottom: number}
  // Given a position in the document model, get a bounding box of the
  // character at that position, relative to the window.
  function coordsAtPos(view, pos) {
    var ref = view.docView.domFromPos(pos);
    var node = ref.node;
    var offset = ref.offset;

    // These browsers support querying empty text ranges
    if (node.nodeType == 3 && (result.chrome || result.gecko)) {
      var rect = singleRect(textRange(node, offset, offset), 0);
      // Firefox returns bad results (the position before the space)
      // when querying a position directly after line-broken
      // whitespace. Detect this situation and and kludge around it
      if (result.gecko && offset && /\s/.test(node.nodeValue[offset - 1]) && offset < node.nodeValue.length) {
        var rectBefore = singleRect(textRange(node, offset - 1, offset - 1), -1);
        if (Math.abs(rectBefore.left - rect.left) < 1 && rectBefore.top == rect.top) {
          var rectAfter = singleRect(textRange(node, offset, offset + 1), -1);
          return flattenV(rectAfter, rectAfter.left < rectBefore.left)
        }
      }
      return rect
    }

    if (node.nodeType == 1 && !view.state.doc.resolve(pos).parent.inlineContent) {
      // Return a horizontal line in block context
      var top = true, rect$1;
      if (offset < node.childNodes.length) {
        var after = node.childNodes[offset];
        if (after.nodeType == 1) { rect$1 = after.getBoundingClientRect(); }
      }
      if (!rect$1 && offset) {
        var before = node.childNodes[offset - 1];
        if (before.nodeType == 1) { rect$1 = before.getBoundingClientRect(); top = false; }
      }
      return flattenH(rect$1 || node.getBoundingClientRect(), top)
    }

    // Not Firefox/Chrome, or not in a text node, so we have to use
    // actual element/character rectangles to get a solution (this part
    // is not very bidi-safe)
    //
    // Try the left side first, fall back to the right one if that
    // doesn't work.
    for (var dir = -1; dir < 2; dir += 2) {
      if (dir < 0 && offset) {
        var prev = (void 0), target = node.nodeType == 3 ? textRange(node, offset - 1, offset)
            : (prev = node.childNodes[offset - 1]).nodeType == 3 ? textRange(prev)
            : prev.nodeType == 1 && prev.nodeName != "BR" ? prev : null; // BR nodes tend to only return the rectangle before them
        if (target) {
          var rect$2 = singleRect(target, 1);
          if (rect$2.top < rect$2.bottom) { return flattenV(rect$2, false) }
        }
      } else if (dir > 0 && offset < nodeSize(node)) {
        var next = (void 0), target$1 = node.nodeType == 3 ? textRange(node, offset, offset + 1)
            : (next = node.childNodes[offset]).nodeType == 3 ? textRange(next)
            : next.nodeType == 1 ? next : null;
        if (target$1) {
          var rect$3 = singleRect(target$1, -1);
          if (rect$3.top < rect$3.bottom) { return flattenV(rect$3, true) }
        }
      }
    }
    // All else failed, just try to get a rectangle for the target node
    return flattenV(singleRect(node.nodeType == 3 ? textRange(node) : node, 0), false)
  }

  function flattenV(rect, left) {
    if (rect.width == 0) { return rect }
    var x = left ? rect.left : rect.right;
    return {top: rect.top, bottom: rect.bottom, left: x, right: x}
  }

  function flattenH(rect, top) {
    if (rect.height == 0) { return rect }
    var y = top ? rect.top : rect.bottom;
    return {top: y, bottom: y, left: rect.left, right: rect.right}
  }

  function withFlushedState(view, state, f) {
    var viewState = view.state, active = view.root.activeElement;
    if (viewState != state) { view.updateState(state); }
    if (active != view.dom) { view.focus(); }
    try {
      return f()
    } finally {
      if (viewState != state) { view.updateState(viewState); }
      if (active != view.dom) { active.focus(); }
    }
  }

  // : (EditorView, number, number)
  // Whether vertical position motion in a given direction
  // from a position would leave a text block.
  function endOfTextblockVertical(view, state, dir) {
    var sel = state.selection;
    var $pos = dir == "up" ? sel.$anchor.min(sel.$head) : sel.$anchor.max(sel.$head);
    return withFlushedState(view, state, function () {
      var ref = view.docView.domFromPos($pos.pos);
      var dom = ref.node;
      for (;;) {
        var nearest = view.docView.nearestDesc(dom, true);
        if (!nearest) { break }
        if (nearest.node.isBlock) { dom = nearest.dom; break }
        dom = nearest.dom.parentNode;
      }
      var coords = coordsAtPos(view, $pos.pos);
      for (var child = dom.firstChild; child; child = child.nextSibling) {
        var boxes = (void 0);
        if (child.nodeType == 1) { boxes = child.getClientRects(); }
        else if (child.nodeType == 3) { boxes = textRange(child, 0, child.nodeValue.length).getClientRects(); }
        else { continue }
        for (var i = 0; i < boxes.length; i++) {
          var box = boxes[i];
          if (box.bottom > box.top && (dir == "up" ? box.bottom < coords.top + 1 : box.top > coords.bottom - 1))
            { return false }
        }
      }
      return true
    })
  }

  var maybeRTL = /[\u0590-\u08ac]/;

  function endOfTextblockHorizontal(view, state, dir) {
    var ref = state.selection;
    var $head = ref.$head;
    if (!$head.parent.isTextblock) { return false }
    var offset = $head.parentOffset, atStart = !offset, atEnd = offset == $head.parent.content.size;
    var sel = getSelection();
    // If the textblock is all LTR, or the browser doesn't support
    // Selection.modify (Edge), fall back to a primitive approach
    if (!maybeRTL.test($head.parent.textContent) || !sel.modify)
      { return dir == "left" || dir == "backward" ? atStart : atEnd }

    return withFlushedState(view, state, function () {
      // This is a huge hack, but appears to be the best we can
      // currently do: use `Selection.modify` to move the selection by
      // one character, and see if that moves the cursor out of the
      // textblock (or doesn't move it at all, when at the start/end of
      // the document).
      var oldRange = sel.getRangeAt(0), oldNode = sel.focusNode, oldOff = sel.focusOffset;
      var oldBidiLevel = sel.caretBidiLevel; // Only for Firefox
      sel.modify("move", dir, "character");
      var parentDOM = $head.depth ? view.docView.domAfterPos($head.before()) : view.dom;
      var result = !parentDOM.contains(sel.focusNode.nodeType == 1 ? sel.focusNode : sel.focusNode.parentNode) ||
          (oldNode == sel.focusNode && oldOff == sel.focusOffset);
      // Restore the previous selection
      sel.removeAllRanges();
      sel.addRange(oldRange);
      if (oldBidiLevel != null) { sel.caretBidiLevel = oldBidiLevel; }
      return result
    })
  }

  var cachedState = null, cachedDir = null, cachedResult = false;
  function endOfTextblock(view, state, dir) {
    if (cachedState == state && cachedDir == dir) { return cachedResult }
    cachedState = state; cachedDir = dir;
    return cachedResult = dir == "up" || dir == "down"
      ? endOfTextblockVertical(view, state, dir)
      : endOfTextblockHorizontal(view, state, dir)
  }

  // NodeView:: interface
  //
  // By default, document nodes are rendered using the result of the
  // [`toDOM`](#model.NodeSpec.toDOM) method of their spec, and managed
  // entirely by the editor. For some use cases, such as embedded
  // node-specific editing interfaces, you want more control over
  // the behavior of a node's in-editor representation, and need to
  // [define](#view.EditorProps.nodeViews) a custom node view.
  //
  // Objects returned as node views must conform to this interface.
  //
  //   dom:: ?dom.Node
  //   The outer DOM node that represents the document node. When not
  //   given, the default strategy is used to create a DOM node.
  //
  //   contentDOM:: ?dom.Node
  //   The DOM node that should hold the node's content. Only meaningful
  //   if the node view also defines a `dom` property and if its node
  //   type is not a leaf node type. When this is present, ProseMirror
  //   will take care of rendering the node's children into it. When it
  //   is not present, the node view itself is responsible for rendering
  //   (or deciding not to render) its child nodes.
  //
  //   update:: ?(node: Node, decorations: [Decoration]) → bool
  //   When given, this will be called when the view is updating itself.
  //   It will be given a node (possibly of a different type), and an
  //   array of active decorations (which are automatically drawn, and
  //   the node view may ignore if it isn't interested in them), and
  //   should return true if it was able to update to that node, and
  //   false otherwise. If the node view has a `contentDOM` property (or
  //   no `dom` property), updating its child nodes will be handled by
  //   ProseMirror.
  //
  //   selectNode:: ?()
  //   Can be used to override the way the node's selected status (as a
  //   node selection) is displayed.
  //
  //   deselectNode:: ?()
  //   When defining a `selectNode` method, you should also provide a
  //   `deselectNode` method to remove the effect again.
  //
  //   setSelection:: ?(anchor: number, head: number, root: dom.Document)
  //   This will be called to handle setting the selection inside the
  //   node. The `anchor` and `head` positions are relative to the start
  //   of the node. By default, a DOM selection will be created between
  //   the DOM positions corresponding to those positions, but if you
  //   override it you can do something else.
  //
  //   stopEvent:: ?(event: dom.Event) → bool
  //   Can be used to prevent the editor view from trying to handle some
  //   or all DOM events that bubble up from the node view. Events for
  //   which this returns true are not handled by the editor.
  //
  //   ignoreMutation:: ?(dom.MutationRecord) → bool
  //   Called when a DOM
  //   [mutation](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
  //   or a selection change happens within the view. When the change is
  //   a selection change, the record will have a `type` property of
  //   `"selection"` (which doesn't occur for native mutation records).
  //   Return false if the editor should re-read the selection or
  //   re-parse the range around the mutation, true if it can safely be
  //   ignored.
  //
  //   destroy:: ?()
  //   Called when the node view is removed from the editor or the whole
  //   editor is destroyed.

  // View descriptions are data structures that describe the DOM that is
  // used to represent the editor's content. They are used for:
  //
  // - Incremental redrawing when the document changes
  //
  // - Figuring out what part of the document a given DOM position
  //   corresponds to
  //
  // - Wiring in custom implementations of the editing interface for a
  //   given node
  //
  // They form a doubly-linked mutable tree, starting at `view.docView`.

  var NOT_DIRTY = 0, CHILD_DIRTY = 1, CONTENT_DIRTY = 2, NODE_DIRTY = 3;

  // Superclass for the various kinds of descriptions. Defines their
  // basic structure and shared methods.
  var ViewDesc = function ViewDesc(parent, children, dom, contentDOM) {
    this.parent = parent;
    this.children = children;
    this.dom = dom;
    // An expando property on the DOM node provides a link back to its
    // description.
    dom.pmViewDesc = this;
    // This is the node that holds the child views. It may be null for
    // descs that don't have children.
    this.contentDOM = contentDOM;
    this.dirty = NOT_DIRTY;
  };

  var prototypeAccessors$9 = { beforePosition: { configurable: true },size: { configurable: true },border: { configurable: true },posBefore: { configurable: true },posAtStart: { configurable: true },posAfter: { configurable: true },posAtEnd: { configurable: true },contentLost: { configurable: true } };

  // Used to check whether a given description corresponds to a
  // widget/mark/node.
  ViewDesc.prototype.matchesWidget = function matchesWidget () { return false };
  ViewDesc.prototype.matchesMark = function matchesMark () { return false };
  ViewDesc.prototype.matchesNode = function matchesNode () { return false };
  ViewDesc.prototype.matchesHack = function matchesHack () { return false };

  prototypeAccessors$9.beforePosition.get = function () { return false };

  // : () → ?ParseRule
  // When parsing in-editor content (in domchange.js), we allow
  // descriptions to determine the parse rules that should be used to
  // parse them.
  ViewDesc.prototype.parseRule = function parseRule () { return null };

  // : (dom.Event) → bool
  // Used by the editor's event handler to ignore events that come
  // from certain descs.
  ViewDesc.prototype.stopEvent = function stopEvent () { return false };

  // The size of the content represented by this desc.
  prototypeAccessors$9.size.get = function () {
    var size = 0;
    for (var i = 0; i < this.children.length; i++) { size += this.children[i].size; }
    return size
  };

  // For block nodes, this represents the space taken up by their
  // start/end tokens.
  prototypeAccessors$9.border.get = function () { return 0 };

  ViewDesc.prototype.destroy = function destroy () {
    this.parent = null;
    if (this.dom.pmViewDesc == this) { this.dom.pmViewDesc = null; }
    for (var i = 0; i < this.children.length; i++)
      { this.children[i].destroy(); }
  };

  ViewDesc.prototype.posBeforeChild = function posBeforeChild (child) {
    for (var i = 0, pos = this.posAtStart; i < this.children.length; i++) {
      var cur = this.children[i];
      if (cur == child) { return pos }
      pos += cur.size;
    }
  };

  prototypeAccessors$9.posBefore.get = function () {
    return this.parent.posBeforeChild(this)
  };

  prototypeAccessors$9.posAtStart.get = function () {
    return this.parent ? this.parent.posBeforeChild(this) + this.border : 0
  };

  prototypeAccessors$9.posAfter.get = function () {
    return this.posBefore + this.size
  };

  prototypeAccessors$9.posAtEnd.get = function () {
    return this.posAtStart + this.size - 2 * this.border
  };

  // : (dom.Node, number, ?number) → number
  ViewDesc.prototype.localPosFromDOM = function localPosFromDOM (dom, offset, bias) {
    // If the DOM position is in the content, use the child desc after
    // it to figure out a position.
    if (this.contentDOM && this.contentDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode)) {
      if (bias < 0) {
        var domBefore, desc;
        if (dom == this.contentDOM) {
          domBefore = dom.childNodes[offset - 1];
        } else {
          while (dom.parentNode != this.contentDOM) { dom = dom.parentNode; }
          domBefore = dom.previousSibling;
        }
        while (domBefore && !((desc = domBefore.pmViewDesc) && desc.parent == this)) { domBefore = domBefore.previousSibling; }
        return domBefore ? this.posBeforeChild(desc) + desc.size : this.posAtStart
      } else {
        var domAfter, desc$1;
        if (dom == this.contentDOM) {
          domAfter = dom.childNodes[offset];
        } else {
          while (dom.parentNode != this.contentDOM) { dom = dom.parentNode; }
          domAfter = dom.nextSibling;
        }
        while (domAfter && !((desc$1 = domAfter.pmViewDesc) && desc$1.parent == this)) { domAfter = domAfter.nextSibling; }
        return domAfter ? this.posBeforeChild(desc$1) : this.posAtEnd
      }
    }
    // Otherwise, use various heuristics, falling back on the bias
    // parameter, to determine whether to return the position at the
    // start or at the end of this view desc.
    var atEnd;
    if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM)) {
      atEnd = dom.compareDocumentPosition(this.contentDOM) & 2;
    } else if (this.dom.firstChild) {
      if (offset == 0) { for (var search = dom;; search = search.parentNode) {
        if (search == this.dom) { atEnd = false; break }
        if (search.parentNode.firstChild != search) { break }
      } }
      if (atEnd == null && offset == dom.childNodes.length) { for (var search$1 = dom;; search$1 = search$1.parentNode) {
        if (search$1 == this.dom) { atEnd = true; break }
        if (search$1.parentNode.lastChild != search$1) { break }
      } }
    }
    return (atEnd == null ? bias > 0 : atEnd) ? this.posAtEnd : this.posAtStart
  };

  // Scan up the dom finding the first desc that is a descendant of
  // this one.
  ViewDesc.prototype.nearestDesc = function nearestDesc (dom, onlyNodes) {
    for (var first = true, cur = dom; cur; cur = cur.parentNode) {
      var desc = this.getDesc(cur);
      if (desc && (!onlyNodes || desc.node)) {
        // If dom is outside of this desc's nodeDOM, don't count it.
        if (first && desc.nodeDOM && !(desc.nodeDOM.nodeType == 1 ? desc.nodeDOM.contains(dom) : desc.nodeDOM == dom)) { first = false; }
        else { return desc }
      }
    }
  };

  ViewDesc.prototype.getDesc = function getDesc (dom) {
    var desc = dom.pmViewDesc;
    for (var cur = desc; cur; cur = cur.parent) { if (cur == this) { return desc } }
  };

  ViewDesc.prototype.posFromDOM = function posFromDOM (dom, offset, bias) {
    for (var scan = dom;; scan = scan.parentNode) {
      var desc = this.getDesc(scan);
      if (desc) { return desc.localPosFromDOM(dom, offset, bias) }
    }
  };

  // : (number) → ?NodeViewDesc
  // Find the desc for the node after the given pos, if any. (When a
  // parent node overrode rendering, there might not be one.)
  ViewDesc.prototype.descAt = function descAt (pos) {
    for (var i = 0, offset = 0; i < this.children.length; i++) {
      var child = this.children[i], end = offset + child.size;
      if (offset == pos && end != offset) {
        while (!child.border && child.children.length) { child = child.children[0]; }
        return child
      }
      if (pos < end) { return child.descAt(pos - offset - child.border) }
      offset = end;
    }
  };

  // : (number) → {node: dom.Node, offset: number}
  ViewDesc.prototype.domFromPos = function domFromPos (pos) {
    if (!this.contentDOM) { return {node: this.dom, offset: 0} }
    for (var offset = 0, i = 0;; i++) {
      if (offset == pos) {
        while (i < this.children.length && (this.children[i].beforePosition || this.children[i].dom.parentNode != this.contentDOM)) { i++; }
        return {node: this.contentDOM,
                offset: i == this.children.length ? this.contentDOM.childNodes.length : domIndex(this.children[i].dom)}
      }
      if (i == this.children.length) { throw new Error("Invalid position " + pos) }
      var child = this.children[i], end = offset + child.size;
      if (pos < end) { return child.domFromPos(pos - offset - child.border) }
      offset = end;
    }
  };

  // Used to find a DOM range in a single parent for a given changed
  // range.
  ViewDesc.prototype.parseRange = function parseRange (from, to, base) {
      if ( base === void 0 ) base = 0;

    if (this.children.length == 0)
      { return {node: this.contentDOM, from: from, to: to, fromOffset: 0, toOffset: this.contentDOM.childNodes.length} }

    var fromOffset = -1, toOffset = -1;
    for (var offset = base, i = 0;; i++) {
      var child = this.children[i], end = offset + child.size;
      if (fromOffset == -1 && from <= end) {
        var childBase = offset + child.border;
        // FIXME maybe descend mark views to parse a narrower range?
        if (from >= childBase && to <= end - child.border && child.node &&
            child.contentDOM && this.contentDOM.contains(child.contentDOM))
          { return child.parseRange(from, to, childBase) }

        from = offset;
        for (var j = i; j > 0; j--) {
          var prev = this.children[j - 1];
          if (prev.size && prev.dom.parentNode == this.contentDOM && !prev.emptyChildAt(1)) {
            fromOffset = domIndex(prev.dom) + 1;
            break
          }
          from -= prev.size;
        }
        if (fromOffset == -1) { fromOffset = 0; }
      }
      if (fromOffset > -1 && to <= end) {
        to = end;
        for (var j$1 = i + 1; j$1 < this.children.length; j$1++) {
          var next = this.children[j$1];
          if (next.size && next.dom.parentNode == this.contentDOM && !next.emptyChildAt(-1)) {
            toOffset = domIndex(next.dom);
            break
          }
          to += next.size;
        }
        if (toOffset == -1) { toOffset = this.contentDOM.childNodes.length; }
        break
      }
      offset = end;
    }
    return {node: this.contentDOM, from: from, to: to, fromOffset: fromOffset, toOffset: toOffset}
  };

  ViewDesc.prototype.emptyChildAt = function emptyChildAt (side) {
    if (this.border || !this.contentDOM || !this.children.length) { return false }
    var child = this.children[side < 0 ? 0 : this.children.length - 1];
    return child.size == 0 || child.emptyChildAt(side)
  };

  // : (number) → dom.Node
  ViewDesc.prototype.domAfterPos = function domAfterPos (pos) {
    var ref = this.domFromPos(pos);
      var node = ref.node;
      var offset = ref.offset;
    if (node.nodeType != 1 || offset == node.childNodes.length)
      { throw new RangeError("No node after pos " + pos) }
    return node.childNodes[offset]
  };

  // : (number, number, dom.Document)
  // View descs are responsible for setting any selection that falls
  // entirely inside of them, so that custom implementations can do
  // custom things with the selection. Note that this falls apart when
  // a selection starts in such a node and ends in another, in which
  // case we just use whatever domFromPos produces as a best effort.
  ViewDesc.prototype.setSelection = function setSelection (anchor, head, root, force) {
    // If the selection falls entirely in a child, give it to that child
    var from = Math.min(anchor, head), to = Math.max(anchor, head);
    for (var i = 0, offset = 0; i < this.children.length; i++) {
      var child = this.children[i], end = offset + child.size;
      if (from > offset && to < end)
        { return child.setSelection(anchor - offset - child.border, head - offset - child.border, root, force) }
      offset = end;
    }

    var anchorDOM = this.domFromPos(anchor), headDOM = this.domFromPos(head);
    var domSel = root.getSelection(), range = document.createRange();
    if (!force &&
        isEquivalentPosition(anchorDOM.node, anchorDOM.offset, domSel.anchorNode, domSel.anchorOffset) &&
        isEquivalentPosition(headDOM.node, headDOM.offset, domSel.focusNode, domSel.focusOffset))
      { return }

    // Selection.extend can be used to create an 'inverted' selection
    // (one where the focus is before the anchor), but not all
    // browsers support it yet.
    if (domSel.extend) {
      range.setEnd(anchorDOM.node, anchorDOM.offset);
      range.collapse(false);
    } else {
      if (anchor > head) { var tmp = anchorDOM; anchorDOM = headDOM; headDOM = tmp; }
      range.setEnd(headDOM.node, headDOM.offset);
      range.setStart(anchorDOM.node, anchorDOM.offset);
    }
    domSel.removeAllRanges();
    domSel.addRange(range);
    if (domSel.extend)
      { domSel.extend(headDOM.node, headDOM.offset); }
  };

  // : (dom.MutationRecord) → bool
  ViewDesc.prototype.ignoreMutation = function ignoreMutation (_mutation) {
    return !this.contentDOM
  };

  prototypeAccessors$9.contentLost.get = function () {
    return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM)
  };

  // Remove a subtree of the element tree that has been touched
  // by a DOM change, so that the next update will redraw it.
  ViewDesc.prototype.markDirty = function markDirty (from, to) {
    for (var offset = 0, i = 0; i < this.children.length; i++) {
      var child = this.children[i], end = offset + child.size;
      if (offset == end ? from <= end && to >= offset : from < end && to > offset) {
        var startInside = offset + child.border, endInside = end - child.border;
        if (from >= startInside && to <= endInside) {
          this.dirty = from == offset || to == end ? CONTENT_DIRTY : CHILD_DIRTY;
          if (from == startInside && to == endInside &&
              (child.contentLost || child.dom.parentNode != this.contentDOM)) { child.dirty = NODE_DIRTY; }
          else { child.markDirty(from - startInside, to - startInside); }
          return
        } else {
          child.dirty = NODE_DIRTY;
        }
      }
      offset = end;
    }
    this.dirty = CONTENT_DIRTY;
  };

  ViewDesc.prototype.markParentsDirty = function markParentsDirty () {
    for (var node = this.parent; node; node = node.parent) {
      var dirty =  CONTENT_DIRTY ;
      if (node.dirty < dirty) { node.dirty = dirty; }
    }
  };

  Object.defineProperties( ViewDesc.prototype, prototypeAccessors$9 );

  // Reused array to avoid allocating fresh arrays for things that will
  // stay empty anyway.
  var nothing = [];

  // A widget desc represents a widget decoration, which is a DOM node
  // drawn between the document nodes.
  var WidgetViewDesc = /*@__PURE__*/(function (ViewDesc) {
    function WidgetViewDesc(parent, widget, view, pos) {
      var self, dom = widget.type.toDOM;
      if (typeof dom == "function") { dom = dom(view, function () {
        if (!self) { return pos }
        if (self.parent) { return self.parent.posBeforeChild(self) }
      }); }
      if (!widget.type.spec.raw) {
        if (dom.nodeType != 1) {
          var wrap = document.createElement("span");
          wrap.appendChild(dom);
          dom = wrap;
        }
        dom.contentEditable = false;
        dom.classList.add("ProseMirror-widget");
      }
      ViewDesc.call(this, parent, nothing, dom, null);
      this.widget = widget;
      self = this;
    }

    if ( ViewDesc ) WidgetViewDesc.__proto__ = ViewDesc;
    WidgetViewDesc.prototype = Object.create( ViewDesc && ViewDesc.prototype );
    WidgetViewDesc.prototype.constructor = WidgetViewDesc;

    var prototypeAccessors$1 = { beforePosition: { configurable: true } };

    prototypeAccessors$1.beforePosition.get = function () {
      return this.widget.type.side < 0
    };

    WidgetViewDesc.prototype.matchesWidget = function matchesWidget (widget) {
      return this.dirty == NOT_DIRTY && widget.type.eq(this.widget.type)
    };

    WidgetViewDesc.prototype.parseRule = function parseRule () { return {ignore: true} };

    WidgetViewDesc.prototype.stopEvent = function stopEvent (event) {
      var stop = this.widget.spec.stopEvent;
      return stop ? stop(event) : false
    };

    Object.defineProperties( WidgetViewDesc.prototype, prototypeAccessors$1 );

    return WidgetViewDesc;
  }(ViewDesc));

  var CompositionViewDesc = /*@__PURE__*/(function (ViewDesc) {
    function CompositionViewDesc(parent, dom, textDOM, text) {
      ViewDesc.call(this, parent, nothing, dom, null);
      this.textDOM = textDOM;
      this.text = text;
    }

    if ( ViewDesc ) CompositionViewDesc.__proto__ = ViewDesc;
    CompositionViewDesc.prototype = Object.create( ViewDesc && ViewDesc.prototype );
    CompositionViewDesc.prototype.constructor = CompositionViewDesc;

    var prototypeAccessors$2 = { size: { configurable: true } };

    prototypeAccessors$2.size.get = function () { return this.text.length };

    CompositionViewDesc.prototype.localPosFromDOM = function localPosFromDOM (dom, offset) {
      if (dom != this.textDOM) { return this.posAtStart + (offset ? this.size : 0) }
      return this.posAtStart + offset
    };

    CompositionViewDesc.prototype.domFromPos = function domFromPos (pos) {
      return {node: this.textDOM, offset: pos}
    };

    CompositionViewDesc.prototype.ignoreMutation = function ignoreMutation (mut) {
      return mut.type === 'characterData' && mut.target.nodeValue == mut.oldValue
     };

    Object.defineProperties( CompositionViewDesc.prototype, prototypeAccessors$2 );

    return CompositionViewDesc;
  }(ViewDesc));

  // A mark desc represents a mark. May have multiple children,
  // depending on how the mark is split. Note that marks are drawn using
  // a fixed nesting order, for simplicity and predictability, so in
  // some cases they will be split more often than would appear
  // necessary.
  var MarkViewDesc = /*@__PURE__*/(function (ViewDesc) {
    function MarkViewDesc(parent, mark, dom, contentDOM) {
      ViewDesc.call(this, parent, [], dom, contentDOM);
      this.mark = mark;
    }

    if ( ViewDesc ) MarkViewDesc.__proto__ = ViewDesc;
    MarkViewDesc.prototype = Object.create( ViewDesc && ViewDesc.prototype );
    MarkViewDesc.prototype.constructor = MarkViewDesc;

    MarkViewDesc.create = function create (parent, mark, inline, view) {
      var custom = view.nodeViews[mark.type.name];
      var spec = custom && custom(mark, view, inline);
      if (!spec || !spec.dom)
        { spec = DOMSerializer.renderSpec(document, mark.type.spec.toDOM(mark, inline)); }
      return new MarkViewDesc(parent, mark, spec.dom, spec.contentDOM || spec.dom)
    };

    MarkViewDesc.prototype.parseRule = function parseRule () { return {mark: this.mark.type.name, attrs: this.mark.attrs, contentElement: this.contentDOM} };

    MarkViewDesc.prototype.matchesMark = function matchesMark (mark) { return this.dirty != NODE_DIRTY && this.mark.eq(mark) };

    MarkViewDesc.prototype.markDirty = function markDirty (from, to) {
      ViewDesc.prototype.markDirty.call(this, from, to);
      // Move dirty info to nearest node view
      if (this.dirty != NOT_DIRTY) {
        var parent = this.parent;
        while (!parent.node) { parent = parent.parent; }
        if (parent.dirty < this.dirty) { parent.dirty = this.dirty; }
        this.dirty = NOT_DIRTY;
      }
    };

    MarkViewDesc.prototype.slice = function slice (from, to, view) {
      var copy = MarkViewDesc.create(this.parent, this.mark, true, view);
      var nodes = this.children, size = this.size;
      if (to < size) { nodes = replaceNodes(nodes, to, size, view); }
      if (from > 0) { nodes = replaceNodes(nodes, 0, from, view); }
      for (var i = 0; i < nodes.length; i++) { nodes[i].parent = copy; }
      copy.children = nodes;
      return copy
    };

    return MarkViewDesc;
  }(ViewDesc));

  // Node view descs are the main, most common type of view desc, and
  // correspond to an actual node in the document. Unlike mark descs,
  // they populate their child array themselves.
  var NodeViewDesc = /*@__PURE__*/(function (ViewDesc) {
    function NodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos) {
      ViewDesc.call(this, parent, node.isLeaf ? nothing : [], dom, contentDOM);
      this.nodeDOM = nodeDOM;
      this.node = node;
      this.outerDeco = outerDeco;
      this.innerDeco = innerDeco;
      if (contentDOM) { this.updateChildren(view, pos); }
    }

    if ( ViewDesc ) NodeViewDesc.__proto__ = ViewDesc;
    NodeViewDesc.prototype = Object.create( ViewDesc && ViewDesc.prototype );
    NodeViewDesc.prototype.constructor = NodeViewDesc;

    var prototypeAccessors$3 = { size: { configurable: true },border: { configurable: true } };

    // By default, a node is rendered using the `toDOM` method from the
    // node type spec. But client code can use the `nodeViews` spec to
    // supply a custom node view, which can influence various aspects of
    // the way the node works.
    //
    // (Using subclassing for this was intentionally decided against,
    // since it'd require exposing a whole slew of finnicky
    // implementation details to the user code that they probably will
    // never need.)
    NodeViewDesc.create = function create (parent, node, outerDeco, innerDeco, view, pos) {
      var assign;

      var custom = view.nodeViews[node.type.name], descObj;
      var spec = custom && custom(node, view, function () {
        // (This is a function that allows the custom view to find its
        // own position)
        if (!descObj) { return pos }
        if (descObj.parent) { return descObj.parent.posBeforeChild(descObj) }
      }, outerDeco);

      var dom = spec && spec.dom, contentDOM = spec && spec.contentDOM;
      if (node.isText) {
        if (!dom) { dom = document.createTextNode(node.text); }
        else if (dom.nodeType != 3) { throw new RangeError("Text must be rendered as a DOM text node") }
      } else if (!dom) {
  ((assign = DOMSerializer.renderSpec(document, node.type.spec.toDOM(node)), dom = assign.dom, contentDOM = assign.contentDOM));
      }
      if (!contentDOM && !node.isText && dom.nodeName != "BR") { // Chrome gets confused by <br contenteditable=false>
        if (!dom.hasAttribute("contenteditable")) { dom.contentEditable = false; }
        if (node.type.spec.draggable) { dom.draggable = true; }
      }

      var nodeDOM = dom;
      dom = applyOuterDeco(dom, outerDeco, node);

      if (spec)
        { return descObj = new CustomNodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM,
                                                spec, view, pos + 1) }
      else if (node.isText)
        { return new TextViewDesc(parent, node, outerDeco, innerDeco, dom, nodeDOM, view) }
      else
        { return new NodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos + 1) }
    };

    NodeViewDesc.prototype.parseRule = function parseRule () {
      var this$1 = this;

      // Experimental kludge to allow opt-in re-parsing of nodes
      if (this.node.type.spec.reparseInView) { return null }
      // FIXME the assumption that this can always return the current
      // attrs means that if the user somehow manages to change the
      // attrs in the dom, that won't be picked up. Not entirely sure
      // whether this is a problem
      var rule = {node: this.node.type.name, attrs: this.node.attrs};
      if (this.node.type.spec.code) { rule.preserveWhitespace = "full"; }
      if (this.contentDOM && !this.contentLost) { rule.contentElement = this.contentDOM; }
      else { rule.getContent = function () { return this$1.contentDOM ? Fragment.empty : this$1.node.content; }; }
      return rule
    };

    NodeViewDesc.prototype.matchesNode = function matchesNode (node, outerDeco, innerDeco) {
      return this.dirty == NOT_DIRTY && node.eq(this.node) &&
        sameOuterDeco(outerDeco, this.outerDeco) && innerDeco.eq(this.innerDeco)
    };

    prototypeAccessors$3.size.get = function () { return this.node.nodeSize };

    prototypeAccessors$3.border.get = function () { return this.node.isLeaf ? 0 : 1 };

    // Syncs `this.children` to match `this.node.content` and the local
    // decorations, possibly introducing nesting for marks. Then, in a
    // separate step, syncs the DOM inside `this.contentDOM` to
    // `this.children`.
    NodeViewDesc.prototype.updateChildren = function updateChildren (view, pos) {
      var this$1 = this;

      var inline = this.node.inlineContent, off = pos;
      var composition = inline && view.composing && this.localCompositionNode(view, pos);
      var updater = new ViewTreeUpdater(this, composition && composition.node);
      iterDeco(this.node, this.innerDeco, function (widget, i) {
        if (widget.spec.marks)
          { updater.syncToMarks(widget.spec.marks, inline, view); }
        else if (widget.type.side >= 0)
          { updater.syncToMarks(i == this$1.node.childCount ? Mark.none : this$1.node.child(i).marks, inline, view); }
        // If the next node is a desc matching this widget, reuse it,
        // otherwise insert the widget as a new view desc.
        updater.placeWidget(widget, view, off);
      }, function (child, outerDeco, innerDeco, i) {
        // Make sure the wrapping mark descs match the node's marks.
        updater.syncToMarks(child.marks, inline, view);
        // Either find an existing desc that exactly matches this node,
        // and drop the descs before it.
        updater.findNodeMatch(child, outerDeco, innerDeco, i) ||
          // Or try updating the next desc to reflect this node.
          updater.updateNextNode(child, outerDeco, innerDeco, view, i) ||
          // Or just add it as a new desc.
          updater.addNode(child, outerDeco, innerDeco, view, off);
        off += child.nodeSize;
      });
      // Drop all remaining descs after the current position.
      updater.syncToMarks(nothing, inline, view);
      if (this.node.isTextblock) { updater.addTextblockHacks(); }
      updater.destroyRest();

      // Sync the DOM if anything changed
      if (updater.changed || this.dirty == CONTENT_DIRTY) {
        // May have to protect focused DOM from being changed if a composition is active
        if (composition) { this.protectLocalComposition(view, composition); }
        this.renderChildren();
      }
    };

    NodeViewDesc.prototype.renderChildren = function renderChildren () {
      renderDescs(this.contentDOM, this.children);
      if (result.ios) { iosHacks(this.dom); }
    };

    NodeViewDesc.prototype.localCompositionNode = function localCompositionNode (view, pos) {
      // Only do something if both the selection and a focused text node
      // are inside of this node, and the node isn't already part of a
      // view that's a child of this view
      var ref = view.state.selection;
      var from = ref.from;
      var to = ref.to;
      if (!(view.state.selection instanceof TextSelection) || from < pos || to > pos + this.node.content.size) { return }
      var sel = view.root.getSelection();
      var textNode = nearbyTextNode(sel.focusNode, sel.focusOffset);
      if (!textNode || !this.dom.contains(textNode.parentNode)) { return }

      // Find the text in the focused node in the node, stop if it's not
      // there (may have been modified through other means, in which
      // case it should overwritten)
      var text = textNode.nodeValue;
      var textPos = findTextInFragment(this.node.content, text, from - pos, to - pos);

      return textPos < 0 ? null : {node: textNode, pos: textPos, text: text}
    };

    NodeViewDesc.prototype.protectLocalComposition = function protectLocalComposition (view, ref) {
      var node = ref.node;
      var pos = ref.pos;
      var text = ref.text;

      // The node is already part of a local view desc, leave it there
      if (this.getDesc(node)) { return }

      // Create a composition view for the orphaned nodes
      var topNode = node;
      for (;; topNode = topNode.parentNode) {
        if (topNode.parentNode == this.contentDOM) { break }
        while (topNode.previousSibling) { topNode.parentNode.removeChild(topNode.previousSibling); }
        while (topNode.nextSibling) { topNode.parentNode.removeChild(topNode.nextSibling); }
        if (topNode.pmViewDesc) { topNode.pmViewDesc = null; }
      }
      var desc = new CompositionViewDesc(this, topNode, node, text);
      view.compositionNodes.push(desc);

      // Patch up this.children to contain the composition view
      this.children = replaceNodes(this.children, pos, pos + text.length, view, desc);
    };

    // : (Node, [Decoration], DecorationSet, EditorView) → bool
    // If this desc be updated to match the given node decoration,
    // do so and return true.
    NodeViewDesc.prototype.update = function update (node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY ||
          !node.sameMarkup(this.node)) { return false }
      this.updateInner(node, outerDeco, innerDeco, view);
      return true
    };

    NodeViewDesc.prototype.updateInner = function updateInner (node, outerDeco, innerDeco, view) {
      this.updateOuterDeco(outerDeco);
      this.node = node;
      this.innerDeco = innerDeco;
      if (this.contentDOM) { this.updateChildren(view, this.posAtStart); }
      this.dirty = NOT_DIRTY;
    };

    NodeViewDesc.prototype.updateOuterDeco = function updateOuterDeco (outerDeco) {
      if (sameOuterDeco(outerDeco, this.outerDeco)) { return }
      var needsWrap = this.nodeDOM.nodeType != 1;
      var oldDOM = this.dom;
      this.dom = patchOuterDeco(this.dom, this.nodeDOM,
                                computeOuterDeco(this.outerDeco, this.node, needsWrap),
                                computeOuterDeco(outerDeco, this.node, needsWrap));
      if (this.dom != oldDOM) {
        oldDOM.pmViewDesc = null;
        this.dom.pmViewDesc = this;
      }
      this.outerDeco = outerDeco;
    };

    // Mark this node as being the selected node.
    NodeViewDesc.prototype.selectNode = function selectNode () {
      this.nodeDOM.classList.add("ProseMirror-selectednode");
      if (this.contentDOM || !this.node.type.spec.draggable) { this.dom.draggable = true; }
    };

    // Remove selected node marking from this node.
    NodeViewDesc.prototype.deselectNode = function deselectNode () {
      this.nodeDOM.classList.remove("ProseMirror-selectednode");
      if (this.contentDOM || !this.node.type.spec.draggable) { this.dom.draggable = false; }
    };

    Object.defineProperties( NodeViewDesc.prototype, prototypeAccessors$3 );

    return NodeViewDesc;
  }(ViewDesc));

  // Create a view desc for the top-level document node, to be exported
  // and used by the view class.
  function docViewDesc(doc, outerDeco, innerDeco, dom, view) {
    applyOuterDeco(dom, outerDeco, doc);
    return new NodeViewDesc(null, doc, outerDeco, innerDeco, dom, dom, dom, view, 0)
  }

  var TextViewDesc = /*@__PURE__*/(function (NodeViewDesc) {
    function TextViewDesc(parent, node, outerDeco, innerDeco, dom, nodeDOM, view) {
      NodeViewDesc.call(this, parent, node, outerDeco, innerDeco, dom, null, nodeDOM, view);
    }

    if ( NodeViewDesc ) TextViewDesc.__proto__ = NodeViewDesc;
    TextViewDesc.prototype = Object.create( NodeViewDesc && NodeViewDesc.prototype );
    TextViewDesc.prototype.constructor = TextViewDesc;

    TextViewDesc.prototype.parseRule = function parseRule () {
      return {skip: this.nodeDOM.parentNode || true}
    };

    TextViewDesc.prototype.update = function update (node, outerDeco) {
      if (this.dirty == NODE_DIRTY || (this.dirty != NOT_DIRTY && !this.inParent()) ||
          !node.sameMarkup(this.node)) { return false }
      this.updateOuterDeco(outerDeco);
      if ((this.dirty != NOT_DIRTY || node.text != this.node.text) && node.text != this.nodeDOM.nodeValue)
        { this.nodeDOM.nodeValue = node.text; }
      this.node = node;
      this.dirty = NOT_DIRTY;
      return true
    };

    TextViewDesc.prototype.inParent = function inParent () {
      var parentDOM = this.parent.contentDOM;
      for (var n = this.nodeDOM; n; n = n.parentNode) { if (n == parentDOM) { return true } }
      return false
    };

    TextViewDesc.prototype.domFromPos = function domFromPos (pos) {
      return {node: this.nodeDOM, offset: pos}
    };

    TextViewDesc.prototype.localPosFromDOM = function localPosFromDOM (dom, offset, bias) {
      if (dom == this.nodeDOM) { return this.posAtStart + Math.min(offset, this.node.text.length) }
      return NodeViewDesc.prototype.localPosFromDOM.call(this, dom, offset, bias)
    };

    TextViewDesc.prototype.ignoreMutation = function ignoreMutation (mutation) {
      return mutation.type != "characterData" && mutation.type != "selection"
    };

    TextViewDesc.prototype.slice = function slice (from, to, view) {
      var node = this.node.cut(from, to), dom = document.createTextNode(node.text);
      return new TextViewDesc(this.parent, node, this.outerDeco, this.innerDeco, dom, dom, view)
    };

    return TextViewDesc;
  }(NodeViewDesc));

  // A dummy desc used to tag trailing BR or span nodes created to work
  // around contentEditable terribleness.
  var BRHackViewDesc = /*@__PURE__*/(function (ViewDesc) {
    function BRHackViewDesc () {
      ViewDesc.apply(this, arguments);
    }

    if ( ViewDesc ) BRHackViewDesc.__proto__ = ViewDesc;
    BRHackViewDesc.prototype = Object.create( ViewDesc && ViewDesc.prototype );
    BRHackViewDesc.prototype.constructor = BRHackViewDesc;

    BRHackViewDesc.prototype.parseRule = function parseRule () { return {ignore: true} };
    BRHackViewDesc.prototype.matchesHack = function matchesHack () { return this.dirty == NOT_DIRTY };

    return BRHackViewDesc;
  }(ViewDesc));

  // A separate subclass is used for customized node views, so that the
  // extra checks only have to be made for nodes that are actually
  // customized.
  var CustomNodeViewDesc = /*@__PURE__*/(function (NodeViewDesc) {
    function CustomNodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, spec, view, pos) {
      NodeViewDesc.call(this, parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos);
      this.spec = spec;
    }

    if ( NodeViewDesc ) CustomNodeViewDesc.__proto__ = NodeViewDesc;
    CustomNodeViewDesc.prototype = Object.create( NodeViewDesc && NodeViewDesc.prototype );
    CustomNodeViewDesc.prototype.constructor = CustomNodeViewDesc;

    // A custom `update` method gets to decide whether the update goes
    // through. If it does, and there's a `contentDOM` node, our logic
    // updates the children.
    CustomNodeViewDesc.prototype.update = function update (node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY) { return false }
      if (this.spec.update) {
        var result = this.spec.update(node, outerDeco);
        if (result) { this.updateInner(node, outerDeco, innerDeco, view); }
        return result
      } else if (!this.contentDOM && !node.isLeaf) {
        return false
      } else {
        return NodeViewDesc.prototype.update.call(this, node, outerDeco, innerDeco, view)
      }
    };

    CustomNodeViewDesc.prototype.selectNode = function selectNode () {
      this.spec.selectNode ? this.spec.selectNode() : NodeViewDesc.prototype.selectNode.call(this);
    };

    CustomNodeViewDesc.prototype.deselectNode = function deselectNode () {
      this.spec.deselectNode ? this.spec.deselectNode() : NodeViewDesc.prototype.deselectNode.call(this);
    };

    CustomNodeViewDesc.prototype.setSelection = function setSelection (anchor, head, root, force) {
      this.spec.setSelection ? this.spec.setSelection(anchor, head, root)
        : NodeViewDesc.prototype.setSelection.call(this, anchor, head, root, force);
    };

    CustomNodeViewDesc.prototype.destroy = function destroy () {
      if (this.spec.destroy) { this.spec.destroy(); }
      NodeViewDesc.prototype.destroy.call(this);
    };

    CustomNodeViewDesc.prototype.stopEvent = function stopEvent (event) {
      return this.spec.stopEvent ? this.spec.stopEvent(event) : false
    };

    CustomNodeViewDesc.prototype.ignoreMutation = function ignoreMutation (mutation) {
      return this.spec.ignoreMutation ? this.spec.ignoreMutation(mutation) : NodeViewDesc.prototype.ignoreMutation.call(this, mutation)
    };

    return CustomNodeViewDesc;
  }(NodeViewDesc));

  // : (dom.Node, [ViewDesc])
  // Sync the content of the given DOM node with the nodes associated
  // with the given array of view descs, recursing into mark descs
  // because this should sync the subtree for a whole node at a time.
  function renderDescs(parentDOM, descs) {
    var dom = parentDOM.firstChild;
    for (var i = 0; i < descs.length; i++) {
      var desc = descs[i], childDOM = desc.dom;
      if (childDOM.parentNode == parentDOM) {
        while (childDOM != dom) { dom = rm(dom); }
        dom = dom.nextSibling;
      } else {
        parentDOM.insertBefore(childDOM, dom);
      }
      if (desc instanceof MarkViewDesc) {
        var pos = dom ? dom.previousSibling : parentDOM.lastChild;
        renderDescs(desc.contentDOM, desc.children);
        dom = pos ? pos.nextSibling : parentDOM.firstChild;
      }
    }
    while (dom) { dom = rm(dom); }
  }

  function OuterDecoLevel(nodeName) {
    if (nodeName) { this.nodeName = nodeName; }
  }
  OuterDecoLevel.prototype = Object.create(null);

  var noDeco = [new OuterDecoLevel];

  function computeOuterDeco(outerDeco, node, needsWrap) {
    if (outerDeco.length == 0) { return noDeco }

    var top = needsWrap ? noDeco[0] : new OuterDecoLevel, result = [top];

    for (var i = 0; i < outerDeco.length; i++) {
      var attrs = outerDeco[i].type.attrs, cur = top;
      if (!attrs) { continue }
      if (attrs.nodeName)
        { result.push(cur = new OuterDecoLevel(attrs.nodeName)); }

      for (var name in attrs) {
        var val = attrs[name];
        if (val == null) { continue }
        if (needsWrap && result.length == 1)
          { result.push(cur = top = new OuterDecoLevel(node.isInline ? "span" : "div")); }
        if (name == "class") { cur.class = (cur.class ? cur.class + " " : "") + val; }
        else if (name == "style") { cur.style = (cur.style ? cur.style + ";" : "") + val; }
        else if (name != "nodeName") { cur[name] = val; }
      }
    }

    return result
  }

  function patchOuterDeco(outerDOM, nodeDOM, prevComputed, curComputed) {
    // Shortcut for trivial case
    if (prevComputed == noDeco && curComputed == noDeco) { return nodeDOM }

    var curDOM = nodeDOM;
    for (var i = 0; i < curComputed.length; i++) {
      var deco = curComputed[i], prev = prevComputed[i];
      if (i) {
        var parent = (void 0);
        if (prev && prev.nodeName == deco.nodeName && curDOM != outerDOM &&
            (parent = nodeDOM.parentNode) && parent.tagName.toLowerCase() == deco.nodeName) {
          curDOM = parent;
        } else {
          parent = document.createElement(deco.nodeName);
          parent.appendChild(curDOM);
          curDOM = parent;
        }
      }
      patchAttributes(curDOM, prev || noDeco[0], deco);
    }
    return curDOM
  }

  function patchAttributes(dom, prev, cur) {
    for (var name in prev)
      { if (name != "class" && name != "style" && name != "nodeName" && !(name in cur))
        { dom.removeAttribute(name); } }
    for (var name$1 in cur)
      { if (name$1 != "class" && name$1 != "style" && name$1 != "nodeName" && cur[name$1] != prev[name$1])
        { dom.setAttribute(name$1, cur[name$1]); } }
    if (prev.class != cur.class) {
      var prevList = prev.class ? prev.class.split(" ") : nothing;
      var curList = cur.class ? cur.class.split(" ") : nothing;
      for (var i = 0; i < prevList.length; i++) { if (curList.indexOf(prevList[i]) == -1)
        { dom.classList.remove(prevList[i]); } }
      for (var i$1 = 0; i$1 < curList.length; i$1++) { if (prevList.indexOf(curList[i$1]) == -1)
        { dom.classList.add(curList[i$1]); } }
    }
    if (prev.style != cur.style) {
      if (prev.style) {
        var prop = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g, m;
        while (m = prop.exec(prev.style))
          { dom.style[m[1].toLowerCase()] = ""; }
      }
      if (cur.style)
        { dom.style.cssText += cur.style; }
    }
  }

  function applyOuterDeco(dom, deco, node) {
    return patchOuterDeco(dom, dom, noDeco, computeOuterDeco(deco, node, dom.nodeType != 1))
  }

  // : ([Decoration], [Decoration]) → bool
  function sameOuterDeco(a, b) {
    if (a.length != b.length) { return false }
    for (var i = 0; i < a.length; i++) { if (!a[i].type.eq(b[i].type)) { return false } }
    return true
  }

  // Remove a DOM node and return its next sibling.
  function rm(dom) {
    var next = dom.nextSibling;
    dom.parentNode.removeChild(dom);
    return next
  }

  // Helper class for incrementally updating a tree of mark descs and
  // the widget and node descs inside of them.
  var ViewTreeUpdater = function ViewTreeUpdater(top, lockedNode) {
    this.top = top;
    this.lock = lockedNode;
    // Index into `this.top`'s child array, represents the current
    // update position.
    this.index = 0;
    // When entering a mark, the current top and index are pushed
    // onto this.
    this.stack = [];
    // Tracks whether anything was changed
    this.changed = false;

    var pre = preMatch(top.node.content, top.children);
    this.preMatched = pre.nodes;
    this.preMatchOffset = pre.offset;
  };

  ViewTreeUpdater.prototype.getPreMatch = function getPreMatch (index) {
    return index >= this.preMatchOffset ? this.preMatched[index - this.preMatchOffset] : null
  };

  // Destroy and remove the children between the given indices in
  // `this.top`.
  ViewTreeUpdater.prototype.destroyBetween = function destroyBetween (start, end) {
    if (start == end) { return }
    for (var i = start; i < end; i++) { this.top.children[i].destroy(); }
    this.top.children.splice(start, end - start);
    this.changed = true;
  };

  // Destroy all remaining children in `this.top`.
  ViewTreeUpdater.prototype.destroyRest = function destroyRest () {
    this.destroyBetween(this.index, this.top.children.length);
  };

  // : ([Mark], EditorView)
  // Sync the current stack of mark descs with the given array of
  // marks, reusing existing mark descs when possible.
  ViewTreeUpdater.prototype.syncToMarks = function syncToMarks (marks, inline, view) {
    var keep = 0, depth = this.stack.length >> 1;
    var maxKeep = Math.min(depth, marks.length);
    while (keep < maxKeep &&
           (keep == depth - 1 ? this.top : this.stack[(keep + 1) << 1]).matchesMark(marks[keep]) && marks[keep].type.spec.spanning !== false)
      { keep++; }

    while (keep < depth) {
      this.destroyRest();
      this.top.dirty = NOT_DIRTY;
      this.index = this.stack.pop();
      this.top = this.stack.pop();
      depth--;
    }
    while (depth < marks.length) {
      this.stack.push(this.top, this.index + 1);
      var found = -1;
      for (var i = this.index; i < Math.min(this.index + 3, this.top.children.length); i++) {
        if (this.top.children[i].matchesMark(marks[depth])) { found = i; break }
      }
      if (found > -1) {
        if (found > this.index) {
          this.changed = true;
          this.destroyBetween(this.index, found);
        }
        this.top = this.top.children[this.index];
      } else {
        var markDesc = MarkViewDesc.create(this.top, marks[depth], inline, view);
        this.top.children.splice(this.index, 0, markDesc);
        this.top = markDesc;
        this.changed = true;
      }
      this.index = 0;
      depth++;
    }
  };

  // : (Node, [Decoration], DecorationSet) → bool
  // Try to find a node desc matching the given data. Skip over it and
  // return true when successful.
  ViewTreeUpdater.prototype.findNodeMatch = function findNodeMatch (node, outerDeco, innerDeco, index) {
    var found = -1, preMatch = index < 0 ? undefined : this.getPreMatch(index), children = this.top.children;
    if (preMatch && preMatch.matchesNode(node, outerDeco, innerDeco)) {
      found = children.indexOf(preMatch);
    } else {
      for (var i = this.index, e = Math.min(children.length, i + 5); i < e; i++) {
        var child = children[i];
        if (child.matchesNode(node, outerDeco, innerDeco) && this.preMatched.indexOf(child) < 0) {
          found = i;
          break
        }
      }
    }
    if (found < 0) { return false }
    this.destroyBetween(this.index, found);
    this.index++;
    return true
  };

  // : (Node, [Decoration], DecorationSet, EditorView, Fragment, number) → bool
  // Try to update the next node, if any, to the given data. Checks
  // pre-matches to avoid overwriting nodes that could still be used.
  ViewTreeUpdater.prototype.updateNextNode = function updateNextNode (node, outerDeco, innerDeco, view, index) {
    if (this.index == this.top.children.length) { return false }
    var next = this.top.children[this.index];
    if (next instanceof NodeViewDesc) {
      var preMatch = this.preMatched.indexOf(next);
      if (preMatch > -1 && preMatch + this.preMatchOffset != index) { return false }
      var nextDOM = next.dom;

      // Can't update if nextDOM is or contains this.lock, except if
      // it's a text node whose content already matches the new text
      // and whose decorations match the new ones.
      var locked = this.lock && (nextDOM == this.lock || nextDOM.nodeType == 1 && nextDOM.contains(this.lock.parentNode)) &&
          !(node.isText && next.node && next.node.isText && next.nodeDOM.nodeValue == node.text &&
            next.dirty != NODE_DIRTY && sameOuterDeco(outerDeco, next.outerDeco));
      if (!locked && next.update(node, outerDeco, innerDeco, view)) {
        if (next.dom != nextDOM) { this.changed = true; }
        this.index++;
        return true
      }
    }
    return false
  };

  // : (Node, [Decoration], DecorationSet, EditorView)
  // Insert the node as a newly created node desc.
  ViewTreeUpdater.prototype.addNode = function addNode (node, outerDeco, innerDeco, view, pos) {
    this.top.children.splice(this.index++, 0, NodeViewDesc.create(this.top, node, outerDeco, innerDeco, view, pos));
    this.changed = true;
  };

  ViewTreeUpdater.prototype.placeWidget = function placeWidget (widget, view, pos) {
    if (this.index < this.top.children.length && this.top.children[this.index].matchesWidget(widget)) {
      this.index++;
    } else {
      var desc = new WidgetViewDesc(this.top, widget, view, pos);
      this.top.children.splice(this.index++, 0, desc);
      this.changed = true;
    }
  };

  // Make sure a textblock looks and behaves correctly in
  // contentEditable.
  ViewTreeUpdater.prototype.addTextblockHacks = function addTextblockHacks () {
    var lastChild = this.top.children[this.index - 1];
    while (lastChild instanceof MarkViewDesc) { lastChild = lastChild.children[lastChild.children.length - 1]; }

    if (!lastChild || // Empty textblock
        !(lastChild instanceof TextViewDesc) ||
        /\n$/.test(lastChild.node.text)) {
      if (this.index < this.top.children.length && this.top.children[this.index].matchesHack()) {
        this.index++;
      } else {
        var dom = document.createElement("br");
        this.top.children.splice(this.index++, 0, new BRHackViewDesc(this.top, nothing, dom, null));
        this.changed = true;
      }
    }
  };

  // : (Fragment, [ViewDesc]) → [ViewDesc]
  // Iterate from the end of the fragment and array of descs to find
  // directly matching ones, in order to avoid overeagerly reusing
  // those for other nodes. Returns an array whose positions correspond
  // to node positions in the fragment, and whose elements are either
  // descs matched to the child at that index, or empty.
  function preMatch(frag, descs) {
    var result = [], end = frag.childCount;
    for (var i = descs.length - 1; end > 0 && i >= 0; i--) {
      var desc = descs[i], node = desc.node;
      if (!node) { continue }
      if (node != frag.child(end - 1)) { break }
      result.push(desc);
      --end;
    }
    return {nodes: result.reverse(), offset: end}
  }

  function compareSide(a, b) { return a.type.side - b.type.side }

  // : (ViewDesc, DecorationSet, (Decoration, number), (Node, [Decoration], DecorationSet, number))
  // This function abstracts iterating over the nodes and decorations in
  // a fragment. Calls `onNode` for each node, with its local and child
  // decorations. Splits text nodes when there is a decoration starting
  // or ending inside of them. Calls `onWidget` for each widget.
  function iterDeco(parent, deco, onWidget, onNode) {
    var locals = deco.locals(parent), offset = 0;
    // Simple, cheap variant for when there are no local decorations
    if (locals.length == 0) {
      for (var i = 0; i < parent.childCount; i++) {
        var child = parent.child(i);
        onNode(child, locals, deco.forChild(offset, child), i);
        offset += child.nodeSize;
      }
      return
    }

    var decoIndex = 0, active = [], restNode = null;
    for (var parentIndex = 0;;) {
      if (decoIndex < locals.length && locals[decoIndex].to == offset) {
        var widget = locals[decoIndex++], widgets = (void 0);
        while (decoIndex < locals.length && locals[decoIndex].to == offset)
          { (widgets || (widgets = [widget])).push(locals[decoIndex++]); }
        if (widgets) {
          widgets.sort(compareSide);
          for (var i$1 = 0; i$1 < widgets.length; i$1++) { onWidget(widgets[i$1], parentIndex); }
        } else {
          onWidget(widget, parentIndex);
        }
      }

      var child$1 = (void 0), index = (void 0);
      if (restNode) {
        index = -1;
        child$1 = restNode;
        restNode = null;
      } else if (parentIndex < parent.childCount) {
        index = parentIndex;
        child$1 = parent.child(parentIndex++);
      } else {
        break
      }

      for (var i$2 = 0; i$2 < active.length; i$2++) { if (active[i$2].to <= offset) { active.splice(i$2--, 1); } }
      while (decoIndex < locals.length && locals[decoIndex].from == offset) { active.push(locals[decoIndex++]); }

      var end = offset + child$1.nodeSize;
      if (child$1.isText) {
        var cutAt = end;
        if (decoIndex < locals.length && locals[decoIndex].from < cutAt) { cutAt = locals[decoIndex].from; }
        for (var i$3 = 0; i$3 < active.length; i$3++) { if (active[i$3].to < cutAt) { cutAt = active[i$3].to; } }
        if (cutAt < end) {
          restNode = child$1.cut(cutAt - offset);
          child$1 = child$1.cut(0, cutAt - offset);
          end = cutAt;
          index = -1;
        }
      }

      onNode(child$1, active.length ? active.slice() : nothing, deco.forChild(offset, child$1), index);
      offset = end;
    }
  }

  // List markers in Mobile Safari will mysteriously disappear
  // sometimes. This works around that.
  function iosHacks(dom) {
    if (dom.nodeName == "UL" || dom.nodeName == "OL") {
      var oldCSS = dom.style.cssText;
      dom.style.cssText = oldCSS + "; list-style: square !important";
      window.getComputedStyle(dom).listStyle;
      dom.style.cssText = oldCSS;
    }
  }

  function nearbyTextNode(node, offset) {
    for (;;) {
      if (node.nodeType == 3) { return node }
      if (node.nodeType == 1 && offset > 0) {
        if (node.childNodes.length > offset && node.childNodes[offset].nodeType == 3)
          { return node.childNodes[offset] }
        node = node.childNodes[offset - 1];
        offset = nodeSize(node);
      } else if (node.nodeType == 1 && offset < node.childNodes.length) {
        node = node.childNodes[offset];
        offset = 0;
      } else {
        return null
      }
    }
  }

  // Find a piece of text in an inline fragment, overlapping from-to
  function findTextInFragment(frag, text, from, to) {
    for (var str = "", i = 0, childPos = 0; i < frag.childCount; i++) {
      var child = frag.child(i), end = childPos + child.nodeSize;
      if (child.isText) {
        str += child.text;
        if (end >= to) {
          var strStart = end - str.length, found = str.lastIndexOf(text);
          while (found > -1 && strStart + found > from) { found = str.lastIndexOf(text, found - 1); }
          if (found > -1 && strStart + found + text.length >= to) {
            return strStart + found
          } else if (end > to) {
            break
          }
        }
      } else {
        str = "";
      }
      childPos = end;
    }
    return -1
  }

  // Replace range from-to in an array of view descs with replacement
  // (may be null to just delete). This goes very much against the grain
  // of the rest of this code, which tends to create nodes with the
  // right shape in one go, rather than messing with them after
  // creation, but is necessary in the composition hack.
  function replaceNodes(nodes, from, to, view, replacement) {
    var result = [];
    for (var i = 0, off = 0; i < nodes.length; i++) {
      var child = nodes[i], start = off, end = off += child.size;
      if (start >= to || end <= from) {
        result.push(child);
      } else {
        if (start < from) { result.push(child.slice(0, from - start, view)); }
        if (replacement) {
          result.push(replacement);
          replacement = null;
        }
        if (end > to) { result.push(child.slice(to - start, child.size, view)); }
      }
    }
    return result
  }

  function moveSelectionBlock(state, dir) {
    var ref = state.selection;
    var $anchor = ref.$anchor;
    var $head = ref.$head;
    var $side = dir > 0 ? $anchor.max($head) : $anchor.min($head);
    var $start = !$side.parent.inlineContent ? $side : $side.depth ? state.doc.resolve(dir > 0 ? $side.after() : $side.before()) : null;
    return $start && Selection.findFrom($start, dir)
  }

  function apply(view, sel) {
    view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
    return true
  }

  function selectHorizontally(view, dir, mods) {
    var sel = view.state.selection;
    if (sel instanceof TextSelection) {
      if (!sel.empty || mods.indexOf("s") > -1) {
        return false
      } else if (view.endOfTextblock(dir > 0 ? "right" : "left")) {
        var next = moveSelectionBlock(view.state, dir);
        if (next && (next instanceof NodeSelection)) { return apply(view, next) }
        return false
      } else {
        var $head = sel.$head, node = $head.textOffset ? null : dir < 0 ? $head.nodeBefore : $head.nodeAfter, desc;
        if (!node || node.isText) { return false }
        var nodePos = dir < 0 ? $head.pos - node.nodeSize : $head.pos;
        if (!(node.isAtom || (desc = view.docView.descAt(nodePos)) && !desc.contentDOM)) { return false }
        if (NodeSelection.isSelectable(node)) {
          return apply(view, new NodeSelection(dir < 0 ? view.state.doc.resolve($head.pos - node.nodeSize) : $head))
        } else if (result.webkit) {
          // Chrome and Safari will introduce extra pointless cursor
          // positions around inline uneditable nodes, so we have to
          // take over and move the cursor past them (#937)
          return apply(view, new TextSelection(view.state.doc.resolve(dir < 0 ? nodePos : nodePos + node.nodeSize)))
        } else {
          return false
        }
      }
    } else if (sel instanceof NodeSelection && sel.node.isInline) {
      return apply(view, new TextSelection(dir > 0 ? sel.$to : sel.$from))
    } else {
      var next$1 = moveSelectionBlock(view.state, dir);
      if (next$1) { return apply(view, next$1) }
      return false
    }
  }

  function nodeLen(node) {
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length
  }

  function isIgnorable(dom) {
    var desc = dom.pmViewDesc;
    return desc && desc.size == 0 && (dom.nextSibling || dom.nodeName != "BR")
  }

  // Make sure the cursor isn't directly after one or more ignored
  // nodes, which will confuse the browser's cursor motion logic.
  function skipIgnoredNodesLeft(view) {
    var sel = view.root.getSelection();
    var node = sel.focusNode, offset = sel.focusOffset;
    if (!node) { return }
    var moveNode, moveOffset, force = false;
    // Gecko will do odd things when the selection is directly in front
    // of a non-editable node, so in that case, move it into the next
    // node if possible. Issue prosemirror/prosemirror#832.
    if (result.gecko && node.nodeType == 1 && offset < nodeLen(node) && isIgnorable(node.childNodes[offset])) { force = true; }
    for (;;) {
      if (offset > 0) {
        if (node.nodeType != 1) {
          break
        } else {
          var before = node.childNodes[offset - 1];
          if (isIgnorable(before)) {
            moveNode = node;
            moveOffset = --offset;
          } else if (before.nodeType == 3) {
            node = before;
            offset = node.nodeValue.length;
          } else { break }
        }
      } else if (isBlockNode(node)) {
        break
      } else {
        var prev = node.previousSibling;
        while (prev && isIgnorable(prev)) {
          moveNode = node.parentNode;
          moveOffset = domIndex(prev);
          prev = prev.previousSibling;
        }
        if (!prev) {
          node = node.parentNode;
          if (node == view.dom) { break }
          offset = 0;
        } else {
          node = prev;
          offset = nodeLen(node);
        }
      }
    }
    if (force) { setSelFocus(view, sel, node, offset); }
    else if (moveNode) { setSelFocus(view, sel, moveNode, moveOffset); }
  }

  // Make sure the cursor isn't directly before one or more ignored
  // nodes.
  function skipIgnoredNodesRight(view) {
    var sel = view.root.getSelection();
    var node = sel.focusNode, offset = sel.focusOffset;
    if (!node) { return }
    var len = nodeLen(node);
    var moveNode, moveOffset;
    for (;;) {
      if (offset < len) {
        if (node.nodeType != 1) { break }
        var after = node.childNodes[offset];
        if (isIgnorable(after)) {
          moveNode = node;
          moveOffset = ++offset;
        }
        else { break }
      } else if (isBlockNode(node)) {
        break
      } else {
        var next = node.nextSibling;
        while (next && isIgnorable(next)) {
          moveNode = next.parentNode;
          moveOffset = domIndex(next) + 1;
          next = next.nextSibling;
        }
        if (!next) {
          node = node.parentNode;
          if (node == view.dom) { break }
          offset = len = 0;
        } else {
          node = next;
          offset = 0;
          len = nodeLen(node);
        }
      }
    }
    if (moveNode) { setSelFocus(view, sel, moveNode, moveOffset); }
  }

  function isBlockNode(dom) {
    var desc = dom.pmViewDesc;
    return desc && desc.node && desc.node.isBlock
  }

  function setSelFocus(view, sel, node, offset) {
    if (selectionCollapsed(sel)) {
      var range = document.createRange();
      range.setEnd(node, offset);
      range.setStart(node, offset);
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (sel.extend) {
      sel.extend(node, offset);
    }
    view.domObserver.setCurSelection();
  }

  // : (EditorState, number)
  // Check whether vertical selection motion would involve node
  // selections. If so, apply it (if not, the result is left to the
  // browser)
  function selectVertically(view, dir, mods) {
    var sel = view.state.selection;
    if (sel instanceof TextSelection && !sel.empty || mods.indexOf("s") > -1) { return false }
    var $from = sel.$from;
    var $to = sel.$to;

    if (!$from.parent.inlineContent || view.endOfTextblock(dir < 0 ? "up" : "down")) {
      var next = moveSelectionBlock(view.state, dir);
      if (next && (next instanceof NodeSelection))
        { return apply(view, next) }
    }
    if (!$from.parent.inlineContent) {
      var beyond = Selection.findFrom(dir < 0 ? $from : $to, dir);
      return beyond ? apply(view, beyond) : true
    }
    return false
  }

  function stopNativeHorizontalDelete(view, dir) {
    if (!(view.state.selection instanceof TextSelection)) { return true }
    var ref = view.state.selection;
    var $head = ref.$head;
    var $anchor = ref.$anchor;
    var empty = ref.empty;
    if (!$head.sameParent($anchor)) { return true }
    if (!empty) { return false }
    if (view.endOfTextblock(dir > 0 ? "forward" : "backward")) { return true }
    var nextNode = !$head.textOffset && (dir < 0 ? $head.nodeBefore : $head.nodeAfter);
    if (nextNode && !nextNode.isText) {
      var tr = view.state.tr;
      if (dir < 0) { tr.delete($head.pos - nextNode.nodeSize, $head.pos); }
      else { tr.delete($head.pos, $head.pos + nextNode.nodeSize); }
      view.dispatch(tr);
      return true
    }
    return false
  }

  function switchEditable(view, node, state) {
    view.domObserver.stop();
    node.contentEditable = state;
    view.domObserver.start();
  }

  // Issue #867 / https://bugs.chromium.org/p/chromium/issues/detail?id=903821
  // In which Chrome does really wrong things when the down arrow is
  // pressed when the cursor is directly at the start of a textblock and
  // has an uneditable node after it
  function chromeDownArrowBug(view) {
    if (!result.chrome || view.state.selection.$head.parentOffset > 0) { return }
    var ref = view.root.getSelection();
    var focusNode = ref.focusNode;
    var focusOffset = ref.focusOffset;
    if (focusNode && focusNode.nodeType == 1 && focusOffset == 0 &&
        focusNode.firstChild && focusNode.firstChild.contentEditable == "false") {
      var child = focusNode.firstChild;
      switchEditable(view, child, true);
      setTimeout(function () { return switchEditable(view, child, false); }, 20);
    }
  }

  // A backdrop key mapping used to make sure we always suppress keys
  // that have a dangerous default effect, even if the commands they are
  // bound to return false, and to make sure that cursor-motion keys
  // find a cursor (as opposed to a node selection) when pressed. For
  // cursor-motion keys, the code in the handlers also takes care of
  // block selections.

  function getMods(event) {
    var result = "";
    if (event.ctrlKey) { result += "c"; }
    if (event.metaKey) { result += "m"; }
    if (event.altKey) { result += "a"; }
    if (event.shiftKey) { result += "s"; }
    return result
  }

  function captureKeyDown(view, event) {
    var code = event.keyCode, mods = getMods(event);
    if (code == 8 || (result.mac && code == 72 && mods == "c")) { // Backspace, Ctrl-h on Mac
      return stopNativeHorizontalDelete(view, -1) || skipIgnoredNodesLeft(view)
    } else if (code == 46 || (result.mac && code == 68 && mods == "c")) { // Delete, Ctrl-d on Mac
      return stopNativeHorizontalDelete(view, 1) || skipIgnoredNodesRight(view)
    } else if (code == 13 || code == 27) { // Enter, Esc
      return true
    } else if (code == 37) { // Left arrow
      return selectHorizontally(view, -1, mods) || skipIgnoredNodesLeft(view)
    } else if (code == 39) { // Right arrow
      return selectHorizontally(view, 1, mods) || skipIgnoredNodesRight(view)
    } else if (code == 38) { // Up arrow
      return selectVertically(view, -1, mods) || skipIgnoredNodesLeft(view)
    } else if (code == 40) { // Down arrow
      return chromeDownArrowBug(view) || selectVertically(view, 1, mods) || skipIgnoredNodesRight(view)
    } else if (mods == (result.mac ? "m" : "c") &&
               (code == 66 || code == 73 || code == 89 || code == 90)) { // Mod-[biyz]
      return true
    }
    return false
  }

  function selectionFromDOM(view, origin) {
    var domSel = view.root.getSelection(), doc = view.state.doc;
    var nearestDesc = view.docView.nearestDesc(domSel.focusNode), inWidget = nearestDesc && nearestDesc.size == 0;
    var head = view.docView.posFromDOM(domSel.focusNode, domSel.focusOffset);
    var $head = doc.resolve(head), $anchor, selection;
    if (selectionCollapsed(domSel)) {
      $anchor = $head;
      while (nearestDesc && !nearestDesc.node) { nearestDesc = nearestDesc.parent; }
      if (nearestDesc && nearestDesc.node.isAtom && NodeSelection.isSelectable(nearestDesc.node) && nearestDesc.parent) {
        var pos = nearestDesc.posBefore;
        selection = new NodeSelection(head == pos ? $head : doc.resolve(pos));
      }
    } else {
      $anchor = doc.resolve(view.docView.posFromDOM(domSel.anchorNode, domSel.anchorOffset));
    }

    if (!selection) {
      var bias = origin == "pointer" || (view.state.selection.head < $head.pos && !inWidget) ? 1 : -1;
      selection = selectionBetween(view, $anchor, $head, bias);
    }
    return selection
  }

  function selectionToDOM(view, force) {
    var sel = view.state.selection;
    syncNodeSelection(view, sel);

    if (view.editable ? !view.hasFocus() : !(hasSelection(view) && document.activeElement.contains(view.dom))) { return }

    view.domObserver.disconnectSelection();

    if (view.cursorWrapper) {
      selectCursorWrapper(view);
    } else {
      var anchor = sel.anchor;
      var head = sel.head;
      var resetEditableFrom, resetEditableTo;
      if (brokenSelectBetweenUneditable && !(sel instanceof TextSelection)) {
        if (!sel.$from.parent.inlineContent)
          { resetEditableFrom = temporarilyEditableNear(view, sel.from); }
        if (!sel.empty && !sel.$from.parent.inlineContent)
          { resetEditableTo = temporarilyEditableNear(view, sel.to); }
      }
      view.docView.setSelection(anchor, head, view.root, force);
      if (brokenSelectBetweenUneditable) {
        if (resetEditableFrom) { resetEditableFrom.contentEditable = "false"; }
        if (resetEditableTo) { resetEditableTo.contentEditable = "false"; }
      }
      if (sel.visible) {
        view.dom.classList.remove("ProseMirror-hideselection");
      } else if (anchor != head) {
        view.dom.classList.add("ProseMirror-hideselection");
        if ("onselectionchange" in document) { removeClassOnSelectionChange(view); }
      }
    }

    view.domObserver.setCurSelection();
    view.domObserver.connectSelection();
  }

  // Kludge to work around Webkit not allowing a selection to start/end
  // between non-editable block nodes. We briefly make something
  // editable, set the selection, then set it uneditable again.

  var brokenSelectBetweenUneditable = result.safari || result.chrome && result.chrome_version < 63;

  function temporarilyEditableNear(view, pos) {
    var ref = view.docView.domFromPos(pos);
    var node = ref.node;
    var offset = ref.offset;
    var after = offset < node.childNodes.length ? node.childNodes[offset] : null;
    var before = offset ? node.childNodes[offset - 1] : null;
    if ((!after || after.contentEditable == "false") && (!before || before.contentEditable == "false")) {
      if (after) {
        after.contentEditable = "true";
        return after
      } else if (before) {
        before.contentEditable = "true";
        return before
      }
    }
  }

  function removeClassOnSelectionChange(view) {
    var doc = view.dom.ownerDocument;
    doc.removeEventListener("selectionchange", view.hideSelectionGuard);
    var domSel = view.root.getSelection();
    var node = domSel.anchorNode, offset = domSel.anchorOffset;
    doc.addEventListener("selectionchange", view.hideSelectionGuard = function () {
      if (domSel.anchorNode != node || domSel.anchorOffset != offset) {
        doc.removeEventListener("selectionchange", view.hideSelectionGuard);
        view.dom.classList.remove("ProseMirror-hideselection");
      }
    });
  }

  function selectCursorWrapper(view) {
    var domSel = view.root.getSelection(), range = document.createRange();
    var node = view.cursorWrapper.dom, img = node.nodeName == "IMG";
    if (img) { range.setEnd(node.parentNode, domIndex(node) + 1); }
    else { range.setEnd(node, 0); }
    range.collapse(false);
    domSel.removeAllRanges();
    domSel.addRange(range);
    // Kludge to kill 'control selection' in IE11 when selecting an
    // invisible cursor wrapper, since that would result in those weird
    // resize handles and a selection that considers the absolutely
    // positioned wrapper, rather than the root editable node, the
    // focused element.
    if (!img && !view.state.selection.visible && result.ie && result.ie_version <= 11) {
      node.disabled = true;
      node.disabled = false;
    }
  }

  function syncNodeSelection(view, sel) {
    if (sel instanceof NodeSelection) {
      var desc = view.docView.descAt(sel.from);
      if (desc != view.lastSelectedViewDesc) {
        clearNodeSelection(view);
        if (desc) { desc.selectNode(); }
        view.lastSelectedViewDesc = desc;
      }
    } else {
      clearNodeSelection(view);
    }
  }

  // Clear all DOM statefulness of the last node selection.
  function clearNodeSelection(view) {
    if (view.lastSelectedViewDesc) {
      if (view.lastSelectedViewDesc.parent)
        { view.lastSelectedViewDesc.deselectNode(); }
      view.lastSelectedViewDesc = null;
    }
  }

  function selectionBetween(view, $anchor, $head, bias) {
    return view.someProp("createSelectionBetween", function (f) { return f(view, $anchor, $head); })
      || TextSelection.between($anchor, $head, bias)
  }

  function hasFocusAndSelection(view) {
    if (view.editable && view.root.activeElement != view.dom) { return false }
    return hasSelection(view)
  }

  function hasSelection(view) {
    var sel = view.root.getSelection();
    if (!sel.anchorNode) { return false }
    try {
      // Firefox will raise 'permission denied' errors when accessing
      // properties of `sel.anchorNode` when it's in a generated CSS
      // element.
      return view.dom.contains(sel.anchorNode.nodeType == 3 ? sel.anchorNode.parentNode : sel.anchorNode) &&
        (view.editable || view.dom.contains(sel.focusNode.nodeType == 3 ? sel.focusNode.parentNode : sel.focusNode))
    } catch(_) {
      return false
    }
  }

  function anchorInRightPlace(view) {
    var anchorDOM = view.docView.domFromPos(view.state.selection.anchor);
    var domSel = view.root.getSelection();
    return isEquivalentPosition(anchorDOM.node, anchorDOM.offset, domSel.anchorNode, domSel.anchorOffset)
  }

  // Note that all referencing and parsing is done with the
  // start-of-operation selection and document, since that's the one
  // that the DOM represents. If any changes came in in the meantime,
  // the modification is mapped over those before it is applied, in
  // readDOMChange.

  function parseBetween(view, from_, to_) {
    var ref = view.docView.parseRange(from_, to_);
    var parent = ref.node;
    var fromOffset = ref.fromOffset;
    var toOffset = ref.toOffset;
    var from = ref.from;
    var to = ref.to;

    var domSel = view.root.getSelection(), find = null, anchor = domSel.anchorNode;
    if (anchor && view.dom.contains(anchor.nodeType == 1 ? anchor : anchor.parentNode)) {
      find = [{node: anchor, offset: domSel.anchorOffset}];
      if (!selectionCollapsed(domSel))
        { find.push({node: domSel.focusNode, offset: domSel.focusOffset}); }
    }
    // Work around issue in Chrome where backspacing sometimes replaces
    // the deleted content with a random BR node (issues #799, #831)
    if (result.chrome && view.lastKeyCode === 8) {
      for (var off = toOffset; off > fromOffset; off--) {
        var node = parent.childNodes[off - 1], desc = node.pmViewDesc;
        if (node.nodeType == "BR" && !desc) { toOffset = off; break }
        if (!desc || desc.size) { break }
      }
    }
    var startDoc = view.state.doc;
    var parser = view.someProp("domParser") || DOMParser.fromSchema(view.state.schema);
    var $from = startDoc.resolve(from);

    var sel = null, doc = parser.parse(parent, {
      topNode: $from.parent,
      topMatch: $from.parent.contentMatchAt($from.index()),
      topOpen: true,
      from: fromOffset,
      to: toOffset,
      preserveWhitespace: $from.parent.type.spec.code ? "full" : true,
      editableContent: true,
      findPositions: find,
      ruleFromNode: ruleFromNode(parser, $from),
      context: $from
    });
    if (find && find[0].pos != null) {
      var anchor$1 = find[0].pos, head = find[1] && find[1].pos;
      if (head == null) { head = anchor$1; }
      sel = {anchor: anchor$1 + from, head: head + from};
    }
    return {doc: doc, sel: sel, from: from, to: to}
  }

  function ruleFromNode(parser, context) {
    return function (dom) {
      var desc = dom.pmViewDesc;
      if (desc) {
        return desc.parseRule()
      } else if (dom.nodeName == "BR" && dom.parentNode) {
        // Safari replaces the list item or table cell with a BR
        // directly in the list node (?!) if you delete the last
        // character in a list item or table cell (#708, #862)
        if (result.safari && /^(ul|ol)$/i.test(dom.parentNode.nodeName))
          { return parser.matchTag(document.createElement("li"), context) }
        else if (dom.parentNode.lastChild == dom || result.safari && /^(tr|table)$/i.test(dom.parentNode.nodeName))
          { return {ignore: true} }
      } else if (dom.nodeName == "IMG" && dom.getAttribute("mark-placeholder")) {
        return {ignore: true}
      }
    }
  }

  function readDOMChange(view, from, to, typeOver) {
    if (from < 0) {
      var origin = view.lastSelectionTime > Date.now() - 50 ? view.lastSelectionOrigin : null;
      var newSel = selectionFromDOM(view, origin);
      if (!view.state.selection.eq(newSel)) {
        var tr$1 = view.state.tr.setSelection(newSel);
        if (origin == "pointer") { tr$1.setMeta("pointer", true); }
        else if (origin == "key") { tr$1.scrollIntoView(); }
        view.dispatch(tr$1);
      }
      return
    }

    var $before = view.state.doc.resolve(from);
    var shared = $before.sharedDepth(to);
    from = $before.before(shared + 1);
    to = view.state.doc.resolve(to).after(shared + 1);

    var sel = view.state.selection;
    var parse = parseBetween(view, from, to);

    var doc = view.state.doc, compare = doc.slice(parse.from, parse.to);
    var preferredPos, preferredSide;
    // Prefer anchoring to end when Backspace is pressed
    if (view.lastKeyCode === 8 && Date.now() - 100 < view.lastKeyCodeTime) {
      preferredPos = view.state.selection.to;
      preferredSide = "end";
    } else {
      preferredPos = view.state.selection.from;
      preferredSide = "start";
    }
    view.lastKeyCode = null;

    var change = findDiff(compare.content, parse.doc.content, parse.from, preferredPos, preferredSide);
    if (!change) {
      if (typeOver && sel instanceof TextSelection && !sel.empty && sel.$head.sameParent(sel.$anchor) &&
          !view.composing && !(parse.sel && parse.sel.anchor != parse.sel.head)) {
        change = {start: sel.from, endA: sel.to, endB: sel.to};
      } else {
        if (parse.sel) {
          var sel$1 = resolveSelection(view, view.state.doc, parse.sel);
          if (sel$1 && !sel$1.eq(view.state.selection)) { view.dispatch(view.state.tr.setSelection(sel$1)); }
        }
        return
      }
    }
    view.domChangeCount++;
    // Handle the case where overwriting a selection by typing matches
    // the start or end of the selected content, creating a change
    // that's smaller than what was actually overwritten.
    if (view.state.selection.from < view.state.selection.to &&
        change.start == change.endB &&
        view.state.selection instanceof TextSelection) {
      if (change.start > view.state.selection.from && change.start <= view.state.selection.from + 2) {
        change.start = view.state.selection.from;
      } else if (change.endA < view.state.selection.to && change.endA >= view.state.selection.to - 2) {
        change.endB += (view.state.selection.to - change.endA);
        change.endA = view.state.selection.to;
      }
    }

    // IE11 will insert a non-breaking space _ahead_ of the space after
    // the cursor space when adding a space before another space. When
    // that happened, adjust the change to cover the space instead.
    if (result.ie && result.ie_version <= 11 && change.endB == change.start + 1 &&
        change.endA == change.start && change.start > parse.from &&
        parse.doc.textBetween(change.start - parse.from - 1, change.start - parse.from + 1) == " \u00a0") {
      change.start--;
      change.endA--;
      change.endB--;
    }

    var $from = parse.doc.resolveNoCache(change.start - parse.from);
    var $to = parse.doc.resolveNoCache(change.endB - parse.from);
    var nextSel;
    // If this looks like the effect of pressing Enter, just dispatch an
    // Enter key instead.
    if (!$from.sameParent($to) && $from.pos < parse.doc.content.size &&
        (nextSel = Selection.findFrom(parse.doc.resolve($from.pos + 1), 1, true)) &&
        nextSel.head == $to.pos &&
        view.someProp("handleKeyDown", function (f) { return f(view, keyEvent(13, "Enter")); }))
      { return }
    // Same for backspace
    if (view.state.selection.anchor > change.start &&
        looksLikeJoin(doc, change.start, change.endA, $from, $to) &&
        view.someProp("handleKeyDown", function (f) { return f(view, keyEvent(8, "Backspace")); })) {
      if (result.android && result.chrome) { view.domObserver.suppressSelectionUpdates(); } // #820
      return
    }

    var chFrom = change.start, chTo = change.endA;

    var tr, storedMarks, markChange, $from1;
    if ($from.sameParent($to) && $from.parent.inlineContent) {
      if ($from.pos == $to.pos) { // Deletion
        // IE11 sometimes weirdly moves the DOM selection around after
        // backspacing out the first element in a textblock
        if (result.ie && result.ie_version <= 11 && $from.parentOffset == 0) {
          view.domObserver.suppressSelectionUpdates();
          setTimeout(function () { return selectionToDOM(view); }, 20);
        }
        tr = view.state.tr.delete(chFrom, chTo);
        storedMarks = doc.resolve(change.start).marksAcross(doc.resolve(change.endA));
      } else if ( // Adding or removing a mark
        change.endA == change.endB && ($from1 = doc.resolve(change.start)) &&
        (markChange = isMarkChange($from.parent.content.cut($from.parentOffset, $to.parentOffset),
                                   $from1.parent.content.cut($from1.parentOffset, change.endA - $from1.start())))
      ) {
        tr = view.state.tr;
        if (markChange.type == "add") { tr.addMark(chFrom, chTo, markChange.mark); }
        else { tr.removeMark(chFrom, chTo, markChange.mark); }
      } else if ($from.parent.child($from.index()).isText && $from.index() == $to.index() - ($to.textOffset ? 0 : 1)) {
        // Both positions in the same text node -- simply insert text
        var text = $from.parent.textBetween($from.parentOffset, $to.parentOffset);
        if (view.someProp("handleTextInput", function (f) { return f(view, chFrom, chTo, text); })) { return }
        tr = view.state.tr.insertText(text, chFrom, chTo);
      }
    }

    if (!tr)
      { tr = view.state.tr.replace(chFrom, chTo, parse.doc.slice(change.start - parse.from, change.endB - parse.from)); }
    if (parse.sel) {
      var sel$2 = resolveSelection(view, tr.doc, parse.sel);
      // Chrome Android will sometimes, during composition, report the
      // selection in the wrong place. If it looks like that is
      // happening, don't update the selection.
      // Edge just doesn't move the cursor forward when you start typing
      // in an empty block or between br nodes.
      if (sel$2 && !(result.chrome && result.android && view.composing && sel$2.empty && sel$2.head == chFrom ||
                   result.ie && sel$2.empty && sel$2.head == chFrom))
        { tr.setSelection(sel$2); }
    }
    if (storedMarks) { tr.ensureMarks(storedMarks); }
    view.dispatch(tr.scrollIntoView());
  }

  function resolveSelection(view, doc, parsedSel) {
    if (Math.max(parsedSel.anchor, parsedSel.head) > doc.content.size) { return null }
    return selectionBetween(view, doc.resolve(parsedSel.anchor), doc.resolve(parsedSel.head))
  }

  // : (Fragment, Fragment) → ?{mark: Mark, type: string}
  // Given two same-length, non-empty fragments of inline content,
  // determine whether the first could be created from the second by
  // removing or adding a single mark type.
  function isMarkChange(cur, prev) {
    var curMarks = cur.firstChild.marks, prevMarks = prev.firstChild.marks;
    var added = curMarks, removed = prevMarks, type, mark, update;
    for (var i = 0; i < prevMarks.length; i++) { added = prevMarks[i].removeFromSet(added); }
    for (var i$1 = 0; i$1 < curMarks.length; i$1++) { removed = curMarks[i$1].removeFromSet(removed); }
    if (added.length == 1 && removed.length == 0) {
      mark = added[0];
      type = "add";
      update = function (node) { return node.mark(mark.addToSet(node.marks)); };
    } else if (added.length == 0 && removed.length == 1) {
      mark = removed[0];
      type = "remove";
      update = function (node) { return node.mark(mark.removeFromSet(node.marks)); };
    } else {
      return null
    }
    var updated = [];
    for (var i$2 = 0; i$2 < prev.childCount; i$2++) { updated.push(update(prev.child(i$2))); }
    if (Fragment.from(updated).eq(cur)) { return {mark: mark, type: type} }
  }

  function looksLikeJoin(old, start, end, $newStart, $newEnd) {
    if (!$newStart.parent.isTextblock ||
        // The content must have shrunk
        end - start <= $newEnd.pos - $newStart.pos ||
        // newEnd must point directly at or after the end of the block that newStart points into
        skipClosingAndOpening($newStart, true, false) < $newEnd.pos)
      { return false }

    var $start = old.resolve(start);
    // Start must be at the end of a block
    if ($start.parentOffset < $start.parent.content.size || !$start.parent.isTextblock)
      { return false }
    var $next = old.resolve(skipClosingAndOpening($start, true, true));
    // The next textblock must start before end and end near it
    if (!$next.parent.isTextblock || $next.pos > end ||
        skipClosingAndOpening($next, true, false) < end)
      { return false }

    // The fragments after the join point must match
    return $newStart.parent.content.cut($newStart.parentOffset).eq($next.parent.content)
  }

  function skipClosingAndOpening($pos, fromEnd, mayOpen) {
    var depth = $pos.depth, end = fromEnd ? $pos.end() : $pos.pos;
    while (depth > 0 && (fromEnd || $pos.indexAfter(depth) == $pos.node(depth).childCount)) {
      depth--;
      end++;
      fromEnd = false;
    }
    if (mayOpen) {
      var next = $pos.node(depth).maybeChild($pos.indexAfter(depth));
      while (next && !next.isLeaf) {
        next = next.firstChild;
        end++;
      }
    }
    return end
  }

  function findDiff(a, b, pos, preferredPos, preferredSide) {
    var start = a.findDiffStart(b, pos);
    if (start == null) { return null }
    var ref = a.findDiffEnd(b, pos + a.size, pos + b.size);
    var endA = ref.a;
    var endB = ref.b;
    if (preferredSide == "end") {
      var adjust = Math.max(0, start - Math.min(endA, endB));
      preferredPos -= endA + adjust - start;
    }
    if (endA < start && a.size < b.size) {
      var move = preferredPos <= start && preferredPos >= endA ? start - preferredPos : 0;
      start -= move;
      endB = start + (endB - endA);
      endA = start;
    } else if (endB < start) {
      var move$1 = preferredPos <= start && preferredPos >= endB ? start - preferredPos : 0;
      start -= move$1;
      endA = start + (endA - endB);
      endB = start;
    }
    return {start: start, endA: endA, endB: endB}
  }

  function serializeForClipboard(view, slice) {
    var context = [];
    var content = slice.content;
    var openStart = slice.openStart;
    var openEnd = slice.openEnd;
    while (openStart > 1 && openEnd > 1 && content.childCount == 1 && content.firstChild.childCount == 1) {
      openStart--;
      openEnd--;
      var node = content.firstChild;
      context.push(node.type.name, node.type.hasRequiredAttrs() ? node.attrs : null);
      content = node.content;
    }

    var serializer = view.someProp("clipboardSerializer") || DOMSerializer.fromSchema(view.state.schema);
    var doc = detachedDoc(), wrap = doc.createElement("div");
    wrap.appendChild(serializer.serializeFragment(content, {document: doc}));

    var firstChild = wrap.firstChild, needsWrap;
    while (firstChild && firstChild.nodeType == 1 && (needsWrap = wrapMap[firstChild.nodeName.toLowerCase()])) {
      for (var i = needsWrap.length - 1; i >= 0; i--) {
        var wrapper = doc.createElement(needsWrap[i]);
        while (wrap.firstChild) { wrapper.appendChild(wrap.firstChild); }
        wrap.appendChild(wrapper);
      }
      firstChild = wrap.firstChild;
    }

    if (firstChild && firstChild.nodeType == 1)
      { firstChild.setAttribute("data-pm-slice", (openStart + " " + openEnd + " " + (JSON.stringify(context)))); }

    var text = view.someProp("clipboardTextSerializer", function (f) { return f(slice); }) ||
        slice.content.textBetween(0, slice.content.size, "\n\n");

    return {dom: wrap, text: text}
  }

  // : (EditorView, string, string, ?bool, ResolvedPos) → ?Slice
  // Read a slice of content from the clipboard (or drop data).
  function parseFromClipboard(view, text, html, plainText, $context) {
    var dom, inCode = $context.parent.type.spec.code, slice;
    if (!html && !text) { return null }
    var asText = text && (plainText || inCode || !html);
    if (asText) {
      view.someProp("transformPastedText", function (f) { text = f(text); });
      if (inCode) { return new Slice(Fragment.from(view.state.schema.text(text)), 0, 0) }
      var parsed = view.someProp("clipboardTextParser", function (f) { return f(text, $context); });
      if (parsed) {
        slice = parsed;
      } else {
        dom = document.createElement("div");
        text.trim().split(/(?:\r\n?|\n)+/).forEach(function (block) {
          dom.appendChild(document.createElement("p")).textContent = block;
        });
      }
    } else {
      view.someProp("transformPastedHTML", function (f) { html = f(html); });
      dom = readHTML(html);
    }

    var contextNode = dom && dom.querySelector("[data-pm-slice]");
    var sliceData = contextNode && /^(\d+) (\d+) (.*)/.exec(contextNode.getAttribute("data-pm-slice"));
    if (!slice) {
      var parser = view.someProp("clipboardParser") || view.someProp("domParser") || DOMParser.fromSchema(view.state.schema);
      slice = parser.parseSlice(dom, {preserveWhitespace: !!(asText || sliceData), context: $context});
    }
    if (sliceData)
      { slice = addContext(closeSlice(slice, +sliceData[1], +sliceData[2]), sliceData[3]); }
    else // HTML wasn't created by ProseMirror. Make sure top-level siblings are coherent
      { slice = Slice.maxOpen(normalizeSiblings(slice.content, $context), false); }

    view.someProp("transformPasted", function (f) { slice = f(slice); });
    return slice
  }

  // Takes a slice parsed with parseSlice, which means there hasn't been
  // any content-expression checking done on the top nodes, tries to
  // find a parent node in the current context that might fit the nodes,
  // and if successful, rebuilds the slice so that it fits into that parent.
  //
  // This addresses the problem that Transform.replace expects a
  // coherent slice, and will fail to place a set of siblings that don't
  // fit anywhere in the schema.
  function normalizeSiblings(fragment, $context) {
    if (fragment.childCount < 2) { return fragment }
    var loop = function ( d ) {
      var parent = $context.node(d);
      var match = parent.contentMatchAt($context.index(d));
      var lastWrap = (void 0), result = [];
      fragment.forEach(function (node) {
        if (!result) { return }
        var wrap = match.findWrapping(node.type), inLast;
        if (!wrap) { return result = null }
        if (inLast = result.length && lastWrap.length && addToSibling(wrap, lastWrap, node, result[result.length - 1], 0)) {
          result[result.length - 1] = inLast;
        } else {
          if (result.length) { result[result.length - 1] = closeRight(result[result.length - 1], lastWrap.length); }
          var wrapped = withWrappers(node, wrap);
          result.push(wrapped);
          match = match.matchType(wrapped.type, wrapped.attrs);
          lastWrap = wrap;
        }
      });
      if (result) { return { v: Fragment.from(result) } }
    };

    for (var d = $context.depth; d >= 0; d--) {
      var returned = loop( d );

      if ( returned ) return returned.v;
    }
    return fragment
  }

  function withWrappers(node, wrap, from) {
    if ( from === void 0 ) from = 0;

    for (var i = wrap.length - 1; i >= from; i--)
      { node = wrap[i].create(null, Fragment.from(node)); }
    return node
  }

  // Used to group adjacent nodes wrapped in similar parents by
  // normalizeSiblings into the same parent node
  function addToSibling(wrap, lastWrap, node, sibling, depth) {
    if (depth < wrap.length && depth < lastWrap.length && wrap[depth] == lastWrap[depth]) {
      var inner = addToSibling(wrap, lastWrap, node, sibling.lastChild, depth + 1);
      if (inner) { return sibling.copy(sibling.content.replaceChild(sibling.childCount - 1, inner)) }
      var match = sibling.contentMatchAt(sibling.childCount);
      if (match.matchType(depth == wrap.length - 1 ? node.type : wrap[depth + 1]))
        { return sibling.copy(sibling.content.append(Fragment.from(withWrappers(node, wrap, depth + 1)))) }
    }
  }

  function closeRight(node, depth) {
    if (depth == 0) { return node }
    var fragment = node.content.replaceChild(node.childCount - 1, closeRight(node.lastChild, depth - 1));
    var fill = node.contentMatchAt(node.childCount).fillBefore(Fragment.empty, true);
    return node.copy(fragment.append(fill))
  }

  function closeRange(fragment, side, from, to, depth, openEnd) {
    var node = side < 0 ? fragment.firstChild : fragment.lastChild, inner = node.content;
    if (depth < to - 1) { inner = closeRange(inner, side, from, to, depth + 1, openEnd); }
    if (depth >= from)
      { inner = side < 0 ? node.contentMatchAt(0).fillBefore(inner, fragment.childCount > 1 || openEnd <= depth).append(inner)
        : inner.append(node.contentMatchAt(node.childCount).fillBefore(Fragment.empty, true)); }
    return fragment.replaceChild(side < 0 ? 0 : fragment.childCount - 1, node.copy(inner))
  }

  function closeSlice(slice, openStart, openEnd) {
    if (openStart < slice.openStart)
      { slice = new Slice(closeRange(slice.content, -1, openStart, slice.openStart, 0, slice.openEnd), openStart, slice.openEnd); }
    if (openEnd < slice.openEnd)
      { slice = new Slice(closeRange(slice.content, 1, openEnd, slice.openEnd, 0, 0), slice.openStart, openEnd); }
    return slice
  }

  // Trick from jQuery -- some elements must be wrapped in other
  // elements for innerHTML to work. I.e. if you do `div.innerHTML =
  // "<td>..</td>"` the table cells are ignored.
  var wrapMap = {thead: ["table"], colgroup: ["table"], col: ["table", "colgroup"],
                   tr: ["table", "tbody"], td: ["table", "tbody", "tr"], th: ["table", "tbody", "tr"]};

  var _detachedDoc = null;
  function detachedDoc() {
    return _detachedDoc || (_detachedDoc = document.implementation.createHTMLDocument("title"))
  }

  function readHTML(html) {
    var metas = /(\s*<meta [^>]*>)*/.exec(html);
    if (metas) { html = html.slice(metas[0].length); }
    var elt = detachedDoc().createElement("div");
    var firstTag = /(?:<meta [^>]*>)*<([a-z][^>\s]+)/i.exec(html), wrap, depth = 0;
    if (wrap = firstTag && wrapMap[firstTag[1].toLowerCase()]) {
      html = wrap.map(function (n) { return "<" + n + ">"; }).join("") + html + wrap.map(function (n) { return "</" + n + ">"; }).reverse().join("");
      depth = wrap.length;
    }
    elt.innerHTML = html;
    for (var i = 0; i < depth; i++) { elt = elt.firstChild; }
    return elt
  }

  function addContext(slice, context) {
    if (!slice.size) { return slice }
    var schema = slice.content.firstChild.type.schema, array;
    try { array = JSON.parse(context); }
    catch(e) { return slice }
    var content = slice.content;
    var openStart = slice.openStart;
    var openEnd = slice.openEnd;
    for (var i = array.length - 2; i >= 0; i -= 2) {
      var type = schema.nodes[array[i]];
      if (!type || type.hasRequiredAttrs()) { break }
      content = Fragment.from(type.create(array[i + 1], content));
      openStart++; openEnd++;
    }
    return new Slice(content, openStart, openEnd)
  }

  var observeOptions = {
    childList: true,
    characterData: true,
    characterDataOldValue: true,
    attributes: true,
    attributeOldValue: true,
    subtree: true
  };
  // IE11 has very broken mutation observers, so we also listen to DOMCharacterDataModified
  var useCharData = result.ie && result.ie_version <= 11;

  var SelectionState = function SelectionState() {
    this.anchorNode = this.anchorOffset = this.focusNode = this.focusOffset = null;
  };

  SelectionState.prototype.set = function set (sel) {
    this.anchorNode = sel.anchorNode; this.anchorOffset = sel.anchorOffset;
    this.focusNode = sel.focusNode; this.focusOffset = sel.focusOffset;
  };

  SelectionState.prototype.eq = function eq (sel) {
    return sel.anchorNode == this.anchorNode && sel.anchorOffset == this.anchorOffset &&
      sel.focusNode == this.focusNode && sel.focusOffset == this.focusOffset
  };

  var DOMObserver = function DOMObserver(view, handleDOMChange) {
    var this$1 = this;

    this.view = view;
    this.handleDOMChange = handleDOMChange;
    this.queue = [];
    this.flushingSoon = false;
    this.observer = window.MutationObserver &&
      new window.MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) { this$1.queue.push(mutations[i]); }
        // IE11 will sometimes (on backspacing out a single character
        // text node after a BR node) call the observer callback
        // before actually updating the DOM, which will cause
        // ProseMirror to miss the change (see #930)
        if (result.ie && result.ie_version <= 11 && mutations.some(
          function (m) { return m.type == "childList" && m.removedNodes.length ||
               m.type == "characterData" && m.oldValue.length > m.target.nodeValue.length; }))
          { this$1.flushSoon(); }
        else
          { this$1.flush(); }
      });
    this.currentSelection = new SelectionState;
    if (useCharData) {
      this.onCharData = function (e) {
        this$1.queue.push({target: e.target, type: "characterData", oldValue: e.prevValue});
        this$1.flushSoon();
      };
    }
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.suppressingSelectionUpdates = false;
  };

  DOMObserver.prototype.flushSoon = function flushSoon () {
      var this$1 = this;

    if (!this.flushingSoon) {
      this.flushingSoon = true;
      window.setTimeout(function () { this$1.flushingSoon = false; this$1.flush(); }, 20);
    }
  };

  DOMObserver.prototype.start = function start () {
    if (this.observer)
      { this.observer.observe(this.view.dom, observeOptions); }
    if (useCharData)
      { this.view.dom.addEventListener("DOMCharacterDataModified", this.onCharData); }
    this.connectSelection();
  };

  DOMObserver.prototype.stop = function stop () {
      var this$1 = this;

    if (this.observer) {
      var take = this.observer.takeRecords();
      if (take.length) {
        for (var i = 0; i < take.length; i++) { this.queue.push(take[i]); }
        window.setTimeout(function () { return this$1.flush(); }, 20);
      }
      this.observer.disconnect();
    }
    if (useCharData) { this.view.dom.removeEventListener("DOMCharacterDataModified", this.onCharData); }
    this.disconnectSelection();
  };

  DOMObserver.prototype.connectSelection = function connectSelection () {
    this.view.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange);
  };

  DOMObserver.prototype.disconnectSelection = function disconnectSelection () {
    this.view.dom.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange);
  };

  DOMObserver.prototype.suppressSelectionUpdates = function suppressSelectionUpdates () {
      var this$1 = this;

    this.suppressingSelectionUpdates = true;
    setTimeout(function () { return this$1.suppressingSelectionUpdates = false; }, 50);
  };

  DOMObserver.prototype.onSelectionChange = function onSelectionChange () {
    if (!hasFocusAndSelection(this.view)) { return }
    if (this.suppressingSelectionUpdates) { return selectionToDOM(this.view) }
    // Deletions on IE11 fire their events in the wrong order, giving
    // us a selection change event before the DOM changes are
    // reported.
    if (result.ie && result.ie_version <= 11 && !this.view.state.selection.empty) {
      var sel = this.view.root.getSelection();
      // Selection.isCollapsed isn't reliable on IE
      if (sel.focusNode && isEquivalentPosition(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset))
        { return this.flushSoon() }
    }
    this.flush();
  };

  DOMObserver.prototype.setCurSelection = function setCurSelection () {
    this.currentSelection.set(this.view.root.getSelection());
  };

  DOMObserver.prototype.ignoreSelectionChange = function ignoreSelectionChange (sel) {
    if (sel.rangeCount == 0) { return true }
    var container = sel.getRangeAt(0).commonAncestorContainer;
    var desc = this.view.docView.nearestDesc(container);
    return desc && desc.ignoreMutation({type: "selection", target: container.nodeType == 3 ? container.parentNode : container})
  };

  DOMObserver.prototype.flush = function flush () {
    if (!this.view.docView || this.flushingSoon) { return }
    var mutations = this.observer ? this.observer.takeRecords() : [];
    if (this.queue.length) {
      mutations = this.queue.concat(mutations);
      this.queue.length = 0;
    }

    var sel = this.view.root.getSelection();
    var newSel = !this.suppressingSelectionUpdates && !this.currentSelection.eq(sel) && hasSelection(this.view) && !this.ignoreSelectionChange(sel);

    var from = -1, to = -1, typeOver = false, added = [];
    if (this.view.editable) {
      for (var i = 0; i < mutations.length; i++) {
        var result = this.registerMutation(mutations[i], added);
        if (result) {
          from = from < 0 ? result.from : Math.min(result.from, from);
          to = to < 0 ? result.to : Math.max(result.to, to);
          if (result.typeOver && !this.view.composing) { typeOver = true; }
        }
      }
    }

    if (from > -1 || newSel) {
      if (from > -1) {
        this.view.docView.markDirty(from, to);
        checkCSS(this.view);
      }
      this.handleDOMChange(from, to, typeOver);
      if (this.view.docView.dirty) { this.view.updateState(this.view.state); }
      else if (!this.currentSelection.eq(sel)) { selectionToDOM(this.view); }
    }
  };

  DOMObserver.prototype.registerMutation = function registerMutation (mut, added) {
    // Ignore mutations inside nodes that were already noted as inserted
    if (added.indexOf(mut.target) > -1) { return null }
    var desc = this.view.docView.nearestDesc(mut.target);
    if (mut.type == "attributes" &&
        (desc == this.view.docView || mut.attributeName == "contenteditable" ||
         // Firefox sometimes fires spurious events for null/empty styles
         (mut.attributeName == "style" && !mut.oldValue && !mut.target.getAttribute("style"))))
      { return null }
    if (!desc || desc.ignoreMutation(mut)) { return null }

    if (mut.type == "childList") {
      var prev = mut.previousSibling, next = mut.nextSibling;
      if (result.ie && result.ie_version <= 11 && mut.addedNodes.length) {
        // IE11 gives us incorrect next/prev siblings for some
        // insertions, so if there are added nodes, recompute those
        for (var i = 0; i < mut.addedNodes.length; i++) {
          var ref = mut.addedNodes[i];
            var previousSibling = ref.previousSibling;
            var nextSibling = ref.nextSibling;
          if (!previousSibling || Array.prototype.indexOf.call(mut.addedNodes, previousSibling) < 0) { prev = previousSibling; }
          if (!nextSibling || Array.prototype.indexOf.call(mut.addedNodes, nextSibling) < 0) { next = nextSibling; }
        }
      }
      var fromOffset = prev && prev.parentNode == mut.target
          ? domIndex(prev) + 1 : 0;
      var from = desc.localPosFromDOM(mut.target, fromOffset, -1);
      var toOffset = next && next.parentNode == mut.target
          ? domIndex(next) : mut.target.childNodes.length;
      for (var i$1 = 0; i$1 < mut.addedNodes.length; i$1++) { added.push(mut.addedNodes[i$1]); }
      var to = desc.localPosFromDOM(mut.target, toOffset, 1);
      return {from: from, to: to}
    } else if (mut.type == "attributes") {
      return {from: desc.posAtStart - desc.border, to: desc.posAtEnd + desc.border}
    } else { // "characterData"
      return {
        from: desc.posAtStart,
        to: desc.posAtEnd,
        // An event was generated for a text change that didn't change
        // any text. Mark the dom change to fall back to assuming the
        // selection was typed over with an identical value if it can't
        // find another change.
        typeOver: mut.target.nodeValue == mut.oldValue
      }
    }
  };

  var cssChecked = false;

  function checkCSS(view) {
    if (cssChecked) { return }
    cssChecked = true;
    if (getComputedStyle(view.dom).whiteSpace == "normal")
      { console["warn"]("ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package."); }
  }

  // A collection of DOM events that occur within the editor, and callback functions
  // to invoke when the event fires.
  var handlers = {}, editHandlers = {};

  function initInput(view) {
    view.shiftKey = false;
    view.mouseDown = null;
    view.lastKeyCode = null;
    view.lastKeyCodeTime = 0;
    view.lastClick = {time: 0, x: 0, y: 0, type: ""};
    view.lastSelectionOrigin = null;
    view.lastSelectionTime = 0;

    view.composing = false;
    view.composingTimeout = null;
    view.compositionNodes = [];
    view.compositionEndedAt = -2e8;

    view.domObserver = new DOMObserver(view, function (from, to, typeOver) { return readDOMChange(view, from, to, typeOver); });
    view.domObserver.start();
    // Used by hacks like the beforeinput handler to check whether anything happened in the DOM
    view.domChangeCount = 0;

    view.eventHandlers = Object.create(null);
    var loop = function ( event ) {
      var handler = handlers[event];
      view.dom.addEventListener(event, view.eventHandlers[event] = function (event) {
        if (eventBelongsToView(view, event) && !runCustomHandler(view, event) &&
            (view.editable || !(event.type in editHandlers)))
          { handler(view, event); }
      });
    };

    for (var event in handlers) loop( event );
    // On Safari, for reasons beyond my understanding, adding an input
    // event handler makes an issue where the composition vanishes when
    // you press enter go away.
    if (result.safari) { view.dom.addEventListener("input", function () { return null; }); }

    ensureListeners(view);
  }

  function setSelectionOrigin(view, origin) {
    view.lastSelectionOrigin = origin;
    view.lastSelectionTime = Date.now();
  }

  function destroyInput(view) {
    view.domObserver.stop();
    for (var type in view.eventHandlers)
      { view.dom.removeEventListener(type, view.eventHandlers[type]); }
    clearTimeout(view.composingTimeout);
  }

  function ensureListeners(view) {
    view.someProp("handleDOMEvents", function (currentHandlers) {
      for (var type in currentHandlers) { if (!view.eventHandlers[type])
        { view.dom.addEventListener(type, view.eventHandlers[type] = function (event) { return runCustomHandler(view, event); }); } }
    });
  }

  function runCustomHandler(view, event) {
    return view.someProp("handleDOMEvents", function (handlers) {
      var handler = handlers[event.type];
      return handler ? handler(view, event) || event.defaultPrevented : false
    })
  }

  function eventBelongsToView(view, event) {
    if (!event.bubbles) { return true }
    if (event.defaultPrevented) { return false }
    for (var node = event.target; node != view.dom; node = node.parentNode)
      { if (!node || node.nodeType == 11 ||
          (node.pmViewDesc && node.pmViewDesc.stopEvent(event)))
        { return false } }
    return true
  }

  function dispatchEvent(view, event) {
    if (!runCustomHandler(view, event) && handlers[event.type] &&
        (view.editable || !(event.type in editHandlers)))
      { handlers[event.type](view, event); }
  }

  editHandlers.keydown = function (view, event) {
    view.shiftKey = event.keyCode == 16 || event.shiftKey;
    if (inOrNearComposition(view, event)) { return }
    view.lastKeyCode = event.keyCode;
    view.lastKeyCodeTime = Date.now();
    if (view.someProp("handleKeyDown", function (f) { return f(view, event); }) || captureKeyDown(view, event))
      { event.preventDefault(); }
    else
      { setSelectionOrigin(view, "key"); }
  };

  editHandlers.keyup = function (view, e) {
    if (e.keyCode == 16) { view.shiftKey = false; }
  };

  editHandlers.keypress = function (view, event) {
    if (inOrNearComposition(view, event) || !event.charCode ||
        event.ctrlKey && !event.altKey || result.mac && event.metaKey) { return }

    if (view.someProp("handleKeyPress", function (f) { return f(view, event); })) {
      event.preventDefault();
      return
    }

    var sel = view.state.selection;
    if (!(sel instanceof TextSelection) || !sel.$from.sameParent(sel.$to)) {
      var text = String.fromCharCode(event.charCode);
      if (!view.someProp("handleTextInput", function (f) { return f(view, sel.$from.pos, sel.$to.pos, text); }))
        { view.dispatch(view.state.tr.insertText(text).scrollIntoView()); }
      event.preventDefault();
    }
  };

  function eventCoords(event) { return {left: event.clientX, top: event.clientY} }

  function isNear(event, click) {
    var dx = click.x - event.clientX, dy = click.y - event.clientY;
    return dx * dx + dy * dy < 100
  }

  function runHandlerOnContext(view, propName, pos, inside, event) {
    if (inside == -1) { return false }
    var $pos = view.state.doc.resolve(inside);
    var loop = function ( i ) {
      if (view.someProp(propName, function (f) { return i > $pos.depth ? f(view, pos, $pos.nodeAfter, $pos.before(i), event, true)
                                                      : f(view, pos, $pos.node(i), $pos.before(i), event, false); }))
        { return { v: true } }
    };

    for (var i = $pos.depth + 1; i > 0; i--) {
      var returned = loop( i );

      if ( returned ) return returned.v;
    }
    return false
  }

  function updateSelection(view, selection, origin) {
    if (!view.focused) { view.focus(); }
    var tr = view.state.tr.setSelection(selection);
    if (origin == "pointer") { tr.setMeta("pointer", true); }
    view.dispatch(tr);
  }

  function selectClickedLeaf(view, inside) {
    if (inside == -1) { return false }
    var $pos = view.state.doc.resolve(inside), node = $pos.nodeAfter;
    if (node && node.isAtom && NodeSelection.isSelectable(node)) {
      updateSelection(view, new NodeSelection($pos), "pointer");
      return true
    }
    return false
  }

  function selectClickedNode(view, inside) {
    if (inside == -1) { return false }
    var sel = view.state.selection, selectedNode, selectAt;
    if (sel instanceof NodeSelection) { selectedNode = sel.node; }

    var $pos = view.state.doc.resolve(inside);
    for (var i = $pos.depth + 1; i > 0; i--) {
      var node = i > $pos.depth ? $pos.nodeAfter : $pos.node(i);
      if (NodeSelection.isSelectable(node)) {
        if (selectedNode && sel.$from.depth > 0 &&
            i >= sel.$from.depth && $pos.before(sel.$from.depth + 1) == sel.$from.pos)
          { selectAt = $pos.before(sel.$from.depth); }
        else
          { selectAt = $pos.before(i); }
        break
      }
    }

    if (selectAt != null) {
      updateSelection(view, NodeSelection.create(view.state.doc, selectAt), "pointer");
      return true
    } else {
      return false
    }
  }

  function handleSingleClick(view, pos, inside, event, selectNode) {
    return runHandlerOnContext(view, "handleClickOn", pos, inside, event) ||
      view.someProp("handleClick", function (f) { return f(view, pos, event); }) ||
      (selectNode ? selectClickedNode(view, inside) : selectClickedLeaf(view, inside))
  }

  function handleDoubleClick(view, pos, inside, event) {
    return runHandlerOnContext(view, "handleDoubleClickOn", pos, inside, event) ||
      view.someProp("handleDoubleClick", function (f) { return f(view, pos, event); })
  }

  function handleTripleClick(view, pos, inside, event) {
    return runHandlerOnContext(view, "handleTripleClickOn", pos, inside, event) ||
      view.someProp("handleTripleClick", function (f) { return f(view, pos, event); }) ||
      defaultTripleClick(view, inside)
  }

  function defaultTripleClick(view, inside) {
    var doc = view.state.doc;
    if (inside == -1) {
      if (doc.inlineContent) {
        updateSelection(view, TextSelection.create(doc, 0, doc.content.size), "pointer");
        return true
      }
      return false
    }

    var $pos = doc.resolve(inside);
    for (var i = $pos.depth + 1; i > 0; i--) {
      var node = i > $pos.depth ? $pos.nodeAfter : $pos.node(i);
      var nodePos = $pos.before(i);
      if (node.inlineContent)
        { updateSelection(view, TextSelection.create(doc, nodePos + 1, nodePos + 1 + node.content.size), "pointer"); }
      else if (NodeSelection.isSelectable(node))
        { updateSelection(view, NodeSelection.create(doc, nodePos), "pointer"); }
      else
        { continue }
      return true
    }
  }

  function forceDOMFlush(view) {
    return endComposition(view)
  }

  var selectNodeModifier = result.mac ? "metaKey" : "ctrlKey";

  handlers.mousedown = function (view, event) {
    view.shiftKey = event.shiftKey;
    var flushed = forceDOMFlush(view);
    var now = Date.now(), type = "singleClick";
    if (now - view.lastClick.time < 500 && isNear(event, view.lastClick) && !event[selectNodeModifier]) {
      if (view.lastClick.type == "singleClick") { type = "doubleClick"; }
      else if (view.lastClick.type == "doubleClick") { type = "tripleClick"; }
    }
    view.lastClick = {time: now, x: event.clientX, y: event.clientY, type: type};

    var pos = view.posAtCoords(eventCoords(event));
    if (!pos) { return }

    if (type == "singleClick")
      { view.mouseDown = new MouseDown(view, pos, event, flushed); }
    else if ((type == "doubleClick" ? handleDoubleClick : handleTripleClick)(view, pos.pos, pos.inside, event))
      { event.preventDefault(); }
    else
      { setSelectionOrigin(view, "pointer"); }
  };

  var MouseDown = function MouseDown(view, pos, event, flushed) {
    var this$1 = this;

    this.view = view;
    this.startDoc = view.state.doc;
    this.pos = pos;
    this.event = event;
    this.flushed = flushed;
    this.selectNode = event[selectNodeModifier];
    this.allowDefault = event.shiftKey;

    var targetNode, targetPos;
    if (pos.inside > -1) {
      targetNode = view.state.doc.nodeAt(pos.inside);
      targetPos = pos.inside;
    } else {
      var $pos = view.state.doc.resolve(pos.pos);
      targetNode = $pos.parent;
      targetPos = $pos.depth ? $pos.before() : 0;
    }

    this.mightDrag = null;

    var target = flushed ? null : event.target;
    var targetDesc = target ? view.docView.nearestDesc(target, true) : null;
    this.target = targetDesc ? targetDesc.dom : null;

    if (targetNode.type.spec.draggable && targetNode.type.spec.selectable !== false ||
        view.state.selection instanceof NodeSelection && targetPos == view.state.selection.from)
      { this.mightDrag = {node: targetNode,
                        pos: targetPos,
                        addAttr: this.target && !this.target.draggable,
                        setUneditable: this.target && result.gecko && !this.target.hasAttribute("contentEditable")}; }

    if (this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable)) {
      this.view.domObserver.stop();
      if (this.mightDrag.addAttr) { this.target.draggable = true; }
      if (this.mightDrag.setUneditable)
        { setTimeout(function () { return this$1.target.setAttribute("contentEditable", "false"); }, 20); }
      this.view.domObserver.start();
    }

    view.root.addEventListener("mouseup", this.up = this.up.bind(this));
    view.root.addEventListener("mousemove", this.move = this.move.bind(this));
    setSelectionOrigin(view, "pointer");
  };

  MouseDown.prototype.done = function done () {
    this.view.root.removeEventListener("mouseup", this.up);
    this.view.root.removeEventListener("mousemove", this.move);
    if (this.mightDrag && this.target) {
      this.view.domObserver.stop();
      if (this.mightDrag.addAttr) { this.target.draggable = false; }
      if (this.mightDrag.setUneditable) { this.target.removeAttribute("contentEditable"); }
      this.view.domObserver.start();
    }
    this.view.mouseDown = null;
  };

  MouseDown.prototype.up = function up (event) {
    this.done();

    if (!this.view.dom.contains(event.target.nodeType == 3 ? event.target.parentNode : event.target))
      { return }

    var pos = this.pos;
    if (this.view.state.doc != this.startDoc) { pos = this.view.posAtCoords(eventCoords(event)); }

    if (this.allowDefault || !pos) {
      setSelectionOrigin(this.view, "pointer");
    } else if (handleSingleClick(this.view, pos.pos, pos.inside, event, this.selectNode)) {
      event.preventDefault();
    } else if (this.flushed ||
               // Chrome will sometimes treat a node selection as a
               // cursor, but still report that the node is selected
               // when asked through getSelection. You'll then get a
               // situation where clicking at the point where that
               // (hidden) cursor is doesn't change the selection, and
               // thus doesn't get a reaction from ProseMirror. This
               // works around that.
               (result.chrome && !(this.view.state.selection instanceof TextSelection) &&
                (pos.pos == this.view.state.selection.from || pos.pos == this.view.state.selection.to))) {
      updateSelection(this.view, Selection.near(this.view.state.doc.resolve(pos.pos)), "pointer");
      event.preventDefault();
    } else {
      setSelectionOrigin(this.view, "pointer");
    }
  };

  MouseDown.prototype.move = function move (event) {
    if (!this.allowDefault && (Math.abs(this.event.x - event.clientX) > 4 ||
                               Math.abs(this.event.y - event.clientY) > 4))
      { this.allowDefault = true; }
    setSelectionOrigin(this.view, "pointer");
  };

  handlers.touchdown = function (view) {
    forceDOMFlush(view);
    setSelectionOrigin(view, "pointer");
  };

  handlers.contextmenu = function (view) { return forceDOMFlush(view); };

  function inOrNearComposition(view, event) {
    if (view.composing) { return true }
    // See https://www.stum.de/2016/06/24/handling-ime-events-in-javascript/.
    // On Japanese input method editors (IMEs), the Enter key is used to confirm character
    // selection. On Safari, when Enter is pressed, compositionend and keydown events are
    // emitted. The keydown event triggers newline insertion, which we don't want.
    // This method returns true if the keydown event should be ignored.
    // We only ignore it once, as pressing Enter a second time *should* insert a newline.
    // Furthermore, the keydown event timestamp must be close to the compositionEndedAt timestamp.
    // This guards against the case where compositionend is triggered without the keyboard
    // (e.g. character confirmation may be done with the mouse), and keydown is triggered
    // afterwards- we wouldn't want to ignore the keydown event in this case.
    if (result.safari && Math.abs(event.timeStamp - view.compositionEndedAt) < 500) {
      view.compositionEndedAt = -2e8;
      return true
    }
    return false
  }

  // Drop active composition after 5 seconds of inactivity on Android
  var timeoutComposition = result.android ? 5000 : -1;

  editHandlers.compositionstart = editHandlers.compositionupdate = function (view) {
    if (!view.composing) {
      view.domObserver.flush();
      var state = view.state;
      var $pos = state.selection.$from;
      if (state.selection.empty &&
          (state.storedMarks || (!$pos.textOffset && $pos.parentOffset && $pos.nodeBefore.marks.some(function (m) { return m.type.spec.inclusive === false; })))) {
        // Need to wrap the cursor in mark nodes different from the ones in the DOM context
        view.markCursor = view.state.storedMarks || $pos.marks();
        endComposition(view, true);
        view.markCursor = null;
      } else {
        endComposition(view);
        // In firefox, if the cursor is after but outside a marked node,
        // the inserted text won't inherit the marks. So this moves it
        // inside if necessary.
        if (result.gecko && state.selection.empty && $pos.parentOffset && !$pos.textOffset && $pos.nodeBefore.marks.length) {
          var sel = view.root.getSelection();
          for (var node = sel.focusNode, offset = sel.focusOffset; node && node.nodeType == 1 && offset != 0;) {
            var before = offset < 0 ? node.lastChild : node.childNodes[offset - 1];
            if (before.nodeType == 3) {
              sel.collapse(before, before.nodeValue.length);
              break
            } else {
              node = before;
              offset = -1;
            }
          }
        }
      }
      view.composing = true;
    }
    scheduleComposeEnd(view, timeoutComposition);
  };

  editHandlers.compositionend = function (view, event) {
    if (view.composing) {
      view.composing = false;
      view.compositionEndedAt = event.timeStamp;
      scheduleComposeEnd(view, 20);
    }
  };

  function scheduleComposeEnd(view, delay) {
    clearTimeout(view.composingTimeout);
    if (delay > -1) { view.composingTimeout = setTimeout(function () { return endComposition(view); }, delay); }
  }

  function endComposition(view, forceUpdate) {
    view.composing = false;
    while (view.compositionNodes.length > 0) { view.compositionNodes.pop().markParentsDirty(); }
    if (forceUpdate || view.docView.dirty) {
      view.updateState(view.state);
      return true
    }
    return false
  }

  function captureCopy(view, dom) {
    // The extra wrapper is somehow necessary on IE/Edge to prevent the
    // content from being mangled when it is put onto the clipboard
    var doc = view.dom.ownerDocument;
    var wrap = doc.body.appendChild(doc.createElement("div"));
    wrap.appendChild(dom);
    wrap.style.cssText = "position: fixed; left: -10000px; top: 10px";
    var sel = getSelection(), range = doc.createRange();
    range.selectNodeContents(dom);
    // Done because IE will fire a selectionchange moving the selection
    // to its start when removeAllRanges is called and the editor still
    // has focus (which will mess up the editor's selection state).
    view.dom.blur();
    sel.removeAllRanges();
    sel.addRange(range);
    setTimeout(function () {
      doc.body.removeChild(wrap);
      view.focus();
    }, 50);
  }

  // This is very crude, but unfortunately both these browsers _pretend_
  // that they have a clipboard API—all the objects and methods are
  // there, they just don't work, and they are hard to test.
  var brokenClipboardAPI = (result.ie && result.ie_version < 15) ||
        (result.ios && result.webkit_version < 604);

  handlers.copy = editHandlers.cut = function (view, e) {
    var sel = view.state.selection, cut = e.type == "cut";
    if (sel.empty) { return }

    // IE and Edge's clipboard interface is completely broken
    var data = brokenClipboardAPI ? null : e.clipboardData;
    var slice = sel.content();
    var ref = serializeForClipboard(view, slice);
    var dom = ref.dom;
    var text = ref.text;
    if (data) {
      e.preventDefault();
      data.clearData();
      data.setData("text/html", dom.innerHTML);
      data.setData("text/plain", text);
    } else {
      captureCopy(view, dom);
    }
    if (cut) { view.dispatch(view.state.tr.deleteSelection().scrollIntoView().setMeta("uiEvent", "cut")); }
  };

  function sliceSingleNode(slice) {
    return slice.openStart == 0 && slice.openEnd == 0 && slice.content.childCount == 1 ? slice.content.firstChild : null
  }

  function capturePaste(view, e) {
    var doc = view.dom.ownerDocument;
    var plainText = view.shiftKey || view.state.selection.$from.parent.type.spec.code;
    var target = doc.body.appendChild(doc.createElement(plainText ? "textarea" : "div"));
    if (!plainText) { target.contentEditable = "true"; }
    target.style.cssText = "position: fixed; left: -10000px; top: 10px";
    target.focus();
    setTimeout(function () {
      view.focus();
      doc.body.removeChild(target);
      if (plainText) { doPaste(view, target.value, null, e); }
      else { doPaste(view, target.textContent, target.innerHTML, e); }
    }, 50);
  }

  function doPaste(view, text, html, e) {
    var slice = parseFromClipboard(view, text, html, view.shiftKey, view.state.selection.$from);
    if (view.someProp("handlePaste", function (f) { return f(view, e, slice || Slice.empty); }) || !slice) { return }

    var singleNode = sliceSingleNode(slice);
    var tr = singleNode ? view.state.tr.replaceSelectionWith(singleNode, view.shiftKey) : view.state.tr.replaceSelection(slice);
    view.dispatch(tr.scrollIntoView().setMeta("paste", true).setMeta("uiEvent", "paste"));
  }

  editHandlers.paste = function (view, e) {
    var data = brokenClipboardAPI ? null : e.clipboardData;
    var html = data && data.getData("text/html"), text = data && data.getData("text/plain");
    if (data && (html || text || data.files.length)) {
      doPaste(view, text, html, e);
      e.preventDefault();
    } else {
      capturePaste(view, e);
    }
  };

  var Dragging = function Dragging(slice, move) {
    this.slice = slice;
    this.move = move;
  };

  var dragCopyModifier = result.mac ? "altKey" : "ctrlKey";

  handlers.dragstart = function (view, e) {
    var mouseDown = view.mouseDown;
    if (mouseDown) { mouseDown.done(); }
    if (!e.dataTransfer) { return }

    var sel = view.state.selection;
    var pos = sel.empty ? null : view.posAtCoords(eventCoords(e));
    if (pos && pos.pos >= sel.from && pos.pos <= (sel instanceof NodeSelection ? sel.to - 1: sel.to)) ; else if (mouseDown && mouseDown.mightDrag) {
      view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, mouseDown.mightDrag.pos)));
    } else if (e.target && e.target.nodeType == 1) {
      var desc = view.docView.nearestDesc(e.target, true);
      if (!desc || !desc.node.type.spec.draggable || desc == view.docView) { return }
      view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, desc.posBefore)));
    }
    var slice = view.state.selection.content();
    var ref = serializeForClipboard(view, slice);
    var dom = ref.dom;
    var text = ref.text;
    e.dataTransfer.clearData();
    e.dataTransfer.setData(brokenClipboardAPI ? "Text" : "text/html", dom.innerHTML);
    if (!brokenClipboardAPI) { e.dataTransfer.setData("text/plain", text); }
    view.dragging = new Dragging(slice, !e[dragCopyModifier]);
  };

  handlers.dragend = function (view) {
    window.setTimeout(function () { return view.dragging = null; }, 50);
  };

  editHandlers.dragover = editHandlers.dragenter = function (_, e) { return e.preventDefault(); };

  editHandlers.drop = function (view, e) {
    var dragging = view.dragging;
    view.dragging = null;

    if (!e.dataTransfer) { return }

    var eventPos = view.posAtCoords(eventCoords(e));
    if (!eventPos) { return }
    var $mouse = view.state.doc.resolve(eventPos.pos);
    if (!$mouse) { return }
    var slice = dragging && dragging.slice ||
        parseFromClipboard(view, e.dataTransfer.getData(brokenClipboardAPI ? "Text" : "text/plain"),
                           brokenClipboardAPI ? null : e.dataTransfer.getData("text/html"), false, $mouse);
    if (!slice) { return }

    e.preventDefault();
    if (view.someProp("handleDrop", function (f) { return f(view, e, slice, dragging && dragging.move); })) { return }
    var insertPos = slice ? dropPoint(view.state.doc, $mouse.pos, slice) : $mouse.pos;
    if (insertPos == null) { insertPos = $mouse.pos; }

    var tr = view.state.tr;
    if (dragging && dragging.move) { tr.deleteSelection(); }

    var pos = tr.mapping.map(insertPos);
    var isNode = slice.openStart == 0 && slice.openEnd == 0 && slice.content.childCount == 1;
    var beforeInsert = tr.doc;
    if (isNode)
      { tr.replaceRangeWith(pos, pos, slice.content.firstChild); }
    else
      { tr.replaceRange(pos, pos, slice); }
    if (tr.doc.eq(beforeInsert)) { return }

    var $pos = tr.doc.resolve(pos);
    if (isNode && NodeSelection.isSelectable(slice.content.firstChild) &&
        $pos.nodeAfter && $pos.nodeAfter.sameMarkup(slice.content.firstChild))
      { tr.setSelection(new NodeSelection($pos)); }
    else
      { tr.setSelection(selectionBetween(view, $pos, tr.doc.resolve(tr.mapping.map(insertPos)))); }
    view.focus();
    view.dispatch(tr.setMeta("uiEvent", "drop"));
  };

  handlers.focus = function (view) {
    if (!view.focused) {
      view.domObserver.stop();
      view.dom.classList.add("ProseMirror-focused");
      view.domObserver.start();
      view.focused = true;
    }
  };

  handlers.blur = function (view) {
    if (view.focused) {
      view.domObserver.stop();
      view.dom.classList.remove("ProseMirror-focused");
      view.domObserver.start();
      view.domObserver.currentSelection.set({});
      view.focused = false;
    }
  };

  handlers.beforeinput = function (view, event) {
    // We should probably do more with beforeinput events, but support
    // is so spotty that I'm still waiting to see where they are going.

    // Very specific hack to deal with backspace sometimes failing on
    // Chrome Android when after an uneditable node.
    if (result.chrome && result.android && event.inputType == "deleteContentBackward") {
      var domChangeCount = view.domChangeCount;
      setTimeout(function () {
        if (view.domChangeCount != domChangeCount) { return } // Event already had some effect
        // This bug tends to close the virtual keyboard, so we refocus
        view.dom.blur();
        view.focus();
        if (view.someProp("handleKeyDown", function (f) { return f(view, keyEvent(8, "Backspace")); })) { return }
        var ref = view.state.selection;
        var $cursor = ref.$cursor;
        // Crude approximation of backspace behavior when no command handled it
        if ($cursor && $cursor.pos > 0) { view.dispatch(view.state.tr.delete($cursor.pos - 1, $cursor.pos).scrollIntoView()); }
      }, 50);
    }
  };

  // Make sure all handlers get registered
  for (var prop in editHandlers) { handlers[prop] = editHandlers[prop]; }

  function compareObjs(a, b) {
    if (a == b) { return true }
    for (var p in a) { if (a[p] !== b[p]) { return false } }
    for (var p$1 in b) { if (!(p$1 in a)) { return false } }
    return true
  }

  var WidgetType = function WidgetType(toDOM, spec) {
    this.spec = spec || noSpec;
    this.side = this.spec.side || 0;
    this.toDOM = toDOM;
  };

  WidgetType.prototype.map = function map (mapping, span, offset, oldOffset) {
    var ref = mapping.mapResult(span.from + oldOffset, this.side < 0 ? -1 : 1);
      var pos = ref.pos;
      var deleted = ref.deleted;
    return deleted ? null : new Decoration(pos - offset, pos - offset, this)
  };

  WidgetType.prototype.valid = function valid () { return true };

  WidgetType.prototype.eq = function eq (other) {
    return this == other ||
      (other instanceof WidgetType &&
       (this.spec.key && this.spec.key == other.spec.key ||
        this.toDOM == other.toDOM && compareObjs(this.spec, other.spec)))
  };

  var InlineType = function InlineType(attrs, spec) {
    this.spec = spec || noSpec;
    this.attrs = attrs;
  };

  InlineType.prototype.map = function map (mapping, span, offset, oldOffset) {
    var from = mapping.map(span.from + oldOffset, this.spec.inclusiveStart ? -1 : 1) - offset;
    var to = mapping.map(span.to + oldOffset, this.spec.inclusiveEnd ? 1 : -1) - offset;
    return from >= to ? null : new Decoration(from, to, this)
  };

  InlineType.prototype.valid = function valid (_, span) { return span.from < span.to };

  InlineType.prototype.eq = function eq (other) {
    return this == other ||
      (other instanceof InlineType && compareObjs(this.attrs, other.attrs) &&
       compareObjs(this.spec, other.spec))
  };

  InlineType.is = function is (span) { return span.type instanceof InlineType };

  var NodeType$1 = function NodeType(attrs, spec) {
    this.spec = spec || noSpec;
    this.attrs = attrs;
  };

  NodeType$1.prototype.map = function map (mapping, span, offset, oldOffset) {
    var from = mapping.mapResult(span.from + oldOffset, 1);
    if (from.deleted) { return null }
    var to = mapping.mapResult(span.to + oldOffset, -1);
    if (to.deleted || to.pos <= from.pos) { return null }
    return new Decoration(from.pos - offset, to.pos - offset, this)
  };

  NodeType$1.prototype.valid = function valid (node, span) {
    var ref = node.content.findIndex(span.from);
      var index = ref.index;
      var offset = ref.offset;
    return offset == span.from && offset + node.child(index).nodeSize == span.to
  };

  NodeType$1.prototype.eq = function eq (other) {
    return this == other ||
      (other instanceof NodeType$1 && compareObjs(this.attrs, other.attrs) &&
       compareObjs(this.spec, other.spec))
  };

  // ::- Decoration objects can be provided to the view through the
  // [`decorations` prop](#view.EditorProps.decorations). They come in
  // several variants—see the static members of this class for details.
  var Decoration = function Decoration(from, to, type) {
    // :: number
    // The start position of the decoration.
    this.from = from;
    // :: number
    // The end position. Will be the same as `from` for [widget
    // decorations](#view.Decoration^widget).
    this.to = to;
    this.type = type;
  };

  var prototypeAccessors$1$5 = { spec: { configurable: true } };

  Decoration.prototype.copy = function copy (from, to) {
    return new Decoration(from, to, this.type)
  };

  Decoration.prototype.eq = function eq (other) {
    return this.type.eq(other.type) && this.from == other.from && this.to == other.to
  };

  Decoration.prototype.map = function map (mapping, offset, oldOffset) {
    return this.type.map(mapping, this, offset, oldOffset)
  };

  // :: (number, union<(view: EditorView, getPos: () → number) → dom.Node, dom.Node>, ?Object) → Decoration
  // Creates a widget decoration, which is a DOM node that's shown in
  // the document at the given position. It is recommended that you
  // delay rendering the widget by passing a function that will be
  // called when the widget is actually drawn in a view, but you can
  // also directly pass a DOM node. `getPos` can be used to find the
  // widget's current document position.
  //
  // spec::- These options are supported:
  //
  //   side:: ?number
  //   Controls which side of the document position this widget is
  //   associated with. When negative, it is drawn before a cursor
  //   at its position, and content inserted at that position ends
  //   up after the widget. When zero (the default) or positive, the
  //   widget is drawn after the cursor and content inserted there
  //   ends up before the widget.
  //
  //   When there are multiple widgets at a given position, their
  //   `side` values determine the order in which they appear. Those
  //   with lower values appear first. The ordering of widgets with
  //   the same `side` value is unspecified.
  //
  //   When `marks` is null, `side` also determines the marks that
  //   the widget is wrapped in—those of the node before when
  //   negative, those of the node after when positive.
  //
  //   marks:: ?[Mark]
  //   The precise set of marks to draw around the widget.
  //
  //   stopEvent:: ?(event: dom.Event) → bool
  //   Can be used to control which DOM events, when they bubble out
  //   of this widget, the editor view should ignore.
  //
  //   key:: ?string
  //   When comparing decorations of this type (in order to decide
  //   whether it needs to be redrawn), ProseMirror will by default
  //   compare the widget DOM node by identity. If you pass a key,
  //   that key will be compared instead, which can be useful when
  //   you generate decorations on the fly and don't want to store
  //   and reuse DOM nodes. Make sure that any widgets with the same
  //   key are interchangeable—if widgets differ in, for example,
  //   the behavior of some event handler, they should get
  //   different keys.
  Decoration.widget = function widget (pos, toDOM, spec) {
    return new Decoration(pos, pos, new WidgetType(toDOM, spec))
  };

  // :: (number, number, DecorationAttrs, ?Object) → Decoration
  // Creates an inline decoration, which adds the given attributes to
  // each inline node between `from` and `to`.
  //
  // spec::- These options are recognized:
  //
  //   inclusiveStart:: ?bool
  //   Determines how the left side of the decoration is
  //   [mapped](#transform.Position_Mapping) when content is
  //   inserted directly at that position. By default, the decoration
  //   won't include the new content, but you can set this to `true`
  //   to make it inclusive.
  //
  //   inclusiveEnd:: ?bool
  //   Determines how the right side of the decoration is mapped.
  //   See
  //   [`inclusiveStart`](#view.Decoration^inline^spec.inclusiveStart).
  Decoration.inline = function inline (from, to, attrs, spec) {
    return new Decoration(from, to, new InlineType(attrs, spec))
  };

  // :: (number, number, DecorationAttrs, ?Object) → Decoration
  // Creates a node decoration. `from` and `to` should point precisely
  // before and after a node in the document. That node, and only that
  // node, will receive the given attributes.
  //
  // spec::-
  //
  // Optional information to store with the decoration. It
  // is also used when comparing decorators for equality.
  Decoration.node = function node (from, to, attrs, spec) {
    return new Decoration(from, to, new NodeType$1(attrs, spec))
  };

  // :: Object
  // The spec provided when creating this decoration. Can be useful
  // if you've stored extra information in that object.
  prototypeAccessors$1$5.spec.get = function () { return this.type.spec };

  Object.defineProperties( Decoration.prototype, prototypeAccessors$1$5 );

  // DecorationAttrs:: interface
  // A set of attributes to add to a decorated node. Most properties
  // simply directly correspond to DOM attributes of the same name,
  // which will be set to the property's value. These are exceptions:
  //
  //   class:: ?string
  //   A CSS class name or a space-separated set of class names to be
  //   _added_ to the classes that the node already had.
  //
  //   style:: ?string
  //   A string of CSS to be _added_ to the node's existing `style` property.
  //
  //   nodeName:: ?string
  //   When non-null, the target node is wrapped in a DOM element of
  //   this type (and the other attributes are applied to this element).

  var none = [], noSpec = {};

  // ::- A collection of [decorations](#view.Decoration), organized in
  // such a way that the drawing algorithm can efficiently use and
  // compare them. This is a persistent data structure—it is not
  // modified, updates create a new value.
  var DecorationSet = function DecorationSet(local, children) {
    this.local = local && local.length ? local : none;
    this.children = children && children.length ? children : none;
  };

  // :: (Node, [Decoration]) → DecorationSet
  // Create a set of decorations, using the structure of the given
  // document.
  DecorationSet.create = function create (doc, decorations) {
    return decorations.length ? buildTree(decorations, doc, 0, noSpec) : empty
  };

  // :: (?number, ?number, ?(spec: Object) → bool) → [Decoration]
  // Find all decorations in this set which touch the given range
  // (including decorations that start or end directly at the
  // boundaries) and match the given predicate on their spec. When
  // `start` and `end` are omitted, all decorations in the set are
  // considered. When `predicate` isn't given, all decorations are
  // assumed to match.
  DecorationSet.prototype.find = function find (start, end, predicate) {
    var result = [];
    this.findInner(start == null ? 0 : start, end == null ? 1e9 : end, result, 0, predicate);
    return result
  };

  DecorationSet.prototype.findInner = function findInner (start, end, result, offset, predicate) {
    for (var i = 0; i < this.local.length; i++) {
      var span = this.local[i];
      if (span.from <= end && span.to >= start && (!predicate || predicate(span.spec)))
        { result.push(span.copy(span.from + offset, span.to + offset)); }
    }
    for (var i$1 = 0; i$1 < this.children.length; i$1 += 3) {
      if (this.children[i$1] < end && this.children[i$1 + 1] > start) {
        var childOff = this.children[i$1] + 1;
        this.children[i$1 + 2].findInner(start - childOff, end - childOff, result, offset + childOff, predicate);
      }
    }
  };

  // :: (Mapping, Node, ?Object) → DecorationSet
  // Map the set of decorations in response to a change in the
  // document.
  //
  // options::- An optional set of options.
  //
  //   onRemove:: ?(decorationSpec: Object)
  //   When given, this function will be called for each decoration
  //   that gets dropped as a result of the mapping, passing the
  //   spec of that decoration.
  DecorationSet.prototype.map = function map (mapping, doc, options) {
    if (this == empty || mapping.maps.length == 0) { return this }
    return this.mapInner(mapping, doc, 0, 0, options || noSpec)
  };

  DecorationSet.prototype.mapInner = function mapInner (mapping, node, offset, oldOffset, options) {
    var newLocal;
    for (var i = 0; i < this.local.length; i++) {
      var mapped = this.local[i].map(mapping, offset, oldOffset);
      if (mapped && mapped.type.valid(node, mapped)) { (newLocal || (newLocal = [])).push(mapped); }
      else if (options.onRemove) { options.onRemove(this.local[i].spec); }
    }

    if (this.children.length)
      { return mapChildren(this.children, newLocal, mapping, node, offset, oldOffset, options) }
    else
      { return newLocal ? new DecorationSet(newLocal.sort(byPos)) : empty }
  };

  // :: (Node, [Decoration]) → DecorationSet
  // Add the given array of decorations to the ones in the set,
  // producing a new set. Needs access to the current document to
  // create the appropriate tree structure.
  DecorationSet.prototype.add = function add (doc, decorations) {
    if (!decorations.length) { return this }
    if (this == empty) { return DecorationSet.create(doc, decorations) }
    return this.addInner(doc, decorations, 0)
  };

  DecorationSet.prototype.addInner = function addInner (doc, decorations, offset) {
      var this$1 = this;

    var children, childIndex = 0;
    doc.forEach(function (childNode, childOffset) {
      var baseOffset = childOffset + offset, found;
      if (!(found = takeSpansForNode(decorations, childNode, baseOffset))) { return }

      if (!children) { children = this$1.children.slice(); }
      while (childIndex < children.length && children[childIndex] < childOffset) { childIndex += 3; }
      if (children[childIndex] == childOffset)
        { children[childIndex + 2] = children[childIndex + 2].addInner(childNode, found, baseOffset + 1); }
      else
        { children.splice(childIndex, 0, childOffset, childOffset + childNode.nodeSize, buildTree(found, childNode, baseOffset + 1, noSpec)); }
      childIndex += 3;
    });

    var local = moveSpans(childIndex ? withoutNulls(decorations) : decorations, -offset);
    return new DecorationSet(local.length ? this.local.concat(local).sort(byPos) : this.local,
                             children || this.children)
  };

  // :: ([Decoration]) → DecorationSet
  // Create a new set that contains the decorations in this set, minus
  // the ones in the given array.
  DecorationSet.prototype.remove = function remove (decorations) {
    if (decorations.length == 0 || this == empty) { return this }
    return this.removeInner(decorations, 0)
  };

  DecorationSet.prototype.removeInner = function removeInner (decorations, offset) {
    var children = this.children, local = this.local;
    for (var i = 0; i < children.length; i += 3) {
      var found = (void 0), from = children[i] + offset, to = children[i + 1] + offset;
      for (var j = 0, span = (void 0); j < decorations.length; j++) { if (span = decorations[j]) {
        if (span.from > from && span.to < to) {
          decorations[j] = null
          ;(found || (found = [])).push(span);
        }
      } }
      if (!found) { continue }
      if (children == this.children) { children = this.children.slice(); }
      var removed = children[i + 2].removeInner(found, from + 1);
      if (removed != empty) {
        children[i + 2] = removed;
      } else {
        children.splice(i, 3);
        i -= 3;
      }
    }
    if (local.length) { for (var i$1 = 0, span$1 = (void 0); i$1 < decorations.length; i$1++) { if (span$1 = decorations[i$1]) {
      for (var j$1 = 0; j$1 < local.length; j$1++) { if (local[j$1].type.eq(span$1.type)) {
        if (local == this.local) { local = this.local.slice(); }
        local.splice(j$1--, 1);
      } }
    } } }
    if (children == this.children && local == this.local) { return this }
    return local.length || children.length ? new DecorationSet(local, children) : empty
  };

  DecorationSet.prototype.forChild = function forChild (offset, node) {
    if (this == empty) { return this }
    if (node.isLeaf) { return DecorationSet.empty }

    var child, local;
    for (var i = 0; i < this.children.length; i += 3) { if (this.children[i] >= offset) {
      if (this.children[i] == offset) { child = this.children[i + 2]; }
      break
    } }
    var start = offset + 1, end = start + node.content.size;
    for (var i$1 = 0; i$1 < this.local.length; i$1++) {
      var dec = this.local[i$1];
      if (dec.from < end && dec.to > start && (dec.type instanceof InlineType)) {
        var from = Math.max(start, dec.from) - start, to = Math.min(end, dec.to) - start;
        if (from < to) { (local || (local = [])).push(dec.copy(from, to)); }
      }
    }
    if (local) {
      var localSet = new DecorationSet(local.sort(byPos));
      return child ? new DecorationGroup([localSet, child]) : localSet
    }
    return child || empty
  };

  DecorationSet.prototype.eq = function eq (other) {
    if (this == other) { return true }
    if (!(other instanceof DecorationSet) ||
        this.local.length != other.local.length ||
        this.children.length != other.children.length) { return false }
    for (var i = 0; i < this.local.length; i++)
      { if (!this.local[i].eq(other.local[i])) { return false } }
    for (var i$1 = 0; i$1 < this.children.length; i$1 += 3)
      { if (this.children[i$1] != other.children[i$1] ||
          this.children[i$1 + 1] != other.children[i$1 + 1] ||
          !this.children[i$1 + 2].eq(other.children[i$1 + 2])) { return false } }
    return true
  };

  DecorationSet.prototype.locals = function locals (node) {
    return removeOverlap(this.localsInner(node))
  };

  DecorationSet.prototype.localsInner = function localsInner (node) {
    if (this == empty) { return none }
    if (node.inlineContent || !this.local.some(InlineType.is)) { return this.local }
    var result = [];
    for (var i = 0; i < this.local.length; i++) {
      if (!(this.local[i].type instanceof InlineType))
        { result.push(this.local[i]); }
    }
    return result
  };

  var empty = new DecorationSet();

  // :: DecorationSet
  // The empty set of decorations.
  DecorationSet.empty = empty;

  DecorationSet.removeOverlap = removeOverlap;

  // :- An abstraction that allows the code dealing with decorations to
  // treat multiple DecorationSet objects as if it were a single object
  // with (a subset of) the same interface.
  var DecorationGroup = function DecorationGroup(members) {
    this.members = members;
  };

  DecorationGroup.prototype.forChild = function forChild (offset, child) {
    if (child.isLeaf) { return DecorationSet.empty }
    var found = [];
    for (var i = 0; i < this.members.length; i++) {
      var result = this.members[i].forChild(offset, child);
      if (result == empty) { continue }
      if (result instanceof DecorationGroup) { found = found.concat(result.members); }
      else { found.push(result); }
    }
    return DecorationGroup.from(found)
  };

  DecorationGroup.prototype.eq = function eq (other) {
    if (!(other instanceof DecorationGroup) ||
        other.members.length != this.members.length) { return false }
    for (var i = 0; i < this.members.length; i++)
      { if (!this.members[i].eq(other.members[i])) { return false } }
    return true
  };

  DecorationGroup.prototype.locals = function locals (node) {
    var result, sorted = true;
    for (var i = 0; i < this.members.length; i++) {
      var locals = this.members[i].localsInner(node);
      if (!locals.length) { continue }
      if (!result) {
        result = locals;
      } else {
        if (sorted) {
          result = result.slice();
          sorted = false;
        }
        for (var j = 0; j < locals.length; j++) { result.push(locals[j]); }
      }
    }
    return result ? removeOverlap(sorted ? result : result.sort(byPos)) : none
  };

  // : ([DecorationSet]) → union<DecorationSet, DecorationGroup>
  // Create a group for the given array of decoration sets, or return
  // a single set when possible.
  DecorationGroup.from = function from (members) {
    switch (members.length) {
      case 0: return empty
      case 1: return members[0]
      default: return new DecorationGroup(members)
    }
  };

  function mapChildren(oldChildren, newLocal, mapping, node, offset, oldOffset, options) {
    var children = oldChildren.slice();

    // Mark the children that are directly touched by changes, and
    // move those that are after the changes.
    var shift = function (oldStart, oldEnd, newStart, newEnd) {
      for (var i = 0; i < children.length; i += 3) {
        var end = children[i + 1], dSize = (void 0);
        if (end == -1 || oldStart > end + oldOffset) { continue }
        if (oldEnd >= children[i] + oldOffset) {
          children[i + 1] = -1;
        } else if (dSize = (newEnd - newStart) - (oldEnd - oldStart) + (oldOffset - offset)) {
          children[i] += dSize;
          children[i + 1] += dSize;
        }
      }
    };
    for (var i = 0; i < mapping.maps.length; i++) { mapping.maps[i].forEach(shift); }

    // Find the child nodes that still correspond to a single node,
    // recursively call mapInner on them and update their positions.
    var mustRebuild = false;
    for (var i$1 = 0; i$1 < children.length; i$1 += 3) { if (children[i$1 + 1] == -1) { // Touched nodes
      var from = mapping.map(children[i$1] + oldOffset), fromLocal = from - offset;
      if (fromLocal < 0 || fromLocal >= node.content.size) {
        mustRebuild = true;
        continue
      }
      // Must read oldChildren because children was tagged with -1
      var to = mapping.map(oldChildren[i$1 + 1] + oldOffset, -1), toLocal = to - offset;
      var ref = node.content.findIndex(fromLocal);
      var index = ref.index;
      var childOffset = ref.offset;
      var childNode = node.maybeChild(index);
      if (childNode && childOffset == fromLocal && childOffset + childNode.nodeSize == toLocal) {
        var mapped = children[i$1 + 2].mapInner(mapping, childNode, from + 1, children[i$1] + oldOffset + 1, options);
        if (mapped != empty) {
          children[i$1] = fromLocal;
          children[i$1 + 1] = toLocal;
          children[i$1 + 2] = mapped;
        } else {
          children[i$1 + 1] = -2;
          mustRebuild = true;
        }
      } else {
        mustRebuild = true;
      }
    } }

    // Remaining children must be collected and rebuilt into the appropriate structure
    if (mustRebuild) {
      var decorations = mapAndGatherRemainingDecorations(children, oldChildren, newLocal || [], mapping,
                                                         offset, oldOffset, options);
      var built = buildTree(decorations, node, 0, options);
      newLocal = built.local;
      for (var i$2 = 0; i$2 < children.length; i$2 += 3) { if (children[i$2 + 1] < 0) {
        children.splice(i$2, 3);
        i$2 -= 3;
      } }
      for (var i$3 = 0, j = 0; i$3 < built.children.length; i$3 += 3) {
        var from$1 = built.children[i$3];
        while (j < children.length && children[j] < from$1) { j += 3; }
        children.splice(j, 0, built.children[i$3], built.children[i$3 + 1], built.children[i$3 + 2]);
      }
    }

    return new DecorationSet(newLocal && newLocal.sort(byPos), children)
  }

  function moveSpans(spans, offset) {
    if (!offset || !spans.length) { return spans }
    var result = [];
    for (var i = 0; i < spans.length; i++) {
      var span = spans[i];
      result.push(new Decoration(span.from + offset, span.to + offset, span.type));
    }
    return result
  }

  function mapAndGatherRemainingDecorations(children, oldChildren, decorations, mapping, offset, oldOffset, options) {
    // Gather all decorations from the remaining marked children
    function gather(set, oldOffset) {
      for (var i = 0; i < set.local.length; i++) {
        var mapped = set.local[i].map(mapping, offset, oldOffset);
        if (mapped) { decorations.push(mapped); }
        else if (options.onRemove) { options.onRemove(set.local[i].spec); }
      }
      for (var i$1 = 0; i$1 < set.children.length; i$1 += 3)
        { gather(set.children[i$1 + 2], set.children[i$1] + oldOffset + 1); }
    }
    for (var i = 0; i < children.length; i += 3) { if (children[i + 1] == -1)
      { gather(children[i + 2], oldChildren[i] + oldOffset + 1); } }

    return decorations
  }

  function takeSpansForNode(spans, node, offset) {
    if (node.isLeaf) { return null }
    var end = offset + node.nodeSize, found = null;
    for (var i = 0, span = (void 0); i < spans.length; i++) {
      if ((span = spans[i]) && span.from > offset && span.to < end) {
  (found || (found = [])).push(span);
        spans[i] = null;
      }
    }
    return found
  }

  function withoutNulls(array) {
    var result = [];
    for (var i = 0; i < array.length; i++)
      { if (array[i] != null) { result.push(array[i]); } }
    return result
  }

  // : ([Decoration], Node, number) → DecorationSet
  // Build up a tree that corresponds to a set of decorations. `offset`
  // is a base offset that should be subtractet from the `from` and `to`
  // positions in the spans (so that we don't have to allocate new spans
  // for recursive calls).
  function buildTree(spans, node, offset, options) {
    var children = [], hasNulls = false;
    node.forEach(function (childNode, localStart) {
      var found = takeSpansForNode(spans, childNode, localStart + offset);
      if (found) {
        hasNulls = true;
        var subtree = buildTree(found, childNode, offset + localStart + 1, options);
        if (subtree != empty)
          { children.push(localStart, localStart + childNode.nodeSize, subtree); }
      }
    });
    var locals = moveSpans(hasNulls ? withoutNulls(spans) : spans, -offset).sort(byPos);
    for (var i = 0; i < locals.length; i++) { if (!locals[i].type.valid(node, locals[i])) {
      if (options.onRemove) { options.onRemove(locals[i].spec); }
      locals.splice(i--, 1);
    } }
    return locals.length || children.length ? new DecorationSet(locals, children) : empty
  }

  // : (Decoration, Decoration) → number
  // Used to sort decorations so that ones with a low start position
  // come first, and within a set with the same start position, those
  // with an smaller end position come first.
  function byPos(a, b) {
    return a.from - b.from || a.to - b.to
  }

  // : ([Decoration]) → [Decoration]
  // Scan a sorted array of decorations for partially overlapping spans,
  // and split those so that only fully overlapping spans are left (to
  // make subsequent rendering easier). Will return the input array if
  // no partially overlapping spans are found (the common case).
  function removeOverlap(spans) {
    var working = spans;
    for (var i = 0; i < working.length - 1; i++) {
      var span = working[i];
      if (span.from != span.to) { for (var j = i + 1; j < working.length; j++) {
        var next = working[j];
        if (next.from == span.from) {
          if (next.to != span.to) {
            if (working == spans) { working = spans.slice(); }
            // Followed by a partially overlapping larger span. Split that
            // span.
            working[j] = next.copy(next.from, span.to);
            insertAhead(working, j + 1, next.copy(span.to, next.to));
          }
          continue
        } else {
          if (next.from < span.to) {
            if (working == spans) { working = spans.slice(); }
            // The end of this one overlaps with a subsequent span. Split
            // this one.
            working[i] = span.copy(span.from, next.from);
            insertAhead(working, j, span.copy(next.from, span.to));
          }
          break
        }
      } }
    }
    return working
  }

  function insertAhead(array, i, deco) {
    while (i < array.length && byPos(deco, array[i]) > 0) { i++; }
    array.splice(i, 0, deco);
  }

  // : (EditorView) → union<DecorationSet, DecorationGroup>
  // Get the decorations associated with the current props of a view.
  function viewDecorations(view) {
    var found = [];
    view.someProp("decorations", function (f) {
      var result = f(view.state);
      if (result && result != empty) { found.push(result); }
    });
    if (view.cursorWrapper)
      { found.push(DecorationSet.create(view.state.doc, [view.cursorWrapper.deco])); }
    return DecorationGroup.from(found)
  }

  // ::- An editor view manages the DOM structure that represents an
  // editable document. Its state and behavior are determined by its
  // [props](#view.DirectEditorProps).
  var EditorView = function EditorView(place, props) {
    this._props = props;
    // :: EditorState
    // The view's current [state](#state.EditorState).
    this.state = props.state;

    this.dispatch = this.dispatch.bind(this);

    this._root = null;
    this.focused = false;

    // :: dom.Element
    // An editable DOM node containing the document. (You probably
    // should not directly interfere with its content.)
    this.dom = (place && place.mount) || document.createElement("div");
    if (place) {
      if (place.appendChild) { place.appendChild(this.dom); }
      else if (place.apply) { place(this.dom); }
      else if (place.mount) { this.mounted = true; }
    }

    // :: bool
    // Indicates whether the editor is currently [editable](#view.EditorProps.editable).
    this.editable = getEditable(this);
    this.markCursor = null;
    this.cursorWrapper = null;
    updateCursorWrapper(this);
    this.nodeViews = buildNodeViews(this);
    this.docView = docViewDesc(this.state.doc, computeDocDeco(this), viewDecorations(this), this.dom, this);

    this.lastSelectedViewDesc = null;
    // :: ?{slice: Slice, move: bool}
    // When editor content is being dragged, this object contains
    // information about the dragged slice and whether it is being
    // copied or moved. At any other time, it is null.
    this.dragging = null;

    initInput(this);

    this.pluginViews = [];
    this.updatePluginViews();
  };

  var prototypeAccessors$2$1 = { props: { configurable: true },root: { configurable: true } };

  // composing:: boolean
  // Holds `true` when a
  // [composition](https://developer.mozilla.org/en-US/docs/Mozilla/IME_handling_guide)
  // is active.

  // :: DirectEditorProps
  // The view's current [props](#view.EditorProps).
  prototypeAccessors$2$1.props.get = function () {
    if (this._props.state != this.state) {
      var prev = this._props;
      this._props = {};
      for (var name in prev) { this._props[name] = prev[name]; }
      this._props.state = this.state;
    }
    return this._props
  };

  // :: (DirectEditorProps)
  // Update the view's props. Will immediately cause an update to
  // the DOM.
  EditorView.prototype.update = function update (props) {
    if (props.handleDOMEvents != this._props.handleDOMEvents) { ensureListeners(this); }
    this._props = props;
    this.updateStateInner(props.state, true);
  };

  // :: (DirectEditorProps)
  // Update the view by updating existing props object with the object
  // given as argument. Equivalent to `view.update(Object.assign({},
  // view.props, props))`.
  EditorView.prototype.setProps = function setProps (props) {
    var updated = {};
    for (var name in this._props) { updated[name] = this._props[name]; }
    updated.state = this.state;
    for (var name$1 in props) { updated[name$1] = props[name$1]; }
    this.update(updated);
  };

  // :: (EditorState)
  // Update the editor's `state` prop, without touching any of the
  // other props.
  EditorView.prototype.updateState = function updateState (state) {
    this.updateStateInner(state, this.state.plugins != state.plugins);
  };

  EditorView.prototype.updateStateInner = function updateStateInner (state, reconfigured) {
      var this$1 = this;

    var prev = this.state, redraw = false;
    this.state = state;
    if (reconfigured) {
      var nodeViews = buildNodeViews(this);
      if (changedNodeViews(nodeViews, this.nodeViews)) {
        this.nodeViews = nodeViews;
        redraw = true;
      }
      ensureListeners(this);
    }

    this.editable = getEditable(this);
    updateCursorWrapper(this);
    var innerDeco = viewDecorations(this), outerDeco = computeDocDeco(this);

    var scroll = reconfigured ? "reset"
        : state.scrollToSelection > prev.scrollToSelection ? "to selection" : "preserve";
    var updateDoc = redraw || !this.docView.matchesNode(state.doc, outerDeco, innerDeco);
    var updateSel = updateDoc || !state.selection.eq(prev.selection);
    var oldScrollPos = scroll == "preserve" && updateSel && this.dom.style.overflowAnchor == null && storeScrollPos(this);

    if (updateSel) {
      this.domObserver.stop();
      var forceSelUpdate = false;
      if (updateDoc) {
        // Work around an issue in Chrome where changing the DOM
        // around the active selection puts it into a broken state
        // where the thing the user sees differs from the selection
        // reported by the Selection object (#710)
        var startSelContext = result.chrome && selectionContext(this.root);
        if (redraw || !this.docView.update(state.doc, outerDeco, innerDeco, this)) {
          this.docView.destroy();
          this.docView = docViewDesc(state.doc, outerDeco, innerDeco, this.dom, this);
        }
        if (startSelContext)
          { forceSelUpdate = !this.composing && needChromeSelectionForce(startSelContext, this.root); }
        // IE11 will sometimes _report_ the selection as being in the
        // right place but actually draw/use a different selection
        // after a deletion (#973).
        if (result.ie && result.ie_version <= 11 && !prev.selection.empty && state.selection.empty &&
            state.doc.content.size < prev.doc.content.size)
          { forceSelUpdate = true; }
      }
      // Work around for an issue where an update arriving right between
      // a DOM selection change and the "selectionchange" event for it
      // can cause a spurious DOM selection update, disrupting mouse
      // drag selection.
      if (forceSelUpdate ||
          !(this.mouseDown && this.domObserver.currentSelection.eq(this.root.getSelection()) && anchorInRightPlace(this))) {
        selectionToDOM(this, forceSelUpdate);
      } else {
        syncNodeSelection(this, state.selection);
        this.domObserver.setCurSelection();
      }
      this.domObserver.start();
    }

    this.updatePluginViews(prev);

    if (scroll == "reset") {
      this.dom.scrollTop = 0;
    } else if (scroll == "to selection") {
      var startDOM = this.root.getSelection().focusNode;
      if (this.someProp("handleScrollToSelection", function (f) { return f(this$1); }))
        ; // Handled
      else if (state.selection instanceof NodeSelection)
        { scrollRectIntoView(this, this.docView.domAfterPos(state.selection.from).getBoundingClientRect(), startDOM); }
      else
        { scrollRectIntoView(this, this.coordsAtPos(state.selection.head), startDOM); }
    } else if (oldScrollPos) {
      resetScrollPos(oldScrollPos);
    }
  };

  EditorView.prototype.destroyPluginViews = function destroyPluginViews () {
    var view;
    while (view = this.pluginViews.pop()) { if (view.destroy) { view.destroy(); } }
  };

  EditorView.prototype.updatePluginViews = function updatePluginViews (prevState) {
    if (!prevState || prevState.plugins != this.state.plugins) {
      this.destroyPluginViews();
      for (var i = 0; i < this.state.plugins.length; i++) {
        var plugin = this.state.plugins[i];
        if (plugin.spec.view) { this.pluginViews.push(plugin.spec.view(this)); }
      }
    } else {
      for (var i$1 = 0; i$1 < this.pluginViews.length; i$1++) {
        var pluginView = this.pluginViews[i$1];
        if (pluginView.update) { pluginView.update(this, prevState); }
      }
    }
  };

  // :: (string, ?(prop: *) → *) → *
  // Goes over the values of a prop, first those provided directly,
  // then those from plugins (in order), and calls `f` every time a
  // non-undefined value is found. When `f` returns a truthy value,
  // that is immediately returned. When `f` isn't provided, it is
  // treated as the identity function (the prop value is returned
  // directly).
  EditorView.prototype.someProp = function someProp (propName, f) {
    var prop = this._props && this._props[propName], value;
    if (prop != null && (value = f ? f(prop) : prop)) { return value }
    var plugins = this.state.plugins;
    if (plugins) { for (var i = 0; i < plugins.length; i++) {
      var prop$1 = plugins[i].props[propName];
      if (prop$1 != null && (value = f ? f(prop$1) : prop$1)) { return value }
    } }
  };

  // :: () → bool
  // Query whether the view has focus.
  EditorView.prototype.hasFocus = function hasFocus () {
    return this.root.activeElement == this.dom
  };

  // :: ()
  // Focus the editor.
  EditorView.prototype.focus = function focus () {
    this.domObserver.stop();
    if (this.editable) { focusPreventScroll(this.dom); }
    selectionToDOM(this);
    this.domObserver.start();
  };

  // :: union<dom.Document, dom.DocumentFragment>
  // Get the document root in which the editor exists. This will
  // usually be the top-level `document`, but might be a [shadow
  // DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Shadow_DOM)
  // root if the editor is inside one.
  prototypeAccessors$2$1.root.get = function () {
    var cached = this._root;
    if (cached == null) { for (var search = this.dom.parentNode; search; search = search.parentNode) {
      if (search.nodeType == 9 || (search.nodeType == 11 && search.host))
        { return this._root = search }
    } }
    return cached || document
  };

  // :: ({left: number, top: number}) → ?{pos: number, inside: number}
  // Given a pair of viewport coordinates, return the document
  // position that corresponds to them. May return null if the given
  // coordinates aren't inside of the editor. When an object is
  // returned, its `pos` property is the position nearest to the
  // coordinates, and its `inside` property holds the position of the
  // inner node that the position falls inside of, or -1 if it is at
  // the top level, not in any node.
  EditorView.prototype.posAtCoords = function posAtCoords$1 (coords) {
    return posAtCoords(this, coords)
  };

  // :: (number) → {left: number, right: number, top: number, bottom: number}
  // Returns the viewport rectangle at a given document position. `left`
  // and `right` will be the same number, as this returns a flat
  // cursor-ish rectangle.
  EditorView.prototype.coordsAtPos = function coordsAtPos$1 (pos) {
    return coordsAtPos(this, pos)
  };

  // :: (number) → {node: dom.Node, offset: number}
  // Find the DOM position that corresponds to the given document
  // position. Note that you should **not** mutate the editor's
  // internal DOM, only inspect it (and even that is usually not
  // necessary).
  EditorView.prototype.domAtPos = function domAtPos (pos) {
    return this.docView.domFromPos(pos)
  };

  // :: (number) → ?dom.Node
  // Find the DOM node that represents the document node after the
  // given position. May return `null` when the position doesn't point
  // in front of a node or if the node is inside an opaque node view.
  //
  // This is intended to be able to call things like
  // `getBoundingClientRect` on that DOM node. Do **not** mutate the
  // editor DOM directly, or add styling this way, since that will be
  // immediately overriden by the editor as it redraws the node.
  EditorView.prototype.nodeDOM = function nodeDOM (pos) {
    var desc = this.docView.descAt(pos);
    return desc ? desc.nodeDOM : null
  };

  // :: (dom.Node, number, ?number) → number
  // Find the document position that corresponds to a given DOM
  // position. (Whenever possible, it is preferable to inspect the
  // document structure directly, rather than poking around in the
  // DOM, but sometimes—for example when interpreting an event
  // target—you don't have a choice.)
  //
  // The `bias` parameter can be used to influence which side of a DOM
  // node to use when the position is inside a leaf node.
  EditorView.prototype.posAtDOM = function posAtDOM (node, offset, bias) {
      if ( bias === void 0 ) bias = -1;

    var pos = this.docView.posFromDOM(node, offset, bias);
    if (pos == null) { throw new RangeError("DOM position not inside the editor") }
    return pos
  };

  // :: (union<"up", "down", "left", "right", "forward", "backward">, ?EditorState) → bool
  // Find out whether the selection is at the end of a textblock when
  // moving in a given direction. When, for example, given `"left"`,
  // it will return true if moving left from the current cursor
  // position would leave that position's parent textblock. Will apply
  // to the view's current state by default, but it is possible to
  // pass a different state.
  EditorView.prototype.endOfTextblock = function endOfTextblock$1 (dir, state) {
    return endOfTextblock(this, state || this.state, dir)
  };

  // :: ()
  // Removes the editor from the DOM and destroys all [node
  // views](#view.NodeView).
  EditorView.prototype.destroy = function destroy () {
    if (!this.docView) { return }
    destroyInput(this);
    this.destroyPluginViews();
    if (this.mounted) {
      this.docView.update(this.state.doc, [], viewDecorations(this), this);
      this.dom.textContent = "";
    } else if (this.dom.parentNode) {
      this.dom.parentNode.removeChild(this.dom);
    }
    this.docView.destroy();
    this.docView = null;
  };

  // Used for testing.
  EditorView.prototype.dispatchEvent = function dispatchEvent$1 (event) {
    return dispatchEvent(this, event)
  };

  // :: (Transaction)
  // Dispatch a transaction. Will call
  // [`dispatchTransaction`](#view.DirectEditorProps.dispatchTransaction)
  // when given, and otherwise defaults to applying the transaction to
  // the current state and calling
  // [`updateState`](#view.EditorView.updateState) with the result.
  // This method is bound to the view instance, so that it can be
  // easily passed around.
  EditorView.prototype.dispatch = function dispatch (tr) {
    var dispatchTransaction = this._props.dispatchTransaction;
    if (dispatchTransaction) { dispatchTransaction.call(this, tr); }
    else { this.updateState(this.state.apply(tr)); }
  };

  Object.defineProperties( EditorView.prototype, prototypeAccessors$2$1 );

  function computeDocDeco(view) {
    var attrs = Object.create(null);
    attrs.class = "ProseMirror";
    attrs.contenteditable = String(view.editable);

    view.someProp("attributes", function (value) {
      if (typeof value == "function") { value = value(view.state); }
      if (value) { for (var attr in value) {
        if (attr == "class")
          { attrs.class += " " + value[attr]; }
        else if (!attrs[attr] && attr != "contenteditable" && attr != "nodeName")
          { attrs[attr] = String(value[attr]); }
      } }
    });

    return [Decoration.node(0, view.state.doc.content.size, attrs)]
  }

  function updateCursorWrapper(view) {
    var ref = view.state.selection;
    var $head = ref.$head;
    var $anchor = ref.$anchor;
    var visible = ref.visible;
    if (view.markCursor) {
      var dom = document.createElement("img");
      dom.setAttribute("mark-placeholder", "true");
      view.cursorWrapper = {dom: dom, deco: Decoration.widget($head.pos, dom, {raw: true, marks: view.markCursor})};
    } else if (visible || $head.pos != $anchor.pos) {
      view.cursorWrapper = null;
    } else {
      var dom$1;
      if (!view.cursorWrapper || view.cursorWrapper.dom.childNodes.length) {
        dom$1 = document.createElement("div");
        dom$1.style.position = "absolute";
        dom$1.style.left = "-100000px";
      } else if (view.cursorWrapper.deco.pos != $head.pos) {
        dom$1 = view.cursorWrapper.dom;
      }
      if (dom$1)
        { view.cursorWrapper = {dom: dom$1, deco: Decoration.widget($head.pos, dom$1, {raw: true})}; }
    }
  }

  function getEditable(view) {
    return !view.someProp("editable", function (value) { return value(view.state) === false; })
  }

  function selectionContext(root) {
    var ref = root.getSelection();
    var offset = ref.focusOffset;
    var node = ref.focusNode;
    if (!node || node.nodeType == 3) { return null }
    return [node, offset,
            node.nodeType == 1 ? node.childNodes[offset - 1] : null,
            node.nodeType == 1 ? node.childNodes[offset] : null]
  }

  function needChromeSelectionForce(context, root) {
    var newContext = selectionContext(root);
    if (!newContext || newContext[0].nodeType == 3) { return false }
    for (var i = 0; i < context.length; i++) { if (newContext[i] != context[i]) { return true } }
    return false
  }

  function buildNodeViews(view) {
    var result = {};
    view.someProp("nodeViews", function (obj) {
      for (var prop in obj) { if (!Object.prototype.hasOwnProperty.call(result, prop))
        { result[prop] = obj[prop]; } }
    });
    return result
  }

  function changedNodeViews(a, b) {
    var nA = 0, nB = 0;
    for (var prop in a) {
      if (a[prop] != b[prop]) { return true }
      nA++;
    }
    for (var _ in b) { nB++; }
    return nA != nB
  }

  var index_es$3 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Decoration: Decoration,
    DecorationSet: DecorationSet,
    EditorView: EditorView,
    __endComposition: endComposition,
    __parseFromClipboard: parseFromClipboard,
    __serializeForClipboard: serializeForClipboard
  });

  var pDOM = ["p", 0], blockquoteDOM = ["blockquote", 0], hrDOM = ["hr"],
        preDOM = ["pre", ["code", 0]], brDOM = ["br"];

  // :: Object
  // [Specs](#model.NodeSpec) for the nodes defined in this schema.
  var nodes = {
    // :: NodeSpec The top level document node.
    doc: {
      content: "block+"
    },

    // :: NodeSpec A plain paragraph textblock. Represented in the DOM
    // as a `<p>` element.
    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{tag: "p"}],
      toDOM: function toDOM() { return pDOM }
    },

    // :: NodeSpec A blockquote (`<blockquote>`) wrapping one or more blocks.
    blockquote: {
      content: "block+",
      group: "block",
      defining: true,
      parseDOM: [{tag: "blockquote"}],
      toDOM: function toDOM() { return blockquoteDOM }
    },

    // :: NodeSpec A horizontal rule (`<hr>`).
    horizontal_rule: {
      group: "block",
      parseDOM: [{tag: "hr"}],
      toDOM: function toDOM() { return hrDOM }
    },

    // :: NodeSpec A heading textblock, with a `level` attribute that
    // should hold the number 1 to 6. Parsed and serialized as `<h1>` to
    // `<h6>` elements.
    heading: {
      attrs: {level: {default: 1}},
      content: "inline*",
      group: "block",
      defining: true,
      parseDOM: [{tag: "h1", attrs: {level: 1}},
                 {tag: "h2", attrs: {level: 2}},
                 {tag: "h3", attrs: {level: 3}},
                 {tag: "h4", attrs: {level: 4}},
                 {tag: "h5", attrs: {level: 5}},
                 {tag: "h6", attrs: {level: 6}}],
      toDOM: function toDOM(node) { return ["h" + node.attrs.level, 0] }
    },

    // :: NodeSpec A code listing. Disallows marks or non-text inline
    // nodes by default. Represented as a `<pre>` element with a
    // `<code>` element inside of it.
    code_block: {
      content: "text*",
      marks: "",
      group: "block",
      code: true,
      defining: true,
      parseDOM: [{tag: "pre", preserveWhitespace: "full"}],
      toDOM: function toDOM() { return preDOM }
    },

    // :: NodeSpec The text node.
    text: {
      group: "inline"
    },

    // :: NodeSpec An inline image (`<img>`) node. Supports `src`,
    // `alt`, and `href` attributes. The latter two default to the empty
    // string.
    image: {
      inline: true,
      attrs: {
        src: {},
        alt: {default: null},
        title: {default: null}
      },
      group: "inline",
      draggable: true,
      parseDOM: [{tag: "img[src]", getAttrs: function getAttrs(dom) {
        return {
          src: dom.getAttribute("src"),
          title: dom.getAttribute("title"),
          alt: dom.getAttribute("alt")
        }
      }}],
      toDOM: function toDOM(node) { var ref = node.attrs;
      var src = ref.src;
      var alt = ref.alt;
      var title = ref.title; return ["img", {src: src, alt: alt, title: title}] }
    },

    // :: NodeSpec A hard line break, represented in the DOM as `<br>`.
    hard_break: {
      inline: true,
      group: "inline",
      selectable: false,
      parseDOM: [{tag: "br"}],
      toDOM: function toDOM() { return brDOM }
    }
  };

  var emDOM = ["em", 0], strongDOM = ["strong", 0], codeDOM = ["code", 0];

  // :: Object [Specs](#model.MarkSpec) for the marks in the schema.
  var marks = {
    // :: MarkSpec A link. Has `href` and `title` attributes. `title`
    // defaults to the empty string. Rendered and parsed as an `<a>`
    // element.
    link: {
      attrs: {
        href: {},
        title: {default: null}
      },
      inclusive: false,
      parseDOM: [{tag: "a[href]", getAttrs: function getAttrs(dom) {
        return {href: dom.getAttribute("href"), title: dom.getAttribute("title")}
      }}],
      toDOM: function toDOM(node) { var ref = node.attrs;
      var href = ref.href;
      var title = ref.title; return ["a", {href: href, title: title}, 0] }
    },

    // :: MarkSpec An emphasis mark. Rendered as an `<em>` element.
    // Has parse rules that also match `<i>` and `font-style: italic`.
    em: {
      parseDOM: [{tag: "i"}, {tag: "em"}, {style: "font-style=italic"}],
      toDOM: function toDOM() { return emDOM }
    },

    // :: MarkSpec A strong mark. Rendered as `<strong>`, parse rules
    // also match `<b>` and `font-weight: bold`.
    strong: {
      parseDOM: [{tag: "strong"},
                 // This works around a Google Docs misbehavior where
                 // pasted content will be inexplicably wrapped in `<b>`
                 // tags with a font-weight normal.
                 {tag: "b", getAttrs: function (node) { return node.style.fontWeight != "normal" && null; }},
                 {style: "font-weight", getAttrs: function (value) { return /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null; }}],
      toDOM: function toDOM() { return strongDOM }
    },

    // :: MarkSpec Code font mark. Represented as a `<code>` element.
    code: {
      parseDOM: [{tag: "code"}],
      toDOM: function toDOM() { return codeDOM }
    }
  };

  // :: Schema
  // This schema roughly corresponds to the document schema used by
  // [CommonMark](http://commonmark.org/), minus the list elements,
  // which are defined in the [`prosemirror-schema-list`](#schema-list)
  // module.
  //
  // To reuse elements from this schema, extend or read from its
  // `spec.nodes` and `spec.marks` [properties](#model.Schema.spec).
  var schema = new Schema({nodes: nodes, marks: marks});

  var olDOM = ["ol", 0], ulDOM = ["ul", 0], liDOM = ["li", 0];

  // :: NodeSpec
  // An ordered list [node spec](#model.NodeSpec). Has a single
  // attribute, `order`, which determines the number at which the list
  // starts counting, and defaults to 1. Represented as an `<ol>`
  // element.
  var orderedList = {
    attrs: {order: {default: 1}},
    parseDOM: [{tag: "ol", getAttrs: function getAttrs(dom) {
      return {order: dom.hasAttribute("start") ? +dom.getAttribute("start") : 1}
    }}],
    toDOM: function toDOM(node) {
      return node.attrs.order == 1 ? olDOM : ["ol", {start: node.attrs.order}, 0]
    }
  };

  // :: NodeSpec
  // A bullet list node spec, represented in the DOM as `<ul>`.
  var bulletList = {
    parseDOM: [{tag: "ul"}],
    toDOM: function toDOM() { return ulDOM }
  };

  // :: NodeSpec
  // A list item (`<li>`) spec.
  var listItem = {
    parseDOM: [{tag: "li"}],
    toDOM: function toDOM() { return liDOM },
    defining: true
  };

  function add(obj, props) {
    var copy = {};
    for (var prop in obj) { copy[prop] = obj[prop]; }
    for (var prop$1 in props) { copy[prop$1] = props[prop$1]; }
    return copy
  }

  // :: (OrderedMap<NodeSpec>, string, ?string) → OrderedMap<NodeSpec>
  // Convenience function for adding list-related node types to a map
  // specifying the nodes for a schema. Adds
  // [`orderedList`](#schema-list.orderedList) as `"ordered_list"`,
  // [`bulletList`](#schema-list.bulletList) as `"bullet_list"`, and
  // [`listItem`](#schema-list.listItem) as `"list_item"`.
  //
  // `itemContent` determines the content expression for the list items.
  // If you want the commands defined in this module to apply to your
  // list structure, it should have a shape like `"paragraph block*"` or
  // `"paragraph (ordered_list | bullet_list)*"`. `listGroup` can be
  // given to assign a group name to the list node types, for example
  // `"block"`.
  function addListNodes(nodes, itemContent, listGroup) {
    return nodes.append({
      ordered_list: add(orderedList, {content: "list_item+", group: listGroup}),
      bullet_list: add(bulletList, {content: "list_item+", group: listGroup}),
      list_item: add(listItem, {content: itemContent})
    })
  }

  // :: (NodeType, ?Object) → (state: EditorState, dispatch: ?(tr: Transaction)) → bool
  // Returns a command function that wraps the selection in a list with
  // the given type an attributes. If `dispatch` is null, only return a
  // value to indicate whether this is possible, but don't actually
  // perform the change.
  function wrapInList(listType, attrs) {
    return function(state, dispatch) {
      var ref = state.selection;
      var $from = ref.$from;
      var $to = ref.$to;
      var range = $from.blockRange($to), doJoin = false, outerRange = range;
      if (!range) { return false }
      // This is at the top of an existing list item
      if (range.depth >= 2 && $from.node(range.depth - 1).type.compatibleContent(listType) && range.startIndex == 0) {
        // Don't do anything if this is the top of the list
        if ($from.index(range.depth - 1) == 0) { return false }
        var $insert = state.doc.resolve(range.start - 2);
        outerRange = new NodeRange($insert, $insert, range.depth);
        if (range.endIndex < range.parent.childCount)
          { range = new NodeRange($from, state.doc.resolve($to.end(range.depth)), range.depth); }
        doJoin = true;
      }
      var wrap = findWrapping(outerRange, listType, attrs, range);
      if (!wrap) { return false }
      if (dispatch) { dispatch(doWrapInList(state.tr, range, wrap, doJoin, listType).scrollIntoView()); }
      return true
    }
  }

  function doWrapInList(tr, range, wrappers, joinBefore, listType) {
    var content = Fragment.empty;
    for (var i = wrappers.length - 1; i >= 0; i--)
      { content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content)); }

    tr.step(new ReplaceAroundStep(range.start - (joinBefore ? 2 : 0), range.end, range.start, range.end,
                                  new Slice(content, 0, 0), wrappers.length, true));

    var found = 0;
    for (var i$1 = 0; i$1 < wrappers.length; i$1++) { if (wrappers[i$1].type == listType) { found = i$1 + 1; } }
    var splitDepth = wrappers.length - found;

    var splitPos = range.start + wrappers.length - (joinBefore ? 2 : 0), parent = range.parent;
    for (var i$2 = range.startIndex, e = range.endIndex, first = true; i$2 < e; i$2++, first = false) {
      if (!first && canSplit(tr.doc, splitPos, splitDepth)) {
        tr.split(splitPos, splitDepth);
        splitPos += 2 * splitDepth;
      }
      splitPos += parent.child(i$2).nodeSize;
    }
    return tr
  }

  // :: (NodeType) → (state: EditorState, dispatch: ?(tr: Transaction)) → bool
  // Build a command that splits a non-empty textblock at the top level
  // of a list item by also splitting that list item.
  function splitListItem(itemType) {
    return function(state, dispatch) {
      var ref = state.selection;
      var $from = ref.$from;
      var $to = ref.$to;
      var node = ref.node;
      if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to)) { return false }
      var grandParent = $from.node(-1);
      if (grandParent.type != itemType) { return false }
      if ($from.parent.content.size == 0) {
        // In an empty block. If this is a nested list, the wrapping
        // list item should be split. Otherwise, bail out and let next
        // command handle lifting.
        if ($from.depth == 2 || $from.node(-3).type != itemType ||
            $from.index(-2) != $from.node(-2).childCount - 1) { return false }
        if (dispatch) {
          var wrap = Fragment.empty, keepItem = $from.index(-1) > 0;
          // Build a fragment containing empty versions of the structure
          // from the outer list item to the parent node of the cursor
          for (var d = $from.depth - (keepItem ? 1 : 2); d >= $from.depth - 3; d--)
            { wrap = Fragment.from($from.node(d).copy(wrap)); }
          // Add a second list item with an empty default start node
          wrap = wrap.append(Fragment.from(itemType.createAndFill()));
          var tr$1 = state.tr.replace($from.before(keepItem ? null : -1), $from.after(-3), new Slice(wrap, keepItem ? 3 : 2, 2));
          tr$1.setSelection(state.selection.constructor.near(tr$1.doc.resolve($from.pos + (keepItem ? 3 : 2))));
          dispatch(tr$1.scrollIntoView());
        }
        return true
      }
      var nextType = $to.pos == $from.end() ? grandParent.contentMatchAt(0).defaultType : null;
      var tr = state.tr.delete($from.pos, $to.pos);
      var types = nextType && [null, {type: nextType}];
      if (!canSplit(tr.doc, $from.pos, 2, types)) { return false }
      if (dispatch) { dispatch(tr.split($from.pos, 2, types).scrollIntoView()); }
      return true
    }
  }

  // :: (NodeType) → (state: EditorState, dispatch: ?(tr: Transaction)) → bool
  // Create a command to lift the list item around the selection up into
  // a wrapping list.
  function liftListItem(itemType) {
    return function(state, dispatch) {
      var ref = state.selection;
      var $from = ref.$from;
      var $to = ref.$to;
      var range = $from.blockRange($to, function (node) { return node.childCount && node.firstChild.type == itemType; });
      if (!range) { return false }
      if (!dispatch) { return true }
      if ($from.node(range.depth - 1).type == itemType) // Inside a parent list
        { return liftToOuterList(state, dispatch, itemType, range) }
      else // Outer list node
        { return liftOutOfList(state, dispatch, range) }
    }
  }

  function liftToOuterList(state, dispatch, itemType, range) {
    var tr = state.tr, end = range.end, endOfList = range.$to.end(range.depth);
    if (end < endOfList) {
      // There are siblings after the lifted items, which must become
      // children of the last item
      tr.step(new ReplaceAroundStep(end - 1, endOfList, end, endOfList,
                                    new Slice(Fragment.from(itemType.create(null, range.parent.copy())), 1, 0), 1, true));
      range = new NodeRange(tr.doc.resolve(range.$from.pos), tr.doc.resolve(endOfList), range.depth);
    }
    dispatch(tr.lift(range, liftTarget(range)).scrollIntoView());
    return true
  }

  function liftOutOfList(state, dispatch, range) {
    var tr = state.tr, list = range.parent;
    // Merge the list items into a single big item
    for (var pos = range.end, i = range.endIndex - 1, e = range.startIndex; i > e; i--) {
      pos -= list.child(i).nodeSize;
      tr.delete(pos - 1, pos + 1);
    }
    var $start = tr.doc.resolve(range.start), item = $start.nodeAfter;
    var atStart = range.startIndex == 0, atEnd = range.endIndex == list.childCount;
    var parent = $start.node(-1), indexBefore = $start.index(-1);
    if (!parent.canReplace(indexBefore + (atStart ? 0 : 1), indexBefore + 1,
                           item.content.append(atEnd ? Fragment.empty : Fragment.from(list))))
      { return false }
    var start = $start.pos, end = start + item.nodeSize;
    // Strip off the surrounding list. At the sides where we're not at
    // the end of the list, the existing list is closed. At sides where
    // this is the end, it is overwritten to its end.
    tr.step(new ReplaceAroundStep(start - (atStart ? 1 : 0), end + (atEnd ? 1 : 0), start + 1, end - 1,
                                  new Slice((atStart ? Fragment.empty : Fragment.from(list.copy(Fragment.empty)))
                                            .append(atEnd ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))),
                                            atStart ? 0 : 1, atEnd ? 0 : 1), atStart ? 0 : 1));
    dispatch(tr.scrollIntoView());
    return true
  }

  // :: (NodeType) → (state: EditorState, dispatch: ?(tr: Transaction)) → bool
  // Create a command to sink the list item around the selection down
  // into an inner list.
  function sinkListItem(itemType) {
    return function(state, dispatch) {
      var ref = state.selection;
      var $from = ref.$from;
      var $to = ref.$to;
      var range = $from.blockRange($to, function (node) { return node.childCount && node.firstChild.type == itemType; });
      if (!range) { return false }
      var startIndex = range.startIndex;
      if (startIndex == 0) { return false }
      var parent = range.parent, nodeBefore = parent.child(startIndex - 1);
      if (nodeBefore.type != itemType) { return false }

      if (dispatch) {
        var nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
        var inner = Fragment.from(nestedBefore ? itemType.create() : null);
        var slice = new Slice(Fragment.from(itemType.create(null, Fragment.from(parent.type.create(null, inner)))),
                              nestedBefore ? 3 : 1, 0);
        var before = range.start, after = range.end;
        dispatch(state.tr.step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after,
                                                     before, after, slice, 1, true))
                 .scrollIntoView());
      }
      return true
    }
  }

  var GOOD_LEAF_SIZE = 200;

  // :: class<T> A rope sequence is a persistent sequence data structure
  // that supports appending, prepending, and slicing without doing a
  // full copy. It is represented as a mostly-balanced tree.
  var RopeSequence = function RopeSequence () {};

  RopeSequence.prototype.append = function append (other) {
    if (!other.length) { return this }
    other = RopeSequence.from(other);

    return (!this.length && other) ||
      (other.length < GOOD_LEAF_SIZE && this.leafAppend(other)) ||
      (this.length < GOOD_LEAF_SIZE && other.leafPrepend(this)) ||
      this.appendInner(other)
  };

  // :: (union<[T], RopeSequence<T>>) → RopeSequence<T>
  // Prepend an array or other rope to this one, returning a new rope.
  RopeSequence.prototype.prepend = function prepend (other) {
    if (!other.length) { return this }
    return RopeSequence.from(other).append(this)
  };

  RopeSequence.prototype.appendInner = function appendInner (other) {
    return new Append(this, other)
  };

  // :: (?number, ?number) → RopeSequence<T>
  // Create a rope repesenting a sub-sequence of this rope.
  RopeSequence.prototype.slice = function slice (from, to) {
      if ( from === void 0 ) from = 0;
      if ( to === void 0 ) to = this.length;

    if (from >= to) { return RopeSequence.empty }
    return this.sliceInner(Math.max(0, from), Math.min(this.length, to))
  };

  // :: (number) → T
  // Retrieve the element at the given position from this rope.
  RopeSequence.prototype.get = function get (i) {
    if (i < 0 || i >= this.length) { return undefined }
    return this.getInner(i)
  };

  // :: ((element: T, index: number) → ?bool, ?number, ?number)
  // Call the given function for each element between the given
  // indices. This tends to be more efficient than looping over the
  // indices and calling `get`, because it doesn't have to descend the
  // tree for every element.
  RopeSequence.prototype.forEach = function forEach (f, from, to) {
      if ( from === void 0 ) from = 0;
      if ( to === void 0 ) to = this.length;

    if (from <= to)
      { this.forEachInner(f, from, to, 0); }
    else
      { this.forEachInvertedInner(f, from, to, 0); }
  };

  // :: ((element: T, index: number) → U, ?number, ?number) → [U]
  // Map the given functions over the elements of the rope, producing
  // a flat array.
  RopeSequence.prototype.map = function map (f, from, to) {
      if ( from === void 0 ) from = 0;
      if ( to === void 0 ) to = this.length;

    var result = [];
    this.forEach(function (elt, i) { return result.push(f(elt, i)); }, from, to);
    return result
  };

  // :: (?union<[T], RopeSequence<T>>) → RopeSequence<T>
  // Create a rope representing the given array, or return the rope
  // itself if a rope was given.
  RopeSequence.from = function from (values) {
    if (values instanceof RopeSequence) { return values }
    return values && values.length ? new Leaf(values) : RopeSequence.empty
  };

  var Leaf = /*@__PURE__*/(function (RopeSequence) {
    function Leaf(values) {
      RopeSequence.call(this);
      this.values = values;
    }

    if ( RopeSequence ) Leaf.__proto__ = RopeSequence;
    Leaf.prototype = Object.create( RopeSequence && RopeSequence.prototype );
    Leaf.prototype.constructor = Leaf;

    var prototypeAccessors = { length: { configurable: true },depth: { configurable: true } };

    Leaf.prototype.flatten = function flatten () {
      return this.values
    };

    Leaf.prototype.sliceInner = function sliceInner (from, to) {
      if (from == 0 && to == this.length) { return this }
      return new Leaf(this.values.slice(from, to))
    };

    Leaf.prototype.getInner = function getInner (i) {
      return this.values[i]
    };

    Leaf.prototype.forEachInner = function forEachInner (f, from, to, start) {
      for (var i = from; i < to; i++)
        { if (f(this.values[i], start + i) === false) { return false } }
    };

    Leaf.prototype.forEachInvertedInner = function forEachInvertedInner (f, from, to, start) {
      for (var i = from - 1; i >= to; i--)
        { if (f(this.values[i], start + i) === false) { return false } }
    };

    Leaf.prototype.leafAppend = function leafAppend (other) {
      if (this.length + other.length <= GOOD_LEAF_SIZE)
        { return new Leaf(this.values.concat(other.flatten())) }
    };

    Leaf.prototype.leafPrepend = function leafPrepend (other) {
      if (this.length + other.length <= GOOD_LEAF_SIZE)
        { return new Leaf(other.flatten().concat(this.values)) }
    };

    prototypeAccessors.length.get = function () { return this.values.length };

    prototypeAccessors.depth.get = function () { return 0 };

    Object.defineProperties( Leaf.prototype, prototypeAccessors );

    return Leaf;
  }(RopeSequence));

  // :: RopeSequence
  // The empty rope sequence.
  RopeSequence.empty = new Leaf([]);

  var Append = /*@__PURE__*/(function (RopeSequence) {
    function Append(left, right) {
      RopeSequence.call(this);
      this.left = left;
      this.right = right;
      this.length = left.length + right.length;
      this.depth = Math.max(left.depth, right.depth) + 1;
    }

    if ( RopeSequence ) Append.__proto__ = RopeSequence;
    Append.prototype = Object.create( RopeSequence && RopeSequence.prototype );
    Append.prototype.constructor = Append;

    Append.prototype.flatten = function flatten () {
      return this.left.flatten().concat(this.right.flatten())
    };

    Append.prototype.getInner = function getInner (i) {
      return i < this.left.length ? this.left.get(i) : this.right.get(i - this.left.length)
    };

    Append.prototype.forEachInner = function forEachInner (f, from, to, start) {
      var leftLen = this.left.length;
      if (from < leftLen &&
          this.left.forEachInner(f, from, Math.min(to, leftLen), start) === false)
        { return false }
      if (to > leftLen &&
          this.right.forEachInner(f, Math.max(from - leftLen, 0), Math.min(this.length, to) - leftLen, start + leftLen) === false)
        { return false }
    };

    Append.prototype.forEachInvertedInner = function forEachInvertedInner (f, from, to, start) {
      var leftLen = this.left.length;
      if (from > leftLen &&
          this.right.forEachInvertedInner(f, from - leftLen, Math.max(to, leftLen) - leftLen, start + leftLen) === false)
        { return false }
      if (to < leftLen &&
          this.left.forEachInvertedInner(f, Math.min(from, leftLen), to, start) === false)
        { return false }
    };

    Append.prototype.sliceInner = function sliceInner (from, to) {
      if (from == 0 && to == this.length) { return this }
      var leftLen = this.left.length;
      if (to <= leftLen) { return this.left.slice(from, to) }
      if (from >= leftLen) { return this.right.slice(from - leftLen, to - leftLen) }
      return this.left.slice(from, leftLen).append(this.right.slice(0, to - leftLen))
    };

    Append.prototype.leafAppend = function leafAppend (other) {
      var inner = this.right.leafAppend(other);
      if (inner) { return new Append(this.left, inner) }
    };

    Append.prototype.leafPrepend = function leafPrepend (other) {
      var inner = this.left.leafPrepend(other);
      if (inner) { return new Append(inner, this.right) }
    };

    Append.prototype.appendInner = function appendInner (other) {
      if (this.left.depth >= Math.max(this.right.depth, other.depth) + 1)
        { return new Append(this.left, new Append(this.right, other)) }
      return new Append(this, other)
    };

    return Append;
  }(RopeSequence));

  var ropeSequence = RopeSequence;

  // ProseMirror's history isn't simply a way to roll back to a previous
  // state, because ProseMirror supports applying changes without adding
  // them to the history (for example during collaboration).
  //
  // To this end, each 'Branch' (one for the undo history and one for
  // the redo history) keeps an array of 'Items', which can optionally
  // hold a step (an actual undoable change), and always hold a position
  // map (which is needed to move changes below them to apply to the
  // current document).
  //
  // An item that has both a step and a selection bookmark is the start
  // of an 'event' — a group of changes that will be undone or redone at
  // once. (It stores only the bookmark, since that way we don't have to
  // provide a document until the selection is actually applied, which
  // is useful when compressing.)

  // Used to schedule history compression
  var max_empty_items = 500;

  var Branch = function Branch(items, eventCount) {
    this.items = items;
    this.eventCount = eventCount;
  };

  // : (EditorState, bool) → ?{transform: Transform, selection: ?SelectionBookmark, remaining: Branch}
  // Pop the latest event off the branch's history and apply it
  // to a document transform.
  Branch.prototype.popEvent = function popEvent (state, preserveItems) {
      var this$1 = this;

    if (this.eventCount == 0) { return null }

    var end = this.items.length;
    for (;; end--) {
      var next = this.items.get(end - 1);
      if (next.selection) { --end; break }
    }

    var remap, mapFrom;
    if (preserveItems) {
      remap = this.remapping(end, this.items.length);
      mapFrom = remap.maps.length;
    }
    var transform = state.tr;
    var selection, remaining;
    var addAfter = [], addBefore = [];

    this.items.forEach(function (item, i) {
      if (!item.step) {
        if (!remap) {
          remap = this$1.remapping(end, i + 1);
          mapFrom = remap.maps.length;
        }
        mapFrom--;
        addBefore.push(item);
        return
      }

      if (remap) {
        addBefore.push(new Item(item.map));
        var step = item.step.map(remap.slice(mapFrom)), map;

        if (step && transform.maybeStep(step).doc) {
          map = transform.mapping.maps[transform.mapping.maps.length - 1];
          addAfter.push(new Item(map, null, null, addAfter.length + addBefore.length));
        }
        mapFrom--;
        if (map) { remap.appendMap(map, mapFrom); }
      } else {
        transform.maybeStep(item.step);
      }

      if (item.selection) {
        selection = remap ? item.selection.map(remap.slice(mapFrom)) : item.selection;
        remaining = new Branch(this$1.items.slice(0, end).append(addBefore.reverse().concat(addAfter)), this$1.eventCount - 1);
        return false
      }
    }, this.items.length, 0);

    return {remaining: remaining, transform: transform, selection: selection}
  };

  // : (Transform, ?SelectionBookmark, Object) → Branch
  // Create a new branch with the given transform added.
  Branch.prototype.addTransform = function addTransform (transform, selection, histOptions, preserveItems) {
    var newItems = [], eventCount = this.eventCount;
    var oldItems = this.items, lastItem = !preserveItems && oldItems.length ? oldItems.get(oldItems.length - 1) : null;

    for (var i = 0; i < transform.steps.length; i++) {
      var step = transform.steps[i].invert(transform.docs[i]);
      var item = new Item(transform.mapping.maps[i], step, selection), merged = (void 0);
      if (merged = lastItem && lastItem.merge(item)) {
        item = merged;
        if (i) { newItems.pop(); }
        else { oldItems = oldItems.slice(0, oldItems.length - 1); }
      }
      newItems.push(item);
      if (selection) {
        eventCount++;
        selection = null;
      }
      if (!preserveItems) { lastItem = item; }
    }
    var overflow = eventCount - histOptions.depth;
    if (overflow > DEPTH_OVERFLOW) {
      oldItems = cutOffEvents(oldItems, overflow);
      eventCount -= overflow;
    }
    return new Branch(oldItems.append(newItems), eventCount)
  };

  Branch.prototype.remapping = function remapping (from, to) {
    var maps = new Mapping;
    this.items.forEach(function (item, i) {
      var mirrorPos = item.mirrorOffset != null && i - item.mirrorOffset >= from
          ? mirrorPos = maps.maps.length - item.mirrorOffset : null;
      maps.appendMap(item.map, mirrorPos);
    }, from, to);
    return maps
  };

  Branch.prototype.addMaps = function addMaps (array) {
    if (this.eventCount == 0) { return this }
    return new Branch(this.items.append(array.map(function (map) { return new Item(map); })), this.eventCount)
  };

  // : (Transform, number)
  // When the collab module receives remote changes, the history has
  // to know about those, so that it can adjust the steps that were
  // rebased on top of the remote changes, and include the position
  // maps for the remote changes in its array of items.
  Branch.prototype.rebased = function rebased (rebasedTransform, rebasedCount) {
    if (!this.eventCount) { return this }

    var rebasedItems = [], start = Math.max(0, this.items.length - rebasedCount);

    var mapping = rebasedTransform.mapping;
    var newUntil = rebasedTransform.steps.length;
    var eventCount = this.eventCount;
    this.items.forEach(function (item) { if (item.selection) { eventCount--; } }, start);

    var iRebased = rebasedCount;
    this.items.forEach(function (item) {
      var pos = mapping.getMirror(--iRebased);
      if (pos == null) { return }
      newUntil = Math.min(newUntil, pos);
      var map = mapping.maps[pos];
      if (item.step) {
        var step = rebasedTransform.steps[pos].invert(rebasedTransform.docs[pos]);
        var selection = item.selection && item.selection.map(mapping.slice(iRebased + 1, pos));
        if (selection) { eventCount++; }
        rebasedItems.push(new Item(map, step, selection));
      } else {
        rebasedItems.push(new Item(map));
      }
    }, start);

    var newMaps = [];
    for (var i = rebasedCount; i < newUntil; i++)
      { newMaps.push(new Item(mapping.maps[i])); }
    var items = this.items.slice(0, start).append(newMaps).append(rebasedItems);
    var branch = new Branch(items, eventCount);

    if (branch.emptyItemCount() > max_empty_items)
      { branch = branch.compress(this.items.length - rebasedItems.length); }
    return branch
  };

  Branch.prototype.emptyItemCount = function emptyItemCount () {
    var count = 0;
    this.items.forEach(function (item) { if (!item.step) { count++; } });
    return count
  };

  // Compressing a branch means rewriting it to push the air (map-only
  // items) out. During collaboration, these naturally accumulate
  // because each remote change adds one. The `upto` argument is used
  // to ensure that only the items below a given level are compressed,
  // because `rebased` relies on a clean, untouched set of items in
  // order to associate old items with rebased steps.
  Branch.prototype.compress = function compress (upto) {
      if ( upto === void 0 ) upto = this.items.length;

    var remap = this.remapping(0, upto), mapFrom = remap.maps.length;
    var items = [], events = 0;
    this.items.forEach(function (item, i) {
      if (i >= upto) {
        items.push(item);
        if (item.selection) { events++; }
      } else if (item.step) {
        var step = item.step.map(remap.slice(mapFrom)), map = step && step.getMap();
        mapFrom--;
        if (map) { remap.appendMap(map, mapFrom); }
        if (step) {
          var selection = item.selection && item.selection.map(remap.slice(mapFrom));
          if (selection) { events++; }
          var newItem = new Item(map.invert(), step, selection), merged, last = items.length - 1;
          if (merged = items.length && items[last].merge(newItem))
            { items[last] = merged; }
          else
            { items.push(newItem); }
        }
      } else if (item.map) {
        mapFrom--;
      }
    }, this.items.length, 0);
    return new Branch(ropeSequence.from(items.reverse()), events)
  };

  Branch.empty = new Branch(ropeSequence.empty, 0);

  function cutOffEvents(items, n) {
    var cutPoint;
    items.forEach(function (item, i) {
      if (item.selection && (n-- == 0)) {
        cutPoint = i;
        return false
      }
    });
    return items.slice(cutPoint)
  }

  var Item = function Item(map, step, selection, mirrorOffset) {
    // The (forward) step map for this item.
    this.map = map;
    // The inverted step
    this.step = step;
    // If this is non-null, this item is the start of a group, and
    // this selection is the starting selection for the group (the one
    // that was active before the first step was applied)
    this.selection = selection;
    // If this item is the inverse of a previous mapping on the stack,
    // this points at the inverse's offset
    this.mirrorOffset = mirrorOffset;
  };

  Item.prototype.merge = function merge (other) {
    if (this.step && other.step && !other.selection) {
      var step = other.step.merge(this.step);
      if (step) { return new Item(step.getMap().invert(), step, this.selection) }
    }
  };

  // The value of the state field that tracks undo/redo history for that
  // state. Will be stored in the plugin state when the history plugin
  // is active.
  var HistoryState = function HistoryState(done, undone, prevRanges, prevTime) {
    this.done = done;
    this.undone = undone;
    this.prevRanges = prevRanges;
    this.prevTime = prevTime;
  };

  var DEPTH_OVERFLOW = 20;

  // : (HistoryState, EditorState, Transaction, Object)
  // Record a transformation in undo history.
  function applyTransaction(history, state, tr, options) {
    var historyTr = tr.getMeta(historyKey), rebased;
    if (historyTr) { return historyTr.historyState }

    if (tr.getMeta(closeHistoryKey)) { history = new HistoryState(history.done, history.undone, null, 0); }

    var appended = tr.getMeta("appendedTransaction");

    if (tr.steps.length == 0) {
      return history
    } else if (appended && appended.getMeta(historyKey)) {
      if (appended.getMeta(historyKey).redo)
        { return new HistoryState(history.done.addTransform(tr, null, options, mustPreserveItems(state)),
                                history.undone, rangesFor(tr.mapping.maps[tr.steps.length - 1]), history.prevTime) }
      else
        { return new HistoryState(history.done, history.undone.addTransform(tr, null, options, mustPreserveItems(state)),
                                null, history.prevTime) }
    } else if (tr.getMeta("addToHistory") !== false && !(appended && appended.getMeta("addToHistory") === false)) {
      // Group transforms that occur in quick succession into one event.
      var newGroup = !appended && (history.prevTime < (tr.time || 0) - options.newGroupDelay ||
                                   !isAdjacentTo(tr, history.prevRanges));
      var prevRanges = appended ? mapRanges(history.prevRanges, tr.mapping) : rangesFor(tr.mapping.maps[tr.steps.length - 1]);
      return new HistoryState(history.done.addTransform(tr, newGroup ? state.selection.getBookmark() : null,
                                                        options, mustPreserveItems(state)),
                              Branch.empty, prevRanges, tr.time)
    } else if (rebased = tr.getMeta("rebased")) {
      // Used by the collab module to tell the history that some of its
      // content has been rebased.
      return new HistoryState(history.done.rebased(tr, rebased),
                              history.undone.rebased(tr, rebased),
                              mapRanges(history.prevRanges, tr.mapping), history.prevTime)
    } else {
      return new HistoryState(history.done.addMaps(tr.mapping.maps),
                              history.undone.addMaps(tr.mapping.maps),
                              mapRanges(history.prevRanges, tr.mapping), history.prevTime)
    }
  }

  function isAdjacentTo(transform, prevRanges) {
    if (!prevRanges) { return false }
    if (!transform.docChanged) { return true }
    var adjacent = false;
    transform.mapping.maps[0].forEach(function (start, end) {
      for (var i = 0; i < prevRanges.length; i += 2)
        { if (start <= prevRanges[i + 1] && end >= prevRanges[i])
          { adjacent = true; } }
    });
    return adjacent
  }

  function rangesFor(map) {
    var result = [];
    map.forEach(function (_from, _to, from, to) { return result.push(from, to); });
    return result
  }

  function mapRanges(ranges, mapping) {
    if (!ranges) { return null }
    var result = [];
    for (var i = 0; i < ranges.length; i += 2) {
      var from = mapping.map(ranges[i], 1), to = mapping.map(ranges[i + 1], -1);
      if (from <= to) { result.push(from, to); }
    }
    return result
  }

  // : (HistoryState, EditorState, (tr: Transaction), bool)
  // Apply the latest event from one branch to the document and shift the event
  // onto the other branch.
  function histTransaction(history, state, dispatch, redo) {
    var preserveItems = mustPreserveItems(state), histOptions = historyKey.get(state).spec.config;
    var pop = (redo ? history.undone : history.done).popEvent(state, preserveItems);
    if (!pop) { return }

    var selection = pop.selection.resolve(pop.transform.doc);
    var added = (redo ? history.done : history.undone).addTransform(pop.transform, state.selection.getBookmark(),
                                                                    histOptions, preserveItems);

    var newHist = new HistoryState(redo ? added : pop.remaining, redo ? pop.remaining : added, null, 0);
    dispatch(pop.transform.setSelection(selection).setMeta(historyKey, {redo: redo, historyState: newHist}).scrollIntoView());
  }

  var cachedPreserveItems = false, cachedPreserveItemsPlugins = null;
  // Check whether any plugin in the given state has a
  // `historyPreserveItems` property in its spec, in which case we must
  // preserve steps exactly as they came in, so that they can be
  // rebased.
  function mustPreserveItems(state) {
    var plugins = state.plugins;
    if (cachedPreserveItemsPlugins != plugins) {
      cachedPreserveItems = false;
      cachedPreserveItemsPlugins = plugins;
      for (var i = 0; i < plugins.length; i++) { if (plugins[i].spec.historyPreserveItems) {
        cachedPreserveItems = true;
        break
      } }
    }
    return cachedPreserveItems
  }

  var historyKey = new PluginKey("history");
  var closeHistoryKey = new PluginKey("closeHistory");

  // :: (?Object) → Plugin
  // Returns a plugin that enables the undo history for an editor. The
  // plugin will track undo and redo stacks, which can be used with the
  // [`undo`](#history.undo) and [`redo`](#history.redo) commands.
  //
  // You can set an `"addToHistory"` [metadata
  // property](#state.Transaction.setMeta) of `false` on a transaction
  // to prevent it from being rolled back by undo.
  //
  //   config::-
  //   Supports the following configuration options:
  //
  //     depth:: ?number
  //     The amount of history events that are collected before the
  //     oldest events are discarded. Defaults to 100.
  //
  //     newGroupDelay:: ?number
  //     The delay between changes after which a new group should be
  //     started. Defaults to 500 (milliseconds). Note that when changes
  //     aren't adjacent, a new group is always started.
  function history(config) {
    config = {depth: config && config.depth || 100,
              newGroupDelay: config && config.newGroupDelay || 500};
    return new Plugin({
      key: historyKey,

      state: {
        init: function init() {
          return new HistoryState(Branch.empty, Branch.empty, null, 0)
        },
        apply: function apply(tr, hist, state) {
          return applyTransaction(hist, state, tr, config)
        }
      },

      config: config
    })
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // A command function that undoes the last change, if any.
  function undo(state, dispatch) {
    var hist = historyKey.getState(state);
    if (!hist || hist.done.eventCount == 0) { return false }
    if (dispatch) { histTransaction(hist, state, dispatch, false); }
    return true
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // A command function that redoes the last undone change, if any.
  function redo(state, dispatch) {
    var hist = historyKey.getState(state);
    if (!hist || hist.undone.eventCount == 0) { return false }
    if (dispatch) { histTransaction(hist, state, dispatch, true); }
    return true
  }

  var base = {
    8: "Backspace",
    9: "Tab",
    10: "Enter",
    12: "NumLock",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    44: "PrintScreen",
    45: "Insert",
    46: "Delete",
    59: ";",
    61: "=",
    91: "Meta",
    92: "Meta",
    106: "*",
    107: "+",
    108: ",",
    109: "-",
    110: ".",
    111: "/",
    144: "NumLock",
    145: "ScrollLock",
    160: "Shift",
    161: "Shift",
    162: "Control",
    163: "Control",
    164: "Alt",
    165: "Alt",
    173: "-",
    186: ";",
    187: "=",
    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "`",
    219: "[",
    220: "\\",
    221: "]",
    222: "'",
    229: "q"
  };
  var base_1 = base;

  var shift = {
    48: ")",
    49: "!",
    50: "@",
    51: "#",
    52: "$",
    53: "%",
    54: "^",
    55: "&",
    56: "*",
    57: "(",
    59: ";",
    61: "+",
    173: "_",
    186: ":",
    187: "+",
    188: "<",
    189: "_",
    190: ">",
    191: "?",
    192: "~",
    219: "{",
    220: "|",
    221: "}",
    222: "\"",
    229: "Q"
  };

  var chrome$1 = typeof navigator != "undefined" && /Chrome\/(\d+)/.exec(navigator.userAgent);
  var safari = typeof navigator != "undefined" && /Apple Computer/.test(navigator.vendor);
  var gecko = typeof navigator != "undefined" && /Gecko\/\d+/.test(navigator.userAgent);
  var mac = typeof navigator != "undefined" && /Mac/.test(navigator.platform);
  var ie$1 = typeof navigator != "undefined" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);
  var brokenModifierNames = chrome$1 && +chrome$1[1] < 57 || gecko && mac;

  // Fill in the digit keys
  for (var i = 0; i < 10; i++) base[48 + i] = base[96 + i] = String(i);

  // The function keys
  for (var i = 1; i <= 24; i++) base[i + 111] = "F" + i;

  // And the alphabetic keys
  for (var i = 65; i <= 90; i++) {
    base[i] = String.fromCharCode(i + 32);
    shift[i] = String.fromCharCode(i);
  }

  // For each code that doesn't have a shift-equivalent, copy the base name
  for (var code in base) if (!shift.hasOwnProperty(code)) shift[code] = base[code];

  var keyName = function(event) {
    // Don't trust event.key in Chrome when there are modifiers until
    // they fix https://bugs.chromium.org/p/chromium/issues/detail?id=633838
    var ignoreKey = brokenModifierNames && (event.ctrlKey || event.altKey || event.metaKey) ||
      (safari || ie$1) && event.shiftKey && event.key && event.key.length == 1;
    var name = (!ignoreKey && event.key) ||
      (event.shiftKey ? shift : base)[event.keyCode] ||
      event.key || "Unidentified";
    // Edge sometimes produces wrong names (Issue #3)
    if (name == "Esc") name = "Escape";
    if (name == "Del") name = "Delete";
    // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8860571/
    if (name == "Left") name = "ArrowLeft";
    if (name == "Up") name = "ArrowUp";
    if (name == "Right") name = "ArrowRight";
    if (name == "Down") name = "ArrowDown";
    return name
  };

  // declare global: navigator

  var mac$1 = typeof navigator != "undefined" ? /Mac/.test(navigator.platform) : false;

  function normalizeKeyName(name) {
    var parts = name.split(/-(?!$)/), result = parts[parts.length - 1];
    if (result == "Space") { result = " "; }
    var alt, ctrl, shift, meta;
    for (var i = 0; i < parts.length - 1; i++) {
      var mod = parts[i];
      if (/^(cmd|meta|m)$/i.test(mod)) { meta = true; }
      else if (/^a(lt)?$/i.test(mod)) { alt = true; }
      else if (/^(c|ctrl|control)$/i.test(mod)) { ctrl = true; }
      else if (/^s(hift)?$/i.test(mod)) { shift = true; }
      else if (/^mod$/i.test(mod)) { if (mac$1) { meta = true; } else { ctrl = true; } }
      else { throw new Error("Unrecognized modifier name: " + mod) }
    }
    if (alt) { result = "Alt-" + result; }
    if (ctrl) { result = "Ctrl-" + result; }
    if (meta) { result = "Meta-" + result; }
    if (shift) { result = "Shift-" + result; }
    return result
  }

  function normalize(map) {
    var copy = Object.create(null);
    for (var prop in map) { copy[normalizeKeyName(prop)] = map[prop]; }
    return copy
  }

  function modifiers(name, event, shift) {
    if (event.altKey) { name = "Alt-" + name; }
    if (event.ctrlKey) { name = "Ctrl-" + name; }
    if (event.metaKey) { name = "Meta-" + name; }
    if (shift !== false && event.shiftKey) { name = "Shift-" + name; }
    return name
  }

  // :: (Object) → Plugin
  // Create a keymap plugin for the given set of bindings.
  //
  // Bindings should map key names to [command](#commands)-style
  // functions, which will be called with `(EditorState, dispatch,
  // EditorView)` arguments, and should return true when they've handled
  // the key. Note that the view argument isn't part of the command
  // protocol, but can be used as an escape hatch if a binding needs to
  // directly interact with the UI.
  //
  // Key names may be strings like `"Shift-Ctrl-Enter"`—a key
  // identifier prefixed with zero or more modifiers. Key identifiers
  // are based on the strings that can appear in
  // [`KeyEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key).
  // Use lowercase letters to refer to letter keys (or uppercase letters
  // if you want shift to be held). You may use `"Space"` as an alias
  // for the `" "` name.
  //
  // Modifiers can be given in any order. `Shift-` (or `s-`), `Alt-` (or
  // `a-`), `Ctrl-` (or `c-` or `Control-`) and `Cmd-` (or `m-` or
  // `Meta-`) are recognized. For characters that are created by holding
  // shift, the `Shift-` prefix is implied, and should not be added
  // explicitly.
  //
  // You can use `Mod-` as a shorthand for `Cmd-` on Mac and `Ctrl-` on
  // other platforms.
  //
  // You can add multiple keymap plugins to an editor. The order in
  // which they appear determines their precedence (the ones early in
  // the array get to dispatch first).
  function keymap(bindings) {
    return new Plugin({props: {handleKeyDown: keydownHandler(bindings)}})
  }

  // :: (Object) → (view: EditorView, event: dom.Event) → bool
  // Given a set of bindings (using the same format as
  // [`keymap`](#keymap.keymap), return a [keydown
  // handler](#view.EditorProps.handleKeyDown) that handles them.
  function keydownHandler(bindings) {
    var map = normalize(bindings);
    return function(view, event) {
      var name = keyName(event), isChar = name.length == 1 && name != " ", baseName;
      var direct = map[modifiers(name, event, !isChar)];
      if (direct && direct(view.state, view.dispatch, view)) { return true }
      if (isChar && (event.shiftKey || event.altKey || event.metaKey) &&
          (baseName = base_1[event.keyCode]) && baseName != name) {
        var fromCode = map[modifiers(baseName, event, true)];
        if (fromCode && fromCode(view.state, view.dispatch, view)) { return true }
      } else if (isChar && event.shiftKey) {
        var withShift = map[modifiers(name, event, true)];
        if (withShift && withShift(view.state, view.dispatch, view)) { return true }
      }
      return false
    }
  }

  var index_es$4 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    keydownHandler: keydownHandler,
    keymap: keymap
  });

  // :: (EditorState, ?(tr: Transaction)) → bool
  // Delete the selection, if there is one.
  function deleteSelection(state, dispatch) {
    if (state.selection.empty) { return false }
    if (dispatch) { dispatch(state.tr.deleteSelection().scrollIntoView()); }
    return true
  }

  // :: (EditorState, ?(tr: Transaction), ?EditorView) → bool
  // If the selection is empty and at the start of a textblock, try to
  // reduce the distance between that block and the one before it—if
  // there's a block directly before it that can be joined, join them.
  // If not, try to move the selected block closer to the next one in
  // the document structure by lifting it out of its parent or moving it
  // into a parent of the previous block. Will use the view for accurate
  // (bidi-aware) start-of-textblock detection if given.
  function joinBackward(state, dispatch, view) {
    var ref = state.selection;
    var $cursor = ref.$cursor;
    if (!$cursor || (view ? !view.endOfTextblock("backward", state)
                          : $cursor.parentOffset > 0))
      { return false }

    var $cut = findCutBefore($cursor);

    // If there is no node before this, try to lift
    if (!$cut) {
      var range = $cursor.blockRange(), target = range && liftTarget(range);
      if (target == null) { return false }
      if (dispatch) { dispatch(state.tr.lift(range, target).scrollIntoView()); }
      return true
    }

    var before = $cut.nodeBefore;
    // Apply the joining algorithm
    if (!before.type.spec.isolating && deleteBarrier(state, $cut, dispatch))
      { return true }

    // If the node below has no content and the node above is
    // selectable, delete the node below and select the one above.
    if ($cursor.parent.content.size == 0 &&
        (textblockAt(before, "end") || NodeSelection.isSelectable(before))) {
      if (dispatch) {
        var tr = state.tr.deleteRange($cursor.before(), $cursor.after());
        tr.setSelection(textblockAt(before, "end") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos, -1)), -1)
                        : NodeSelection.create(tr.doc, $cut.pos - before.nodeSize));
        dispatch(tr.scrollIntoView());
      }
      return true
    }

    // If the node before is an atom, delete it
    if (before.isAtom && $cut.depth == $cursor.depth - 1) {
      if (dispatch) { dispatch(state.tr.delete($cut.pos - before.nodeSize, $cut.pos).scrollIntoView()); }
      return true
    }

    return false
  }

  function textblockAt(node, side) {
    for (; node; node = (side == "start" ? node.firstChild : node.lastChild))
      { if (node.isTextblock) { return true } }
    return false
  }

  // :: (EditorState, ?(tr: Transaction), ?EditorView) → bool
  // When the selection is empty and at the start of a textblock, select
  // the node before that textblock, if possible. This is intended to be
  // bound to keys like backspace, after
  // [`joinBackward`](#commands.joinBackward) or other deleting
  // commands, as a fall-back behavior when the schema doesn't allow
  // deletion at the selected point.
  function selectNodeBackward(state, dispatch, view) {
    var ref = state.selection;
    var $cursor = ref.$cursor;
    if (!$cursor || (view ? !view.endOfTextblock("backward", state)
                          : $cursor.parentOffset > 0))
      { return false }

    var $cut = findCutBefore($cursor), node = $cut && $cut.nodeBefore;
    if (!node || !NodeSelection.isSelectable(node)) { return false }
    if (dispatch)
      { dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos - node.nodeSize)).scrollIntoView()); }
    return true
  }

  function findCutBefore($pos) {
    if (!$pos.parent.type.spec.isolating) { for (var i = $pos.depth - 1; i >= 0; i--) {
      if ($pos.index(i) > 0) { return $pos.doc.resolve($pos.before(i + 1)) }
      if ($pos.node(i).type.spec.isolating) { break }
    } }
    return null
  }

  // :: (EditorState, ?(tr: Transaction), ?EditorView) → bool
  // If the selection is empty and the cursor is at the end of a
  // textblock, try to reduce or remove the boundary between that block
  // and the one after it, either by joining them or by moving the other
  // block closer to this one in the tree structure. Will use the view
  // for accurate start-of-textblock detection if given.
  function joinForward(state, dispatch, view) {
    var ref = state.selection;
    var $cursor = ref.$cursor;
    if (!$cursor || (view ? !view.endOfTextblock("forward", state)
                          : $cursor.parentOffset < $cursor.parent.content.size))
      { return false }

    var $cut = findCutAfter($cursor);

    // If there is no node after this, there's nothing to do
    if (!$cut) { return false }

    var after = $cut.nodeAfter;
    // Try the joining algorithm
    if (deleteBarrier(state, $cut, dispatch)) { return true }

    // If the node above has no content and the node below is
    // selectable, delete the node above and select the one below.
    if ($cursor.parent.content.size == 0 &&
        (textblockAt(after, "start") || NodeSelection.isSelectable(after))) {
      if (dispatch) {
        var tr = state.tr.deleteRange($cursor.before(), $cursor.after());
        tr.setSelection(textblockAt(after, "start") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos)), 1)
                        : NodeSelection.create(tr.doc, tr.mapping.map($cut.pos)));
        dispatch(tr.scrollIntoView());
      }
      return true
    }

    // If the next node is an atom, delete it
    if (after.isAtom && $cut.depth == $cursor.depth - 1) {
      if (dispatch) { dispatch(state.tr.delete($cut.pos, $cut.pos + after.nodeSize).scrollIntoView()); }
      return true
    }

    return false
  }

  // :: (EditorState, ?(tr: Transaction), ?EditorView) → bool
  // When the selection is empty and at the end of a textblock, select
  // the node coming after that textblock, if possible. This is intended
  // to be bound to keys like delete, after
  // [`joinForward`](#commands.joinForward) and similar deleting
  // commands, to provide a fall-back behavior when the schema doesn't
  // allow deletion at the selected point.
  function selectNodeForward(state, dispatch, view) {
    var ref = state.selection;
    var $cursor = ref.$cursor;
    if (!$cursor || (view ? !view.endOfTextblock("forward", state)
                          : $cursor.parentOffset < $cursor.parent.content.size))
      { return false }

    var $cut = findCutAfter($cursor), node = $cut && $cut.nodeAfter;
    if (!node || !NodeSelection.isSelectable(node)) { return false }
    if (dispatch)
      { dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos)).scrollIntoView()); }
    return true
  }

  function findCutAfter($pos) {
    if (!$pos.parent.type.spec.isolating) { for (var i = $pos.depth - 1; i >= 0; i--) {
      var parent = $pos.node(i);
      if ($pos.index(i) + 1 < parent.childCount) { return $pos.doc.resolve($pos.after(i + 1)) }
      if (parent.type.spec.isolating) { break }
    } }
    return null
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // Join the selected block or, if there is a text selection, the
  // closest ancestor block of the selection that can be joined, with
  // the sibling above it.
  function joinUp(state, dispatch) {
    var sel = state.selection, nodeSel = sel instanceof NodeSelection, point;
    if (nodeSel) {
      if (sel.node.isTextblock || !canJoin(state.doc, sel.from)) { return false }
      point = sel.from;
    } else {
      point = joinPoint(state.doc, sel.from, -1);
      if (point == null) { return false }
    }
    if (dispatch) {
      var tr = state.tr.join(point);
      if (nodeSel) { tr.setSelection(NodeSelection.create(tr.doc, point - state.doc.resolve(point).nodeBefore.nodeSize)); }
      dispatch(tr.scrollIntoView());
    }
    return true
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // Join the selected block, or the closest ancestor of the selection
  // that can be joined, with the sibling after it.
  function joinDown(state, dispatch) {
    var sel = state.selection, point;
    if (sel instanceof NodeSelection) {
      if (sel.node.isTextblock || !canJoin(state.doc, sel.to)) { return false }
      point = sel.to;
    } else {
      point = joinPoint(state.doc, sel.to, 1);
      if (point == null) { return false }
    }
    if (dispatch)
      { dispatch(state.tr.join(point).scrollIntoView()); }
    return true
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // Lift the selected block, or the closest ancestor block of the
  // selection that can be lifted, out of its parent node.
  function lift(state, dispatch) {
    var ref = state.selection;
    var $from = ref.$from;
    var $to = ref.$to;
    var range = $from.blockRange($to), target = range && liftTarget(range);
    if (target == null) { return false }
    if (dispatch) { dispatch(state.tr.lift(range, target).scrollIntoView()); }
    return true
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // If the selection is in a node whose type has a truthy
  // [`code`](#model.NodeSpec.code) property in its spec, replace the
  // selection with a newline character.
  function newlineInCode(state, dispatch) {
    var ref = state.selection;
    var $head = ref.$head;
    var $anchor = ref.$anchor;
    if (!$head.parent.type.spec.code || !$head.sameParent($anchor)) { return false }
    if (dispatch) { dispatch(state.tr.insertText("\n").scrollIntoView()); }
    return true
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // When the selection is in a node with a truthy
  // [`code`](#model.NodeSpec.code) property in its spec, create a
  // default block after the code block, and move the cursor there.
  function exitCode(state, dispatch) {
    var ref = state.selection;
    var $head = ref.$head;
    var $anchor = ref.$anchor;
    if (!$head.parent.type.spec.code || !$head.sameParent($anchor)) { return false }
    var above = $head.node(-1), after = $head.indexAfter(-1), type = above.contentMatchAt(after).defaultType;
    if (!above.canReplaceWith(after, after, type)) { return false }
    if (dispatch) {
      var pos = $head.after(), tr = state.tr.replaceWith(pos, pos, type.createAndFill());
      tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
      dispatch(tr.scrollIntoView());
    }
    return true
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // If a block node is selected, create an empty paragraph before (if
  // it is its parent's first child) or after it.
  function createParagraphNear(state, dispatch) {
    var ref = state.selection;
    var $from = ref.$from;
    var $to = ref.$to;
    if ($from.parent.inlineContent || $to.parent.inlineContent) { return false }
    var type = $from.parent.contentMatchAt($to.indexAfter()).defaultType;
    if (!type || !type.isTextblock) { return false }
    if (dispatch) {
      var side = (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to).pos;
      var tr = state.tr.insert(side, type.createAndFill());
      tr.setSelection(TextSelection.create(tr.doc, side + 1));
      dispatch(tr.scrollIntoView());
    }
    return true
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // If the cursor is in an empty textblock that can be lifted, lift the
  // block.
  function liftEmptyBlock(state, dispatch) {
    var ref = state.selection;
    var $cursor = ref.$cursor;
    if (!$cursor || $cursor.parent.content.size) { return false }
    if ($cursor.depth > 1 && $cursor.after() != $cursor.end(-1)) {
      var before = $cursor.before();
      if (canSplit(state.doc, before)) {
        if (dispatch) { dispatch(state.tr.split(before).scrollIntoView()); }
        return true
      }
    }
    var range = $cursor.blockRange(), target = range && liftTarget(range);
    if (target == null) { return false }
    if (dispatch) { dispatch(state.tr.lift(range, target).scrollIntoView()); }
    return true
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // Split the parent block of the selection. If the selection is a text
  // selection, also delete its content.
  function splitBlock(state, dispatch) {
    var ref = state.selection;
    var $from = ref.$from;
    var $to = ref.$to;
    if (state.selection instanceof NodeSelection && state.selection.node.isBlock) {
      if (!$from.parentOffset || !canSplit(state.doc, $from.pos)) { return false }
      if (dispatch) { dispatch(state.tr.split($from.pos).scrollIntoView()); }
      return true
    }

    if (!$from.parent.isBlock) { return false }

    if (dispatch) {
      var atEnd = $to.parentOffset == $to.parent.content.size;
      var tr = state.tr;
      if (state.selection instanceof TextSelection) { tr.deleteSelection(); }
      var deflt = $from.depth == 0 ? null : $from.node(-1).contentMatchAt($from.indexAfter(-1)).defaultType;
      var types = atEnd && deflt ? [{type: deflt}] : null;
      var can = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);
      if (!types && !can && canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt && [{type: deflt}])) {
        types = [{type: deflt}];
        can = true;
      }
      if (can) {
        tr.split(tr.mapping.map($from.pos), 1, types);
        if (!atEnd && !$from.parentOffset && $from.parent.type != deflt &&
            $from.node(-1).canReplace($from.index(-1), $from.indexAfter(-1), Fragment.from(deflt.create(), $from.parent)))
          { tr.setNodeMarkup(tr.mapping.map($from.before()), deflt); }
      }
      dispatch(tr.scrollIntoView());
    }
    return true
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // Move the selection to the node wrapping the current selection, if
  // any. (Will not select the document node.)
  function selectParentNode(state, dispatch) {
    var ref = state.selection;
    var $from = ref.$from;
    var to = ref.to;
    var pos;
    var same = $from.sharedDepth(to);
    if (same == 0) { return false }
    pos = $from.before(same);
    if (dispatch) { dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos))); }
    return true
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // Select the whole document.
  function selectAll(state, dispatch) {
    if (dispatch) { dispatch(state.tr.setSelection(new AllSelection(state.doc))); }
    return true
  }

  function joinMaybeClear(state, $pos, dispatch) {
    var before = $pos.nodeBefore, after = $pos.nodeAfter, index = $pos.index();
    if (!before || !after || !before.type.compatibleContent(after.type)) { return false }
    if (!before.content.size && $pos.parent.canReplace(index - 1, index)) {
      if (dispatch) { dispatch(state.tr.delete($pos.pos - before.nodeSize, $pos.pos).scrollIntoView()); }
      return true
    }
    if (!$pos.parent.canReplace(index, index + 1) || !(after.isTextblock || canJoin(state.doc, $pos.pos)))
      { return false }
    if (dispatch)
      { dispatch(state.tr
               .clearIncompatible($pos.pos, before.type, before.contentMatchAt(before.childCount))
               .join($pos.pos)
               .scrollIntoView()); }
    return true
  }

  function deleteBarrier(state, $cut, dispatch) {
    var before = $cut.nodeBefore, after = $cut.nodeAfter, conn, match;
    if (before.type.spec.isolating || after.type.spec.isolating) { return false }
    if (joinMaybeClear(state, $cut, dispatch)) { return true }

    if ($cut.parent.canReplace($cut.index(), $cut.index() + 1) &&
        (conn = (match = before.contentMatchAt(before.childCount)).findWrapping(after.type)) &&
        match.matchType(conn[0] || after.type).validEnd) {
      if (dispatch) {
        var end = $cut.pos + after.nodeSize, wrap = Fragment.empty;
        for (var i = conn.length - 1; i >= 0; i--)
          { wrap = Fragment.from(conn[i].create(null, wrap)); }
        wrap = Fragment.from(before.copy(wrap));
        var tr = state.tr.step(new ReplaceAroundStep($cut.pos - 1, end, $cut.pos, end, new Slice(wrap, 1, 0), conn.length, true));
        var joinAt = end + 2 * conn.length;
        if (canJoin(tr.doc, joinAt)) { tr.join(joinAt); }
        dispatch(tr.scrollIntoView());
      }
      return true
    }

    var selAfter = Selection.findFrom($cut, 1);
    var range = selAfter && selAfter.$from.blockRange(selAfter.$to), target = range && liftTarget(range);
    if (target != null && target >= $cut.depth) {
      if (dispatch) { dispatch(state.tr.lift(range, target).scrollIntoView()); }
      return true
    }

    return false
  }

  // Parameterized commands

  // :: (NodeType, ?Object) → (state: EditorState, dispatch: ?(tr: Transaction)) → bool
  // Wrap the selection in a node of the given type with the given
  // attributes.
  function wrapIn(nodeType, attrs) {
    return function(state, dispatch) {
      var ref = state.selection;
      var $from = ref.$from;
      var $to = ref.$to;
      var range = $from.blockRange($to), wrapping = range && findWrapping(range, nodeType, attrs);
      if (!wrapping) { return false }
      if (dispatch) { dispatch(state.tr.wrap(range, wrapping).scrollIntoView()); }
      return true
    }
  }

  // :: (NodeType, ?Object) → (state: EditorState, dispatch: ?(tr: Transaction)) → bool
  // Returns a command that tries to set the selected textblocks to the
  // given node type with the given attributes.
  function setBlockType(nodeType, attrs) {
    return function(state, dispatch) {
      var ref = state.selection;
      var from = ref.from;
      var to = ref.to;
      var applicable = false;
      state.doc.nodesBetween(from, to, function (node, pos) {
        if (applicable) { return false }
        if (!node.isTextblock || node.hasMarkup(nodeType, attrs)) { return }
        if (node.type == nodeType) {
          applicable = true;
        } else {
          var $pos = state.doc.resolve(pos), index = $pos.index();
          applicable = $pos.parent.canReplaceWith(index, index + 1, nodeType);
        }
      });
      if (!applicable) { return false }
      if (dispatch) { dispatch(state.tr.setBlockType(from, to, nodeType, attrs).scrollIntoView()); }
      return true
    }
  }

  function markApplies(doc, ranges, type) {
    var loop = function ( i ) {
      var ref = ranges[i];
      var $from = ref.$from;
      var $to = ref.$to;
      var can = $from.depth == 0 ? doc.type.allowsMarkType(type) : false;
      doc.nodesBetween($from.pos, $to.pos, function (node) {
        if (can) { return false }
        can = node.inlineContent && node.type.allowsMarkType(type);
      });
      if (can) { return { v: true } }
    };

    for (var i = 0; i < ranges.length; i++) {
      var returned = loop( i );

      if ( returned ) return returned.v;
    }
    return false
  }

  // :: (MarkType, ?Object) → (state: EditorState, dispatch: ?(tr: Transaction)) → bool
  // Create a command function that toggles the given mark with the
  // given attributes. Will return `false` when the current selection
  // doesn't support that mark. This will remove the mark if any marks
  // of that type exist in the selection, or add it otherwise. If the
  // selection is empty, this applies to the [stored
  // marks](#state.EditorState.storedMarks) instead of a range of the
  // document.
  function toggleMark(markType, attrs) {
    return function(state, dispatch) {
      var ref = state.selection;
      var empty = ref.empty;
      var $cursor = ref.$cursor;
      var ranges = ref.ranges;
      if ((empty && !$cursor) || !markApplies(state.doc, ranges, markType)) { return false }
      if (dispatch) {
        if ($cursor) {
          if (markType.isInSet(state.storedMarks || $cursor.marks()))
            { dispatch(state.tr.removeStoredMark(markType)); }
          else
            { dispatch(state.tr.addStoredMark(markType.create(attrs))); }
        } else {
          var has = false, tr = state.tr;
          for (var i = 0; !has && i < ranges.length; i++) {
            var ref$1 = ranges[i];
            var $from = ref$1.$from;
            var $to = ref$1.$to;
            has = state.doc.rangeHasMark($from.pos, $to.pos, markType);
          }
          for (var i$1 = 0; i$1 < ranges.length; i$1++) {
            var ref$2 = ranges[i$1];
            var $from$1 = ref$2.$from;
            var $to$1 = ref$2.$to;
            if (has) { tr.removeMark($from$1.pos, $to$1.pos, markType); }
            else { tr.addMark($from$1.pos, $to$1.pos, markType.create(attrs)); }
          }
          dispatch(tr.scrollIntoView());
        }
      }
      return true
    }
  }

  // :: (...[(EditorState, ?(tr: Transaction), ?EditorView) → bool]) → (EditorState, ?(tr: Transaction), ?EditorView) → bool
  // Combine a number of command functions into a single function (which
  // calls them one by one until one returns true).
  function chainCommands() {
    var commands = [], len = arguments.length;
    while ( len-- ) commands[ len ] = arguments[ len ];

    return function(state, dispatch, view) {
      for (var i = 0; i < commands.length; i++)
        { if (commands[i](state, dispatch, view)) { return true } }
      return false
    }
  }

  var backspace = chainCommands(deleteSelection, joinBackward, selectNodeBackward);
  var del = chainCommands(deleteSelection, joinForward, selectNodeForward);

  // :: Object
  // A basic keymap containing bindings not specific to any schema.
  // Binds the following keys (when multiple commands are listed, they
  // are chained with [`chainCommands`](#commands.chainCommands)):
  //
  // * **Enter** to `newlineInCode`, `createParagraphNear`, `liftEmptyBlock`, `splitBlock`
  // * **Mod-Enter** to `exitCode`
  // * **Backspace** and **Mod-Backspace** to `deleteSelection`, `joinBackward`, `selectNodeBackward`
  // * **Delete** and **Mod-Delete** to `deleteSelection`, `joinForward`, `selectNodeForward`
  // * **Mod-Delete** to `deleteSelection`, `joinForward`, `selectNodeForward`
  // * **Mod-a** to `selectAll`
  var pcBaseKeymap = {
    "Enter": chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock),
    "Mod-Enter": exitCode,
    "Backspace": backspace,
    "Mod-Backspace": backspace,
    "Delete": del,
    "Mod-Delete": del,
    "Mod-a": selectAll
  };

  // :: Object
  // A copy of `pcBaseKeymap` that also binds **Ctrl-h** like Backspace,
  // **Ctrl-d** like Delete, **Alt-Backspace** like Ctrl-Backspace, and
  // **Ctrl-Alt-Backspace**, **Alt-Delete**, and **Alt-d** like
  // Ctrl-Delete.
  var macBaseKeymap = {
    "Ctrl-h": pcBaseKeymap["Backspace"],
    "Alt-Backspace": pcBaseKeymap["Mod-Backspace"],
    "Ctrl-d": pcBaseKeymap["Delete"],
    "Ctrl-Alt-Backspace": pcBaseKeymap["Mod-Delete"],
    "Alt-Delete": pcBaseKeymap["Mod-Delete"],
    "Alt-d": pcBaseKeymap["Mod-Delete"]
  };
  for (var key in pcBaseKeymap) { macBaseKeymap[key] = pcBaseKeymap[key]; }

  // declare global: os, navigator
  var mac$2 = typeof navigator != "undefined" ? /Mac/.test(navigator.platform)
            : typeof os != "undefined" ? os.platform() == "darwin" : false;

  // :: Object
  // Depending on the detected platform, this will hold
  // [`pcBasekeymap`](#commands.pcBaseKeymap) or
  // [`macBaseKeymap`](#commands.macBaseKeymap).
  var baseKeymap = mac$2 ? macBaseKeymap : pcBaseKeymap;

  // :: (options: ?Object) → Plugin
  // Create a plugin that, when added to a ProseMirror instance,
  // causes a decoration to show up at the drop position when something
  // is dragged over the editor.
  //
  //   options::- These options are supported:
  //
  //     color:: ?string
  //     The color of the cursor. Defaults to `black`.
  //
  //     width:: ?number
  //     The precise width of the cursor in pixels. Defaults to 1.
  //
  //     class:: ?string
  //     A CSS class name to add to the cursor element.
  function dropCursor(options) {
    if ( options === void 0 ) options = {};

    return new Plugin({
      view: function view(editorView) { return new DropCursorView(editorView, options) }
    })
  }

  var DropCursorView = function DropCursorView(editorView, options) {
    var this$1 = this;

    this.editorView = editorView;
    this.width = options.width || 1;
    this.color = options.color || "black";
    this.class = options.class;
    this.cursorPos = null;
    this.element = null;
    this.timeout = null;

    this.handlers = ["dragover", "dragend", "drop", "dragleave"].map(function (name) {
      var handler = function (e) { return this$1[name](e); };
      editorView.dom.addEventListener(name, handler);
      return {name: name, handler: handler}
    });
  };

  DropCursorView.prototype.destroy = function destroy () {
      var this$1 = this;

    this.handlers.forEach(function (ref) {
        var name = ref.name;
        var handler = ref.handler;

        return this$1.editorView.dom.removeEventListener(name, handler);
      });
  };

  DropCursorView.prototype.update = function update (editorView, prevState) {
    if (this.cursorPos != null && prevState.doc != editorView.state.doc) { this.updateOverlay(); }
  };

  DropCursorView.prototype.setCursor = function setCursor (pos) {
    if (pos == this.cursorPos) { return }
    this.cursorPos = pos;
    if (pos == null) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    } else {
      this.updateOverlay();
    }
  };

  DropCursorView.prototype.updateOverlay = function updateOverlay () {
    var $pos = this.editorView.state.doc.resolve(this.cursorPos), rect;
    if (!$pos.parent.inlineContent) {
      var before = $pos.nodeBefore, after = $pos.nodeAfter;
      if (before || after) {
        var nodeRect = this.editorView.nodeDOM(this.cursorPos - (before ?before.nodeSize : 0)).getBoundingClientRect();
        var top = before ? nodeRect.bottom : nodeRect.top;
        if (before && after)
          { top = (top + this.editorView.nodeDOM(this.cursorPos).getBoundingClientRect().top) / 2; }
        rect = {left: nodeRect.left, right: nodeRect.right, top: top - this.width / 2, bottom: top + this.width / 2};
      }
    }
    if (!rect) {
      var coords = this.editorView.coordsAtPos(this.cursorPos);
      rect = {left: coords.left - this.width / 2, right: coords.left + this.width / 2, top: coords.top, bottom: coords.bottom};
    }

    var parent = this.editorView.dom.offsetParent;
    if (!this.element) {
      this.element = parent.appendChild(document.createElement("div"));
      if (this.class) { this.element.className = this.class; }
      this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none; background-color: " + this.color;
    }
    var parentRect = !parent || parent == document.body && getComputedStyle(parent).position == "static"
        ? {left: -pageXOffset, top: -pageYOffset} : parent.getBoundingClientRect();
    this.element.style.left = (rect.left - parentRect.left) + "px";
    this.element.style.top = (rect.top - parentRect.top) + "px";
    this.element.style.width = (rect.right - rect.left) + "px";
    this.element.style.height = (rect.bottom - rect.top) + "px";
  };

  DropCursorView.prototype.scheduleRemoval = function scheduleRemoval (timeout) {
      var this$1 = this;

    clearTimeout(this.timeout);
    this.timeout = setTimeout(function () { return this$1.setCursor(null); }, timeout);
  };

  DropCursorView.prototype.dragover = function dragover (event) {
    if (!this.editorView.editable) { return }
    var pos = this.editorView.posAtCoords({left: event.clientX, top: event.clientY});
    if (pos) {
      var target = pos.pos;
      if (this.editorView.dragging && this.editorView.dragging.slice) {
        target = dropPoint(this.editorView.state.doc, target, this.editorView.dragging.slice);
        if (target == null) { target = pos.pos; }
      }
      this.setCursor(target);
      this.scheduleRemoval(5000);
    }
  };

  DropCursorView.prototype.dragend = function dragend () {
    this.scheduleRemoval(20);
  };

  DropCursorView.prototype.drop = function drop () {
    this.scheduleRemoval(20);
  };

  DropCursorView.prototype.dragleave = function dragleave (event) {
    if (event.target == this.editorView.dom || !this.editorView.dom.contains(event.relatedTarget))
      { this.setCursor(null); }
  };

  // ::- Gap cursor selections are represented using this class. Its
  // `$anchor` and `$head` properties both point at the cursor position.
  var GapCursor = /*@__PURE__*/(function (Selection) {
    function GapCursor($pos) {
      Selection.call(this, $pos, $pos);
    }

    if ( Selection ) GapCursor.__proto__ = Selection;
    GapCursor.prototype = Object.create( Selection && Selection.prototype );
    GapCursor.prototype.constructor = GapCursor;

    GapCursor.prototype.map = function map (doc, mapping) {
      var $pos = doc.resolve(mapping.map(this.head));
      return GapCursor.valid($pos) ? new GapCursor($pos) : Selection.near($pos)
    };

    GapCursor.prototype.content = function content () { return Slice.empty };

    GapCursor.prototype.eq = function eq (other) {
      return other instanceof GapCursor && other.head == this.head
    };

    GapCursor.prototype.toJSON = function toJSON () {
      return {type: "gapcursor", pos: this.head}
    };

    GapCursor.fromJSON = function fromJSON (doc, json) {
      if (typeof json.pos != "number") { throw new RangeError("Invalid input for GapCursor.fromJSON") }
      return new GapCursor(doc.resolve(json.pos))
    };

    GapCursor.prototype.getBookmark = function getBookmark () { return new GapBookmark(this.anchor) };

    GapCursor.valid = function valid ($pos) {
      var parent = $pos.parent;
      if (parent.isTextblock || !closedBefore($pos) || !closedAfter($pos)) { return false }
      var override = parent.type.spec.allowGapCursor;
      if (override != null) { return override }
      var deflt = parent.contentMatchAt($pos.index()).defaultType;
      return deflt && deflt.isTextblock
    };

    GapCursor.findFrom = function findFrom ($pos, dir, mustMove) {
      if (!mustMove && GapCursor.valid($pos)) { return $pos }

      var pos = $pos.pos, next = null;
      // Scan up from this position
      for (var d = $pos.depth;; d--) {
        var parent = $pos.node(d);
        if (dir > 0 ? $pos.indexAfter(d) < parent.childCount : $pos.index(d) > 0) {
          next = parent.maybeChild(dir > 0 ? $pos.indexAfter(d) : $pos.index(d) - 1);
          break
        } else if (d == 0) {
          return null
        }
        pos += dir;
        var $cur = $pos.doc.resolve(pos);
        if (GapCursor.valid($cur)) { return $cur }
      }

      // And then down into the next node
      for (;;) {
        next = dir > 0 ? next.firstChild : next.lastChild;
        if (!next) { break }
        pos += dir;
        var $cur$1 = $pos.doc.resolve(pos);
        if (GapCursor.valid($cur$1)) { return $cur$1 }
      }

      return null
    };

    return GapCursor;
  }(Selection));

  GapCursor.prototype.visible = false;

  Selection.jsonID("gapcursor", GapCursor);

  var GapBookmark = function GapBookmark(pos) {
    this.pos = pos;
  };
  GapBookmark.prototype.map = function map (mapping) {
    return new GapBookmark(mapping.map(this.pos))
  };
  GapBookmark.prototype.resolve = function resolve (doc) {
    var $pos = doc.resolve(this.pos);
    return GapCursor.valid($pos) ? new GapCursor($pos) : Selection.near($pos)
  };

  function closedBefore($pos) {
    for (var d = $pos.depth; d >= 0; d--) {
      var index = $pos.index(d);
      // At the start of this parent, look at next one
      if (index == 0) { continue }
      // See if the node before (or its first ancestor) is closed
      for (var before = $pos.node(d).child(index - 1);; before = before.lastChild) {
        if ((before.childCount == 0 && !before.inlineContent) || before.isAtom || before.type.spec.isolating) { return true }
        if (before.inlineContent) { return false }
      }
    }
    // Hit start of document
    return true
  }

  function closedAfter($pos) {
    for (var d = $pos.depth; d >= 0; d--) {
      var index = $pos.indexAfter(d), parent = $pos.node(d);
      if (index == parent.childCount) { continue }
      for (var after = parent.child(index);; after = after.firstChild) {
        if ((after.childCount == 0 && !after.inlineContent) || after.isAtom || after.type.spec.isolating) { return true }
        if (after.inlineContent) { return false }
      }
    }
    return true
  }

  // :: () → Plugin
  // Create a gap cursor plugin. When enabled, this will capture clicks
  // near and arrow-key-motion past places that don't have a normally
  // selectable position nearby, and create a gap cursor selection for
  // them. The cursor is drawn as an element with class
  // `ProseMirror-gapcursor`. You can either include
  // `style/gapcursor.css` from the package's directory or add your own
  // styles to make it visible.
  var gapCursor = function() {
    return new Plugin({
      props: {
        decorations: drawGapCursor,

        createSelectionBetween: function createSelectionBetween(_view, $anchor, $head) {
          if ($anchor.pos == $head.pos && GapCursor.valid($head)) { return new GapCursor($head) }
        },

        handleClick: handleClick,
        handleKeyDown: handleKeyDown
      }
    })
  };

  var handleKeyDown = keydownHandler({
    "ArrowLeft": arrow("horiz", -1),
    "ArrowRight": arrow("horiz", 1),
    "ArrowUp": arrow("vert", -1),
    "ArrowDown": arrow("vert", 1)
  });

  function arrow(axis, dir) {
    var dirStr = axis == "vert" ? (dir > 0 ? "down" : "up") : (dir > 0 ? "right" : "left");
    return function(state, dispatch, view) {
      var sel = state.selection;
      var $start = dir > 0 ? sel.$to : sel.$from, mustMove = sel.empty;
      if (sel instanceof TextSelection) {
        if (!view.endOfTextblock(dirStr)) { return false }
        mustMove = false;
        $start = state.doc.resolve(dir > 0 ? $start.after() : $start.before());
      }
      var $found = GapCursor.findFrom($start, dir, mustMove);
      if (!$found) { return false }
      if (dispatch) { dispatch(state.tr.setSelection(new GapCursor($found))); }
      return true
    }
  }

  function handleClick(view, pos, event) {
    if (!view.editable) { return false }
    var $pos = view.state.doc.resolve(pos);
    if (!GapCursor.valid($pos)) { return false }
    var ref = view.posAtCoords({left: event.clientX, top: event.clientY});
    var inside = ref.inside;
    if (inside > -1 && NodeSelection.isSelectable(view.state.doc.nodeAt(inside))) { return false }
    view.dispatch(view.state.tr.setSelection(new GapCursor($pos)));
    return true
  }

  function drawGapCursor(state) {
    if (!(state.selection instanceof GapCursor)) { return null }
    var node = document.createElement("div");
    node.className = "ProseMirror-gapcursor";
    return DecorationSet.create(state.doc, [Decoration.widget(state.selection.head, node, {key: "gapcursor"})])
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var crel = createCommonjsModule(function (module, exports) {

  /* Copyright (C) 2012 Kory Nunn
  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

  NOTE:
  This code is formatted for run-speed and to assist compilers.
  This might make it harder to read at times, but the code's intention should be transparent. */

  // IIFE our function
  (function (exporter) {
      // Define our function and its properties
      // These strings are used multiple times, so this makes things smaller once compiled
      var func = 'function',
          isNodeString = 'isNode',
          // Helper functions used throughout the script
          isType = function (object, type) { return typeof object === type; },
          // Recursively appends children to given element. As a text node if not already an element
          appendChild = function (element, child) {
              if (child !== null) {
                  if (Array.isArray(child)) { // Support (deeply) nested child elements
                      child.map(function (subChild) { return appendChild(element, subChild); });
                  } else {
                      if (!crel[isNodeString](child)) {
                          child = document.createTextNode(child);
                      }
                      element.appendChild(child);
                  }
              }
          };
      //
      function crel (element, settings) {
          // Define all used variables / shortcuts here, to make things smaller once compiled
          var args = arguments, // Note: assigned to a variable to assist compilers.
              index = 1,
              key,
              attribute;
          // If first argument is an element, use it as is, otherwise treat it as a tagname
          element = crel.isElement(element) ? element : document.createElement(element);
          // Check if second argument is a settings object
          if (isType(settings, 'object') && !crel[isNodeString](settings) && !Array.isArray(settings)) {
              // Don't treat settings as a child
              index++;
              // Go through settings / attributes object, if it exists
              for (key in settings) {
                  // Store the attribute into a variable, before we potentially modify the key
                  attribute = settings[key];
                  // Get mapped key / function, if one exists
                  key = crel.attrMap[key] || key;
                  // Note: We want to prioritise mapping over properties
                  if (isType(key, func)) {
                      key(element, attribute);
                  } else if (isType(attribute, func)) { // ex. onClick property
                      element[key] = attribute;
                  } else {
                      // Set the element attribute
                      element.setAttribute(key, attribute);
                  }
              }
          }
          // Loop through all arguments, if any, and append them to our element if they're not `null`
          for (; index < args.length; index++) {
              appendChild(element, args[index]);
          }

          return element;
      }

      // Used for mapping attribute keys to supported versions in bad browsers, or to custom functionality
      crel.attrMap = {};
      crel.isElement = function (object) { return object instanceof Element; };
      crel[isNodeString] = function (node) { return node instanceof Node; };
      // Expose proxy interface
      crel.proxy = new Proxy(crel, {
          get: function (target, key) {
              !(key in crel) && (crel[key] = crel.bind(null, key));
              return crel[key];
          }
      });
      // Export crel
      exporter(crel, func);
  })(function (product, func) {
      {
          // Export for Browserify / CommonJS format
          module.exports = product;
      }
  });
  });

  var SVG = "http://www.w3.org/2000/svg";
  var XLINK = "http://www.w3.org/1999/xlink";

  var prefix = "ProseMirror-icon";

  function hashPath(path) {
    var hash = 0;
    for (var i = 0; i < path.length; i++)
      { hash = (((hash << 5) - hash) + path.charCodeAt(i)) | 0; }
    return hash
  }

  function getIcon(icon) {
    var node = document.createElement("div");
    node.className = prefix;
    if (icon.path) {
      var name = "pm-icon-" + hashPath(icon.path).toString(16);
      if (!document.getElementById(name)) { buildSVG(name, icon); }
      var svg = node.appendChild(document.createElementNS(SVG, "svg"));
      svg.style.width = (icon.width / icon.height) + "em";
      var use = svg.appendChild(document.createElementNS(SVG, "use"));
      use.setAttributeNS(XLINK, "href", /([^#]*)/.exec(document.location)[1] + "#" + name);
    } else if (icon.dom) {
      node.appendChild(icon.dom.cloneNode(true));
    } else {
      node.appendChild(document.createElement("span")).textContent = icon.text || '';
      if (icon.css) { node.firstChild.style.cssText = icon.css; }
    }
    return node
  }

  function buildSVG(name, data) {
    var collection = document.getElementById(prefix + "-collection");
    if (!collection) {
      collection = document.createElementNS(SVG, "svg");
      collection.id = prefix + "-collection";
      collection.style.display = "none";
      document.body.insertBefore(collection, document.body.firstChild);
    }
    var sym = document.createElementNS(SVG, "symbol");
    sym.id = name;
    sym.setAttribute("viewBox", "0 0 " + data.width + " " + data.height);
    var path = sym.appendChild(document.createElementNS(SVG, "path"));
    path.setAttribute("d", data.path);
    collection.appendChild(sym);
  }

  var prefix$1 = "ProseMirror-menu";

  // ::- An icon or label that, when clicked, executes a command.
  var MenuItem = function MenuItem(spec) {
    // :: MenuItemSpec
    // The spec used to create the menu item.
    this.spec = spec;
  };

  // :: (EditorView) → {dom: dom.Node, update: (EditorState) → bool}
  // Renders the icon according to its [display
  // spec](#menu.MenuItemSpec.display), and adds an event handler which
  // executes the command when the representation is clicked.
  MenuItem.prototype.render = function render (view) {
    var spec = this.spec;
    var dom = spec.render ? spec.render(view)
        : spec.icon ? getIcon(spec.icon)
        : spec.label ? crel("div", null, translate(view, spec.label))
        : null;
    if (!dom) { throw new RangeError("MenuItem without icon or label property") }
    if (spec.title) {
      var title = (typeof spec.title === "function" ? spec.title(view.state) : spec.title);
      dom.setAttribute("title", translate(view, title));
    }
    if (spec.class) { dom.classList.add(spec.class); }
    if (spec.css) { dom.style.cssText += spec.css; }

    dom.addEventListener("mousedown", function (e) {
      e.preventDefault();
      if (!dom.classList.contains(prefix$1 + "-disabled"))
        { spec.run(view.state, view.dispatch, view, e); }
    });

    function update(state) {
      if (spec.select) {
        var selected = spec.select(state);
        dom.style.display = selected ? "" : "none";
        if (!selected) { return false }
      }
      var enabled = true;
      if (spec.enable) {
        enabled = spec.enable(state) || false;
        setClass(dom, prefix$1 + "-disabled", !enabled);
      }
      if (spec.active) {
        var active = enabled && spec.active(state) || false;
        setClass(dom, prefix$1 + "-active", active);
      }
      return true
    }

    return {dom: dom, update: update}
  };

  function translate(view, text) {
    return view._props.translate ? view._props.translate(text) : text
  }

  // MenuItemSpec:: interface
  // The configuration object passed to the `MenuItem` constructor.
  //
  //   run:: (EditorState, (Transaction), EditorView, dom.Event)
  //   The function to execute when the menu item is activated.
  //
  //   select:: ?(EditorState) → bool
  //   Optional function that is used to determine whether the item is
  //   appropriate at the moment. Deselected items will be hidden.
  //
  //   enable:: ?(EditorState) → bool
  //   Function that is used to determine if the item is enabled. If
  //   given and returning false, the item will be given a disabled
  //   styling.
  //
  //   active:: ?(EditorState) → bool
  //   A predicate function to determine whether the item is 'active' (for
  //   example, the item for toggling the strong mark might be active then
  //   the cursor is in strong text).
  //
  //   render:: ?(EditorView) → dom.Node
  //   A function that renders the item. You must provide either this,
  //   [`icon`](#menu.MenuItemSpec.icon), or [`label`](#MenuItemSpec.label).
  //
  //   icon:: ?Object
  //   Describes an icon to show for this item. The object may specify
  //   an SVG icon, in which case its `path` property should be an [SVG
  //   path
  //   spec](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d),
  //   and `width` and `height` should provide the viewbox in which that
  //   path exists. Alternatively, it may have a `text` property
  //   specifying a string of text that makes up the icon, with an
  //   optional `css` property giving additional CSS styling for the
  //   text. _Or_ it may contain `dom` property containing a DOM node.
  //
  //   label:: ?string
  //   Makes the item show up as a text label. Mostly useful for items
  //   wrapped in a [drop-down](#menu.Dropdown) or similar menu. The object
  //   should have a `label` property providing the text to display.
  //
  //   title:: ?union<string, (EditorState) → string>
  //   Defines DOM title (mouseover) text for the item.
  //
  //   class:: ?string
  //   Optionally adds a CSS class to the item's DOM representation.
  //
  //   css:: ?string
  //   Optionally adds a string of inline CSS to the item's DOM
  //   representation.
  //
  //   execEvent:: ?string
  //   Defines which event on the command's DOM representation should
  //   trigger the execution of the command. Defaults to mousedown.

  var lastMenuEvent = {time: 0, node: null};
  function markMenuEvent(e) {
    lastMenuEvent.time = Date.now();
    lastMenuEvent.node = e.target;
  }
  function isMenuEvent(wrapper) {
    return Date.now() - 100 < lastMenuEvent.time &&
      lastMenuEvent.node && wrapper.contains(lastMenuEvent.node)
  }

  // ::- A drop-down menu, displayed as a label with a downwards-pointing
  // triangle to the right of it.
  var Dropdown = function Dropdown(content, options) {
    this.options = options || {};
    this.content = Array.isArray(content) ? content : [content];
  };

  // :: (EditorView) → {dom: dom.Node, update: (EditorState)}
  // Render the dropdown menu and sub-items.
  Dropdown.prototype.render = function render (view) {
      var this$1 = this;

    var content = renderDropdownItems(this.content, view);

    var label = crel("div", {class: prefix$1 + "-dropdown " + (this.options.class || ""),
                             style: this.options.css},
                     translate(view, this.options.label));
    if (this.options.title) { label.setAttribute("title", translate(view, this.options.title)); }
    var wrap = crel("div", {class: prefix$1 + "-dropdown-wrap"}, label);
    var open = null, listeningOnClose = null;
    var close = function () {
      if (open && open.close()) {
        open = null;
        window.removeEventListener("mousedown", listeningOnClose);
      }
    };
    label.addEventListener("mousedown", function (e) {
      e.preventDefault();
      markMenuEvent(e);
      if (open) {
        close();
      } else {
        open = this$1.expand(wrap, content.dom);
        window.addEventListener("mousedown", listeningOnClose = function () {
          if (!isMenuEvent(wrap)) { close(); }
        });
      }
    });

    function update(state) {
      var inner = content.update(state);
      wrap.style.display = inner ? "" : "none";
      return inner
    }

    return {dom: wrap, update: update}
  };

  Dropdown.prototype.expand = function expand (dom, items) {
    var menuDOM = crel("div", {class: prefix$1 + "-dropdown-menu " + (this.options.class || "")}, items);

    var done = false;
    function close() {
      if (done) { return }
      done = true;
      dom.removeChild(menuDOM);
      return true
    }
    dom.appendChild(menuDOM);
    return {close: close, node: menuDOM}
  };

  function renderDropdownItems(items, view) {
    var rendered = [], updates = [];
    for (var i = 0; i < items.length; i++) {
      var ref = items[i].render(view);
      var dom = ref.dom;
      var update = ref.update;
      rendered.push(crel("div", {class: prefix$1 + "-dropdown-item"}, dom));
      updates.push(update);
    }
    return {dom: rendered, update: combineUpdates(updates, rendered)}
  }

  function combineUpdates(updates, nodes) {
    return function (state) {
      var something = false;
      for (var i = 0; i < updates.length; i++) {
        var up = updates[i](state);
        nodes[i].style.display = up ? "" : "none";
        if (up) { something = true; }
      }
      return something
    }
  }

  // ::- Represents a submenu wrapping a group of elements that start
  // hidden and expand to the right when hovered over or tapped.
  var DropdownSubmenu = function DropdownSubmenu(content, options) {
    this.options = options || {};
    this.content = Array.isArray(content) ? content : [content];
  };

  // :: (EditorView) → {dom: dom.Node, update: (EditorState) → bool}
  // Renders the submenu.
  DropdownSubmenu.prototype.render = function render (view) {
    var items = renderDropdownItems(this.content, view);

    var label = crel("div", {class: prefix$1 + "-submenu-label"}, translate(view, this.options.label));
    var wrap = crel("div", {class: prefix$1 + "-submenu-wrap"}, label,
                   crel("div", {class: prefix$1 + "-submenu"}, items.dom));
    var listeningOnClose = null;
    label.addEventListener("mousedown", function (e) {
      e.preventDefault();
      markMenuEvent(e);
      setClass(wrap, prefix$1 + "-submenu-wrap-active");
      if (!listeningOnClose)
        { window.addEventListener("mousedown", listeningOnClose = function () {
          if (!isMenuEvent(wrap)) {
            wrap.classList.remove(prefix$1 + "-submenu-wrap-active");
            window.removeEventListener("mousedown", listeningOnClose);
            listeningOnClose = null;
          }
        }); }
    });

    function update(state) {
      var inner = items.update(state);
      wrap.style.display = inner ? "" : "none";
      return inner
    }
    return {dom: wrap, update: update}
  };

  // :: (EditorView, [union<MenuElement, [MenuElement]>]) → {dom: ?dom.DocumentFragment, update: (EditorState) → bool}
  // Render the given, possibly nested, array of menu elements into a
  // document fragment, placing separators between them (and ensuring no
  // superfluous separators appear when some of the groups turn out to
  // be empty).
  function renderGrouped(view, content) {
    var result = document.createDocumentFragment();
    var updates = [], separators = [];
    for (var i = 0; i < content.length; i++) {
      var items = content[i], localUpdates = [], localNodes = [];
      for (var j = 0; j < items.length; j++) {
        var ref = items[j].render(view);
        var dom = ref.dom;
        var update$1 = ref.update;
        var span = crel("span", {class: prefix$1 + "item"}, dom);
        result.appendChild(span);
        localNodes.push(span);
        localUpdates.push(update$1);
      }
      if (localUpdates.length) {
        updates.push(combineUpdates(localUpdates, localNodes));
        if (i < content.length - 1)
          { separators.push(result.appendChild(separator())); }
      }
    }

    function update(state) {
      var something = false, needSep = false;
      for (var i = 0; i < updates.length; i++) {
        var hasContent = updates[i](state);
        if (i) { separators[i - 1].style.display = needSep && hasContent ? "" : "none"; }
        needSep = hasContent;
        if (hasContent) { something = true; }
      }
      return something
    }
    return {dom: result, update: update}
  }

  function separator() {
    return crel("span", {class: prefix$1 + "separator"})
  }

  // :: Object
  // A set of basic editor-related icons. Contains the properties
  // `join`, `lift`, `selectParentNode`, `undo`, `redo`, `strong`, `em`,
  // `code`, `link`, `bulletList`, `orderedList`, and `blockquote`, each
  // holding an object that can be used as the `icon` option to
  // `MenuItem`.
  var icons = {
    join: {
      width: 800, height: 900,
      path: "M0 75h800v125h-800z M0 825h800v-125h-800z M250 400h100v-100h100v100h100v100h-100v100h-100v-100h-100z"
    },
    lift: {
      width: 1024, height: 1024,
      path: "M219 310v329q0 7-5 12t-12 5q-8 0-13-5l-164-164q-5-5-5-13t5-13l164-164q5-5 13-5 7 0 12 5t5 12zM1024 749v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12zM1024 530v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 310v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 91v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12z"
    },
    selectParentNode: {text: "\u2b1a", css: "font-weight: bold"},
    undo: {
      width: 1024, height: 1024,
      path: "M761 1024c113-206 132-520-313-509v253l-384-384 384-384v248c534-13 594 472 313 775z"
    },
    redo: {
      width: 1024, height: 1024,
      path: "M576 248v-248l384 384-384 384v-253c-446-10-427 303-313 509-280-303-221-789 313-775z"
    },
    strong: {
      width: 805, height: 1024,
      path: "M317 869q42 18 80 18 214 0 214-191 0-65-23-102-15-25-35-42t-38-26-46-14-48-6-54-1q-41 0-57 5 0 30-0 90t-0 90q0 4-0 38t-0 55 2 47 6 38zM309 442q24 4 62 4 46 0 81-7t62-25 42-51 14-81q0-40-16-70t-45-46-61-24-70-8q-28 0-74 7 0 28 2 86t2 86q0 15-0 45t-0 45q0 26 0 39zM0 950l1-53q8-2 48-9t60-15q4-6 7-15t4-19 3-18 1-21 0-19v-37q0-561-12-585-2-4-12-8t-25-6-28-4-27-2-17-1l-2-47q56-1 194-6t213-5q13 0 39 0t38 0q40 0 78 7t73 24 61 40 42 59 16 78q0 29-9 54t-22 41-36 32-41 25-48 22q88 20 146 76t58 141q0 57-20 102t-53 74-78 48-93 27-100 8q-25 0-75-1t-75-1q-60 0-175 6t-132 6z"
    },
    em: {
      width: 585, height: 1024,
      path: "M0 949l9-48q3-1 46-12t63-21q16-20 23-57 0-4 35-165t65-310 29-169v-14q-13-7-31-10t-39-4-33-3l10-58q18 1 68 3t85 4 68 1q27 0 56-1t69-4 56-3q-2 22-10 50-17 5-58 16t-62 19q-4 10-8 24t-5 22-4 26-3 24q-15 84-50 239t-44 203q-1 5-7 33t-11 51-9 47-3 32l0 10q9 2 105 17-1 25-9 56-6 0-18 0t-18 0q-16 0-49-5t-49-5q-78-1-117-1-29 0-81 5t-69 6z"
    },
    code: {
      width: 896, height: 1024,
      path: "M608 192l-96 96 224 224-224 224 96 96 288-320-288-320zM288 192l-288 320 288 320 96-96-224-224 224-224-96-96z"
    },
    link: {
      width: 951, height: 1024,
      path: "M832 694q0-22-16-38l-118-118q-16-16-38-16-24 0-41 18 1 1 10 10t12 12 8 10 7 14 2 15q0 22-16 38t-38 16q-8 0-15-2t-14-7-10-8-12-12-10-10q-18 17-18 41 0 22 16 38l117 118q15 15 38 15 22 0 38-14l84-83q16-16 16-38zM430 292q0-22-16-38l-117-118q-16-16-38-16-22 0-38 15l-84 83q-16 16-16 38 0 22 16 38l118 118q15 15 38 15 24 0 41-17-1-1-10-10t-12-12-8-10-7-14-2-15q0-22 16-38t38-16q8 0 15 2t14 7 10 8 12 12 10 10q18-17 18-41zM941 694q0 68-48 116l-84 83q-47 47-116 47-69 0-116-48l-117-118q-47-47-47-116 0-70 50-119l-50-50q-49 50-118 50-68 0-116-48l-118-118q-48-48-48-116t48-116l84-83q47-47 116-47 69 0 116 48l117 118q47 47 47 116 0 70-50 119l50 50q49-50 118-50 68 0 116 48l118 118q48 48 48 116z"
    },
    bulletList: {
      width: 768, height: 896,
      path: "M0 512h128v-128h-128v128zM0 256h128v-128h-128v128zM0 768h128v-128h-128v128zM256 512h512v-128h-512v128zM256 256h512v-128h-512v128zM256 768h512v-128h-512v128z"
    },
    orderedList: {
      width: 768, height: 896,
      path: "M320 512h448v-128h-448v128zM320 768h448v-128h-448v128zM320 128v128h448v-128h-448zM79 384h78v-256h-36l-85 23v50l43-2v185zM189 590c0-36-12-78-96-78-33 0-64 6-83 16l1 66c21-10 42-15 67-15s32 11 32 28c0 26-30 58-110 112v50h192v-67l-91 2c49-30 87-66 87-113l1-1z"
    },
    blockquote: {
      width: 640, height: 896,
      path: "M0 448v256h256v-256h-128c0 0 0-128 128-128v-128c0 0-256 0-256 256zM640 320v-128c0 0-256 0-256 256v256h256v-256h-128c0 0 0-128 128-128z"
    }
  };

  // :: MenuItem
  // Menu item for the `joinUp` command.
  var joinUpItem = new MenuItem({
    title: "Join with above block",
    run: joinUp,
    select: function (state) { return joinUp(state); },
    icon: icons.join
  });

  // :: MenuItem
  // Menu item for the `lift` command.
  var liftItem = new MenuItem({
    title: "Lift out of enclosing block",
    run: lift,
    select: function (state) { return lift(state); },
    icon: icons.lift
  });

  // :: MenuItem
  // Menu item for the `selectParentNode` command.
  var selectParentNodeItem = new MenuItem({
    title: "Select parent node",
    run: selectParentNode,
    select: function (state) { return selectParentNode(state); },
    icon: icons.selectParentNode
  });

  // :: MenuItem
  // Menu item for the `undo` command.
  var undoItem = new MenuItem({
    title: "Undo last change",
    run: undo,
    enable: function (state) { return undo(state); },
    icon: icons.undo
  });

  // :: MenuItem
  // Menu item for the `redo` command.
  var redoItem = new MenuItem({
    title: "Redo last undone change",
    run: redo,
    enable: function (state) { return redo(state); },
    icon: icons.redo
  });

  // :: (NodeType, Object) → MenuItem
  // Build a menu item for wrapping the selection in a given node type.
  // Adds `run` and `select` properties to the ones present in
  // `options`. `options.attrs` may be an object or a function.
  function wrapItem(nodeType, options) {
    var passedOptions = {
      run: function run(state, dispatch) {
        // FIXME if (options.attrs instanceof Function) options.attrs(state, attrs => wrapIn(nodeType, attrs)(state))
        return wrapIn(nodeType, options.attrs)(state, dispatch)
      },
      select: function select(state) {
        return wrapIn(nodeType, options.attrs instanceof Function ? null : options.attrs)(state)
      }
    };
    for (var prop in options) { passedOptions[prop] = options[prop]; }
    return new MenuItem(passedOptions)
  }

  // :: (NodeType, Object) → MenuItem
  // Build a menu item for changing the type of the textblock around the
  // selection to the given type. Provides `run`, `active`, and `select`
  // properties. Others must be given in `options`. `options.attrs` may
  // be an object to provide the attributes for the textblock node.
  function blockTypeItem(nodeType, options) {
    var command = setBlockType(nodeType, options.attrs);
    var passedOptions = {
      run: command,
      enable: function enable(state) { return command(state) },
      active: function active(state) {
        var ref = state.selection;
        var $from = ref.$from;
        var to = ref.to;
        var node = ref.node;
        if (node) { return node.hasMarkup(nodeType, options.attrs) }
        return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs)
      }
    };
    for (var prop in options) { passedOptions[prop] = options[prop]; }
    return new MenuItem(passedOptions)
  }

  // Work around classList.toggle being broken in IE11
  function setClass(dom, cls, on) {
    if (on) { dom.classList.add(cls); }
    else { dom.classList.remove(cls); }
  }

  var prefix$2 = "ProseMirror-menubar";

  function isIOS() {
    if (typeof navigator == "undefined") { return false }
    var agent = navigator.userAgent;
    return !/Edge\/\d/.test(agent) && /AppleWebKit/.test(agent) && /Mobile\/\w+/.test(agent)
  }

  // :: (Object) → Plugin
  // A plugin that will place a menu bar above the editor. Note that
  // this involves wrapping the editor in an additional `<div>`.
  //
  //   options::-
  //   Supports the following options:
  //
  //     content:: [[MenuElement]]
  //     Provides the content of the menu, as a nested array to be
  //     passed to `renderGrouped`.
  //
  //     floating:: ?bool
  //     Determines whether the menu floats, i.e. whether it sticks to
  //     the top of the viewport when the editor is partially scrolled
  //     out of view.
  function menuBar(options) {
    return new Plugin({
      view: function view(editorView) { return new MenuBarView(editorView, options) }
    })
  }

  var MenuBarView = function MenuBarView(editorView, options) {
    var this$1 = this;

    this.editorView = editorView;
    this.options = options;

    this.wrapper = crel("div", {class: prefix$2 + "-wrapper"});
    this.menu = this.wrapper.appendChild(crel("div", {class: prefix$2}));
    this.menu.className = prefix$2;
    this.spacer = null;

    editorView.dom.parentNode.replaceChild(this.wrapper, editorView.dom);
    this.wrapper.appendChild(editorView.dom);

    this.maxHeight = 0;
    this.widthForMaxHeight = 0;
    this.floating = false;

    var ref = renderGrouped(this.editorView, this.options.content);
    var dom = ref.dom;
    var update = ref.update;
    this.contentUpdate = update;
    this.menu.appendChild(dom);
    this.update();

    if (options.floating && !isIOS()) {
      this.updateFloat();
      var potentialScrollers = getAllWrapping(this.wrapper);
      this.scrollFunc = function (e) {
        var root = this$1.editorView.root;
        if (!(root.body || root).contains(this$1.wrapper)) {
            potentialScrollers.forEach(function (el) { return el.removeEventListener("scroll", this$1.scrollFunc); });
        } else {
            this$1.updateFloat(e.target.getBoundingClientRect && e.target);
        }
      };
      potentialScrollers.forEach(function (el) { return el.addEventListener('scroll', this$1.scrollFunc); });
    }
  };

  MenuBarView.prototype.update = function update () {
    this.contentUpdate(this.editorView.state);

    if (this.floating) {
      this.updateScrollCursor();
    } else {
      if (this.menu.offsetWidth != this.widthForMaxHeight) {
        this.widthForMaxHeight = this.menu.offsetWidth;
        this.maxHeight = 0;
      }
      if (this.menu.offsetHeight > this.maxHeight) {
        this.maxHeight = this.menu.offsetHeight;
        this.menu.style.minHeight = this.maxHeight + "px";
      }
    }
  };

  MenuBarView.prototype.updateScrollCursor = function updateScrollCursor () {
    var selection = this.editorView.root.getSelection();
    if (!selection.focusNode) { return }
    var rects = selection.getRangeAt(0).getClientRects();
    var selRect = rects[selectionIsInverted(selection) ? 0 : rects.length - 1];
    if (!selRect) { return }
    var menuRect = this.menu.getBoundingClientRect();
    if (selRect.top < menuRect.bottom && selRect.bottom > menuRect.top) {
      var scrollable = findWrappingScrollable(this.wrapper);
      if (scrollable) { scrollable.scrollTop -= (menuRect.bottom - selRect.top); }
    }
  };

  MenuBarView.prototype.updateFloat = function updateFloat (scrollAncestor) {
    var parent = this.wrapper, editorRect = parent.getBoundingClientRect(),
        top = scrollAncestor ? Math.max(0, scrollAncestor.getBoundingClientRect().top) : 0;

    if (this.floating) {
      if (editorRect.top >= top || editorRect.bottom < this.menu.offsetHeight + 10) {
        this.floating = false;
        this.menu.style.position = this.menu.style.left = this.menu.style.top = this.menu.style.width = "";
        this.menu.style.display = "";
        this.spacer.parentNode.removeChild(this.spacer);
        this.spacer = null;
      } else {
        var border = (parent.offsetWidth - parent.clientWidth) / 2;
        this.menu.style.left = (editorRect.left + border) + "px";
        this.menu.style.display = (editorRect.top > window.innerHeight ? "none" : "");
        if (scrollAncestor) { this.menu.style.top = top + "px"; }
      }
    } else {
      if (editorRect.top < top && editorRect.bottom >= this.menu.offsetHeight + 10) {
        this.floating = true;
        var menuRect = this.menu.getBoundingClientRect();
        this.menu.style.left = menuRect.left + "px";
        this.menu.style.width = menuRect.width + "px";
        if (scrollAncestor) { this.menu.style.top = top + "px"; }
        this.menu.style.position = "fixed";
        this.spacer = crel("div", {class: prefix$2 + "-spacer", style: ("height: " + (menuRect.height) + "px")});
        parent.insertBefore(this.spacer, this.menu);
      }
    }
  };

  MenuBarView.prototype.destroy = function destroy () {
    if (this.wrapper.parentNode)
      { this.wrapper.parentNode.replaceChild(this.editorView.dom, this.wrapper); }
  };

  // Not precise, but close enough
  function selectionIsInverted(selection) {
    if (selection.anchorNode == selection.focusNode) { return selection.anchorOffset > selection.focusOffset }
    return selection.anchorNode.compareDocumentPosition(selection.focusNode) == Node.DOCUMENT_POSITION_FOLLOWING
  }

  function findWrappingScrollable(node) {
    for (var cur = node.parentNode; cur; cur = cur.parentNode)
      { if (cur.scrollHeight > cur.clientHeight) { return cur } }
  }

  function getAllWrapping(node) {
      var res = [window];
      for (var cur = node.parentNode; cur; cur = cur.parentNode)
          { res.push(cur); }
      return res
  }

  // ::- Input rules are regular expressions describing a piece of text
  // that, when typed, causes something to happen. This might be
  // changing two dashes into an emdash, wrapping a paragraph starting
  // with `"> "` into a blockquote, or something entirely different.
  var InputRule = function InputRule(match, handler) {
    this.match = match;
    this.handler = typeof handler == "string" ? stringHandler(handler) : handler;
  };

  function stringHandler(string) {
    return function(state, match, start, end) {
      var insert = string;
      if (match[1]) {
        var offset = match[0].lastIndexOf(match[1]);
        insert += match[0].slice(offset + match[1].length);
        start += offset;
        var cutOff = start - end;
        if (cutOff > 0) {
          insert = match[0].slice(offset - cutOff, offset) + insert;
          start = end;
        }
      }
      return state.tr.insertText(insert, start, end)
    }
  }

  var MAX_MATCH = 500;

  // :: (config: {rules: [InputRule]}) → Plugin
  // Create an input rules plugin. When enabled, it will cause text
  // input that matches any of the given rules to trigger the rule's
  // action.
  function inputRules(ref) {
    var rules = ref.rules;

    var plugin = new Plugin({
      state: {
        init: function init() { return null },
        apply: function apply(tr, prev) {
          var stored = tr.getMeta(this);
          if (stored) { return stored }
          return tr.selectionSet || tr.docChanged ? null : prev
        }
      },

      props: {
        handleTextInput: function handleTextInput(view, from, to, text) {
          return run(view, from, to, text, rules, plugin)
        },
        handleDOMEvents: {
          compositionend: function (view) {
            setTimeout(function () {
              var ref = view.state.selection;
              var $cursor = ref.$cursor;
              if ($cursor) { run(view, $cursor.pos, $cursor.pos, "", rules, plugin); }
            });
          }
        }
      },

      isInputRules: true
    });
    return plugin
  }

  function run(view, from, to, text, rules, plugin) {
    if (view.composing) { return false }
    var state = view.state, $from = state.doc.resolve(from);
    if ($from.parent.type.spec.code) { return false }
    var textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - MAX_MATCH), $from.parentOffset,
                                              null, "\ufffc") + text;
    for (var i = 0; i < rules.length; i++) {
      var match = rules[i].match.exec(textBefore);
      var tr = match && rules[i].handler(state, match, from - (match[0].length - text.length), to);
      if (!tr) { continue }
      view.dispatch(tr.setMeta(plugin, {transform: tr, from: from, to: to, text: text}));
      return true
    }
    return false
  }

  // :: (EditorState, ?(Transaction)) → bool
  // This is a command that will undo an input rule, if applying such a
  // rule was the last thing that the user did.
  function undoInputRule(state, dispatch) {
    var plugins = state.plugins;
    for (var i = 0; i < plugins.length; i++) {
      var plugin = plugins[i], undoable = (void 0);
      if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
        if (dispatch) {
          var tr = state.tr, toUndo = undoable.transform;
          for (var j = toUndo.steps.length - 1; j >= 0; j--)
            { tr.step(toUndo.steps[j].invert(toUndo.docs[j])); }
          var marks = tr.doc.resolve(undoable.from).marks();
          dispatch(tr.replaceWith(undoable.from, undoable.to, state.schema.text(undoable.text, marks)));
        }
        return true
      }
    }
    return false
  }

  // :: InputRule Converts double dashes to an emdash.
  var emDash = new InputRule(/--$/, "—");
  // :: InputRule Converts three dots to an ellipsis character.
  var ellipsis = new InputRule(/\.\.\.$/, "…");
  // :: InputRule “Smart” opening double quotes.
  var openDoubleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, "“");
  // :: InputRule “Smart” closing double quotes.
  var closeDoubleQuote = new InputRule(/"$/, "”");
  // :: InputRule “Smart” opening single quotes.
  var openSingleQuote = new InputRule(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, "‘");
  // :: InputRule “Smart” closing single quotes.
  var closeSingleQuote = new InputRule(/'$/, "’");

  // :: [InputRule] Smart-quote related input rules.
  var smartQuotes = [openDoubleQuote, closeDoubleQuote, openSingleQuote, closeSingleQuote];

  // :: (RegExp, NodeType, ?union<Object, ([string]) → ?Object>, ?([string], Node) → bool) → InputRule
  // Build an input rule for automatically wrapping a textblock when a
  // given string is typed. The `regexp` argument is
  // directly passed through to the `InputRule` constructor. You'll
  // probably want the regexp to start with `^`, so that the pattern can
  // only occur at the start of a textblock.
  //
  // `nodeType` is the type of node to wrap in. If it needs attributes,
  // you can either pass them directly, or pass a function that will
  // compute them from the regular expression match.
  //
  // By default, if there's a node with the same type above the newly
  // wrapped node, the rule will try to [join](#transform.Transform.join) those
  // two nodes. You can pass a join predicate, which takes a regular
  // expression match and the node before the wrapped node, and can
  // return a boolean to indicate whether a join should happen.
  function wrappingInputRule(regexp, nodeType, getAttrs, joinPredicate) {
    return new InputRule(regexp, function (state, match, start, end) {
      var attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
      var tr = state.tr.delete(start, end);
      var $start = tr.doc.resolve(start), range = $start.blockRange(), wrapping = range && findWrapping(range, nodeType, attrs);
      if (!wrapping) { return null }
      tr.wrap(range, wrapping);
      var before = tr.doc.resolve(start - 1).nodeBefore;
      if (before && before.type == nodeType && canJoin(tr.doc, start - 1) &&
          (!joinPredicate || joinPredicate(match, before)))
        { tr.join(start - 1); }
      return tr
    })
  }

  // :: (RegExp, NodeType, ?union<Object, ([string]) → ?Object>) → InputRule
  // Build an input rule that changes the type of a textblock when the
  // matched text is typed into it. You'll usually want to start your
  // regexp with `^` to that it is only matched at the start of a
  // textblock. The optional `getAttrs` parameter can be used to compute
  // the new node's attributes, and works the same as in the
  // `wrappingInputRule` function.
  function textblockTypeInputRule(regexp, nodeType, getAttrs) {
    return new InputRule(regexp, function (state, match, start, end) {
      var $start = state.doc.resolve(start);
      var attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
      if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType)) { return null }
      return state.tr
        .delete(start, end)
        .setBlockType(start, start, nodeType, attrs)
    })
  }

  var prefix$3 = "ProseMirror-prompt";

  function openPrompt(options) {
    var wrapper = document.body.appendChild(document.createElement("div"));
    wrapper.className = prefix$3;

    var mouseOutside = function (e) { if (!wrapper.contains(e.target)) { close(); } };
    setTimeout(function () { return window.addEventListener("mousedown", mouseOutside); }, 50);
    var close = function () {
      window.removeEventListener("mousedown", mouseOutside);
      if (wrapper.parentNode) { wrapper.parentNode.removeChild(wrapper); }
    };

    var domFields = [];
    for (var name in options.fields) { domFields.push(options.fields[name].render()); }

    var submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = prefix$3 + "-submit";
    submitButton.textContent = "OK";
    var cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = prefix$3 + "-cancel";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", close);

    var form = wrapper.appendChild(document.createElement("form"));
    if (options.title) { form.appendChild(document.createElement("h5")).textContent = options.title; }
    domFields.forEach(function (field) {
      form.appendChild(document.createElement("div")).appendChild(field);
    });
    var buttons = form.appendChild(document.createElement("div"));
    buttons.className = prefix$3 + "-buttons";
    buttons.appendChild(submitButton);
    buttons.appendChild(document.createTextNode(" "));
    buttons.appendChild(cancelButton);

    var box = wrapper.getBoundingClientRect();
    wrapper.style.top = ((window.innerHeight - box.height) / 2) + "px";
    wrapper.style.left = ((window.innerWidth - box.width) / 2) + "px";

    var submit = function () {
      var params = getValues(options.fields, domFields);
      if (params) {
        close();
        options.callback(params);
      }
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      submit();
    });

    form.addEventListener("keydown", function (e) {
      if (e.keyCode == 27) {
        e.preventDefault();
        close();
      } else if (e.keyCode == 13 && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        submit();
      } else if (e.keyCode == 9) {
        window.setTimeout(function () {
          if (!wrapper.contains(document.activeElement)) { close(); }
        }, 500);
      }
    });

    var input = form.elements[0];
    if (input) { input.focus(); }
  }

  function getValues(fields, domFields) {
    var result = Object.create(null), i = 0;
    for (var name in fields) {
      var field = fields[name], dom = domFields[i++];
      var value = field.read(dom), bad = field.validate(value);
      if (bad) {
        reportInvalid(dom, bad);
        return null
      }
      result[name] = field.clean(value);
    }
    return result
  }

  function reportInvalid(dom, message) {
    // FIXME this is awful and needs a lot more work
    var parent = dom.parentNode;
    var msg = parent.appendChild(document.createElement("div"));
    msg.style.left = (dom.offsetLeft + dom.offsetWidth + 2) + "px";
    msg.style.top = (dom.offsetTop - 5) + "px";
    msg.className = "ProseMirror-invalid";
    msg.textContent = message;
    setTimeout(function () { return parent.removeChild(msg); }, 1500);
  }

  // ::- The type of field that `FieldPrompt` expects to be passed to it.
  var Field = function Field(options) { this.options = options; };

  // render:: (state: EditorState, props: Object) → dom.Node
  // Render the field to the DOM. Should be implemented by all subclasses.

  // :: (dom.Node) → any
  // Read the field's value from its DOM node.
  Field.prototype.read = function read (dom) { return dom.value };

  // :: (any) → ?string
  // A field-type-specific validation function.
  Field.prototype.validateType = function validateType (_value) {};

  Field.prototype.validate = function validate (value) {
    if (!value && this.options.required)
      { return "Required field" }
    return this.validateType(value) || (this.options.validate && this.options.validate(value))
  };

  Field.prototype.clean = function clean (value) {
    return this.options.clean ? this.options.clean(value) : value
  };

  // ::- A field class for single-line text fields.
  var TextField = /*@__PURE__*/(function (Field) {
    function TextField () {
      Field.apply(this, arguments);
    }

    if ( Field ) TextField.__proto__ = Field;
    TextField.prototype = Object.create( Field && Field.prototype );
    TextField.prototype.constructor = TextField;

    TextField.prototype.render = function render () {
      var input = document.createElement("input");
      input.type = "text";
      input.placeholder = this.options.label;
      input.value = this.options.value || "";
      input.autocomplete = "off";
      return input
    };

    return TextField;
  }(Field));

  // Helpers to create specific types of items

  function canInsert(state, nodeType) {
    var $from = state.selection.$from;
    for (var d = $from.depth; d >= 0; d--) {
      var index = $from.index(d);
      if ($from.node(d).canReplaceWith(index, index, nodeType)) { return true }
    }
    return false
  }

  function insertImageItem(nodeType) {
    return new MenuItem({
      title: "Insert image",
      label: "Image",
      enable: function enable(state) { return canInsert(state, nodeType) },
      run: function run(state, _, view) {
        var ref = state.selection;
        var from = ref.from;
        var to = ref.to;
        var attrs = null;
        if (state.selection instanceof NodeSelection && state.selection.node.type == nodeType)
          { attrs = state.selection.node.attrs; }
        openPrompt({
          title: "Insert image",
          fields: {
            src: new TextField({label: "Location", required: true, value: attrs && attrs.src}),
            title: new TextField({label: "Title", value: attrs && attrs.title}),
            alt: new TextField({label: "Description",
                                value: attrs ? attrs.alt : state.doc.textBetween(from, to, " ")})
          },
          callback: function callback(attrs) {
            view.dispatch(view.state.tr.replaceSelectionWith(nodeType.createAndFill(attrs)));
            view.focus();
          }
        });
      }
    })
  }

  function cmdItem(cmd, options) {
    var passedOptions = {
      label: options.title,
      run: cmd
    };
    for (var prop in options) { passedOptions[prop] = options[prop]; }
    if ((!options.enable || options.enable === true) && !options.select)
      { passedOptions[options.enable ? "enable" : "select"] = function (state) { return cmd(state); }; }

    return new MenuItem(passedOptions)
  }

  function markActive(state, type) {
    var ref = state.selection;
    var from = ref.from;
    var $from = ref.$from;
    var to = ref.to;
    var empty = ref.empty;
    if (empty) { return type.isInSet(state.storedMarks || $from.marks()) }
    else { return state.doc.rangeHasMark(from, to, type) }
  }

  function markItem(markType, options) {
    var passedOptions = {
      active: function active(state) { return markActive(state, markType) },
      enable: true
    };
    for (var prop in options) { passedOptions[prop] = options[prop]; }
    return cmdItem(toggleMark(markType), passedOptions)
  }

  function linkItem(markType) {
    return new MenuItem({
      title: "Add or remove link",
      icon: icons.link,
      active: function active(state) { return markActive(state, markType) },
      enable: function enable(state) { return !state.selection.empty },
      run: function run(state, dispatch, view) {
        if (markActive(state, markType)) {
          toggleMark(markType)(state, dispatch);
          return true
        }
        openPrompt({
          title: "Create a link",
          fields: {
            href: new TextField({
              label: "Link target",
              required: true
            }),
            title: new TextField({label: "Title"})
          },
          callback: function callback(attrs) {
            toggleMark(markType, attrs)(view.state, view.dispatch);
            view.focus();
          }
        });
      }
    })
  }

  function wrapListItem(nodeType, options) {
    return cmdItem(wrapInList(nodeType, options.attrs), options)
  }

  // :: (Schema) → Object
  // Given a schema, look for default mark and node types in it and
  // return an object with relevant menu items relating to those marks:
  //
  // **`toggleStrong`**`: MenuItem`
  //   : A menu item to toggle the [strong mark](#schema-basic.StrongMark).
  //
  // **`toggleEm`**`: MenuItem`
  //   : A menu item to toggle the [emphasis mark](#schema-basic.EmMark).
  //
  // **`toggleCode`**`: MenuItem`
  //   : A menu item to toggle the [code font mark](#schema-basic.CodeMark).
  //
  // **`toggleLink`**`: MenuItem`
  //   : A menu item to toggle the [link mark](#schema-basic.LinkMark).
  //
  // **`insertImage`**`: MenuItem`
  //   : A menu item to insert an [image](#schema-basic.Image).
  //
  // **`wrapBulletList`**`: MenuItem`
  //   : A menu item to wrap the selection in a [bullet list](#schema-list.BulletList).
  //
  // **`wrapOrderedList`**`: MenuItem`
  //   : A menu item to wrap the selection in an [ordered list](#schema-list.OrderedList).
  //
  // **`wrapBlockQuote`**`: MenuItem`
  //   : A menu item to wrap the selection in a [block quote](#schema-basic.BlockQuote).
  //
  // **`makeParagraph`**`: MenuItem`
  //   : A menu item to set the current textblock to be a normal
  //     [paragraph](#schema-basic.Paragraph).
  //
  // **`makeCodeBlock`**`: MenuItem`
  //   : A menu item to set the current textblock to be a
  //     [code block](#schema-basic.CodeBlock).
  //
  // **`makeHead[N]`**`: MenuItem`
  //   : Where _N_ is 1 to 6. Menu items to set the current textblock to
  //     be a [heading](#schema-basic.Heading) of level _N_.
  //
  // **`insertHorizontalRule`**`: MenuItem`
  //   : A menu item to insert a horizontal rule.
  //
  // The return value also contains some prefabricated menu elements and
  // menus, that you can use instead of composing your own menu from
  // scratch:
  //
  // **`insertMenu`**`: Dropdown`
  //   : A dropdown containing the `insertImage` and
  //     `insertHorizontalRule` items.
  //
  // **`typeMenu`**`: Dropdown`
  //   : A dropdown containing the items for making the current
  //     textblock a paragraph, code block, or heading.
  //
  // **`fullMenu`**`: [[MenuElement]]`
  //   : An array of arrays of menu elements for use as the full menu
  //     for, for example the [menu bar](https://github.com/prosemirror/prosemirror-menu#user-content-menubar).
  function buildMenuItems(schema) {
    var r = {}, type;
    if (type = schema.marks.strong)
      { r.toggleStrong = markItem(type, {title: "Toggle strong style", icon: icons.strong}); }
    if (type = schema.marks.em)
      { r.toggleEm = markItem(type, {title: "Toggle emphasis", icon: icons.em}); }
    if (type = schema.marks.code)
      { r.toggleCode = markItem(type, {title: "Toggle code font", icon: icons.code}); }
    if (type = schema.marks.link)
      { r.toggleLink = linkItem(type); }

    if (type = schema.nodes.image)
      { r.insertImage = insertImageItem(type); }
    if (type = schema.nodes.bullet_list)
      { r.wrapBulletList = wrapListItem(type, {
        title: "Wrap in bullet list",
        icon: icons.bulletList
      }); }
    if (type = schema.nodes.ordered_list)
      { r.wrapOrderedList = wrapListItem(type, {
        title: "Wrap in ordered list",
        icon: icons.orderedList
      }); }
    if (type = schema.nodes.blockquote)
      { r.wrapBlockQuote = wrapItem(type, {
        title: "Wrap in block quote",
        icon: icons.blockquote
      }); }
    if (type = schema.nodes.paragraph)
      { r.makeParagraph = blockTypeItem(type, {
        title: "Change to paragraph",
        label: "Plain"
      }); }
    if (type = schema.nodes.code_block)
      { r.makeCodeBlock = blockTypeItem(type, {
        title: "Change to code block",
        label: "Code"
      }); }
    if (type = schema.nodes.heading)
      { for (var i = 1; i <= 10; i++)
        { r["makeHead" + i] = blockTypeItem(type, {
          title: "Change to heading " + i,
          label: "Level " + i,
          attrs: {level: i}
        }); } }
    if (type = schema.nodes.horizontal_rule) {
      var hr = type;
      r.insertHorizontalRule = new MenuItem({
        title: "Insert horizontal rule",
        label: "Horizontal rule",
        enable: function enable(state) { return canInsert(state, hr) },
        run: function run(state, dispatch) { dispatch(state.tr.replaceSelectionWith(hr.create())); }
      });
    }

    var cut = function (arr) { return arr.filter(function (x) { return x; }); };
    r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule]), {label: "Insert"});
    r.typeMenu = new Dropdown(cut([r.makeParagraph, r.makeCodeBlock, r.makeHead1 && new DropdownSubmenu(cut([
      r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6
    ]), {label: "Heading"})]), {label: "Type..."});

    r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink])];
    r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, joinUpItem,
                        liftItem, selectParentNodeItem])];
    r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], [[undoItem, redoItem]], r.blockMenu);

    return r
  }

  var mac$3 = typeof navigator != "undefined" ? /Mac/.test(navigator.platform) : false;

  // :: (Schema, ?Object) → Object
  // Inspect the given schema looking for marks and nodes from the
  // basic schema, and if found, add key bindings related to them.
  // This will add:
  //
  // * **Mod-b** for toggling [strong](#schema-basic.StrongMark)
  // * **Mod-i** for toggling [emphasis](#schema-basic.EmMark)
  // * **Mod-`** for toggling [code font](#schema-basic.CodeMark)
  // * **Ctrl-Shift-0** for making the current textblock a paragraph
  // * **Ctrl-Shift-1** to **Ctrl-Shift-Digit6** for making the current
  //   textblock a heading of the corresponding level
  // * **Ctrl-Shift-Backslash** to make the current textblock a code block
  // * **Ctrl-Shift-8** to wrap the selection in an ordered list
  // * **Ctrl-Shift-9** to wrap the selection in a bullet list
  // * **Ctrl->** to wrap the selection in a block quote
  // * **Enter** to split a non-empty textblock in a list item while at
  //   the same time splitting the list item
  // * **Mod-Enter** to insert a hard break
  // * **Mod-_** to insert a horizontal rule
  // * **Backspace** to undo an input rule
  // * **Alt-ArrowUp** to `joinUp`
  // * **Alt-ArrowDown** to `joinDown`
  // * **Mod-BracketLeft** to `lift`
  // * **Escape** to `selectParentNode`
  //
  // You can suppress or map these bindings by passing a `mapKeys`
  // argument, which maps key names (say `"Mod-B"` to either `false`, to
  // remove the binding, or a new key name string.
  function buildKeymap(schema, mapKeys) {
    var keys = {}, type;
    function bind(key, cmd) {
      if (mapKeys) {
        var mapped = mapKeys[key];
        if (mapped === false) { return }
        if (mapped) { key = mapped; }
      }
      keys[key] = cmd;
    }


    bind("Mod-z", undo);
    bind("Shift-Mod-z", redo);
    bind("Backspace", undoInputRule);
    if (!mac$3) { bind("Mod-y", redo); }

    bind("Alt-ArrowUp", joinUp);
    bind("Alt-ArrowDown", joinDown);
    bind("Mod-BracketLeft", lift);
    bind("Escape", selectParentNode);

    if (type = schema.marks.strong) {
      bind("Mod-b", toggleMark(type));
      bind("Mod-B", toggleMark(type));
    }
    if (type = schema.marks.em) {
      bind("Mod-i", toggleMark(type));
      bind("Mod-I", toggleMark(type));
    }
    if (type = schema.marks.code)
      { bind("Mod-`", toggleMark(type)); }

    if (type = schema.nodes.bullet_list)
      { bind("Shift-Ctrl-8", wrapInList(type)); }
    if (type = schema.nodes.ordered_list)
      { bind("Shift-Ctrl-9", wrapInList(type)); }
    if (type = schema.nodes.blockquote)
      { bind("Ctrl->", wrapIn(type)); }
    if (type = schema.nodes.hard_break) {
      var br = type, cmd = chainCommands(exitCode, function (state, dispatch) {
        dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
        return true
      });
      bind("Mod-Enter", cmd);
      bind("Shift-Enter", cmd);
      if (mac$3) { bind("Ctrl-Enter", cmd); }
    }
    if (type = schema.nodes.list_item) {
      bind("Enter", splitListItem(type));
      bind("Mod-[", liftListItem(type));
      bind("Mod-]", sinkListItem(type));
    }
    if (type = schema.nodes.paragraph)
      { bind("Shift-Ctrl-0", setBlockType(type)); }
    if (type = schema.nodes.code_block)
      { bind("Shift-Ctrl-\\", setBlockType(type)); }
    if (type = schema.nodes.heading)
      { for (var i = 1; i <= 6; i++) { bind("Shift-Ctrl-" + i, setBlockType(type, {level: i})); } }
    if (type = schema.nodes.horizontal_rule) {
      var hr = type;
      bind("Mod-_", function (state, dispatch) {
        dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
        return true
      });
    }

    return keys
  }

  // : (NodeType) → InputRule
  // Given a blockquote node type, returns an input rule that turns `"> "`
  // at the start of a textblock into a blockquote.
  function blockQuoteRule(nodeType) {
    return wrappingInputRule(/^\s*>\s$/, nodeType)
  }

  // : (NodeType) → InputRule
  // Given a list node type, returns an input rule that turns a number
  // followed by a dot at the start of a textblock into an ordered list.
  function orderedListRule(nodeType) {
    return wrappingInputRule(/^(\d+)\.\s$/, nodeType, function (match) { return ({order: +match[1]}); },
                             function (match, node) { return node.childCount + node.attrs.order == +match[1]; })
  }

  // : (NodeType) → InputRule
  // Given a list node type, returns an input rule that turns a bullet
  // (dash, plush, or asterisk) at the start of a textblock into a
  // bullet list.
  function bulletListRule(nodeType) {
    return wrappingInputRule(/^\s*([-+*])\s$/, nodeType)
  }

  // : (NodeType) → InputRule
  // Given a code block node type, returns an input rule that turns a
  // textblock starting with three backticks into a code block.
  function codeBlockRule(nodeType) {
    return textblockTypeInputRule(/^```$/, nodeType)
  }

  // : (NodeType, number) → InputRule
  // Given a node type and a maximum level, creates an input rule that
  // turns up to that number of `#` characters followed by a space at
  // the start of a textblock into a heading whose level corresponds to
  // the number of `#` signs.
  function headingRule(nodeType, maxLevel) {
    return textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"),
                                  nodeType, function (match) { return ({level: match[1].length}); })
  }

  // : (Schema) → Plugin
  // A set of input rules for creating the basic block quotes, lists,
  // code blocks, and heading.
  function buildInputRules(schema) {
    var rules = smartQuotes.concat(ellipsis, emDash), type;
    if (type = schema.nodes.blockquote) { rules.push(blockQuoteRule(type)); }
    if (type = schema.nodes.ordered_list) { rules.push(orderedListRule(type)); }
    if (type = schema.nodes.bullet_list) { rules.push(bulletListRule(type)); }
    if (type = schema.nodes.code_block) { rules.push(codeBlockRule(type)); }
    if (type = schema.nodes.heading) { rules.push(headingRule(type, 6)); }
    return inputRules({rules: rules})
  }

  // !! This module exports helper functions for deriving a set of basic
  // menu items, input rules, or key bindings from a schema. These
  // values need to know about the schema for two reasons—they need
  // access to specific instances of node and mark types, and they need
  // to know which of the node and mark types that they know about are
  // actually present in the schema.
  //
  // The `exampleSetup` plugin ties these together into a plugin that
  // will automatically enable this basic functionality in an editor.

  // :: (Object) → [Plugin]
  // A convenience plugin that bundles together a simple menu with basic
  // key bindings, input rules, and styling for the example schema.
  // Probably only useful for quickly setting up a passable
  // editor—you'll need more control over your settings in most
  // real-world situations.
  //
  //   options::- The following options are recognized:
  //
  //     schema:: Schema
  //     The schema to generate key bindings and menu items for.
  //
  //     mapKeys:: ?Object
  //     Can be used to [adjust](#example-setup.buildKeymap) the key bindings created.
  //
  //     menuBar:: ?bool
  //     Set to false to disable the menu bar.
  //
  //     history:: ?bool
  //     Set to false to disable the history plugin.
  //
  //     floatingMenu:: ?bool
  //     Set to false to make the menu bar non-floating.
  //
  //     menuContent:: [[MenuItem]]
  //     Can be used to override the menu content.
  function exampleSetup(options) {
    var plugins = [
      buildInputRules(options.schema),
      keymap(buildKeymap(options.schema, options.mapKeys)),
      keymap(baseKeymap),
      dropCursor(),
      gapCursor()
    ];
    if (options.menuBar !== false)
      { plugins.push(menuBar({floating: options.floatingMenu !== false,
                            content: options.menuContent || buildMenuItems(options.schema).fullMenu})); }
    if (options.history !== false)
      { plugins.push(history()); }

    return plugins.concat(new Plugin({
      props: {
        attributes: {class: "ProseMirror-example-setup-style"}
      }
    }))
  }

  const REQUEST_FOR_DIRTY_RANGES = "REQUEST_START";
  const REQUEST_FOR_DOCUMENT = "REQUEST_FOR_DOCUMENT";
  const REQUEST_SUCCESS = "REQUEST_SUCCESS";
  const REQUEST_ERROR = "REQUEST_ERROR";
  const REQUEST_COMPLETE = "REQUEST_COMPLETE";
  const NEW_HOVER_ID = "NEW_HOVER_ID";
  const SELECT_MATCH = "SELECT_MATCH";
  const APPLY_NEW_DIRTY_RANGES = "HANDLE_NEW_DIRTY_RANGES";
  const SET_DEBUG_STATE = "SET_DEBUG_STATE";
  const SET_REQUEST_MATCHES_ON_DOC_MODIFIED = "SET_REQUEST_MATCHES_ON_DOC_MODIFIED";
  const requestMatchesForDirtyRanges = (requestId, categoryIds) => ({
      type: REQUEST_FOR_DIRTY_RANGES,
      payload: { requestId, categoryIds }
  });
  const requestMatchesForDocument = (requestId, categoryIds) => ({
      type: REQUEST_FOR_DOCUMENT,
      payload: { requestId, categoryIds }
  });
  const requestMatchesSuccess = (response) => ({
      type: REQUEST_SUCCESS,
      payload: { response }
  });
  const requestError = (matchRequestError) => ({
      type: REQUEST_ERROR,
      payload: { matchRequestError }
  });
  const requestMatchesComplete = (requestId) => ({
      type: REQUEST_COMPLETE,
      payload: { requestId }
  });
  const newHoverIdReceived = (matchId, hoverInfo) => ({
      type: NEW_HOVER_ID,
      payload: { matchId, hoverInfo }
  });
  const applyNewDirtiedRanges = (ranges) => ({
      type: APPLY_NEW_DIRTY_RANGES,
      payload: { ranges }
  });
  const selectMatch = (matchId) => ({
      type: SELECT_MATCH,
      payload: { matchId }
  });
  const setDebugState = (debug) => ({
      type: SET_DEBUG_STATE,
      payload: { debug }
  });
  const setRequestMatchesOnDocModified = (requestMatchesOnDocModified) => ({
      type: SET_REQUEST_MATCHES_ON_DOC_MODIFIED,
      payload: { requestMatchesOnDocModified }
  });

  /**
   * A specialized version of `_.map` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  function arrayMap(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length,
        result = Array(length);

    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }

  var _arrayMap = arrayMap;

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }

  var _listCacheClear = listCacheClear;

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || (value !== value && other !== other);
  }

  var eq_1 = eq;

  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq_1(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }

  var _assocIndexOf = assocIndexOf;

  /** Used for built-in method references. */
  var arrayProto = Array.prototype;

  /** Built-in value references. */
  var splice = arrayProto.splice;

  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }

  var _listCacheDelete = listCacheDelete;

  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
  }

  var _listCacheGet = listCacheGet;

  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return _assocIndexOf(this.__data__, key) > -1;
  }

  var _listCacheHas = listCacheHas;

  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }

  var _listCacheSet = listCacheSet;

  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `ListCache`.
  ListCache.prototype.clear = _listCacheClear;
  ListCache.prototype['delete'] = _listCacheDelete;
  ListCache.prototype.get = _listCacheGet;
  ListCache.prototype.has = _listCacheHas;
  ListCache.prototype.set = _listCacheSet;

  var _ListCache = ListCache;

  /**
   * Removes all key-value entries from the stack.
   *
   * @private
   * @name clear
   * @memberOf Stack
   */
  function stackClear() {
    this.__data__ = new _ListCache;
    this.size = 0;
  }

  var _stackClear = stackClear;

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function stackDelete(key) {
    var data = this.__data__,
        result = data['delete'](key);

    this.size = data.size;
    return result;
  }

  var _stackDelete = stackDelete;

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function stackGet(key) {
    return this.__data__.get(key);
  }

  var _stackGet = stackGet;

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function stackHas(key) {
    return this.__data__.has(key);
  }

  var _stackHas = stackHas;

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule$1(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

  var _freeGlobal = freeGlobal;

  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = _freeGlobal || freeSelf || Function('return this')();

  var _root = root;

  /** Built-in value references. */
  var Symbol = _root.Symbol;

  var _Symbol = Symbol;

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString = objectProto.toString;

  /** Built-in value references. */
  var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

  /**
   * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the raw `toStringTag`.
   */
  function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag),
        tag = value[symToStringTag];

    try {
      value[symToStringTag] = undefined;
      var unmasked = true;
    } catch (e) {}

    var result = nativeObjectToString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }

  var _getRawTag = getRawTag;

  /** Used for built-in method references. */
  var objectProto$1 = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString$1 = objectProto$1.toString;

  /**
   * Converts `value` to a string using `Object.prototype.toString`.
   *
   * @private
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   */
  function objectToString(value) {
    return nativeObjectToString$1.call(value);
  }

  var _objectToString = objectToString;

  /** `Object#toString` result references. */
  var nullTag = '[object Null]',
      undefinedTag = '[object Undefined]';

  /** Built-in value references. */
  var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

  /**
   * The base implementation of `getTag` without fallbacks for buggy environments.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    if (value == null) {
      return value === undefined ? undefinedTag : nullTag;
    }
    return (symToStringTag$1 && symToStringTag$1 in Object(value))
      ? _getRawTag(value)
      : _objectToString(value);
  }

  var _baseGetTag = baseGetTag;

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == 'object' || type == 'function');
  }

  var isObject_1 = isObject;

  /** `Object#toString` result references. */
  var asyncTag = '[object AsyncFunction]',
      funcTag = '[object Function]',
      genTag = '[object GeneratorFunction]',
      proxyTag = '[object Proxy]';

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    if (!isObject_1(value)) {
      return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = _baseGetTag(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
  }

  var isFunction_1 = isFunction;

  /** Used to detect overreaching core-js shims. */
  var coreJsData = _root['__core-js_shared__'];

  var _coreJsData = coreJsData;

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = (function() {
    var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
    return uid ? ('Symbol(src)_1.' + uid) : '';
  }());

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && (maskSrcKey in func);
  }

  var _isMasked = isMasked;

  /** Used for built-in method references. */
  var funcProto = Function.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to convert.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {}
      try {
        return (func + '');
      } catch (e) {}
    }
    return '';
  }

  var _toSource = toSource;

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used for built-in method references. */
  var funcProto$1 = Function.prototype,
      objectProto$2 = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString$1 = funcProto$1.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' +
    funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
    .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
  );

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject_1(value) || _isMasked(value)) {
      return false;
    }
    var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
    return pattern.test(_toSource(value));
  }

  var _baseIsNative = baseIsNative;

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  var _getValue = getValue;

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = _getValue(object, key);
    return _baseIsNative(value) ? value : undefined;
  }

  var _getNative = getNative;

  /* Built-in method references that are verified to be native. */
  var Map = _getNative(_root, 'Map');

  var _Map = Map;

  /* Built-in method references that are verified to be native. */
  var nativeCreate = _getNative(Object, 'create');

  var _nativeCreate = nativeCreate;

  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
    this.size = 0;
  }

  var _hashClear = hashClear;

  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }

  var _hashDelete = hashDelete;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /** Used for built-in method references. */
  var objectProto$3 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__;
    if (_nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? undefined : result;
    }
    return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
  }

  var _hashGet = hashGet;

  /** Used for built-in method references. */
  var objectProto$4 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__;
    return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$3.call(data, key);
  }

  var _hashHas = hashHas;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = (_nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
    return this;
  }

  var _hashSet = hashSet;

  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `Hash`.
  Hash.prototype.clear = _hashClear;
  Hash.prototype['delete'] = _hashDelete;
  Hash.prototype.get = _hashGet;
  Hash.prototype.has = _hashHas;
  Hash.prototype.set = _hashSet;

  var _Hash = Hash;

  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      'hash': new _Hash,
      'map': new (_Map || _ListCache),
      'string': new _Hash
    };
  }

  var _mapCacheClear = mapCacheClear;

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value;
    return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
      ? (value !== '__proto__')
      : (value === null);
  }

  var _isKeyable = isKeyable;

  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__;
    return _isKeyable(key)
      ? data[typeof key == 'string' ? 'string' : 'hash']
      : data.map;
  }

  var _getMapData = getMapData;

  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    var result = _getMapData(this, key)['delete'](key);
    this.size -= result ? 1 : 0;
    return result;
  }

  var _mapCacheDelete = mapCacheDelete;

  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return _getMapData(this, key).get(key);
  }

  var _mapCacheGet = mapCacheGet;

  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return _getMapData(this, key).has(key);
  }

  var _mapCacheHas = mapCacheHas;

  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    var data = _getMapData(this, key),
        size = data.size;

    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }

  var _mapCacheSet = mapCacheSet;

  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `MapCache`.
  MapCache.prototype.clear = _mapCacheClear;
  MapCache.prototype['delete'] = _mapCacheDelete;
  MapCache.prototype.get = _mapCacheGet;
  MapCache.prototype.has = _mapCacheHas;
  MapCache.prototype.set = _mapCacheSet;

  var _MapCache = MapCache;

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /**
   * Sets the stack `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Stack
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the stack cache instance.
   */
  function stackSet(key, value) {
    var data = this.__data__;
    if (data instanceof _ListCache) {
      var pairs = data.__data__;
      if (!_Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
        pairs.push([key, value]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new _MapCache(pairs);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }

  var _stackSet = stackSet;

  /**
   * Creates a stack cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Stack(entries) {
    var data = this.__data__ = new _ListCache(entries);
    this.size = data.size;
  }

  // Add methods to `Stack`.
  Stack.prototype.clear = _stackClear;
  Stack.prototype['delete'] = _stackDelete;
  Stack.prototype.get = _stackGet;
  Stack.prototype.has = _stackHas;
  Stack.prototype.set = _stackSet;

  var _Stack = Stack;

  /**
   * A specialized version of `_.forEach` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns `array`.
   */
  function arrayEach(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (iteratee(array[index], index, array) === false) {
        break;
      }
    }
    return array;
  }

  var _arrayEach = arrayEach;

  var defineProperty = (function() {
    try {
      var func = _getNative(Object, 'defineProperty');
      func({}, '', {});
      return func;
    } catch (e) {}
  }());

  var _defineProperty = defineProperty;

  /**
   * The base implementation of `assignValue` and `assignMergeValue` without
   * value checks.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function baseAssignValue(object, key, value) {
    if (key == '__proto__' && _defineProperty) {
      _defineProperty(object, key, {
        'configurable': true,
        'enumerable': true,
        'value': value,
        'writable': true
      });
    } else {
      object[key] = value;
    }
  }

  var _baseAssignValue = baseAssignValue;

  /** Used for built-in method references. */
  var objectProto$5 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

  /**
   * Assigns `value` to `key` of `object` if the existing value is not equivalent
   * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * for equality comparisons.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function assignValue(object, key, value) {
    var objValue = object[key];
    if (!(hasOwnProperty$4.call(object, key) && eq_1(objValue, value)) ||
        (value === undefined && !(key in object))) {
      _baseAssignValue(object, key, value);
    }
  }

  var _assignValue = assignValue;

  /**
   * Copies properties of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy properties from.
   * @param {Array} props The property identifiers to copy.
   * @param {Object} [object={}] The object to copy properties to.
   * @param {Function} [customizer] The function to customize copied values.
   * @returns {Object} Returns `object`.
   */
  function copyObject(source, props, object, customizer) {
    var isNew = !object;
    object || (object = {});

    var index = -1,
        length = props.length;

    while (++index < length) {
      var key = props[index];

      var newValue = customizer
        ? customizer(object[key], source[key], key, object, source)
        : undefined;

      if (newValue === undefined) {
        newValue = source[key];
      }
      if (isNew) {
        _baseAssignValue(object, key, newValue);
      } else {
        _assignValue(object, key, newValue);
      }
    }
    return object;
  }

  var _copyObject = copyObject;

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  var _baseTimes = baseTimes;

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return value != null && typeof value == 'object';
  }

  var isObjectLike_1 = isObjectLike;

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]';

  /**
   * The base implementation of `_.isArguments`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   */
  function baseIsArguments(value) {
    return isObjectLike_1(value) && _baseGetTag(value) == argsTag;
  }

  var _baseIsArguments = baseIsArguments;

  /** Used for built-in method references. */
  var objectProto$6 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$5 = objectProto$6.hasOwnProperty;

  /** Built-in value references. */
  var propertyIsEnumerable = objectProto$6.propertyIsEnumerable;

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
    return isObjectLike_1(value) && hasOwnProperty$5.call(value, 'callee') &&
      !propertyIsEnumerable.call(value, 'callee');
  };

  var isArguments_1 = isArguments;

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray = Array.isArray;

  var isArray_1 = isArray;

  /**
   * This method returns `false`.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {boolean} Returns `false`.
   * @example
   *
   * _.times(2, _.stubFalse);
   * // => [false, false]
   */
  function stubFalse() {
    return false;
  }

  var stubFalse_1 = stubFalse;

  var isBuffer_1 = createCommonjsModule$1(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports =  exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Built-in value references. */
  var Buffer = moduleExports ? _root.Buffer : undefined;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */
  var isBuffer = nativeIsBuffer || stubFalse_1;

  module.exports = isBuffer;
  });

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    var type = typeof value;
    length = length == null ? MAX_SAFE_INTEGER : length;

    return !!length &&
      (type == 'number' ||
        (type != 'symbol' && reIsUint.test(value))) &&
          (value > -1 && value % 1 == 0 && value < length);
  }

  var _isIndex = isIndex;

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER$1 = 9007199254740991;

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return typeof value == 'number' &&
      value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
  }

  var isLength_1 = isLength;

  /** `Object#toString` result references. */
  var argsTag$1 = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag$1 = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
  typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
  typedArrayTags[mapTag] = typedArrayTags[numberTag] =
  typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
  typedArrayTags[setTag] = typedArrayTags[stringTag] =
  typedArrayTags[weakMapTag] = false;

  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
    return isObjectLike_1(value) &&
      isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
  }

  var _baseIsTypedArray = baseIsTypedArray;

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }

  var _baseUnary = baseUnary;

  var _nodeUtil = createCommonjsModule$1(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports =  exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && _freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function() {
    try {
      // Use `util.types` for Node.js 10+.
      var types = freeModule && freeModule.require && freeModule.require('util').types;

      if (types) {
        return types;
      }

      // Legacy `process.binding('util')` for Node.js < 10.
      return freeProcess && freeProcess.binding && freeProcess.binding('util');
    } catch (e) {}
  }());

  module.exports = nodeUtil;
  });

  /* Node.js helper references. */
  var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

  var isTypedArray_1 = isTypedArray;

  /** Used for built-in method references. */
  var objectProto$7 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$6 = objectProto$7.hasOwnProperty;

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray_1(value),
        isArg = !isArr && isArguments_1(value),
        isBuff = !isArr && !isArg && isBuffer_1(value),
        isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
        skipIndexes = isArr || isArg || isBuff || isType,
        result = skipIndexes ? _baseTimes(value.length, String) : [],
        length = result.length;

    for (var key in value) {
      if ((inherited || hasOwnProperty$6.call(value, key)) &&
          !(skipIndexes && (
             // Safari 9 has enumerable `arguments.length` in strict mode.
             key == 'length' ||
             // Node.js 0.10 has enumerable non-index properties on buffers.
             (isBuff && (key == 'offset' || key == 'parent')) ||
             // PhantomJS 2 has enumerable non-index properties on typed arrays.
             (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
             // Skip index properties.
             _isIndex(key, length)
          ))) {
        result.push(key);
      }
    }
    return result;
  }

  var _arrayLikeKeys = arrayLikeKeys;

  /** Used for built-in method references. */
  var objectProto$8 = Object.prototype;

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
        proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$8;

    return value === proto;
  }

  var _isPrototype = isPrototype;

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }

  var _overArg = overArg;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeKeys = _overArg(Object.keys, Object);

  var _nativeKeys = nativeKeys;

  /** Used for built-in method references. */
  var objectProto$9 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$7 = objectProto$9.hasOwnProperty;

  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!_isPrototype(object)) {
      return _nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty$7.call(object, key) && key != 'constructor') {
        result.push(key);
      }
    }
    return result;
  }

  var _baseKeys = baseKeys;

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength_1(value.length) && !isFunction_1(value);
  }

  var isArrayLike_1 = isArrayLike;

  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys$1(object) {
    return isArrayLike_1(object) ? _arrayLikeKeys(object) : _baseKeys(object);
  }

  var keys_1 = keys$1;

  /**
   * The base implementation of `_.assign` without support for multiple sources
   * or `customizer` functions.
   *
   * @private
   * @param {Object} object The destination object.
   * @param {Object} source The source object.
   * @returns {Object} Returns `object`.
   */
  function baseAssign(object, source) {
    return object && _copyObject(source, keys_1(source), object);
  }

  var _baseAssign = baseAssign;

  /**
   * This function is like
   * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * except that it includes inherited enumerable properties.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function nativeKeysIn(object) {
    var result = [];
    if (object != null) {
      for (var key in Object(object)) {
        result.push(key);
      }
    }
    return result;
  }

  var _nativeKeysIn = nativeKeysIn;

  /** Used for built-in method references. */
  var objectProto$a = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$8 = objectProto$a.hasOwnProperty;

  /**
   * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeysIn(object) {
    if (!isObject_1(object)) {
      return _nativeKeysIn(object);
    }
    var isProto = _isPrototype(object),
        result = [];

    for (var key in object) {
      if (!(key == 'constructor' && (isProto || !hasOwnProperty$8.call(object, key)))) {
        result.push(key);
      }
    }
    return result;
  }

  var _baseKeysIn = baseKeysIn;

  /**
   * Creates an array of the own and inherited enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keysIn(new Foo);
   * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
   */
  function keysIn$1(object) {
    return isArrayLike_1(object) ? _arrayLikeKeys(object, true) : _baseKeysIn(object);
  }

  var keysIn_1 = keysIn$1;

  /**
   * The base implementation of `_.assignIn` without support for multiple sources
   * or `customizer` functions.
   *
   * @private
   * @param {Object} object The destination object.
   * @param {Object} source The source object.
   * @returns {Object} Returns `object`.
   */
  function baseAssignIn(object, source) {
    return object && _copyObject(source, keysIn_1(source), object);
  }

  var _baseAssignIn = baseAssignIn;

  var _cloneBuffer = createCommonjsModule$1(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports =  exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Built-in value references. */
  var Buffer = moduleExports ? _root.Buffer : undefined,
      allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

  /**
   * Creates a clone of  `buffer`.
   *
   * @private
   * @param {Buffer} buffer The buffer to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Buffer} Returns the cloned buffer.
   */
  function cloneBuffer(buffer, isDeep) {
    if (isDeep) {
      return buffer.slice();
    }
    var length = buffer.length,
        result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

    buffer.copy(result);
    return result;
  }

  module.exports = cloneBuffer;
  });

  /**
   * Copies the values of `source` to `array`.
   *
   * @private
   * @param {Array} source The array to copy values from.
   * @param {Array} [array=[]] The array to copy values to.
   * @returns {Array} Returns `array`.
   */
  function copyArray(source, array) {
    var index = -1,
        length = source.length;

    array || (array = Array(length));
    while (++index < length) {
      array[index] = source[index];
    }
    return array;
  }

  var _copyArray = copyArray;

  /**
   * A specialized version of `_.filter` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {Array} Returns the new filtered array.
   */
  function arrayFilter(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[resIndex++] = value;
      }
    }
    return result;
  }

  var _arrayFilter = arrayFilter;

  /**
   * This method returns a new empty array.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {Array} Returns the new empty array.
   * @example
   *
   * var arrays = _.times(2, _.stubArray);
   *
   * console.log(arrays);
   * // => [[], []]
   *
   * console.log(arrays[0] === arrays[1]);
   * // => false
   */
  function stubArray() {
    return [];
  }

  var stubArray_1 = stubArray;

  /** Used for built-in method references. */
  var objectProto$b = Object.prototype;

  /** Built-in value references. */
  var propertyIsEnumerable$1 = objectProto$b.propertyIsEnumerable;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeGetSymbols = Object.getOwnPropertySymbols;

  /**
   * Creates an array of the own enumerable symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of symbols.
   */
  var getSymbols = !nativeGetSymbols ? stubArray_1 : function(object) {
    if (object == null) {
      return [];
    }
    object = Object(object);
    return _arrayFilter(nativeGetSymbols(object), function(symbol) {
      return propertyIsEnumerable$1.call(object, symbol);
    });
  };

  var _getSymbols = getSymbols;

  /**
   * Copies own symbols of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy symbols from.
   * @param {Object} [object={}] The object to copy symbols to.
   * @returns {Object} Returns `object`.
   */
  function copySymbols(source, object) {
    return _copyObject(source, _getSymbols(source), object);
  }

  var _copySymbols = copySymbols;

  /**
   * Appends the elements of `values` to `array`.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {Array} values The values to append.
   * @returns {Array} Returns `array`.
   */
  function arrayPush(array, values) {
    var index = -1,
        length = values.length,
        offset = array.length;

    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }

  var _arrayPush = arrayPush;

  /** Built-in value references. */
  var getPrototype = _overArg(Object.getPrototypeOf, Object);

  var _getPrototype = getPrototype;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeGetSymbols$1 = Object.getOwnPropertySymbols;

  /**
   * Creates an array of the own and inherited enumerable symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of symbols.
   */
  var getSymbolsIn = !nativeGetSymbols$1 ? stubArray_1 : function(object) {
    var result = [];
    while (object) {
      _arrayPush(result, _getSymbols(object));
      object = _getPrototype(object);
    }
    return result;
  };

  var _getSymbolsIn = getSymbolsIn;

  /**
   * Copies own and inherited symbols of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy symbols from.
   * @param {Object} [object={}] The object to copy symbols to.
   * @returns {Object} Returns `object`.
   */
  function copySymbolsIn(source, object) {
    return _copyObject(source, _getSymbolsIn(source), object);
  }

  var _copySymbolsIn = copySymbolsIn;

  /**
   * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
   * `keysFunc` and `symbolsFunc` to get the enumerable property names and
   * symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @param {Function} symbolsFunc The function to get the symbols of `object`.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray_1(object) ? result : _arrayPush(result, symbolsFunc(object));
  }

  var _baseGetAllKeys = baseGetAllKeys;

  /**
   * Creates an array of own enumerable property names and symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function getAllKeys(object) {
    return _baseGetAllKeys(object, keys_1, _getSymbols);
  }

  var _getAllKeys = getAllKeys;

  /**
   * Creates an array of own and inherited enumerable property names and
   * symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function getAllKeysIn(object) {
    return _baseGetAllKeys(object, keysIn_1, _getSymbolsIn);
  }

  var _getAllKeysIn = getAllKeysIn;

  /* Built-in method references that are verified to be native. */
  var DataView = _getNative(_root, 'DataView');

  var _DataView = DataView;

  /* Built-in method references that are verified to be native. */
  var Promise$1 = _getNative(_root, 'Promise');

  var _Promise = Promise$1;

  /* Built-in method references that are verified to be native. */
  var Set = _getNative(_root, 'Set');

  var _Set = Set;

  /* Built-in method references that are verified to be native. */
  var WeakMap$1 = _getNative(_root, 'WeakMap');

  var _WeakMap = WeakMap$1;

  /** `Object#toString` result references. */
  var mapTag$1 = '[object Map]',
      objectTag$1 = '[object Object]',
      promiseTag = '[object Promise]',
      setTag$1 = '[object Set]',
      weakMapTag$1 = '[object WeakMap]';

  var dataViewTag$1 = '[object DataView]';

  /** Used to detect maps, sets, and weakmaps. */
  var dataViewCtorString = _toSource(_DataView),
      mapCtorString = _toSource(_Map),
      promiseCtorString = _toSource(_Promise),
      setCtorString = _toSource(_Set),
      weakMapCtorString = _toSource(_WeakMap);

  /**
   * Gets the `toStringTag` of `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  var getTag = _baseGetTag;

  // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
  if ((_DataView && getTag(new _DataView(new ArrayBuffer(1))) != dataViewTag$1) ||
      (_Map && getTag(new _Map) != mapTag$1) ||
      (_Promise && getTag(_Promise.resolve()) != promiseTag) ||
      (_Set && getTag(new _Set) != setTag$1) ||
      (_WeakMap && getTag(new _WeakMap) != weakMapTag$1)) {
    getTag = function(value) {
      var result = _baseGetTag(value),
          Ctor = result == objectTag$1 ? value.constructor : undefined,
          ctorString = Ctor ? _toSource(Ctor) : '';

      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString: return dataViewTag$1;
          case mapCtorString: return mapTag$1;
          case promiseCtorString: return promiseTag;
          case setCtorString: return setTag$1;
          case weakMapCtorString: return weakMapTag$1;
        }
      }
      return result;
    };
  }

  var _getTag = getTag;

  /** Used for built-in method references. */
  var objectProto$c = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$9 = objectProto$c.hasOwnProperty;

  /**
   * Initializes an array clone.
   *
   * @private
   * @param {Array} array The array to clone.
   * @returns {Array} Returns the initialized clone.
   */
  function initCloneArray(array) {
    var length = array.length,
        result = new array.constructor(length);

    // Add properties assigned by `RegExp#exec`.
    if (length && typeof array[0] == 'string' && hasOwnProperty$9.call(array, 'index')) {
      result.index = array.index;
      result.input = array.input;
    }
    return result;
  }

  var _initCloneArray = initCloneArray;

  /** Built-in value references. */
  var Uint8Array$1 = _root.Uint8Array;

  var _Uint8Array = Uint8Array$1;

  /**
   * Creates a clone of `arrayBuffer`.
   *
   * @private
   * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
   * @returns {ArrayBuffer} Returns the cloned array buffer.
   */
  function cloneArrayBuffer(arrayBuffer) {
    var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
    new _Uint8Array(result).set(new _Uint8Array(arrayBuffer));
    return result;
  }

  var _cloneArrayBuffer = cloneArrayBuffer;

  /**
   * Creates a clone of `dataView`.
   *
   * @private
   * @param {Object} dataView The data view to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned data view.
   */
  function cloneDataView(dataView, isDeep) {
    var buffer = isDeep ? _cloneArrayBuffer(dataView.buffer) : dataView.buffer;
    return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
  }

  var _cloneDataView = cloneDataView;

  /** Used to match `RegExp` flags from their coerced string values. */
  var reFlags = /\w*$/;

  /**
   * Creates a clone of `regexp`.
   *
   * @private
   * @param {Object} regexp The regexp to clone.
   * @returns {Object} Returns the cloned regexp.
   */
  function cloneRegExp(regexp) {
    var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
    result.lastIndex = regexp.lastIndex;
    return result;
  }

  var _cloneRegExp = cloneRegExp;

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = _Symbol ? _Symbol.prototype : undefined,
      symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

  /**
   * Creates a clone of the `symbol` object.
   *
   * @private
   * @param {Object} symbol The symbol object to clone.
   * @returns {Object} Returns the cloned symbol object.
   */
  function cloneSymbol(symbol) {
    return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
  }

  var _cloneSymbol = cloneSymbol;

  /**
   * Creates a clone of `typedArray`.
   *
   * @private
   * @param {Object} typedArray The typed array to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned typed array.
   */
  function cloneTypedArray(typedArray, isDeep) {
    var buffer = isDeep ? _cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
    return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
  }

  var _cloneTypedArray = cloneTypedArray;

  /** `Object#toString` result references. */
  var boolTag$1 = '[object Boolean]',
      dateTag$1 = '[object Date]',
      mapTag$2 = '[object Map]',
      numberTag$1 = '[object Number]',
      regexpTag$1 = '[object RegExp]',
      setTag$2 = '[object Set]',
      stringTag$1 = '[object String]',
      symbolTag = '[object Symbol]';

  var arrayBufferTag$1 = '[object ArrayBuffer]',
      dataViewTag$2 = '[object DataView]',
      float32Tag$1 = '[object Float32Array]',
      float64Tag$1 = '[object Float64Array]',
      int8Tag$1 = '[object Int8Array]',
      int16Tag$1 = '[object Int16Array]',
      int32Tag$1 = '[object Int32Array]',
      uint8Tag$1 = '[object Uint8Array]',
      uint8ClampedTag$1 = '[object Uint8ClampedArray]',
      uint16Tag$1 = '[object Uint16Array]',
      uint32Tag$1 = '[object Uint32Array]';

  /**
   * Initializes an object clone based on its `toStringTag`.
   *
   * **Note:** This function only supports cloning values with tags of
   * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
   *
   * @private
   * @param {Object} object The object to clone.
   * @param {string} tag The `toStringTag` of the object to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the initialized clone.
   */
  function initCloneByTag(object, tag, isDeep) {
    var Ctor = object.constructor;
    switch (tag) {
      case arrayBufferTag$1:
        return _cloneArrayBuffer(object);

      case boolTag$1:
      case dateTag$1:
        return new Ctor(+object);

      case dataViewTag$2:
        return _cloneDataView(object, isDeep);

      case float32Tag$1: case float64Tag$1:
      case int8Tag$1: case int16Tag$1: case int32Tag$1:
      case uint8Tag$1: case uint8ClampedTag$1: case uint16Tag$1: case uint32Tag$1:
        return _cloneTypedArray(object, isDeep);

      case mapTag$2:
        return new Ctor;

      case numberTag$1:
      case stringTag$1:
        return new Ctor(object);

      case regexpTag$1:
        return _cloneRegExp(object);

      case setTag$2:
        return new Ctor;

      case symbolTag:
        return _cloneSymbol(object);
    }
  }

  var _initCloneByTag = initCloneByTag;

  /** Built-in value references. */
  var objectCreate = Object.create;

  /**
   * The base implementation of `_.create` without support for assigning
   * properties to the created object.
   *
   * @private
   * @param {Object} proto The object to inherit from.
   * @returns {Object} Returns the new object.
   */
  var baseCreate = (function() {
    function object() {}
    return function(proto) {
      if (!isObject_1(proto)) {
        return {};
      }
      if (objectCreate) {
        return objectCreate(proto);
      }
      object.prototype = proto;
      var result = new object;
      object.prototype = undefined;
      return result;
    };
  }());

  var _baseCreate = baseCreate;

  /**
   * Initializes an object clone.
   *
   * @private
   * @param {Object} object The object to clone.
   * @returns {Object} Returns the initialized clone.
   */
  function initCloneObject(object) {
    return (typeof object.constructor == 'function' && !_isPrototype(object))
      ? _baseCreate(_getPrototype(object))
      : {};
  }

  var _initCloneObject = initCloneObject;

  /** `Object#toString` result references. */
  var mapTag$3 = '[object Map]';

  /**
   * The base implementation of `_.isMap` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a map, else `false`.
   */
  function baseIsMap(value) {
    return isObjectLike_1(value) && _getTag(value) == mapTag$3;
  }

  var _baseIsMap = baseIsMap;

  /* Node.js helper references. */
  var nodeIsMap = _nodeUtil && _nodeUtil.isMap;

  /**
   * Checks if `value` is classified as a `Map` object.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a map, else `false`.
   * @example
   *
   * _.isMap(new Map);
   * // => true
   *
   * _.isMap(new WeakMap);
   * // => false
   */
  var isMap = nodeIsMap ? _baseUnary(nodeIsMap) : _baseIsMap;

  var isMap_1 = isMap;

  /** `Object#toString` result references. */
  var setTag$3 = '[object Set]';

  /**
   * The base implementation of `_.isSet` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a set, else `false`.
   */
  function baseIsSet(value) {
    return isObjectLike_1(value) && _getTag(value) == setTag$3;
  }

  var _baseIsSet = baseIsSet;

  /* Node.js helper references. */
  var nodeIsSet = _nodeUtil && _nodeUtil.isSet;

  /**
   * Checks if `value` is classified as a `Set` object.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a set, else `false`.
   * @example
   *
   * _.isSet(new Set);
   * // => true
   *
   * _.isSet(new WeakSet);
   * // => false
   */
  var isSet = nodeIsSet ? _baseUnary(nodeIsSet) : _baseIsSet;

  var isSet_1 = isSet;

  /** Used to compose bitmasks for cloning. */
  var CLONE_DEEP_FLAG = 1,
      CLONE_FLAT_FLAG = 2,
      CLONE_SYMBOLS_FLAG = 4;

  /** `Object#toString` result references. */
  var argsTag$2 = '[object Arguments]',
      arrayTag$1 = '[object Array]',
      boolTag$2 = '[object Boolean]',
      dateTag$2 = '[object Date]',
      errorTag$1 = '[object Error]',
      funcTag$2 = '[object Function]',
      genTag$1 = '[object GeneratorFunction]',
      mapTag$4 = '[object Map]',
      numberTag$2 = '[object Number]',
      objectTag$2 = '[object Object]',
      regexpTag$2 = '[object RegExp]',
      setTag$4 = '[object Set]',
      stringTag$2 = '[object String]',
      symbolTag$1 = '[object Symbol]',
      weakMapTag$2 = '[object WeakMap]';

  var arrayBufferTag$2 = '[object ArrayBuffer]',
      dataViewTag$3 = '[object DataView]',
      float32Tag$2 = '[object Float32Array]',
      float64Tag$2 = '[object Float64Array]',
      int8Tag$2 = '[object Int8Array]',
      int16Tag$2 = '[object Int16Array]',
      int32Tag$2 = '[object Int32Array]',
      uint8Tag$2 = '[object Uint8Array]',
      uint8ClampedTag$2 = '[object Uint8ClampedArray]',
      uint16Tag$2 = '[object Uint16Array]',
      uint32Tag$2 = '[object Uint32Array]';

  /** Used to identify `toStringTag` values supported by `_.clone`. */
  var cloneableTags = {};
  cloneableTags[argsTag$2] = cloneableTags[arrayTag$1] =
  cloneableTags[arrayBufferTag$2] = cloneableTags[dataViewTag$3] =
  cloneableTags[boolTag$2] = cloneableTags[dateTag$2] =
  cloneableTags[float32Tag$2] = cloneableTags[float64Tag$2] =
  cloneableTags[int8Tag$2] = cloneableTags[int16Tag$2] =
  cloneableTags[int32Tag$2] = cloneableTags[mapTag$4] =
  cloneableTags[numberTag$2] = cloneableTags[objectTag$2] =
  cloneableTags[regexpTag$2] = cloneableTags[setTag$4] =
  cloneableTags[stringTag$2] = cloneableTags[symbolTag$1] =
  cloneableTags[uint8Tag$2] = cloneableTags[uint8ClampedTag$2] =
  cloneableTags[uint16Tag$2] = cloneableTags[uint32Tag$2] = true;
  cloneableTags[errorTag$1] = cloneableTags[funcTag$2] =
  cloneableTags[weakMapTag$2] = false;

  /**
   * The base implementation of `_.clone` and `_.cloneDeep` which tracks
   * traversed objects.
   *
   * @private
   * @param {*} value The value to clone.
   * @param {boolean} bitmask The bitmask flags.
   *  1 - Deep clone
   *  2 - Flatten inherited properties
   *  4 - Clone symbols
   * @param {Function} [customizer] The function to customize cloning.
   * @param {string} [key] The key of `value`.
   * @param {Object} [object] The parent object of `value`.
   * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
   * @returns {*} Returns the cloned value.
   */
  function baseClone(value, bitmask, customizer, key, object, stack) {
    var result,
        isDeep = bitmask & CLONE_DEEP_FLAG,
        isFlat = bitmask & CLONE_FLAT_FLAG,
        isFull = bitmask & CLONE_SYMBOLS_FLAG;

    if (customizer) {
      result = object ? customizer(value, key, object, stack) : customizer(value);
    }
    if (result !== undefined) {
      return result;
    }
    if (!isObject_1(value)) {
      return value;
    }
    var isArr = isArray_1(value);
    if (isArr) {
      result = _initCloneArray(value);
      if (!isDeep) {
        return _copyArray(value, result);
      }
    } else {
      var tag = _getTag(value),
          isFunc = tag == funcTag$2 || tag == genTag$1;

      if (isBuffer_1(value)) {
        return _cloneBuffer(value, isDeep);
      }
      if (tag == objectTag$2 || tag == argsTag$2 || (isFunc && !object)) {
        result = (isFlat || isFunc) ? {} : _initCloneObject(value);
        if (!isDeep) {
          return isFlat
            ? _copySymbolsIn(value, _baseAssignIn(result, value))
            : _copySymbols(value, _baseAssign(result, value));
        }
      } else {
        if (!cloneableTags[tag]) {
          return object ? value : {};
        }
        result = _initCloneByTag(value, tag, isDeep);
      }
    }
    // Check for circular references and return its corresponding clone.
    stack || (stack = new _Stack);
    var stacked = stack.get(value);
    if (stacked) {
      return stacked;
    }
    stack.set(value, result);

    if (isSet_1(value)) {
      value.forEach(function(subValue) {
        result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
      });
    } else if (isMap_1(value)) {
      value.forEach(function(subValue, key) {
        result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
      });
    }

    var keysFunc = isFull
      ? (isFlat ? _getAllKeysIn : _getAllKeys)
      : (isFlat ? keysIn : keys_1);

    var props = isArr ? undefined : keysFunc(value);
    _arrayEach(props || value, function(subValue, key) {
      if (props) {
        key = subValue;
        subValue = value[key];
      }
      // Recursively populate clone (susceptible to call stack limits).
      _assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
    });
    return result;
  }

  var _baseClone = baseClone;

  /** `Object#toString` result references. */
  var symbolTag$2 = '[object Symbol]';

  /**
   * Checks if `value` is classified as a `Symbol` primitive or object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
   * @example
   *
   * _.isSymbol(Symbol.iterator);
   * // => true
   *
   * _.isSymbol('abc');
   * // => false
   */
  function isSymbol(value) {
    return typeof value == 'symbol' ||
      (isObjectLike_1(value) && _baseGetTag(value) == symbolTag$2);
  }

  var isSymbol_1 = isSymbol;

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/;

  /**
   * Checks if `value` is a property name and not a property path.
   *
   * @private
   * @param {*} value The value to check.
   * @param {Object} [object] The object to query keys on.
   * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
   */
  function isKey(value, object) {
    if (isArray_1(value)) {
      return false;
    }
    var type = typeof value;
    if (type == 'number' || type == 'symbol' || type == 'boolean' ||
        value == null || isSymbol_1(value)) {
      return true;
    }
    return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
      (object != null && value in Object(object));
  }

  var _isKey = isKey;

  /** Error message constants. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /**
   * Creates a function that memoizes the result of `func`. If `resolver` is
   * provided, it determines the cache key for storing the result based on the
   * arguments provided to the memoized function. By default, the first argument
   * provided to the memoized function is used as the map cache key. The `func`
   * is invoked with the `this` binding of the memoized function.
   *
   * **Note:** The cache is exposed as the `cache` property on the memoized
   * function. Its creation may be customized by replacing the `_.memoize.Cache`
   * constructor with one whose instances implement the
   * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
   * method interface of `clear`, `delete`, `get`, `has`, and `set`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to have its output memoized.
   * @param {Function} [resolver] The function to resolve the cache key.
   * @returns {Function} Returns the new memoized function.
   * @example
   *
   * var object = { 'a': 1, 'b': 2 };
   * var other = { 'c': 3, 'd': 4 };
   *
   * var values = _.memoize(_.values);
   * values(object);
   * // => [1, 2]
   *
   * values(other);
   * // => [3, 4]
   *
   * object.a = 2;
   * values(object);
   * // => [1, 2]
   *
   * // Modify the result cache.
   * values.cache.set(object, ['a', 'b']);
   * values(object);
   * // => ['a', 'b']
   *
   * // Replace `_.memoize.Cache`.
   * _.memoize.Cache = WeakMap;
   */
  function memoize(func, resolver) {
    if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    var memoized = function() {
      var args = arguments,
          key = resolver ? resolver.apply(this, args) : args[0],
          cache = memoized.cache;

      if (cache.has(key)) {
        return cache.get(key);
      }
      var result = func.apply(this, args);
      memoized.cache = cache.set(key, result) || cache;
      return result;
    };
    memoized.cache = new (memoize.Cache || _MapCache);
    return memoized;
  }

  // Expose `MapCache`.
  memoize.Cache = _MapCache;

  var memoize_1 = memoize;

  /** Used as the maximum memoize cache size. */
  var MAX_MEMOIZE_SIZE = 500;

  /**
   * A specialized version of `_.memoize` which clears the memoized function's
   * cache when it exceeds `MAX_MEMOIZE_SIZE`.
   *
   * @private
   * @param {Function} func The function to have its output memoized.
   * @returns {Function} Returns the new memoized function.
   */
  function memoizeCapped(func) {
    var result = memoize_1(func, function(key) {
      if (cache.size === MAX_MEMOIZE_SIZE) {
        cache.clear();
      }
      return key;
    });

    var cache = result.cache;
    return result;
  }

  var _memoizeCapped = memoizeCapped;

  /** Used to match property names within property paths. */
  var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /**
   * Converts `string` to a property path array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the property path array.
   */
  var stringToPath = _memoizeCapped(function(string) {
    var result = [];
    if (string.charCodeAt(0) === 46 /* . */) {
      result.push('');
    }
    string.replace(rePropName, function(match, number, quote, subString) {
      result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
    });
    return result;
  });

  var _stringToPath = stringToPath;

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0;

  /** Used to convert symbols to primitives and strings. */
  var symbolProto$1 = _Symbol ? _Symbol.prototype : undefined,
      symbolToString = symbolProto$1 ? symbolProto$1.toString : undefined;

  /**
   * The base implementation of `_.toString` which doesn't convert nullish
   * values to empty strings.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (typeof value == 'string') {
      return value;
    }
    if (isArray_1(value)) {
      // Recursively convert values (susceptible to call stack limits).
      return _arrayMap(value, baseToString) + '';
    }
    if (isSymbol_1(value)) {
      return symbolToString ? symbolToString.call(value) : '';
    }
    var result = (value + '');
    return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
  }

  var _baseToString = baseToString;

  /**
   * Converts `value` to a string. An empty string is returned for `null`
   * and `undefined` values. The sign of `-0` is preserved.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   * @example
   *
   * _.toString(null);
   * // => ''
   *
   * _.toString(-0);
   * // => '-0'
   *
   * _.toString([1, 2, 3]);
   * // => '1,2,3'
   */
  function toString(value) {
    return value == null ? '' : _baseToString(value);
  }

  var toString_1 = toString;

  /**
   * Casts `value` to a path array if it's not one.
   *
   * @private
   * @param {*} value The value to inspect.
   * @param {Object} [object] The object to query keys on.
   * @returns {Array} Returns the cast property path array.
   */
  function castPath(value, object) {
    if (isArray_1(value)) {
      return value;
    }
    return _isKey(value, object) ? [value] : _stringToPath(toString_1(value));
  }

  var _castPath = castPath;

  /**
   * Gets the last element of `array`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Array
   * @param {Array} array The array to query.
   * @returns {*} Returns the last element of `array`.
   * @example
   *
   * _.last([1, 2, 3]);
   * // => 3
   */
  function last(array) {
    var length = array == null ? 0 : array.length;
    return length ? array[length - 1] : undefined;
  }

  var last_1 = last;

  /** Used as references for various `Number` constants. */
  var INFINITY$1 = 1 / 0;

  /**
   * Converts `value` to a string key if it's not a string or symbol.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {string|symbol} Returns the key.
   */
  function toKey(value) {
    if (typeof value == 'string' || isSymbol_1(value)) {
      return value;
    }
    var result = (value + '');
    return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
  }

  var _toKey = toKey;

  /**
   * The base implementation of `_.get` without support for default values.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @returns {*} Returns the resolved value.
   */
  function baseGet(object, path) {
    path = _castPath(path, object);

    var index = 0,
        length = path.length;

    while (object != null && index < length) {
      object = object[_toKey(path[index++])];
    }
    return (index && index == length) ? object : undefined;
  }

  var _baseGet = baseGet;

  /**
   * The base implementation of `_.slice` without an iteratee call guard.
   *
   * @private
   * @param {Array} array The array to slice.
   * @param {number} [start=0] The start position.
   * @param {number} [end=array.length] The end position.
   * @returns {Array} Returns the slice of `array`.
   */
  function baseSlice(array, start, end) {
    var index = -1,
        length = array.length;

    if (start < 0) {
      start = -start > length ? 0 : (length + start);
    }
    end = end > length ? length : end;
    if (end < 0) {
      end += length;
    }
    length = start > end ? 0 : ((end - start) >>> 0);
    start >>>= 0;

    var result = Array(length);
    while (++index < length) {
      result[index] = array[index + start];
    }
    return result;
  }

  var _baseSlice = baseSlice;

  /**
   * Gets the parent value at `path` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array} path The path to get the parent value of.
   * @returns {*} Returns the parent value.
   */
  function parent(object, path) {
    return path.length < 2 ? object : _baseGet(object, _baseSlice(path, 0, -1));
  }

  var _parent = parent;

  /**
   * The base implementation of `_.unset`.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {Array|string} path The property path to unset.
   * @returns {boolean} Returns `true` if the property is deleted, else `false`.
   */
  function baseUnset(object, path) {
    path = _castPath(path, object);
    object = _parent(object, path);
    return object == null || delete object[_toKey(last_1(path))];
  }

  var _baseUnset = baseUnset;

  /** `Object#toString` result references. */
  var objectTag$3 = '[object Object]';

  /** Used for built-in method references. */
  var funcProto$2 = Function.prototype,
      objectProto$d = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString$2 = funcProto$2.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty$a = objectProto$d.hasOwnProperty;

  /** Used to infer the `Object` constructor. */
  var objectCtorString = funcToString$2.call(Object);

  /**
   * Checks if `value` is a plain object, that is, an object created by the
   * `Object` constructor or one with a `[[Prototype]]` of `null`.
   *
   * @static
   * @memberOf _
   * @since 0.8.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   * }
   *
   * _.isPlainObject(new Foo);
   * // => false
   *
   * _.isPlainObject([1, 2, 3]);
   * // => false
   *
   * _.isPlainObject({ 'x': 0, 'y': 0 });
   * // => true
   *
   * _.isPlainObject(Object.create(null));
   * // => true
   */
  function isPlainObject(value) {
    if (!isObjectLike_1(value) || _baseGetTag(value) != objectTag$3) {
      return false;
    }
    var proto = _getPrototype(value);
    if (proto === null) {
      return true;
    }
    var Ctor = hasOwnProperty$a.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor == 'function' && Ctor instanceof Ctor &&
      funcToString$2.call(Ctor) == objectCtorString;
  }

  var isPlainObject_1 = isPlainObject;

  /**
   * Used by `_.omit` to customize its `_.cloneDeep` use to only clone plain
   * objects.
   *
   * @private
   * @param {*} value The value to inspect.
   * @param {string} key The key of the property to inspect.
   * @returns {*} Returns the uncloned value or `undefined` to defer cloning to `_.cloneDeep`.
   */
  function customOmitClone(value) {
    return isPlainObject_1(value) ? undefined : value;
  }

  var _customOmitClone = customOmitClone;

  /** Built-in value references. */
  var spreadableSymbol = _Symbol ? _Symbol.isConcatSpreadable : undefined;

  /**
   * Checks if `value` is a flattenable `arguments` object or array.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
   */
  function isFlattenable(value) {
    return isArray_1(value) || isArguments_1(value) ||
      !!(spreadableSymbol && value && value[spreadableSymbol]);
  }

  var _isFlattenable = isFlattenable;

  /**
   * The base implementation of `_.flatten` with support for restricting flattening.
   *
   * @private
   * @param {Array} array The array to flatten.
   * @param {number} depth The maximum recursion depth.
   * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
   * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
   * @param {Array} [result=[]] The initial result value.
   * @returns {Array} Returns the new flattened array.
   */
  function baseFlatten(array, depth, predicate, isStrict, result) {
    var index = -1,
        length = array.length;

    predicate || (predicate = _isFlattenable);
    result || (result = []);

    while (++index < length) {
      var value = array[index];
      if (depth > 0 && predicate(value)) {
        if (depth > 1) {
          // Recursively flatten arrays (susceptible to call stack limits).
          baseFlatten(value, depth - 1, predicate, isStrict, result);
        } else {
          _arrayPush(result, value);
        }
      } else if (!isStrict) {
        result[result.length] = value;
      }
    }
    return result;
  }

  var _baseFlatten = baseFlatten;

  /**
   * Flattens `array` a single level deep.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Array
   * @param {Array} array The array to flatten.
   * @returns {Array} Returns the new flattened array.
   * @example
   *
   * _.flatten([1, [2, [3, [4]], 5]]);
   * // => [1, 2, [3, [4]], 5]
   */
  function flatten(array) {
    var length = array == null ? 0 : array.length;
    return length ? _baseFlatten(array, 1) : [];
  }

  var flatten_1 = flatten;

  /**
   * A faster alternative to `Function#apply`, this function invokes `func`
   * with the `this` binding of `thisArg` and the arguments of `args`.
   *
   * @private
   * @param {Function} func The function to invoke.
   * @param {*} thisArg The `this` binding of `func`.
   * @param {Array} args The arguments to invoke `func` with.
   * @returns {*} Returns the result of `func`.
   */
  function apply$1(func, thisArg, args) {
    switch (args.length) {
      case 0: return func.call(thisArg);
      case 1: return func.call(thisArg, args[0]);
      case 2: return func.call(thisArg, args[0], args[1]);
      case 3: return func.call(thisArg, args[0], args[1], args[2]);
    }
    return func.apply(thisArg, args);
  }

  var _apply = apply$1;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeMax = Math.max;

  /**
   * A specialized version of `baseRest` which transforms the rest array.
   *
   * @private
   * @param {Function} func The function to apply a rest parameter to.
   * @param {number} [start=func.length-1] The start position of the rest parameter.
   * @param {Function} transform The rest array transform.
   * @returns {Function} Returns the new function.
   */
  function overRest(func, start, transform) {
    start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
    return function() {
      var args = arguments,
          index = -1,
          length = nativeMax(args.length - start, 0),
          array = Array(length);

      while (++index < length) {
        array[index] = args[start + index];
      }
      index = -1;
      var otherArgs = Array(start + 1);
      while (++index < start) {
        otherArgs[index] = args[index];
      }
      otherArgs[start] = transform(array);
      return _apply(func, this, otherArgs);
    };
  }

  var _overRest = overRest;

  /**
   * Creates a function that returns `value`.
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Util
   * @param {*} value The value to return from the new function.
   * @returns {Function} Returns the new constant function.
   * @example
   *
   * var objects = _.times(2, _.constant({ 'a': 1 }));
   *
   * console.log(objects);
   * // => [{ 'a': 1 }, { 'a': 1 }]
   *
   * console.log(objects[0] === objects[1]);
   * // => true
   */
  function constant(value) {
    return function() {
      return value;
    };
  }

  var constant_1 = constant;

  /**
   * This method returns the first argument it receives.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Util
   * @param {*} value Any value.
   * @returns {*} Returns `value`.
   * @example
   *
   * var object = { 'a': 1 };
   *
   * console.log(_.identity(object) === object);
   * // => true
   */
  function identity(value) {
    return value;
  }

  var identity_1 = identity;

  /**
   * The base implementation of `setToString` without support for hot loop shorting.
   *
   * @private
   * @param {Function} func The function to modify.
   * @param {Function} string The `toString` result.
   * @returns {Function} Returns `func`.
   */
  var baseSetToString = !_defineProperty ? identity_1 : function(func, string) {
    return _defineProperty(func, 'toString', {
      'configurable': true,
      'enumerable': false,
      'value': constant_1(string),
      'writable': true
    });
  };

  var _baseSetToString = baseSetToString;

  /** Used to detect hot functions by number of calls within a span of milliseconds. */
  var HOT_COUNT = 800,
      HOT_SPAN = 16;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeNow = Date.now;

  /**
   * Creates a function that'll short out and invoke `identity` instead
   * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
   * milliseconds.
   *
   * @private
   * @param {Function} func The function to restrict.
   * @returns {Function} Returns the new shortable function.
   */
  function shortOut(func) {
    var count = 0,
        lastCalled = 0;

    return function() {
      var stamp = nativeNow(),
          remaining = HOT_SPAN - (stamp - lastCalled);

      lastCalled = stamp;
      if (remaining > 0) {
        if (++count >= HOT_COUNT) {
          return arguments[0];
        }
      } else {
        count = 0;
      }
      return func.apply(undefined, arguments);
    };
  }

  var _shortOut = shortOut;

  /**
   * Sets the `toString` method of `func` to return `string`.
   *
   * @private
   * @param {Function} func The function to modify.
   * @param {Function} string The `toString` result.
   * @returns {Function} Returns `func`.
   */
  var setToString = _shortOut(_baseSetToString);

  var _setToString = setToString;

  /**
   * A specialized version of `baseRest` which flattens the rest array.
   *
   * @private
   * @param {Function} func The function to apply a rest parameter to.
   * @returns {Function} Returns the new function.
   */
  function flatRest(func) {
    return _setToString(_overRest(func, undefined, flatten_1), func + '');
  }

  var _flatRest = flatRest;

  /** Used to compose bitmasks for cloning. */
  var CLONE_DEEP_FLAG$1 = 1,
      CLONE_FLAT_FLAG$1 = 2,
      CLONE_SYMBOLS_FLAG$1 = 4;

  /**
   * The opposite of `_.pick`; this method creates an object composed of the
   * own and inherited enumerable property paths of `object` that are not omitted.
   *
   * **Note:** This method is considerably slower than `_.pick`.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The source object.
   * @param {...(string|string[])} [paths] The property paths to omit.
   * @returns {Object} Returns the new object.
   * @example
   *
   * var object = { 'a': 1, 'b': '2', 'c': 3 };
   *
   * _.omit(object, ['a', 'c']);
   * // => { 'b': '2' }
   */
  var omit = _flatRest(function(object, paths) {
    var result = {};
    if (object == null) {
      return result;
    }
    var isDeep = false;
    paths = _arrayMap(paths, function(path) {
      path = _castPath(path, object);
      isDeep || (isDeep = path.length > 1);
      return path;
    });
    _copyObject(object, _getAllKeysIn(object), result);
    if (isDeep) {
      result = _baseClone(result, CLONE_DEEP_FLAG$1 | CLONE_FLAT_FLAG$1 | CLONE_SYMBOLS_FLAG$1, _customOmitClone);
    }
    var length = paths.length;
    while (length--) {
      _baseUnset(result, paths[length]);
    }
    return result;
  });

  var omit_1 = omit;

  const DECORATION_MATCH = "DECORATION_MATCH";
  const DECORATION_MATCH_IS_CORRECT = "DECORATION_MATCH_IS_CORRECT";
  const DECORATION_MATCH_IS_SELECTED = "DECORATION_MATCH_IS_HOVERING";
  const DECORATION_MATCH_HEIGHT_MARKER = "DECORATION_MATCH_HEIGHT_MARKER";
  const DECORATION_DIRTY = "DECORATION_DIRTY";
  const DECORATION_INFLIGHT = "DECORATION_INFLIGHT";
  const DecorationClassMap = {
      [DECORATION_DIRTY]: "MatchDebugDirty",
      [DECORATION_INFLIGHT]: "MatchDebugInflight",
      [DECORATION_MATCH]: "MatchDecoration",
      [DECORATION_MATCH_HEIGHT_MARKER]: "MatchDecoration__height-marker",
      [DECORATION_MATCH_IS_SELECTED]: "MatchDecoration--is-selected",
      [DECORATION_MATCH_IS_CORRECT]: "MatchDecoration--is-correct"
  };
  const DECORATION_ATTRIBUTE_ID = "data-match-id";
  const DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID = "data-height-marker-id";
  const DECORATION_ATTRIBUTE_IS_CORRECT_ID = "data-is-correct-id";
  const createDebugDecorationFromRange = (range, dirty = true) => {
      const type = dirty ? DECORATION_DIRTY : DECORATION_INFLIGHT;
      return Decoration.inline(range.from, range.to + 1, {
          class: DecorationClassMap[type]
      }, {
          type
      });
  };
  const removeDecorationsFromRanges = (decorationSet, ranges, types = [
      DECORATION_MATCH,
      DECORATION_MATCH_HEIGHT_MARKER,
      DECORATION_MATCH_IS_CORRECT
  ]) => ranges.reduce((acc, range) => {
      const predicate = (spec) => types.indexOf(spec.type) !== -1;
      const decorations = decorationSet.find(range.from, range.to, predicate);
      if (!decorations.length) {
          return acc;
      }
      const decorationsToRemove = flatten_1(decorations
          .map(decoration => decorationSet.find(decoration.from, decoration.to, predicate))
          .filter(_ => !!_));
      return acc.remove(decorationsToRemove);
  }, decorationSet);
  const createHeightMarkerElement = (id) => {
      const element = document.createElement("span");
      element.setAttribute(DECORATION_ATTRIBUTE_HEIGHT_MARKER_ID, id);
      element.className = DecorationClassMap[DECORATION_MATCH_HEIGHT_MARKER];
      return element;
  };
  const createIsCorrectElement = (id) => {
      const element = document.createElement("span");
      element.setAttribute(DECORATION_ATTRIBUTE_IS_CORRECT_ID, id);
      element.className = DecorationClassMap[DECORATION_MATCH_IS_CORRECT];
      return element;
  };
  const createDecorationsForMatch = (match, isSelected = false, addWidgetDecorations = true) => {
      const className = isSelected
          ? `${DecorationClassMap[DECORATION_MATCH]} ${DecorationClassMap[DECORATION_MATCH_IS_SELECTED]}`
          : DecorationClassMap[DECORATION_MATCH];
      const opacity = isSelected ? "30" : "07";
      const style = `background-color: #${match.category.colour}${opacity}; border-bottom: 2px solid #${match.category.colour}`;
      const decorations = [
          Decoration.inline(match.from, match.to, {
              class: className,
              style,
              [DECORATION_ATTRIBUTE_ID]: match.matchId
          }, {
              type: DECORATION_MATCH,
              id: match.matchId,
              categoryId: match.category.id,
              inclusiveStart: false,
              inclusiveEnd: false
          })
      ];
      if (addWidgetDecorations) {
          decorations.push(Decoration.widget(match.from, createHeightMarkerElement(match.matchId), {
              type: DECORATION_MATCH_HEIGHT_MARKER,
              id: match.matchId,
              categoryId: match.category.id
          }));
      }
      if (addWidgetDecorations && match.markAsCorrect) {
          decorations.push(Decoration.widget(match.to, createIsCorrectElement(match.matchId), {
              type: DECORATION_MATCH_IS_CORRECT,
              id: match.matchId,
              categoryId: match.category.id,
              side: -1
          }));
      }
      return decorations;
  };
  const createDecorationsForMatches = (matches) => flatten_1(matches.map(_ => createDecorationsForMatch(_)));

  /**
   * The base implementation of `_.clamp` which doesn't coerce arguments.
   *
   * @private
   * @param {number} number The number to clamp.
   * @param {number} [lower] The lower bound.
   * @param {number} upper The upper bound.
   * @returns {number} Returns the clamped number.
   */
  function baseClamp(number, lower, upper) {
    if (number === number) {
      if (upper !== undefined) {
        number = number <= upper ? number : upper;
      }
      if (lower !== undefined) {
        number = number >= lower ? number : lower;
      }
    }
    return number;
  }

  var _baseClamp = baseClamp;

  /** Used as references for various `Number` constants. */
  var NAN = 0 / 0;

  /** Used to match leading and trailing whitespace. */
  var reTrim = /^\s+|\s+$/g;

  /** Used to detect bad signed hexadecimal string values. */
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

  /** Used to detect binary string values. */
  var reIsBinary = /^0b[01]+$/i;

  /** Used to detect octal string values. */
  var reIsOctal = /^0o[0-7]+$/i;

  /** Built-in method references without a dependency on `root`. */
  var freeParseInt = parseInt;

  /**
   * Converts `value` to a number.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to process.
   * @returns {number} Returns the number.
   * @example
   *
   * _.toNumber(3.2);
   * // => 3.2
   *
   * _.toNumber(Number.MIN_VALUE);
   * // => 5e-324
   *
   * _.toNumber(Infinity);
   * // => Infinity
   *
   * _.toNumber('3.2');
   * // => 3.2
   */
  function toNumber(value) {
    if (typeof value == 'number') {
      return value;
    }
    if (isSymbol_1(value)) {
      return NAN;
    }
    if (isObject_1(value)) {
      var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
      value = isObject_1(other) ? (other + '') : other;
    }
    if (typeof value != 'string') {
      return value === 0 ? value : +value;
    }
    value = value.replace(reTrim, '');
    var isBinary = reIsBinary.test(value);
    return (isBinary || reIsOctal.test(value))
      ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
      : (reIsBadHex.test(value) ? NAN : +value);
  }

  var toNumber_1 = toNumber;

  /**
   * Clamps `number` within the inclusive `lower` and `upper` bounds.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Number
   * @param {number} number The number to clamp.
   * @param {number} [lower] The lower bound.
   * @param {number} upper The upper bound.
   * @returns {number} Returns the clamped number.
   * @example
   *
   * _.clamp(-10, -5, 5);
   * // => -5
   *
   * _.clamp(10, -5, 5);
   * // => 5
   */
  function clamp(number, lower, upper) {
    if (upper === undefined) {
      upper = lower;
      lower = undefined;
    }
    if (upper !== undefined) {
      upper = toNumber_1(upper);
      upper = upper === upper ? upper : 0;
    }
    if (lower !== undefined) {
      lower = toNumber_1(lower);
      lower = lower === lower ? lower : 0;
    }
    return _baseClamp(toNumber_1(number), lower, upper);
  }

  var clamp_1 = clamp;

  var dist = createCommonjsModule$1(function (module, exports) {

  Object.defineProperty(exports, '__esModule', { value: true });







  // Because working with row and column-spanning cells is not quite
  // trivial, this code builds up a descriptive structure for a given
  // table node. The structures are cached with the (persistent) table
  // nodes as key, so that they only have to be recomputed when the
  // content of the table changes.
  //
  // This does mean that they have to store table-relative, not
  // document-relative positions. So code that uses them will typically
  // compute the start position of the table and offset positions passed
  // to or gotten from this structure by that amount.

  var readFromCache, addToCache;
  // Prefer using a weak map to cache table maps. Fall back on a
  // fixed-size cache if that's not supported.
  if (typeof WeakMap != "undefined") {
    var cache = new WeakMap;
    readFromCache = function (key) { return cache.get(key); };
    addToCache = function (key, value) {
      cache.set(key, value);
      return value
    };
  } else {
    var cache$1 = [], cacheSize = 10, cachePos = 0;
    readFromCache = function (key) {
      for (var i = 0; i < cache$1.length; i += 2)
        { if (cache$1[i] == key) { return cache$1[i + 1] } }
    };
    addToCache = function (key, value) {
      if (cachePos == cacheSize) { cachePos = 0; }
      cache$1[cachePos++] = key;
      return cache$1[cachePos++] = value
    };
  }

  var Rect = function Rect(left, top, right, bottom) {
    this.left = left; this.top = top; this.right = right; this.bottom = bottom;
  };

  // ::- A table map describes the structore of a given table. To avoid
  // recomputing them all the time, they are cached per table node. To
  // be able to do that, positions saved in the map are relative to the
  // start of the table, rather than the start of the document.
  var TableMap = function TableMap(width, height, map, problems) {
    // :: number The width of the table
    this.width = width;
    // :: number The table's height
    this.height = height;
    // :: [number] A width * height array with the start position of
    // the cell covering that part of the table in each slot
    this.map = map;
    // An optional array of problems (cell overlap or non-rectangular
    // shape) for the table, used by the table normalizer.
    this.problems = problems;
  };

  // :: (number) → Rect
  // Find the dimensions of the cell at the given position.
  TableMap.prototype.findCell = function findCell (pos) {
    for (var i = 0; i < this.map.length; i++) {
      var curPos = this.map[i];
      if (curPos != pos) { continue }
      var left = i % this.width, top = (i / this.width) | 0;
      var right = left + 1, bottom = top + 1;
      for (var j = 1; right < this.width && this.map[i + j] == curPos; j++) { right++; }
      for (var j$1 = 1; bottom < this.height && this.map[i + (this.width * j$1)] == curPos; j$1++) { bottom++; }
      return new Rect(left, top, right, bottom)
    }
    throw new RangeError("No cell with offset " + pos + " found")
  };

  // :: (number) → number
  // Find the left side of the cell at the given position.
  TableMap.prototype.colCount = function colCount (pos) {
    for (var i = 0; i < this.map.length; i++)
      { if (this.map[i] == pos) { return i % this.width } }
    throw new RangeError("No cell with offset " + pos + " found")
  };

  // :: (number, string, number) → ?number
  // Find the next cell in the given direction, starting from the cell
  // at `pos`, if any.
  TableMap.prototype.nextCell = function nextCell (pos, axis, dir) {
    var ref = this.findCell(pos);
      var left = ref.left;
      var right = ref.right;
      var top = ref.top;
      var bottom = ref.bottom;
    if (axis == "horiz") {
      if (dir < 0 ? left == 0 : right == this.width) { return null }
      return this.map[top * this.width + (dir < 0 ? left - 1 : right)]
    } else {
      if (dir < 0 ? top == 0 : bottom == this.height) { return null }
      return this.map[left + this.width * (dir < 0 ? top - 1 : bottom)]
    }
  };

  // :: (number, number) → Rect
  // Get the rectangle spanning the two given cells.
  TableMap.prototype.rectBetween = function rectBetween (a, b) {
    var ref = this.findCell(a);
      var leftA = ref.left;
      var rightA = ref.right;
      var topA = ref.top;
      var bottomA = ref.bottom;
    var ref$1 = this.findCell(b);
      var leftB = ref$1.left;
      var rightB = ref$1.right;
      var topB = ref$1.top;
      var bottomB = ref$1.bottom;
    return new Rect(Math.min(leftA, leftB), Math.min(topA, topB),
                    Math.max(rightA, rightB), Math.max(bottomA, bottomB))
  };

  // :: (Rect) → [number]
  // Return the position of all cells that have the top left corner in
  // the given rectangle.
  TableMap.prototype.cellsInRect = function cellsInRect (rect) {
    var result = [], seen = [];
    for (var row = rect.top; row < rect.bottom; row++) {
      for (var col = rect.left; col < rect.right; col++) {
        var index = row * this.width + col, pos = this.map[index];
        if (seen.indexOf(pos) > -1) { continue }
        seen.push(pos);
        if ((col != rect.left || !col || this.map[index - 1] != pos) &&
            (row != rect.top || !row || this.map[index - this.width] != pos))
          { result.push(pos); }
      }
    }
    return result
  };

  // :: (number, number, Node) → number
  // Return the position at which the cell at the given row and column
  // starts, or would start, if a cell started there.
  TableMap.prototype.positionAt = function positionAt (row, col, table) {
    for (var i = 0, rowStart = 0;; i++) {
      var rowEnd = rowStart + table.child(i).nodeSize;
      if (i == row) {
        var index = col + row * this.width, rowEndIndex = (row + 1) * this.width;
        // Skip past cells from previous rows (via rowspan)
        while (index < rowEndIndex && this.map[index] < rowStart) { index++; }
        return index == rowEndIndex ? rowEnd - 1 : this.map[index]
      }
      rowStart = rowEnd;
    }
  };

  // :: (Node) → TableMap
  // Find the table map for the given table node.
  TableMap.get = function get (table) {
    return readFromCache(table) || addToCache(table, computeMap(table))
  };

  // Compute a table map.
  function computeMap(table) {
    if (table.type.spec.tableRole != "table") { throw new RangeError("Not a table node: " + table.type.name) }
    var width = findWidth(table), height = table.childCount;
    var map = [], mapPos = 0, problems = null, colWidths = [];
    for (var i = 0, e = width * height; i < e; i++) { map[i] = 0; }

    for (var row = 0, pos = 0; row < height; row++) {
      var rowNode = table.child(row);
      pos++;
      for (var i$1 = 0;; i$1++) {
        while (mapPos < map.length && map[mapPos] != 0) { mapPos++; }
        if (i$1 == rowNode.childCount) { break }
        var cellNode = rowNode.child(i$1);
        var ref = cellNode.attrs;
        var colspan = ref.colspan;
        var rowspan = ref.rowspan;
        var colwidth = ref.colwidth;
        for (var h = 0; h < rowspan; h++) {
          if (h + row >= height) {
            (problems || (problems = [])).push({type: "overlong_rowspan", pos: pos, n: rowspan - h});
            break
          }
          var start = mapPos + (h * width);
          for (var w = 0; w < colspan; w++) {
            if (map[start + w] == 0)
              { map[start + w] = pos; }
            else
              { (problems || (problems = [])).push({type: "collision", row: row, pos: pos, n: colspan - w}); }
            var colW = colwidth && colwidth[w];
            if (colW) {
              var widthIndex = ((start + w) % width) * 2, prev = colWidths[widthIndex];
              if (prev == null || (prev != colW && colWidths[widthIndex + 1] == 1)) {
                colWidths[widthIndex] = colW;
                colWidths[widthIndex + 1] = 1;
              } else if (prev == colW) {
                colWidths[widthIndex + 1]++;
              }
            }
          }
        }
        mapPos += colspan;
        pos += cellNode.nodeSize;
      }
      var expectedPos = (row + 1) * width, missing = 0;
      while (mapPos < expectedPos) { if (map[mapPos++] == 0) { missing++; } }
      if (missing) { (problems || (problems = [])).push({type: "missing", row: row, n: missing}); }
      pos++;
    }

    var tableMap = new TableMap(width, height, map, problems), badWidths = false;

    // For columns that have defined widths, but whose widths disagree
    // between rows, fix up the cells whose width doesn't match the
    // computed one.
    for (var i$2 = 0; !badWidths && i$2 < colWidths.length; i$2 += 2)
      { if (colWidths[i$2] != null && colWidths[i$2 + 1] < height) { badWidths = true; } }
    if (badWidths) { findBadColWidths(tableMap, colWidths, table); }

    return tableMap
  }

  function findWidth(table) {
    var width = -1, hasRowSpan = false;
    for (var row = 0; row < table.childCount; row++) {
      var rowNode = table.child(row), rowWidth = 0;
      if (hasRowSpan) { for (var j = 0; j < row; j++) {
        var prevRow = table.child(j);
        for (var i = 0; i < prevRow.childCount; i++) {
          var cell = prevRow.child(i);
          if (j + cell.attrs.rowspan > row) { rowWidth += cell.attrs.colspan; }
        }
      } }
      for (var i$1 = 0; i$1 < rowNode.childCount; i$1++) {
        var cell$1 = rowNode.child(i$1);
        rowWidth += cell$1.attrs.colspan;
        if (cell$1.attrs.rowspan > 1) { hasRowSpan = true; }
      }
      if (width == -1)
        { width = rowWidth; }
      else if (width != rowWidth)
        { width = Math.max(width, rowWidth); }
    }
    return width
  }

  function findBadColWidths(map, colWidths, table) {
    if (!map.problems) { map.problems = []; }
    for (var i = 0, seen = []; i < map.map.length; i++) {
      var pos = map.map[i];
      if (seen.indexOf(pos) > -1) { continue }
      seen.push(pos);
      var node = table.nodeAt(pos), updated = null;
      for (var j = 0; j < node.attrs.colspan; j++) {
        var col = (i + j) % map.width, colWidth = colWidths[col * 2];
        if (colWidth != null && (!node.attrs.colwidth || node.attrs.colwidth[j] != colWidth))
          { (updated || (updated = freshColWidth(node.attrs)))[j] = colWidth; }
      }
      if (updated) { map.problems.unshift({type: "colwidth mismatch", pos: pos, colwidth: updated}); }
    }
  }

  function freshColWidth(attrs) {
    if (attrs.colwidth) { return attrs.colwidth.slice() }
    var result = [];
    for (var i = 0; i < attrs.colspan; i++) { result.push(0); }
    return result
  }

  // Various helper function for working with tables

  var key = new index_es$2.PluginKey("selectingCells");

  function cellAround($pos) {
    for (var d = $pos.depth - 1; d > 0; d--)
      { if ($pos.node(d).type.spec.tableRole == "row") { return $pos.node(0).resolve($pos.before(d + 1)) } }
    return null
  }

  function cellWrapping($pos) {
    for (var d = $pos.depth - 1; d > 0; d--) {
      var role = $pos.node(d).type.spec.tableRole;
      if (role === "cell" || role === 'header_cell') { return $pos.node(d) }
    }
    return null
  }

  function isInTable(state) {
    var $head = state.selection.$head;
    for (var d = $head.depth; d > 0; d--) { if ($head.node(d).type.spec.tableRole == "row") { return true } }
    return false
  }

  function selectionCell(state) {
    var sel = state.selection;
    if (sel.$anchorCell) {
      return sel.$anchorCell.pos > sel.$headCell.pos ? sel.$anchorCell : sel.$headCell;
    } else if (sel.node && sel.node.type.spec.tableRole == "cell") {
      return sel.$anchor
    }
    return cellAround(sel.$head) || cellNear(sel.$head)
  }

  function cellNear($pos) {
    for (var after = $pos.nodeAfter, pos = $pos.pos; after; after = after.firstChild, pos++) {
      var role = after.type.spec.tableRole;
      if (role == "cell" || role == "header_cell") { return $pos.doc.resolve(pos) }
    }
    for (var before = $pos.nodeBefore, pos$1 = $pos.pos; before; before = before.lastChild, pos$1--) {
      var role$1 = before.type.spec.tableRole;
      if (role$1 == "cell" || role$1 == "header_cell") { return $pos.doc.resolve(pos$1 - before.nodeSize) }
    }
  }

  function pointsAtCell($pos) {
    return $pos.parent.type.spec.tableRole == "row" && $pos.nodeAfter
  }

  function moveCellForward($pos) {
    return $pos.node(0).resolve($pos.pos + $pos.nodeAfter.nodeSize)
  }

  function inSameTable($a, $b) {
    return $a.depth == $b.depth && $a.pos >= $b.start(-1) && $a.pos <= $b.end(-1)
  }

  function findCell($pos) {
    return TableMap.get($pos.node(-1)).findCell($pos.pos - $pos.start(-1))
  }

  function colCount($pos) {
    return TableMap.get($pos.node(-1)).colCount($pos.pos - $pos.start(-1))
  }

  function nextCell($pos, axis, dir) {
    var start = $pos.start(-1), map = TableMap.get($pos.node(-1));
    var moved = map.nextCell($pos.pos - start, axis, dir);
    return moved == null ? null : $pos.node(0).resolve(start + moved)
  }

  function setAttr(attrs, name, value) {
    var result = {};
    for (var prop in attrs) { result[prop] = attrs[prop]; }
    result[name] = value;
    return result
  }

  function rmColSpan(attrs, pos, n) {
    if ( n === void 0 ) n=1;

    var result = setAttr(attrs, "colspan", attrs.colspan - n);
    if (result.colwidth) {
      result.colwidth = result.colwidth.slice();
      result.colwidth.splice(pos, n);
      if (!result.colwidth.some(function (w) { return w > 0; })) { result.colwidth = null; }
    }
    return result
  }

  function addColSpan(attrs, pos, n) {
    if ( n === void 0 ) n=1;

    var result = setAttr(attrs, "colspan", attrs.colspan + n);
    if (result.colwidth) {
      result.colwidth = result.colwidth.slice();
      for (var i = 0; i < n; i++) { result.colwidth.splice(pos, 0, 0); }
    }
    return result
  }

  // This file defines a ProseMirror selection subclass that models

  // ::- A [`Selection`](http://prosemirror.net/docs/ref/#state.Selection)
  // subclass that represents a cell selection spanning part of a table.
  // With the plugin enabled, these will be created when the user
  // selects across cells, and will be drawn by giving selected cells a
  // `selectedCell` CSS class.
  var CellSelection = /*@__PURE__*/(function (Selection) {
    function CellSelection($anchorCell, $headCell) {
      if ( $headCell === void 0 ) $headCell = $anchorCell;

      var table = $anchorCell.node(-1), map = TableMap.get(table), start = $anchorCell.start(-1);
      var rect = map.rectBetween($anchorCell.pos - start, $headCell.pos - start);
      var doc = $anchorCell.node(0);
      var cells = map.cellsInRect(rect).filter(function (p) { return p != $headCell.pos - start; });
      // Make the head cell the first range, so that it counts as the
      // primary part of the selection
      cells.unshift($headCell.pos - start);
      var ranges = cells.map(function (pos) {
        var cell = table.nodeAt(pos), from = pos + start + 1;
        return new index_es$2.SelectionRange(doc.resolve(from), doc.resolve(from + cell.content.size))
      });
      Selection.call(this, ranges[0].$from, ranges[0].$to, ranges);
      // :: ResolvedPos
      // A resolved position pointing _in front of_ the anchor cell (the one
      // that doesn't move when extending the selection).
      this.$anchorCell = $anchorCell;
      // :: ResolvedPos
      // A resolved position pointing in front of the head cell (the one
      // moves when extending the selection).
      this.$headCell = $headCell;
    }

    if ( Selection ) CellSelection.__proto__ = Selection;
    CellSelection.prototype = Object.create( Selection && Selection.prototype );
    CellSelection.prototype.constructor = CellSelection;

    CellSelection.prototype.map = function map (doc, mapping) {
      var $anchorCell = doc.resolve(mapping.map(this.$anchorCell.pos));
      var $headCell = doc.resolve(mapping.map(this.$headCell.pos));
      if (pointsAtCell($anchorCell) && pointsAtCell($headCell) && inSameTable($anchorCell, $headCell)) {
        var tableChanged = this.$anchorCell.node(-1) != $anchorCell.node(-1);
        if (tableChanged && this.isRowSelection())
          { return CellSelection.rowSelection($anchorCell, $headCell) }
        else if (tableChanged && this.isColSelection())
          { return CellSelection.colSelection($anchorCell, $headCell) }
        else
          { return new CellSelection($anchorCell, $headCell) }
      }
      return index_es$2.TextSelection.between($anchorCell, $headCell)
    };

    // :: () → Slice
    // Returns a rectangular slice of table rows containing the selected
    // cells.
    CellSelection.prototype.content = function content () {
      var table = this.$anchorCell.node(-1), map = TableMap.get(table), start = this.$anchorCell.start(-1);
      var rect = map.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start);
      var seen = [], rows = [];
      for (var row = rect.top; row < rect.bottom; row++) {
        var rowContent = [];
        for (var index = row * map.width + rect.left, col = rect.left; col < rect.right; col++, index++) {
          var pos = map.map[index];
          if (seen.indexOf(pos) == -1) {
            seen.push(pos);
            var cellRect = map.findCell(pos), cell = table.nodeAt(pos);
            var extraLeft = rect.left - cellRect.left, extraRight = cellRect.right - rect.right;
            if (extraLeft > 0 || extraRight > 0) {
              var attrs = cell.attrs;
              if (extraLeft > 0) { attrs = rmColSpan(attrs, 0, extraLeft); }
              if (extraRight > 0) { attrs = rmColSpan(attrs, attrs.colspan - extraRight, extraRight); }
              if (cellRect.left < rect.left) { cell = cell.type.createAndFill(attrs); }
              else { cell = cell.type.create(attrs, cell.content); }
            }
            if (cellRect.top < rect.top || cellRect.bottom > rect.bottom) {
              var attrs$1 = setAttr(cell.attrs, "rowspan", Math.min(cellRect.bottom, rect.bottom) - Math.max(cellRect.top, rect.top));
              if (cellRect.top < rect.top) { cell = cell.type.createAndFill(attrs$1); }
              else { cell = cell.type.create(attrs$1, cell.content); }
            }
            rowContent.push(cell);
          }
        }
        rows.push(table.child(row).copy(index_es.Fragment.from(rowContent)));
      }

      var fragment = this.isColSelection() && this.isRowSelection() ? table : rows;
      return new index_es.Slice(index_es.Fragment.from(fragment), 1, 1)
    };

    CellSelection.prototype.replace = function replace (tr, content) {
      if ( content === void 0 ) content = index_es.Slice.empty;

      var mapFrom = tr.steps.length, ranges = this.ranges;
      for (var i = 0; i < ranges.length; i++) {
        var ref = ranges[i];
        var $from = ref.$from;
        var $to = ref.$to;
        var mapping = tr.mapping.slice(mapFrom);
        tr.replace(mapping.map($from.pos), mapping.map($to.pos), i ? index_es.Slice.empty : content);
      }
      var sel = Selection.findFrom(tr.doc.resolve(tr.mapping.slice(mapFrom).map(this.to)), -1);
      if (sel) { tr.setSelection(sel); }
    };

    CellSelection.prototype.replaceWith = function replaceWith (tr, node) {
      this.replace(tr, new index_es.Slice(index_es.Fragment.from(node), 0, 0));
    };

    CellSelection.prototype.forEachCell = function forEachCell (f) {
      var table = this.$anchorCell.node(-1), map = TableMap.get(table), start = this.$anchorCell.start(-1);
      var cells = map.cellsInRect(map.rectBetween(this.$anchorCell.pos - start, this.$headCell.pos - start));
      for (var i = 0; i < cells.length; i++)
        { f(table.nodeAt(cells[i]), start + cells[i]); }
    };

    // :: () → bool
    // True if this selection goes all the way from the top to the
    // bottom of the table.
    CellSelection.prototype.isColSelection = function isColSelection () {
      var anchorTop = this.$anchorCell.index(-1), headTop = this.$headCell.index(-1);
      if (Math.min(anchorTop, headTop) > 0) { return false }
      var anchorBot = anchorTop + this.$anchorCell.nodeAfter.attrs.rowspan,
          headBot = headTop + this.$headCell.nodeAfter.attrs.rowspan;
      return Math.max(anchorBot, headBot) == this.$headCell.node(-1).childCount
    };

    // :: (ResolvedPos, ?ResolvedPos) → CellSelection
    // Returns the smallest column selection that covers the given anchor
    // and head cell.
    CellSelection.colSelection = function colSelection ($anchorCell, $headCell) {
      if ( $headCell === void 0 ) $headCell = $anchorCell;

      var map = TableMap.get($anchorCell.node(-1)), start = $anchorCell.start(-1);
      var anchorRect = map.findCell($anchorCell.pos - start), headRect = map.findCell($headCell.pos - start);
      var doc = $anchorCell.node(0);
      if (anchorRect.top <= headRect.top) {
        if (anchorRect.top > 0)
          { $anchorCell = doc.resolve(start + map.map[anchorRect.left]); }
        if (headRect.bottom < map.height)
          { $headCell = doc.resolve(start + map.map[map.width * (map.height - 1) + headRect.right - 1]); }
      } else {
        if (headRect.top > 0)
          { $headCell = doc.resolve(start + map.map[headRect.left]); }
        if (anchorRect.bottom < map.height)
          { $anchorCell = doc.resolve(start + map.map[map.width * (map.height - 1) + anchorRect.right - 1]); }
      }
      return new CellSelection($anchorCell, $headCell)
    };

    // :: () → bool
    // True if this selection goes all the way from the left to the
    // right of the table.
    CellSelection.prototype.isRowSelection = function isRowSelection () {
      var map = TableMap.get(this.$anchorCell.node(-1)), start = this.$anchorCell.start(-1);
      var anchorLeft = map.colCount(this.$anchorCell.pos - start),
          headLeft = map.colCount(this.$headCell.pos - start);
      if (Math.min(anchorLeft, headLeft) > 0) { return false }
      var anchorRight = anchorLeft + this.$anchorCell.nodeAfter.attrs.colspan,
          headRight = headLeft + this.$headCell.nodeAfter.attrs.colspan;
      return Math.max(anchorRight, headRight) == map.width
    };

    CellSelection.prototype.eq = function eq (other) {
      return other instanceof CellSelection && other.$anchorCell.pos == this.$anchorCell.pos &&
        other.$headCell.pos == this.$headCell.pos
    };

    // :: (ResolvedPos, ?ResolvedPos) → CellSelection
    // Returns the smallest row selection that covers the given anchor
    // and head cell.
    CellSelection.rowSelection = function rowSelection ($anchorCell, $headCell) {
      if ( $headCell === void 0 ) $headCell = $anchorCell;

      var map = TableMap.get($anchorCell.node(-1)), start = $anchorCell.start(-1);
      var anchorRect = map.findCell($anchorCell.pos - start), headRect = map.findCell($headCell.pos - start);
      var doc = $anchorCell.node(0);
      if (anchorRect.left <= headRect.left) {
        if (anchorRect.left > 0)
          { $anchorCell = doc.resolve(start + map.map[anchorRect.top * map.width]); }
        if (headRect.right < map.width)
          { $headCell = doc.resolve(start + map.map[map.width * (headRect.top + 1) - 1]); }
      } else {
        if (headRect.left > 0)
          { $headCell = doc.resolve(start + map.map[headRect.top * map.width]); }
        if (anchorRect.right < map.width)
          { $anchorCell = doc.resolve(start + map.map[map.width * (anchorRect.top + 1) - 1]); }
      }
      return new CellSelection($anchorCell, $headCell)
    };

    CellSelection.prototype.toJSON = function toJSON () {
      return {type: "cell", anchor: this.$anchorCell.pos, head: this.$headCell.pos}
    };

    CellSelection.fromJSON = function fromJSON (doc, json) {
      return new CellSelection(doc.resolve(json.anchor), doc.resolve(json.head))
    };

    // :: (Node, number, ?number) → CellSelection
    CellSelection.create = function create (doc, anchorCell, headCell) {
      if ( headCell === void 0 ) headCell = anchorCell;

      return new CellSelection(doc.resolve(anchorCell), doc.resolve(headCell))
    };

    CellSelection.prototype.getBookmark = function getBookmark () { return new CellBookmark(this.$anchorCell.pos, this.$headCell.pos) };

    return CellSelection;
  }(index_es$2.Selection));

  CellSelection.prototype.visible = false;

  index_es$2.Selection.jsonID("cell", CellSelection);

  var CellBookmark = function CellBookmark(anchor, head) {
    this.anchor = anchor;
    this.head = head;
  };
  CellBookmark.prototype.map = function map (mapping) {
    return new CellBookmark(mapping.map(this.anchor), mapping.map(this.head))
  };
  CellBookmark.prototype.resolve = function resolve (doc) {
    var $anchorCell = doc.resolve(this.anchor), $headCell = doc.resolve(this.head);
    if ($anchorCell.parent.type.spec.tableRole == "row" &&
        $headCell.parent.type.spec.tableRole == "row" &&
        $anchorCell.index() < $anchorCell.parent.childCount &&
        $headCell.index() < $headCell.parent.childCount &&
        inSameTable($anchorCell, $headCell))
      { return new CellSelection($anchorCell, $headCell) }
    else
      { return index_es$2.Selection.near($headCell, 1) }
  };

  function drawCellSelection(state) {
    if (!(state.selection instanceof CellSelection)) { return null }
    var cells = [];
    state.selection.forEachCell(function (node, pos) {
      cells.push(index_es$3.Decoration.node(pos, pos + node.nodeSize, {class: "selectedCell"}));
    });
    return index_es$3.DecorationSet.create(state.doc, cells)
  }

  function isCellBoundarySelection(ref) {
    var $from = ref.$from;
    var $to = ref.$to;

    if ($from.pos == $to.pos || $from.pos < $from.pos - 6) { return false } // Cheap elimination
    var afterFrom = $from.pos, beforeTo = $to.pos, depth = $from.depth;
    for (; depth >= 0; depth--, afterFrom++)
      { if ($from.after(depth + 1) < $from.end(depth)) { break } }
    for (var d = $to.depth; d >= 0; d--, beforeTo--)
      { if ($to.before(d + 1) > $to.start(d)) { break } }
    return afterFrom == beforeTo && /row|table/.test($from.node(depth).type.spec.tableRole)
  }

  function isTextSelectionAcrossCells(ref) {
    var $from = ref.$from;
    var $to = ref.$to;

    var fromCellBoundaryNode;
    var toCellBoundaryNode;

    for (var i = $from.depth; i > 0; i--) {
      var node = $from.node(i);
      if (node.type.spec.tableRole === 'cell' || node.type.spec.tableRole === 'header_cell') {
        fromCellBoundaryNode = node;
        break;
      }
    }

    for (var i$1 = $to.depth; i$1 > 0; i$1--) {
      var node$1 = $to.node(i$1);
      if (node$1.type.spec.tableRole === 'cell' || node$1.type.spec.tableRole === 'header_cell') {
        toCellBoundaryNode = node$1;
        break;
      }
    }

    return fromCellBoundaryNode !== toCellBoundaryNode && $to.parentOffset === 0
  }

  function normalizeSelection(state, tr, allowTableNodeSelection) {
    var sel = (tr || state).selection, doc = (tr || state).doc, normalize, role;
    if (sel instanceof index_es$2.NodeSelection && (role = sel.node.type.spec.tableRole)) {
      if (role == "cell" || role == "header_cell") {
        normalize = CellSelection.create(doc, sel.from);
      } else if (role == "row") {
        var $cell = doc.resolve(sel.from + 1);
        normalize = CellSelection.rowSelection($cell, $cell);
      } else if (!allowTableNodeSelection) {
        var map = TableMap.get(sel.node), start = sel.from + 1;
        var lastCell = start + map.map[map.width * map.height - 1];
        normalize = CellSelection.create(doc, start + 1, lastCell);
      }
    } else if (sel instanceof index_es$2.TextSelection && isCellBoundarySelection(sel)) {
      normalize = index_es$2.TextSelection.create(doc, sel.from);
    } else if (sel instanceof index_es$2.TextSelection && isTextSelectionAcrossCells(sel)) {
      normalize = index_es$2.TextSelection.create(doc, sel.$from.start(), sel.$from.end());
    }
    if (normalize)
      { (tr || (tr = state.tr)).setSelection(normalize); }
    return tr
  }

  // Helper for creating a schema that supports tables.

  function getCellAttrs(dom, extraAttrs) {
    var widthAttr = dom.getAttribute("data-colwidth");
    var widths = widthAttr && /^\d+(,\d+)*$/.test(widthAttr) ? widthAttr.split(",").map(function (s) { return Number(s); }) : null;
    var colspan = Number(dom.getAttribute("colspan") || 1);
    var result = {
      colspan: colspan,
      rowspan: Number(dom.getAttribute("rowspan") || 1),
      colwidth: widths && widths.length == colspan ? widths : null
    };
    for (var prop in extraAttrs) {
      var getter = extraAttrs[prop].getFromDOM;
      var value = getter && getter(dom);
      if (value != null) { result[prop] = value; }
    }
    return result
  }

  function setCellAttrs(node, extraAttrs) {
    var attrs = {};
    if (node.attrs.colspan != 1) { attrs.colspan = node.attrs.colspan; }
    if (node.attrs.rowspan != 1) { attrs.rowspan = node.attrs.rowspan; }
    if (node.attrs.colwidth)
      { attrs["data-colwidth"] = node.attrs.colwidth.join(","); }
    for (var prop in extraAttrs) {
      var setter = extraAttrs[prop].setDOMAttr;
      if (setter) { setter(node.attrs[prop], attrs); }
    }
    return attrs
  }

  // :: (Object) → Object
  //
  // This function creates a set of [node
  // specs](http://prosemirror.net/docs/ref/#model.SchemaSpec.nodes) for
  // `table`, `table_row`, and `table_cell` nodes types as used by this
  // module. The result can then be added to the set of nodes when
  // creating a a schema.
  //
  //   options::- The following options are understood:
  //
  //     tableGroup:: ?string
  //     A group name (something like `"block"`) to add to the table
  //     node type.
  //
  //     cellContent:: string
  //     The content expression for table cells.
  //
  //     cellAttributes:: ?Object
  //     Additional attributes to add to cells. Maps attribute names to
  //     objects with the following properties:
  //
  //       default:: any
  //       The attribute's default value.
  //
  //       getFromDOM:: ?(dom.Node) → any
  //       A function to read the attribute's value from a DOM node.
  //
  //       setDOMAttr:: ?(value: any, attrs: Object)
  //       A function to add the attribute's value to an attribute
  //       object that's used to render the cell's DOM.
  function tableNodes(options) {
    var extraAttrs = options.cellAttributes || {};
    var cellAttrs = {
      colspan: {default: 1},
      rowspan: {default: 1},
      colwidth: {default: null}
    };
    for (var prop in extraAttrs)
      { cellAttrs[prop] = {default: extraAttrs[prop].default}; }

    return {
      table: {
        content: "table_row+",
        tableRole: "table",
        isolating: true,
        group: options.tableGroup,
        parseDOM: [{tag: "table"}],
        toDOM: function toDOM() { return ["table", ["tbody", 0]] }
      },
      table_row: {
        content: "(table_cell | table_header)*",
        tableRole: "row",
        parseDOM: [{tag: "tr"}],
        toDOM: function toDOM() { return ["tr", 0] }
      },
      table_cell: {
        content: options.cellContent,
        attrs: cellAttrs,
        tableRole: "cell",
        isolating: true,
        parseDOM: [{tag: "td", getAttrs: function (dom) { return getCellAttrs(dom, extraAttrs); }}],
        toDOM: function toDOM(node) { return ["td", setCellAttrs(node, extraAttrs), 0] }
      },
      table_header: {
        content: options.cellContent,
        attrs: cellAttrs,
        tableRole: "header_cell",
        isolating: true,
        parseDOM: [{tag: "th", getAttrs: function (dom) { return getCellAttrs(dom, extraAttrs); }}],
        toDOM: function toDOM(node) { return ["th", setCellAttrs(node, extraAttrs), 0] }
      }
    }
  }

  function tableNodeTypes(schema) {
    var result = schema.cached.tableNodeTypes;
    if (!result) {
      result = schema.cached.tableNodeTypes = {};
      for (var name in schema.nodes) {
        var type = schema.nodes[name], role = type.spec.tableRole;
        if (role) { result[role] = type; }
      }
    }
    return result
  }

  // Utilities used for copy/paste handling.

  // Utilities to help with copying and pasting table cells

  // : (Slice) → ?{width: number, height: number, rows: [Fragment]}
  // Get a rectangular area of cells from a slice, or null if the outer
  // nodes of the slice aren't table cells or rows.
  function pastedCells(slice) {
    if (!slice.size) { return null }
    var content = slice.content;
    var openStart = slice.openStart;
    var openEnd = slice.openEnd;
    while (content.childCount == 1 && (openStart > 0 && openEnd > 0 || content.firstChild.type.spec.tableRole == "table")) {
      openStart--;
      openEnd--;
      content = content.firstChild.content;
    }
    var first = content.firstChild, role = first.type.spec.tableRole;
    var schema = first.type.schema, rows = [];
    if (role == "row") {
      for (var i = 0; i < content.childCount; i++) {
        var cells = content.child(i).content;
        var left = i ? 0 : Math.max(0, openStart - 1);
        var right = i < content.childCount - 1 ? 0 : Math.max(0, openEnd - 1);
        if (left || right) { cells = fitSlice(tableNodeTypes(schema).row, new index_es.Slice(cells, left, right)).content; }
        rows.push(cells);
      }
    } else if (role == "cell" || role == "header_cell") {
      rows.push(openStart || openEnd ? fitSlice(tableNodeTypes(schema).row, new index_es.Slice(content, openStart, openEnd)).content : content);
    } else {
      return null
    }
    return ensureRectangular(schema, rows)
  }

  // : (Schema, [Fragment]) → {width: number, height: number, rows: [Fragment]}
  // Compute the width and height of a set of cells, and make sure each
  // row has the same number of cells.
  function ensureRectangular(schema, rows) {
    var widths = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      for (var j = row.childCount - 1; j >= 0; j--) {
        var ref = row.child(j).attrs;
        var rowspan = ref.rowspan;
        var colspan = ref.colspan;
        for (var r = i; r < i + rowspan; r++)
          { widths[r] = (widths[r] || 0) + colspan; }
      }
    }
    var width = 0;
    for (var r$1 = 0; r$1 < widths.length; r$1++) { width = Math.max(width, widths[r$1]); }
    for (var r$2 = 0; r$2 < widths.length; r$2++) {
      if (r$2 >= rows.length) { rows.push(index_es.Fragment.empty); }
      if (widths[r$2] < width) {
        var empty = tableNodeTypes(schema).cell.createAndFill(), cells = [];
        for (var i$1 = widths[r$2]; i$1 < width; i$1++) { cells.push(empty); }
        rows[r$2] = rows[r$2].append(index_es.Fragment.from(cells));
      }
    }
    return {height: rows.length, width: width, rows: rows}
  }

  function fitSlice(nodeType, slice) {
    var node = nodeType.createAndFill();
    var tr = new index_es$1.Transform(node).replace(0, node.content.size, slice);
    return tr.doc
  }

  // : ({width: number, height: number, rows: [Fragment]}, number, number) → {width: number, height: number, rows: [Fragment]}
  // Clip or extend (repeat) the given set of cells to cover the given
  // width and height. Will clip rowspan/colspan cells at the edges when
  // they stick out.
  function clipCells(ref, newWidth, newHeight) {
    var width = ref.width;
    var height = ref.height;
    var rows = ref.rows;

    if (width != newWidth) {
      var added = [], newRows = [];
      for (var row = 0; row < rows.length; row++) {
        var frag = rows[row], cells = [];
        for (var col = added[row] || 0, i = 0; col < newWidth; i++) {
          var cell = frag.child(i % frag.childCount);
          if (col + cell.attrs.colspan > newWidth)
            { cell = cell.type.create(rmColSpan(cell.attrs, cell.attrs.colspan, col + cell.attrs.colspan - newWidth), cell.content); }
          cells.push(cell);
          col += cell.attrs.colspan;
          for (var j = 1; j < cell.attrs.rowspan; j++)
            { added[row + j] = (added[row + j] || 0) + cell.attrs.colspan; }
        }
        newRows.push(index_es.Fragment.from(cells));
      }
      rows = newRows;
      width = newWidth;
    }

    if (height != newHeight) {
      var newRows$1 = [];
      for (var row$1 = 0, i$1 = 0; row$1 < newHeight; row$1++, i$1++) {
        var cells$1 = [], source = rows[i$1 % height];
        for (var j$1 = 0; j$1 < source.childCount; j$1++) {
          var cell$1 = source.child(j$1);
          if (row$1 + cell$1.attrs.rowspan > newHeight)
            { cell$1 = cell$1.type.create(setAttr(cell$1.attrs, "rowspan", newHeight - cell$1.attrs.rowspan), cell$1.content); }
          cells$1.push(cell$1);
        }
        newRows$1.push(index_es.Fragment.from(cells$1));
      }
      rows = newRows$1;
      height = newHeight;
    }

    return {width: width, height: height, rows: rows}
  }

  // Make sure a table has at least the given width and height. Return
  // true if something was changed.
  function growTable(tr, map, table, start, width, height, mapFrom) {
    var schema = tr.doc.type.schema, types = tableNodeTypes(schema), empty, emptyHead;
    if (width > map.width) {
      for (var row = 0, rowEnd = 0; row < map.height; row++) {
        var rowNode = table.child(row);
        rowEnd += rowNode.nodeSize;
        var cells = [], add = (void 0);
        if (rowNode.lastChild == null || rowNode.lastChild.type == types.cell)
          { add = empty || (empty = types.cell.createAndFill()); }
        else
          { add = emptyHead || (emptyHead = types.header_cell.createAndFill()); }
        for (var i = map.width; i < width; i++) { cells.push(add); }
        tr.insert(tr.mapping.slice(mapFrom).map(rowEnd - 1 + start), cells);
      }
    }
    if (height > map.height) {
      var cells$1 = [];
      for (var i$1 = 0, start$1 = (map.height - 1) * map.width; i$1 < Math.max(map.width, width); i$1++) {
        var header = i$1 >= map.width ? false :
            table.nodeAt(map.map[start$1 + i$1]).type == types.header_cell;
        cells$1.push(header
                   ? (emptyHead || (emptyHead = types.header_cell.createAndFill()))
                   : (empty || (empty = types.cell.createAndFill())));
      }

      var emptyRow = types.row.create(null, index_es.Fragment.from(cells$1)), rows = [];
      for (var i$2 = map.height; i$2 < height; i$2++) { rows.push(emptyRow); }
      tr.insert(tr.mapping.slice(mapFrom).map(start + table.nodeSize - 2), rows);
    }
    return !!(empty || emptyHead)
  }

  // Make sure the given line (left, top) to (right, top) doesn't cross
  // any rowspan cells by splitting cells that cross it. Return true if
  // something changed.
  function isolateHorizontal(tr, map, table, start, left, right, top, mapFrom) {
    if (top == 0 || top == map.height) { return false }
    var found = false;
    for (var col = left; col < right; col++) {
      var index = top * map.width + col, pos = map.map[index];
      if (map.map[index - map.width] == pos) {
        found = true;
        var cell = table.nodeAt(pos);
        var ref = map.findCell(pos);
        var cellTop = ref.top;
        var cellLeft = ref.left;
        tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(pos + start), null, setAttr(cell.attrs, "rowspan", top - cellTop));
        tr.insert(tr.mapping.slice(mapFrom).map(map.positionAt(top, cellLeft, table)),
                  cell.type.createAndFill(setAttr(cell.attrs, "rowspan", (cellTop + cell.attrs.rowspan) - top)));
        col += cell.attrs.colspan - 1;
      }
    }
    return found
  }

  // Make sure the given line (left, top) to (left, bottom) doesn't
  // cross any colspan cells by splitting cells that cross it. Return
  // true if something changed.
  function isolateVertical(tr, map, table, start, top, bottom, left, mapFrom) {
    if (left == 0 || left == map.width) { return false }
    var found = false;
    for (var row = top; row < bottom; row++) {
      var index = row * map.width + left, pos = map.map[index];
      if (map.map[index - 1] == pos) {
        found = true;
        var cell = table.nodeAt(pos), cellLeft = map.colCount(pos);
        var updatePos = tr.mapping.slice(mapFrom).map(pos + start);
        tr.setNodeMarkup(updatePos, null, rmColSpan(cell.attrs, left - cellLeft, cell.attrs.colspan - (left - cellLeft)));
        tr.insert(updatePos + cell.nodeSize, cell.type.createAndFill(rmColSpan(cell.attrs, 0, left - cellLeft)));
        row += cell.attrs.rowspan - 1;
      }
    }
    return found
  }

  // Insert the given set of cells (as returned by `pastedCells`) into a
  // table, at the position pointed at by rect.
  function insertCells(state, dispatch, tableStart, rect, cells) {
    var table = tableStart ? state.doc.nodeAt(tableStart - 1) : state.doc, map = TableMap.get(table);
    var top = rect.top;
    var left = rect.left;
    var right = left + cells.width, bottom = top + cells.height;
    var tr = state.tr, mapFrom = 0;
    function recomp() {
      table = tableStart ? tr.doc.nodeAt(tableStart - 1) : tr.doc;
      map = TableMap.get(table);
      mapFrom = tr.mapping.maps.length;
    }
    // Prepare the table to be large enough and not have any cells
    // crossing the boundaries of the rectangle that we want to
    // insert into. If anything about it changes, recompute the table
    // map so that subsequent operations can see the current shape.
    if (growTable(tr, map, table, tableStart, right, bottom, mapFrom)) { recomp(); }
    if (isolateHorizontal(tr, map, table, tableStart, left, right, top, mapFrom)) { recomp(); }
    if (isolateHorizontal(tr, map, table, tableStart, left, right, bottom, mapFrom)) { recomp(); }
    if (isolateVertical(tr, map, table, tableStart, top, bottom, left, mapFrom)) { recomp(); }
    if (isolateVertical(tr, map, table, tableStart, top, bottom, right, mapFrom)) { recomp(); }

    for (var row = top; row < bottom; row++) {
      var from = map.positionAt(row, left, table), to = map.positionAt(row, right, table);
      tr.replace(tr.mapping.slice(mapFrom).map(from + tableStart), tr.mapping.slice(mapFrom).map(to + tableStart),
                 new index_es.Slice(cells.rows[row - top], 0, 0));
    }
    recomp();
    tr.setSelection(new CellSelection(tr.doc.resolve(tableStart + map.positionAt(top, left, table)),
                                      tr.doc.resolve(tableStart + map.positionAt(bottom - 1, right - 1, table))));
    dispatch(tr);
  }

  // This file defines a number of helpers for wiring up user input to

  var handleKeyDown = index_es$4.keydownHandler({
    "ArrowLeft": arrow("horiz", -1),
    "ArrowRight": arrow("horiz", 1),
    "ArrowUp": arrow("vert", -1),
    "ArrowDown": arrow("vert", 1),

    "Shift-ArrowLeft": shiftArrow("horiz", -1),
    "Shift-ArrowRight": shiftArrow("horiz", 1),
    "Shift-ArrowUp": shiftArrow("vert", -1),
    "Shift-ArrowDown": shiftArrow("vert", 1),

    "Backspace": deleteCellSelection,
    "Mod-Backspace": deleteCellSelection,
    "Delete": deleteCellSelection,
    "Mod-Delete": deleteCellSelection
  });

  function maybeSetSelection(state, dispatch, selection) {
    if (selection.eq(state.selection)) { return false }
    if (dispatch) { dispatch(state.tr.setSelection(selection).scrollIntoView()); }
    return true
  }

  function arrow(axis, dir) {
    return function (state, dispatch, view) {
      var sel = state.selection;
      if (sel instanceof CellSelection) {
        return maybeSetSelection(state, dispatch, index_es$2.Selection.near(sel.$headCell, dir))
      }
      if (axis != "horiz" && !sel.empty) { return false }
      var end = atEndOfCell(view, axis, dir);
      if (end == null) { return false }
      if (axis == "horiz") {
        return maybeSetSelection(state, dispatch, index_es$2.Selection.near(state.doc.resolve(sel.head + dir), dir))
      } else {
        var $cell = state.doc.resolve(end), $next = nextCell($cell, axis, dir), newSel;
        if ($next) { newSel = index_es$2.Selection.near($next, 1); }
        else if (dir < 0) { newSel = index_es$2.Selection.near(state.doc.resolve($cell.before(-1)), -1); }
        else { newSel = index_es$2.Selection.near(state.doc.resolve($cell.after(-1)), 1); }
        return maybeSetSelection(state, dispatch, newSel)
      }
    }
  }

  function shiftArrow(axis, dir) {
    return function (state, dispatch, view) {
      var sel = state.selection;
      if (!(sel instanceof CellSelection)) {
        var end = atEndOfCell(view, axis, dir);
        if (end == null) { return false }
        sel = new CellSelection(state.doc.resolve(end));
      }
      var $head = nextCell(sel.$headCell, axis, dir);
      if (!$head) { return false }
      return maybeSetSelection(state, dispatch, new CellSelection(sel.$anchorCell, $head))
    }
  }

  function deleteCellSelection(state, dispatch) {
    var sel = state.selection;
    if (!(sel instanceof CellSelection)) { return false }
    if (dispatch) {
      var tr = state.tr, baseContent = tableNodeTypes(state.schema).cell.createAndFill().content;
      sel.forEachCell(function (cell, pos) {
        if (!cell.content.eq(baseContent))
          { tr.replace(tr.mapping.map(pos + 1), tr.mapping.map(pos + cell.nodeSize - 1),
                     new index_es.Slice(baseContent, 0, 0)); }
      });
      if (tr.docChanged) { dispatch(tr); }
    }
    return true
  }

  function handleTripleClick(view, pos) {
    var doc = view.state.doc, $cell = cellAround(doc.resolve(pos));
    if (!$cell) { return false }
    view.dispatch(view.state.tr.setSelection(new CellSelection($cell)));
    return true
  }

  function handlePaste(view, _, slice) {
    if (!isInTable(view.state)) { return false }
    var cells = pastedCells(slice), sel = view.state.selection;
    if (sel instanceof CellSelection) {
      if (!cells) { cells = {width: 1, height: 1, rows: [index_es.Fragment.from(fitSlice(tableNodeTypes(view.state.schema).cell, slice))]}; }
      var table = sel.$anchorCell.node(-1), start = sel.$anchorCell.start(-1);
      var rect = TableMap.get(table).rectBetween(sel.$anchorCell.pos - start, sel.$headCell.pos - start);
      cells = clipCells(cells, rect.right - rect.left, rect.bottom - rect.top);
      insertCells(view.state, view.dispatch, start, rect, cells);
      return true
    } else if (cells) {
      var $cell = selectionCell(view.state), start$1 = $cell.start(-1);
      insertCells(view.state, view.dispatch, start$1, TableMap.get($cell.node(-1)).findCell($cell.pos - start$1), cells);
      return true
    } else {
      return false
    }
  }

  function handleMouseDown(view, startEvent) {
    if (startEvent.ctrlKey || startEvent.metaKey) { return }

    var startDOMCell = domInCell(view, startEvent.target), $anchor;
    if (startEvent.shiftKey && (view.state.selection instanceof CellSelection)) {
      // Adding to an existing cell selection
      setCellSelection(view.state.selection.$anchorCell, startEvent);
      startEvent.preventDefault();
    } else if (startEvent.shiftKey && startDOMCell &&
               ($anchor = cellAround(view.state.selection.$anchor)) != null &&
               cellUnderMouse(view, startEvent).pos != $anchor.pos) {
      // Adding to a selection that starts in another cell (causing a
      // cell selection to be created).
      setCellSelection($anchor, startEvent);
      startEvent.preventDefault();
    } else if (!startDOMCell) {
      // Not in a cell, let the default behavior happen.
      return
    }

    // Create and dispatch a cell selection between the given anchor and
    // the position under the mouse.
    function setCellSelection($anchor, event) {
      var $head = cellUnderMouse(view, event);
      var starting = key.getState(view.state) == null;
      if (!$head || !inSameTable($anchor, $head)) {
        if (starting) { $head = $anchor; }
        else { return }
      }
      var selection = new CellSelection($anchor, $head);
      if (starting || !view.state.selection.eq(selection)) {
        var tr = view.state.tr.setSelection(selection);
        if (starting) { tr.setMeta(key, $anchor.pos); }
        view.dispatch(tr);
      }
    }

    // Stop listening to mouse motion events.
    function stop() {
      view.root.removeEventListener("mouseup", stop);
      view.root.removeEventListener("dragstart", stop);
      view.root.removeEventListener("mousemove", move);
      if (key.getState(view.state) != null) { view.dispatch(view.state.tr.setMeta(key, -1)); }
    }

    function move(event) {
      var anchor = key.getState(view.state), $anchor;
      if (anchor != null) {
        // Continuing an existing cross-cell selection
        $anchor = view.state.doc.resolve(anchor);
      } else if (domInCell(view, event.target) != startDOMCell) {
        // Moving out of the initial cell -- start a new cell selection
        $anchor = cellUnderMouse(view, startEvent);
        if (!$anchor) { return stop() }
      }
      if ($anchor) { setCellSelection($anchor, event); }
    }
    view.root.addEventListener("mouseup", stop);
    view.root.addEventListener("dragstart", stop);
    view.root.addEventListener("mousemove", move);
  }

  // Check whether the cursor is at the end of a cell (so that further
  // motion would move out of the cell)
  function atEndOfCell(view, axis, dir) {
    if (!(view.state.selection instanceof index_es$2.TextSelection)) { return null }
    var ref = view.state.selection;
    var $head = ref.$head;
    for (var d = $head.depth - 1; d >= 0; d--) {
      var parent = $head.node(d), index = dir < 0 ? $head.index(d) : $head.indexAfter(d);
      if (index != (dir < 0 ? 0 : parent.childCount)) { return null }
      if (parent.type.spec.tableRole == "cell" || parent.type.spec.tableRole == "header_cell") {
        var cellPos = $head.before(d);
        var dirStr = axis == "vert" ? (dir > 0 ? "down" : "up") : (dir > 0 ? "right" : "left");
        return view.endOfTextblock(dirStr) ? cellPos : null
      }
    }
    return null
  }

  function domInCell(view, dom) {
    for (; dom && dom != view.dom; dom = dom.parentNode)
      { if (dom.nodeName == "TD" || dom.nodeName == "TH") { return dom } }
  }

  function cellUnderMouse(view, event) {
    var mousePos = view.posAtCoords({left: event.clientX, top: event.clientY});
    if (!mousePos) { return null }
    return mousePos ? cellAround(view.state.doc.resolve(mousePos.pos)) : null
  }

  // This file defines helpers for normalizing tables, making sure no

  // Helper for iterating through the nodes in a document that changed
  // compared to the given previous document. Useful for avoiding
  // duplicate work on each transaction.
  function changedDescendants(old, cur, offset, f) {
    var oldSize = old.childCount, curSize = cur.childCount;
    outer: for (var i = 0, j = 0; i < curSize; i++) {
      var child = cur.child(i);
      for (var scan = j, e = Math.min(oldSize, i + 3); scan < e; scan++) {
        if (old.child(scan) == child) {
          j = scan + 1;
          offset += child.nodeSize;
          continue outer
        }
      }
      f(child, offset);
      if (j < oldSize && old.child(j).sameMarkup(child))
        { changedDescendants(old.child(j), child, offset + 1, f); }
      else
        { child.nodesBetween(0, child.content.size, f, offset + 1); }
      offset += child.nodeSize;
    }
  }

  // :: (EditorState, ?EditorState) → ?Transaction
  // Inspect all tables in the given state's document and return a
  // transaction that fixes them, if necessary. If `oldState` was
  // provided, that is assumed to hold a previous, known-good state,
  // which will be used to avoid re-scanning unchanged parts of the
  // document.
  function fixTables(state, oldState) {
    var tr, check = function (node, pos) {
      if (node.type.spec.tableRole == "table") { tr = fixTable(state, node, pos, tr); }
    };
    if (!oldState) { state.doc.descendants(check); }
    else if (oldState.doc != state.doc) { changedDescendants(oldState.doc, state.doc, 0, check); }
    return tr
  }

  // : (EditorState, Node, number, ?Transaction) → ?Transaction
  // Fix the given table, if necessary. Will append to the transaction
  // it was given, if non-null, or create a new one if necessary.
  function fixTable(state, table, tablePos, tr) {
    var map = TableMap.get(table);
    if (!map.problems) { return tr }
    if (!tr) { tr = state.tr; }

    // Track which rows we must add cells to, so that we can adjust that
    // when fixing collisions.
    var mustAdd = [];
    for (var i = 0; i < map.height; i++) { mustAdd.push(0); }
    for (var i$1 = 0; i$1 < map.problems.length; i$1++) {
      var prob = map.problems[i$1];
      if (prob.type == "collision") {
        var cell = table.nodeAt(prob.pos);
        for (var j = 0; j < cell.attrs.rowspan; j++) { mustAdd[prob.row + j] += prob.n; }
        tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + prob.pos), null, rmColSpan(cell.attrs, cell.attrs.colspan - prob.n, prob.n));
      } else if (prob.type == "missing") {
        mustAdd[prob.row] += prob.n;
      } else if (prob.type == "overlong_rowspan") {
        var cell$1 = table.nodeAt(prob.pos);
        tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + prob.pos), null, setAttr(cell$1.attrs, "rowspan", cell$1.attrs.rowspan - prob.n));
      } else if (prob.type == "colwidth mismatch") {
        var cell$2 = table.nodeAt(prob.pos);
        tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + prob.pos), null, setAttr(cell$2.attrs, "colwidth", prob.colwidth));
      }
    }
    var first, last;
    for (var i$2 = 0; i$2 < mustAdd.length; i$2++) { if (mustAdd[i$2]) {
      if (first == null) { first = i$2; }
      last = i$2;
    } }
    // Add the necessary cells, using a heuristic for whether to add the
    // cells at the start or end of the rows (if it looks like a 'bite'
    // was taken out of the table, add cells at the start of the row
    // after the bite. Otherwise add them at the end).
    for (var i$3 = 0, pos = tablePos + 1; i$3 < map.height; i$3++) {
      var row = table.child(i$3);
      var end = pos + row.nodeSize;
      var add = mustAdd[i$3];
      if (add > 0) {
        var tableNodeType = 'cell';
        if (row.firstChild) {
          tableNodeType = row.firstChild.type.spec.tableRole;
        }
        var nodes = [];
        for (var j$1 = 0; j$1 < add; j$1++)
          { nodes.push(tableNodeTypes(state.schema)[tableNodeType].createAndFill()); }
        var side = (i$3 == 0 || first == i$3 - 1) && last == i$3 ? pos + 1 : end - 1;
        tr.insert(tr.mapping.map(side), nodes);
      }
      pos = end;
    }
    return tr
  }

  // This file defines a number of table-related commands.

  // Helper to get the selected rectangle in a table, if any. Adds table
  // map, table node, and table start offset to the object for
  // convenience.
  function selectedRect(state) {
    var sel = state.selection, $pos = selectionCell(state);
    var table = $pos.node(-1), tableStart = $pos.start(-1), map = TableMap.get(table);
    var rect;
    if (sel instanceof CellSelection)
      { rect = map.rectBetween(sel.$anchorCell.pos - tableStart, sel.$headCell.pos - tableStart); }
    else
      { rect = map.findCell($pos.pos - tableStart); }
    rect.tableStart = tableStart;
    rect.map = map;
    rect.table = table;
    return rect
  }

  function columnIsHeader(map, table, col) {
    var headerCell = tableNodeTypes(table.type.schema).header_cell;
    for (var row = 0; row < map.height; row++)
      { if (table.nodeAt(map.map[col + row * map.width]).type != headerCell)
        { return false } }
    return true
  }

  // Add a column at the given position in a table.
  function addColumn(tr, ref, col) {
    var map = ref.map;
    var tableStart = ref.tableStart;
    var table = ref.table;

    var refColumn = col > 0 ? -1 : 0;
    if (columnIsHeader(map, table, col + refColumn))
      { refColumn = col == 0 || col == map.width ? null : 0; }

    for (var row = 0; row < map.height; row++) {
      var index = row * map.width + col;
      // If this position falls inside a col-spanning cell
      if (col > 0 && col < map.width && map.map[index - 1] == map.map[index]) {
        var pos = map.map[index], cell = table.nodeAt(pos);
        tr.setNodeMarkup(tr.mapping.map(tableStart + pos), null,
                         addColSpan(cell.attrs, col - map.colCount(pos)));
        // Skip ahead if rowspan > 1
        row += cell.attrs.rowspan - 1;
      } else {
        var type = refColumn == null ? tableNodeTypes(table.type.schema).cell
            : table.nodeAt(map.map[index + refColumn]).type;
        var pos$1 = map.positionAt(row, col, table);
        tr.insert(tr.mapping.map(tableStart + pos$1), type.createAndFill());
      }
    }
    return tr
  }

  // :: (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Command to add a column before the column with the selection.
  function addColumnBefore(state, dispatch) {
    if (!isInTable(state)) { return false }
    if (dispatch) {
      var rect = selectedRect(state);
      dispatch(addColumn(state.tr, rect, rect.left));
    }
    return true
  }

  // :: (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Command to add a column after the column with the selection.
  function addColumnAfter(state, dispatch) {
    if (!isInTable(state)) { return false }
    if (dispatch) {
      var rect = selectedRect(state);
      dispatch(addColumn(state.tr, rect, rect.right));
    }
    return true
  }

  function removeColumn(tr, ref, col) {
    var map = ref.map;
    var table = ref.table;
    var tableStart = ref.tableStart;

    var mapStart = tr.mapping.maps.length;
    for (var row = 0; row < map.height;) {
      var index = row * map.width + col, pos = map.map[index], cell = table.nodeAt(pos);
      // If this is part of a col-spanning cell
      if ((col > 0 && map.map[index - 1] == pos) || (col < map.width - 1 && map.map[index + 1] == pos)) {
        tr.setNodeMarkup(tr.mapping.slice(mapStart).map(tableStart + pos), null,
                         rmColSpan(cell.attrs, col - map.colCount(pos)));
      } else {
        var start = tr.mapping.slice(mapStart).map(tableStart + pos);
        tr.delete(start, start + cell.nodeSize);
      }
      row += cell.attrs.rowspan;
    }
  }

  // :: (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Command function that removes the selected columns from a table.
  function deleteColumn(state, dispatch) {
    if (!isInTable(state)) { return false }
    if (dispatch) {
      var rect = selectedRect(state), tr = state.tr;
      if (rect.left == 0 && rect.right == rect.map.width) { return false }
      for (var i = rect.right - 1;; i--) {
        removeColumn(tr, rect, i);
        if (i == rect.left) { break }
        rect.table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc;
        rect.map = TableMap.get(rect.table);
      }
      dispatch(tr);
    }
    return true
  }

  function rowIsHeader(map, table, row) {
    var headerCell = tableNodeTypes(table.type.schema).header_cell;
    for (var col = 0; col < map.width; col++)
      { if (table.nodeAt(map.map[col + row * map.width]).type != headerCell)
        { return false } }
    return true
  }

  function addRow(tr, ref, row) {
    var map = ref.map;
    var tableStart = ref.tableStart;
    var table = ref.table;

    var rowPos = tableStart;
    for (var i = 0; i < row; i++) { rowPos += table.child(i).nodeSize; }
    var cells = [], refRow = row > 0 ? -1 : 0;
    if (rowIsHeader(map, table, row + refRow))
      { refRow = row == 0 || row == map.height ? null : 0; }
    for (var col = 0, index = map.width * row; col < map.width; col++, index++) {
      // Covered by a rowspan cell
      if (row > 0 && row < map.height && map.map[index] == map.map[index - map.width]) {
        var pos = map.map[index], attrs = table.nodeAt(pos).attrs;
        tr.setNodeMarkup(tableStart + pos, null, setAttr(attrs, "rowspan", attrs.rowspan + 1));
        col += attrs.colspan - 1;
      } else {
        var type = refRow == null ? tableNodeTypes(table.type.schema).cell
            : table.nodeAt(map.map[index + refRow * map.width]).type;
        cells.push(type.createAndFill());
      }
    }
    tr.insert(rowPos, tableNodeTypes(table.type.schema).row.create(null, cells));
    return tr
  }

  // :: (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Add a table row before the selection.
  function addRowBefore(state, dispatch) {
    if (!isInTable(state)) { return false }
    if (dispatch) {
      var rect = selectedRect(state);
      dispatch(addRow(state.tr, rect, rect.top));
    }
    return true
  }

  // :: (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Add a table row after the selection.
  function addRowAfter(state, dispatch) {
    if (!isInTable(state)) { return false }
    if (dispatch) {
      var rect = selectedRect(state);
      dispatch(addRow(state.tr, rect, rect.bottom));
    }
    return true
  }

  function removeRow(tr, ref, row) {
    var map = ref.map;
    var table = ref.table;
    var tableStart = ref.tableStart;

    var rowPos = 0;
    for (var i = 0; i < row; i++) { rowPos += table.child(i).nodeSize; }
    var nextRow = rowPos + table.child(row).nodeSize;

    var mapFrom = tr.mapping.maps.length;
    tr.delete(rowPos + tableStart, nextRow + tableStart);

    for (var col = 0, index = row * map.width; col < map.width; col++, index++) {
      var pos = map.map[index];
      if (row > 0 && pos == map.map[index - map.width]) {
        // If this cell starts in the row above, simply reduce its rowspan
        var attrs = table.nodeAt(pos).attrs;
        tr.setNodeMarkup(tr.mapping.slice(mapFrom).map(pos + tableStart), null, setAttr(attrs, "rowspan", attrs.rowspan - 1));
        col += attrs.colspan - 1;
      } else if (row < map.width && pos == map.map[index + map.width]) {
        // Else, if it continues in the row below, it has to be moved down
        var cell = table.nodeAt(pos);
        var copy = cell.type.create(setAttr(cell.attrs, "rowspan", cell.attrs.rowspan - 1), cell.content);
        var newPos = map.positionAt(row + 1, col, table);
        tr.insert(tr.mapping.slice(mapFrom).map(tableStart + newPos), copy);
        col += cell.attrs.colspan - 1;
      }
    }
  }

  // :: (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Remove the selected rows from a table.
  function deleteRow(state, dispatch) {
    if (!isInTable(state)) { return false }
    if (dispatch) {
      var rect = selectedRect(state), tr = state.tr;
      if (rect.top == 0 && rect.bottom == rect.map.height) { return false }
      for (var i = rect.bottom - 1;; i--) {
        removeRow(tr, rect, i);
        if (i == rect.top) { break }
        rect.table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc;
        rect.map = TableMap.get(rect.table);
      }
      dispatch(tr);
    }
    return true
  }

  function isEmpty(cell) {
    var c = cell.content;
    return c.childCount == 1 && c.firstChild.isTextblock && c.firstChild.childCount == 0
  }

  function cellsOverlapRectangle(ref, rect) {
    var width = ref.width;
    var height = ref.height;
    var map = ref.map;

    var indexTop = rect.top * width + rect.left, indexLeft = indexTop;
    var indexBottom = (rect.bottom - 1) * width + rect.left, indexRight = indexTop + (rect.right - rect.left - 1);
    for (var i = rect.top; i < rect.bottom; i++) {
      if (rect.left > 0 && map[indexLeft] == map[indexLeft - 1] ||
          rect.right < width && map[indexRight] == map[indexRight + 1]) { return true }
      indexLeft += width; indexRight += width;
    }
    for (var i$1 = rect.left; i$1 < rect.right; i$1++) {
      if (rect.top > 0 && map[indexTop] == map[indexTop - width] ||
          rect.bottom < height && map[indexBottom] == map[indexBottom + width]) { return true }
      indexTop++; indexBottom++;
    }
    return false
  }

  // :: (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Merge the selected cells into a single cell. Only available when
  // the selected cells' outline forms a rectangle.
  function mergeCells(state, dispatch) {
    var sel = state.selection;
    if (!(sel instanceof CellSelection) || sel.$anchorCell.pos == sel.$headCell.pos) { return false }
    var rect = selectedRect(state);
    var map = rect.map;
    if (cellsOverlapRectangle(map, rect)) { return false }
    if (dispatch) {
      var tr = state.tr, seen = [], content = index_es.Fragment.empty, mergedPos, mergedCell;
      for (var row = rect.top; row < rect.bottom; row++) {
        for (var col = rect.left; col < rect.right; col++) {
          var cellPos = map.map[row * map.width + col], cell = rect.table.nodeAt(cellPos);
          if (seen.indexOf(cellPos) > -1) { continue }
          seen.push(cellPos);
          if (mergedPos == null) {
            mergedPos = cellPos;
            mergedCell = cell;
          } else {
            if (!isEmpty(cell)) { content = content.append(cell.content); }
            var mapped = tr.mapping.map(cellPos + rect.tableStart);
            tr.delete(mapped, mapped + cell.nodeSize);
          }
        }
      }
      tr.setNodeMarkup(mergedPos + rect.tableStart, null,
                       setAttr(addColSpan(mergedCell.attrs, mergedCell.attrs.colspan, (rect.right - rect.left) - mergedCell.attrs.colspan),
                               "rowspan", rect.bottom - rect.top));
      if (content.size) {
        var end = mergedPos + 1 + mergedCell.content.size;
        var start = isEmpty(mergedCell) ? mergedPos + 1 : end;
        tr.replaceWith(start + rect.tableStart, end + rect.tableStart, content);
      }
      tr.setSelection(new CellSelection(tr.doc.resolve(mergedPos + rect.tableStart)));
      dispatch(tr);
    }
    return true
  }

  // :: (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Split a selected cell, whose rowpan or colspan is greater than one,
  // into smaller cells.
  function splitCell(state, dispatch) {
    var sel = state.selection;
    var cellNode, cellPos;
    if (!(sel instanceof CellSelection)) {
      cellNode = cellWrapping(sel.$from);
      if (!cellNode) { return false }
      cellPos = cellAround(sel.$from).pos;
    } else {
      if (sel.$anchorCell.pos != sel.$headCell.pos) { return false }
      cellNode = sel.$anchorCell.nodeAfter;
      cellPos = sel.$anchorCell.pos;
    }
    if (cellNode.attrs.colspan == 1 && cellNode.attrs.rowspan == 1) {return false}
    if (dispatch) {
      var baseAttrs = cellNode.attrs, attrs = [], colwidth = baseAttrs.colwidth;
      if (baseAttrs.rowspan > 1) { baseAttrs = setAttr(baseAttrs, "rowspan", 1); }
      if (baseAttrs.colspan > 1) { baseAttrs = setAttr(baseAttrs, "colspan", 1); }
      var rect = selectedRect(state), tr = state.tr;
      for (var i = 0; i < rect.right - rect.left; i++)
        { attrs.push(colwidth ? setAttr(baseAttrs, "colwidth", colwidth && colwidth[i] ? [colwidth[i]] : null) : baseAttrs); }
      var lastCell, cellType = tableNodeTypes(state.schema)[cellNode.type.spec.tableRole];
      for (var row = 0; row < rect.bottom; row++) {
        if (row >= rect.top) {
          var pos = rect.map.positionAt(row, rect.left, rect.table);
          if (row == rect.top) { pos += cellNode.nodeSize; }
          for (var col = rect.left, i$1 = 0; col < rect.right; col++, i$1++) {
            if (col == rect.left && row == rect.top) { continue }
            tr.insert(lastCell = tr.mapping.map(pos + rect.tableStart, 1), cellType.createAndFill(attrs[i$1]));
          }
        }
      }
      tr.setNodeMarkup(cellPos, null, attrs[0]);
      if (sel instanceof CellSelection)
        { tr.setSelection(new CellSelection(tr.doc.resolve(sel.$anchorCell.pos),
                                          lastCell && tr.doc.resolve(lastCell))); }
      dispatch(tr);
    }
    return true
  }

  // :: (string, any) → (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Returns a command that sets the given attribute to the given value,
  // and is only available when the currently selected cell doesn't
  // already have that attribute set to that value.
  function setCellAttr(name, value) {
    return function(state, dispatch) {
      if (!isInTable(state)) { return false }
      var $cell = selectionCell(state);
      if ($cell.nodeAfter.attrs[name] === value) { return false }
      if (dispatch) {
        var tr = state.tr;
        if (state.selection instanceof CellSelection)
          { state.selection.forEachCell(function (node, pos) {
            if (node.attrs[name] !== value)
              { tr.setNodeMarkup(pos, null, setAttr(node.attrs, name, value)); }
          }); }
        else
          { tr.setNodeMarkup($cell.pos, null, setAttr($cell.nodeAfter.attrs, name, value)); }
        dispatch(tr);
      }
      return true
    }
  }

  function toggleHeader(type) {
    return function(state, dispatch) {
      if (!isInTable(state)) { return false }
      if (dispatch) {
        var types = tableNodeTypes(state.schema);
        var rect = selectedRect(state), tr = state.tr;
        var cells = rect.map.cellsInRect(type == "column" ? new Rect(rect.left, 0, rect.right, rect.map.height) :
                                         type == "row" ? new Rect(0, rect.top, rect.map.width, rect.bottom) : rect);
        var nodes = cells.map(function (pos) { return rect.table.nodeAt(pos); });
        for (var i = 0; i < cells.length; i++) // Remove headers, if any
          { if (nodes[i].type == types.header_cell)
            { tr.setNodeMarkup(rect.tableStart + cells[i], types.cell, nodes[i].attrs); } }
        if (tr.steps.length == 0) { for (var i$1 = 0; i$1 < cells.length; i$1++) // No headers removed, add instead
          { tr.setNodeMarkup(rect.tableStart + cells[i$1], types.header_cell, nodes[i$1].attrs); } }
        dispatch(tr);
      }
      return true
    }
  }

  // :: (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Toggles whether the selected row contains header cells.
  var toggleHeaderRow = toggleHeader("row");

  // :: (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Toggles whether the selected column contains header cells.
  var toggleHeaderColumn = toggleHeader("column");

  // :: (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Toggles whether the selected cells are header cells.
  var toggleHeaderCell = toggleHeader("cell");

  function findNextCell($cell, dir) {
    if (dir < 0) {
      var before = $cell.nodeBefore;
      if (before) { return $cell.pos - before.nodeSize }
      for (var row = $cell.index(-1) - 1, rowEnd = $cell.before(); row >= 0; row--) {
        var rowNode = $cell.node(-1).child(row);
        if (rowNode.childCount) { return rowEnd - 1 - rowNode.lastChild.nodeSize }
        rowEnd -= rowNode.nodeSize;
      }
    } else {
      if ($cell.index() < $cell.parent.childCount - 1) { return $cell.pos + $cell.nodeAfter.nodeSize }
      var table = $cell.node(-1);
      for (var row$1 = $cell.indexAfter(-1), rowStart = $cell.after(); row$1 < table.childCount; row$1++) {
        var rowNode$1 = table.child(row$1);
        if (rowNode$1.childCount) { return rowStart + 1 }
        rowStart += rowNode$1.nodeSize;
      }
    }
  }

  // :: (number) → (EditorState, dispatch: ?(tr: Transaction)) → bool
  // Returns a command for selecting the next (direction=1) or previous
  // (direction=-1) cell in a table.
  function goToNextCell(direction) {
    return function(state, dispatch) {
      if (!isInTable(state)) { return false }
      var cell = findNextCell(selectionCell(state), direction);
      if (cell == null) { return }
      if (dispatch) {
        var $cell = state.doc.resolve(cell);
        dispatch(state.tr.setSelection(index_es$2.TextSelection.between($cell, moveCellForward($cell))).scrollIntoView());
      }
      return true
    }
  }

  // :: (EditorState, ?(tr: Transaction)) → bool
  // Deletes the table around the selection, if any.
  function deleteTable(state, dispatch) {
    var $pos = state.selection.$anchor;
    for (var d = $pos.depth; d > 0; d--) {
      var node = $pos.node(d);
      if (node.type.spec.tableRole == "table") {
        if (dispatch) { dispatch(state.tr.delete($pos.before(d), $pos.after(d)).scrollIntoView()); }
        return true
      }
    }
    return false
  }

  var TableView = function TableView(node, cellMinWidth) {
    this.node = node;
    this.cellMinWidth = cellMinWidth;
    this.dom = document.createElement("div");
    this.dom.className = "tableWrapper";
    this.table = this.dom.appendChild(document.createElement("table"));
    this.colgroup = this.table.appendChild(document.createElement("colgroup"));
    updateColumns(node, this.colgroup, this.table, cellMinWidth);
    this.contentDOM = this.table.appendChild(document.createElement("tbody"));
  };

  TableView.prototype.update = function update (node) {
    if (node.type != this.node.type) { return false }
    this.node = node;
    updateColumns(node, this.colgroup, this.table, this.cellMinWidth);
    return true
  };

  TableView.prototype.ignoreMutation = function ignoreMutation (record) {
    return record.type == "attributes" && (record.target == this.table || this.colgroup.contains(record.target))
  };

  function updateColumns(node, colgroup, table, cellMinWidth, overrideCol, overrideValue) {
    var totalWidth = 0, fixedWidth = true;
    var nextDOM = colgroup.firstChild, row = node.firstChild;
    for (var i = 0, col = 0; i < row.childCount; i++) {
      var ref = row.child(i).attrs;
      var colspan = ref.colspan;
      var colwidth = ref.colwidth;
      for (var j = 0; j < colspan; j++, col++) {
        var hasWidth = overrideCol == col ? overrideValue : colwidth && colwidth[j];
        var cssWidth = hasWidth ? hasWidth + "px" : "";
        totalWidth += hasWidth || cellMinWidth;
        if (!hasWidth) { fixedWidth = false; }
        if (!nextDOM) {
          colgroup.appendChild(document.createElement("col")).style.width = cssWidth;
        } else {
          if (nextDOM.style.width != cssWidth) { nextDOM.style.width = cssWidth; }
          nextDOM = nextDOM.nextSibling;
        }
      }
    }

    while (nextDOM) {
      var after = nextDOM.nextSibling;
      nextDOM.parentNode.removeChild(nextDOM);
      nextDOM = after;
    }

    if (fixedWidth) {
      table.style.width = totalWidth + "px";
      table.style.minWidth = "";
    } else {
      table.style.width = "";
      table.style.minWidth = totalWidth + "px";
    }
  }

  var key$1 = new index_es$2.PluginKey("tableColumnResizing");

  function columnResizing(ref) {
    if ( ref === void 0 ) ref = {};
    var handleWidth = ref.handleWidth; if ( handleWidth === void 0 ) handleWidth = 5;
    var cellMinWidth = ref.cellMinWidth; if ( cellMinWidth === void 0 ) cellMinWidth = 25;
    var View = ref.View; if ( View === void 0 ) View = TableView;
    var lastColumnResizable = ref.lastColumnResizable; if ( lastColumnResizable === void 0 ) lastColumnResizable = true;

    var plugin = new index_es$2.Plugin({
      key: key$1,
      state: {
        init: function init(_, state) {
          this.spec.props.nodeViews[tableNodeTypes(state.schema).table.name] =
            function (node, view) { return new View(node, cellMinWidth, view); };
          return new ResizeState(-1, false)
        },
        apply: function apply(tr, prev) {
          return prev.apply(tr)
        }
      },
      props: {
        attributes: function attributes(state) {
          var pluginState = key$1.getState(state);
          return pluginState.activeHandle > -1 ? {class: "resize-cursor"} : null
        },

        handleDOMEvents: {
          mousemove: function mousemove(view, event) { handleMouseMove(view, event, handleWidth, cellMinWidth, lastColumnResizable); },
          mouseleave: function mouseleave(view) { handleMouseLeave(view); },
          mousedown: function mousedown(view, event) { handleMouseDown$1(view, event, cellMinWidth); }
        },

        decorations: function decorations(state) {
          var pluginState = key$1.getState(state);
          if (pluginState.activeHandle > -1) { return handleDecorations(state, pluginState.activeHandle) }
        },

        nodeViews: {}
      }
    });
    return plugin
  }

  var ResizeState = function ResizeState(activeHandle, dragging) {
    this.activeHandle = activeHandle;
    this.dragging = dragging;
  };

  ResizeState.prototype.apply = function apply (tr) {
    var state = this, action = tr.getMeta(key$1);
    if (action && action.setHandle != null)
      { return new ResizeState(action.setHandle, null) }
    if (action && action.setDragging !== undefined)
      { return new ResizeState(state.activeHandle, action.setDragging) }
    if (state.activeHandle > -1 && tr.docChanged) {
      var handle = tr.mapping.map(state.activeHandle, -1);
      if (!pointsAtCell(tr.doc.resolve(handle))) { handle = null; }
      state = new ResizeState(handle, state.dragging);
    }
    return state
  };

  function handleMouseMove(view, event, handleWidth, cellMinWidth, lastColumnResizable) {
    var pluginState = key$1.getState(view.state);

    if (!pluginState.dragging) {
      var target = domCellAround(event.target), cell = -1;
      if (target) {
        var ref = target.getBoundingClientRect();
        var left = ref.left;
        var right = ref.right;
        if (event.clientX - left <= handleWidth)
          { cell = edgeCell(view, event, "left"); }
        else if (right - event.clientX <= handleWidth)
          { cell = edgeCell(view, event, "right"); }
      }

      if (cell != pluginState.activeHandle) {
        if (!lastColumnResizable && cell !== -1) {
          var $cell = view.state.doc.resolve(cell);
          var table = $cell.node(-1), map = TableMap.get(table), start = $cell.start(-1);
          var col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;

          if (col == map.width - 1) {
            return
          }
        }

        updateHandle(view, cell);
      }
    }
  }

  function handleMouseLeave(view) {
    var pluginState = key$1.getState(view.state);
    if (pluginState.activeHandle > -1 && !pluginState.dragging) { updateHandle(view, -1); }
  }

  function handleMouseDown$1(view, event, cellMinWidth) {
    var pluginState = key$1.getState(view.state);
    if (pluginState.activeHandle == -1 || pluginState.dragging) { return false }

    var cell = view.state.doc.nodeAt(pluginState.activeHandle);
    var width = currentColWidth(view, pluginState.activeHandle, cell.attrs);
    view.dispatch(view.state.tr.setMeta(key$1, {setDragging: {startX: event.clientX, startWidth: width}}));

    function finish(event) {
      window.removeEventListener("mouseup", finish);
      window.removeEventListener("mousemove", move);
      var pluginState = key$1.getState(view.state);
      if (pluginState.dragging) {
        updateColumnWidth(view, pluginState.activeHandle, draggedWidth(pluginState.dragging, event, cellMinWidth));
        view.dispatch(view.state.tr.setMeta(key$1, {setDragging: null}));
      }
    }
    function move(event) {
      if (!event.which) { return finish(event) }
      var pluginState = key$1.getState(view.state);
      var dragged = draggedWidth(pluginState.dragging, event, cellMinWidth);
      displayColumnWidth(view, pluginState.activeHandle, dragged, cellMinWidth);
    }

    window.addEventListener("mouseup", finish);
    window.addEventListener("mousemove", move);
    event.preventDefault();
    return true
  }

  function currentColWidth(view, cellPos, ref) {
    var colspan = ref.colspan;
    var colwidth = ref.colwidth;

    var width = colwidth && colwidth[colwidth.length - 1];
    if (width) { return width }
    var dom = view.domAtPos(cellPos);
    var node = dom.node.childNodes[dom.offset];
    var domWidth = node.offsetWidth, parts = colspan;
    if (colwidth) { for (var i = 0; i < colspan; i++) { if (colwidth[i]) {
      domWidth -= colwidth[i];
      parts--;
    } } }
    return domWidth / parts
  }

  function domCellAround(target) {
    while (target && target.nodeName != "TD" && target.nodeName != "TH")
      { target = target.classList.contains("ProseMirror") ? null : target.parentNode; }
    return target
  }

  function edgeCell(view, event, side) {
    var ref = view.posAtCoords({left: event.clientX, top: event.clientY});
    var pos = ref.pos;
    var $cell = cellAround(view.state.doc.resolve(pos));
    if (!$cell) { return -1 }
    if (side == "right") { return $cell.pos }
    var map = TableMap.get($cell.node(-1)), start = $cell.start(-1);
    var index = map.map.indexOf($cell.pos - start);
    return index % map.width == 0 ? -1 : start + map.map[index - 1]
  }

  function draggedWidth(dragging, event, cellMinWidth) {
    var offset = event.clientX - dragging.startX;
    return Math.max(cellMinWidth, dragging.startWidth + offset)
  }

  function updateHandle(view, value) {
    view.dispatch(view.state.tr.setMeta(key$1, {setHandle: value}));
  }

  function updateColumnWidth(view, cell, width) {
    var $cell = view.state.doc.resolve(cell);
    var table = $cell.node(-1), map = TableMap.get(table), start = $cell.start(-1);
    var col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
    var tr = view.state.tr;
    for (var row = 0; row < map.height; row++) {
      var mapIndex = row * map.width + col;
      // Rowspanning cell that has already been handled
      if (row && map.map[mapIndex] == map.map[mapIndex - map.width]) { continue }
      var pos = map.map[mapIndex];
      var ref = table.nodeAt(pos);
      var attrs = ref.attrs;
      var index = attrs.colspan == 1 ? 0 : col - map.colCount(pos);
      if (attrs.colwidth && attrs.colwidth[index] == width) { continue }
      var colwidth = attrs.colwidth ? attrs.colwidth.slice() : zeroes(attrs.colspan);
      colwidth[index] = width;
      tr.setNodeMarkup(start + pos, null, setAttr(attrs, "colwidth", colwidth));
    }
    if (tr.docChanged) { view.dispatch(tr); }
  }

  function displayColumnWidth(view, cell, width, cellMinWidth) {
    var $cell = view.state.doc.resolve(cell);
    var table = $cell.node(-1), start = $cell.start(-1);
    var col = TableMap.get(table).colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
    var dom = view.domAtPos($cell.start(-1)).node;
    while (dom.nodeName != "TABLE") { dom = dom.parentNode; }
    updateColumns(table, dom.firstChild, dom, cellMinWidth, col, width);
  }

  function zeroes(n) {
    var result = [];
    for (var i = 0; i < n; i++) { result.push(0); }
    return result
  }

  function handleDecorations(state, cell) {
    var decorations = [];
    var $cell = state.doc.resolve(cell);
    var table = $cell.node(-1), map = TableMap.get(table), start = $cell.start(-1);
    var col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan;
    for (var row = 0; row < map.height; row++) {
      var index = col + row * map.width - 1;
      // For positions that are have either a different cell or the end
      // of the table to their right, and either the top of the table or
      // a different cell above them, add a decoration
      if ((col == map.width || map.map[index] != map.map[index + 1]) &&
          (row == 0 || map.map[index - 1] != map.map[index - 1 - map.width])) {
        var cellPos = map.map[index];
        var pos = start + cellPos + table.nodeAt(cellPos).nodeSize - 1;
        var dom = document.createElement("div");
        dom.className = "column-resize-handle";
        decorations.push(index_es$3.Decoration.widget(pos, dom));
      }
    }
    return index_es$3.DecorationSet.create(state.doc, decorations)
  }

  // This file defines a plugin that handles the drawing of cell

  // :: () → Plugin
  //
  // Creates a [plugin](http://prosemirror.net/docs/ref/#state.Plugin)
  // that, when added to an editor, enables cell-selection, handles
  // cell-based copy/paste, and makes sure tables stay well-formed (each
  // row has the same width, and cells don't overlap).
  //
  // You should probably put this plugin near the end of your array of
  // plugins, since it handles mouse and arrow key events in tables
  // rather broadly, and other plugins, like the gap cursor or the
  // column-width dragging plugin, might want to get a turn first to
  // perform more specific behavior.
  function tableEditing(ref) {
    if ( ref === void 0 ) ref = {};
    var allowTableNodeSelection = ref.allowTableNodeSelection; if ( allowTableNodeSelection === void 0 ) allowTableNodeSelection = false;

    return new index_es$2.Plugin({
      key: key,

      // This piece of state is used to remember when a mouse-drag
      // cell-selection is happening, so that it can continue even as
      // transactions (which might move its anchor cell) come in.
      state: {
        init: function init() { return null },
        apply: function apply(tr, cur) {
          var set = tr.getMeta(key);
          if (set != null) { return set == -1 ? null : set }
          if (cur == null || !tr.docChanged) { return cur }
          var ref = tr.mapping.mapResult(cur);
          var deleted = ref.deleted;
          var pos = ref.pos;
          return deleted ? null : pos
        }
      },

      props: {
        decorations: drawCellSelection,

        handleDOMEvents: {
          mousedown: handleMouseDown
        },

        createSelectionBetween: function createSelectionBetween(view) {
          if (key.getState(view.state) != null) { return view.state.selection }
        },

        handleTripleClick: handleTripleClick,

        handleKeyDown: handleKeyDown,

        handlePaste: handlePaste
      },

      appendTransaction: function appendTransaction(_, oldState, state) {
        return normalizeSelection(state, fixTables(state, oldState), allowTableNodeSelection)
      }
    })
  }

  exports.tableEditing = tableEditing;
  exports.fixTables = fixTables;
  exports.handlePaste = handlePaste;
  exports.cellAround = cellAround;
  exports.isInTable = isInTable;
  exports.selectionCell = selectionCell;
  exports.moveCellForward = moveCellForward;
  exports.inSameTable = inSameTable;
  exports.findCell = findCell;
  exports.colCount = colCount;
  exports.nextCell = nextCell;
  exports.tableNodes = tableNodes;
  exports.CellSelection = CellSelection;
  exports.TableMap = TableMap;
  exports.columnResizing = columnResizing;
  exports.columnResizingPluginKey = key$1;
  exports.updateColumnsOnResize = updateColumns;
  exports.__pastedCells = pastedCells;
  exports.__insertCells = insertCells;
  exports.__clipCells = clipCells;
  exports.addColumn = addColumn;
  exports.addColumnBefore = addColumnBefore;
  exports.addColumnAfter = addColumnAfter;
  exports.removeColumn = removeColumn;
  exports.deleteColumn = deleteColumn;
  exports.addRow = addRow;
  exports.addRowBefore = addRowBefore;
  exports.addRowAfter = addRowAfter;
  exports.removeRow = removeRow;
  exports.deleteRow = deleteRow;
  exports.mergeCells = mergeCells;
  exports.splitCell = splitCell;
  exports.setCellAttr = setCellAttr;
  exports.toggleHeaderRow = toggleHeaderRow;
  exports.toggleHeaderColumn = toggleHeaderColumn;
  exports.toggleHeaderCell = toggleHeaderCell;
  exports.goToNextCell = goToNextCell;
  exports.deleteTable = deleteTable;

  });

  unwrapExports(dist);
  var dist_1 = dist.tableEditing;
  var dist_2 = dist.fixTables;
  var dist_3 = dist.handlePaste;
  var dist_4 = dist.cellAround;
  var dist_5 = dist.isInTable;
  var dist_6 = dist.selectionCell;
  var dist_7 = dist.moveCellForward;
  var dist_8 = dist.inSameTable;
  var dist_9 = dist.findCell;
  var dist_10 = dist.colCount;
  var dist_11 = dist.nextCell;
  var dist_12 = dist.tableNodes;
  var dist_13 = dist.CellSelection;
  var dist_14 = dist.TableMap;
  var dist_15 = dist.columnResizing;
  var dist_16 = dist.columnResizingPluginKey;
  var dist_17 = dist.updateColumnsOnResize;
  var dist_18 = dist.__pastedCells;
  var dist_19 = dist.__insertCells;
  var dist_20 = dist.__clipCells;
  var dist_21 = dist.addColumn;
  var dist_22 = dist.addColumnBefore;
  var dist_23 = dist.addColumnAfter;
  var dist_24 = dist.removeColumn;
  var dist_25 = dist.deleteColumn;
  var dist_26 = dist.addRow;
  var dist_27 = dist.addRowBefore;
  var dist_28 = dist.addRowAfter;
  var dist_29 = dist.removeRow;
  var dist_30 = dist.deleteRow;
  var dist_31 = dist.mergeCells;
  var dist_32 = dist.splitCell;
  var dist_33 = dist.setCellAttr;
  var dist_34 = dist.toggleHeaderRow;
  var dist_35 = dist.toggleHeaderColumn;
  var dist_36 = dist.toggleHeaderCell;
  var dist_37 = dist.goToNextCell;
  var dist_38 = dist.deleteTable;

  var dist$1 = createCommonjsModule$1(function (module, exports) {

  Object.defineProperty(exports, '__esModule', { value: true });





  // :: (nodeType: union<NodeType, [NodeType]>) → (tr: Transaction) → Transaction
  // Returns a new transaction that removes a node of a given `nodeType`. It will return an original transaction if parent node hasn't been found.
  //
  // ```javascript
  // dispatch(
  //   removeParentNodeOfType(schema.nodes.table)(tr)
  // );
  // ```
  var removeParentNodeOfType = function removeParentNodeOfType(nodeType) {
    return function (tr) {
      var parent = findParentNodeOfType(nodeType)(tr.selection);
      if (parent) {
        return removeNodeAtPos(parent.pos)(tr);
      }
      return tr;
    };
  };

  // :: (nodeType: union<NodeType, [NodeType]>, content: union<ProseMirrorNode, Fragment>) → (tr: Transaction) → Transaction
  // Returns a new transaction that replaces parent node of a given `nodeType` with the given `content`. It will return an original transaction if either parent node hasn't been found or replacing is not possible.
  //
  // ```javascript
  // const node = schema.nodes.paragraph.createChecked({}, schema.text('new'));
  //
  // dispatch(
  //  replaceParentNodeOfType(schema.nodes.table, node)(tr)
  // );
  // ```
  var replaceParentNodeOfType = function replaceParentNodeOfType(nodeType, content) {
    return function (tr) {
      if (!Array.isArray(nodeType)) {
        nodeType = [nodeType];
      }
      for (var i = 0, count = nodeType.length; i < count; i++) {
        var parent = findParentNodeOfType(nodeType[i])(tr.selection);
        if (parent) {
          var newTr = replaceNodeAtPos(parent.pos, content)(tr);
          if (newTr !== tr) {
            return newTr;
          }
        }
      }
      return tr;
    };
  };

  // :: (tr: Transaction) → Transaction
  // Returns a new transaction that removes selected node. It will return an original transaction if current selection is not a `NodeSelection`.
  //
  // ```javascript
  // dispatch(
  //   removeSelectedNode(tr)
  // );
  // ```
  var removeSelectedNode = function removeSelectedNode(tr) {
    if (isNodeSelection(tr.selection)) {
      var from = tr.selection.$from.pos;
      var to = tr.selection.$to.pos;
      return cloneTr(tr.delete(from, to));
    }
    return tr;
  };

  // :: (node: ProseMirrorNode) → (tr: Transaction) → Transaction
  // Returns a new transaction that replaces selected node with a given `node`.
  // It will return the original transaction if either current selection is not a NodeSelection or replacing is not possible.
  //
  // ```javascript
  // const node = schema.nodes.paragraph.createChecked({}, schema.text('new'));
  // dispatch(
  //   replaceSelectedNode(node)(tr)
  // );
  // ```
  var replaceSelectedNode = function replaceSelectedNode(node) {
    return function (tr) {
      if (isNodeSelection(tr.selection)) {
        var _tr$selection = tr.selection,
            $from = _tr$selection.$from,
            $to = _tr$selection.$to;

        if ($from.parent.canReplaceWith($from.index(), $from.indexAfter(), node.type)) {
          return cloneTr(tr.replaceWith($from.pos, $to.pos, node));
        }
      }
      return tr;
    };
  };

  // :: (position: number, dir: ?number) → (tr: Transaction) → Transaction
  // Returns a new transaction that tries to find a valid cursor selection starting at the given `position`
  // and searching back if `dir` is negative, and forward if positive.
  // If a valid cursor position hasn't been found, it will return the original transaction.
  //
  // ```javascript
  // dispatch(
  //   setTextSelection(5)(tr)
  // );
  // ```
  var setTextSelection = function setTextSelection(position) {
    var dir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    return function (tr) {
      var nextSelection = index_es$2.Selection.findFrom(tr.doc.resolve(position), dir, true);
      if (nextSelection) {
        return tr.setSelection(nextSelection);
      }
      return tr;
    };
  };

  // :: (content: union<ProseMirrorNode, Fragment>, position: ?number) → (tr: Transaction) → Transaction
  // Returns a new transaction that inserts a given `content` at the current cursor position, or at a given `position`, if it is allowed by schema. If schema restricts such nesting, it will try to find an appropriate place for a given node in the document, looping through parent nodes up until the root document node.
  // If cursor is inside of an empty paragraph, it will try to replace that paragraph with the given content. If insertion is successful and inserted node has content, it will set cursor inside of that content.
  // It will return an original transaction if the place for insertion hasn't been found.
  //
  // ```javascript
  // const node = schema.nodes.extension.createChecked({});
  // dispatch(
  //   safeInsert(node)(tr)
  // );
  // ```
  var safeInsert = function safeInsert(content, position) {
    return function (tr) {
      var hasPosition = typeof position === 'number';
      var $from = tr.selection.$from;

      var $insertPos = hasPosition ? tr.doc.resolve(position) : isNodeSelection(tr.selection) ? tr.doc.resolve($from.pos + 1) : $from;
      var parent = $insertPos.parent,
          depth = $insertPos.depth;

      // try to replace an empty paragraph

      if (isEmptyParagraph(parent)) {
        var oldTr = tr;
        tr = replaceParentNodeOfType(parent.type, content)(tr);
        if (oldTr !== tr) {
          return setTextSelection($insertPos.pos)(tr);
        }
      }

      // given node is allowed at the current cursor position
      if (canInsert($insertPos, content)) {
        tr.insert($insertPos.pos, content);
        return cloneTr(setTextSelection(hasPosition ? $insertPos.pos : tr.selection.$anchor.pos)(tr));
      }

      // looking for a place in the doc where the node is allowed
      for (var i = $insertPos.depth; i > 0; i--) {
        var pos = $insertPos.after(i);
        var $pos = tr.doc.resolve(pos);
        if (canInsert($pos, content)) {
          tr.insert(pos, content);
          return cloneTr(setTextSelection(pos)(tr));
        }
      }
      return tr;
    };
  };

  // :: (nodeType: union<NodeType, [NodeType]>, type: ?union<NodeType, null>, attrs: ?union<Object, null>, marks?: [Mark]) → (tr: Transaction) → Transaction
  // Returns a transaction that changes the type, attributes, and/or marks of the parent node of a given `nodeType`.
  //
  // ```javascript
  // const node = schema.nodes.extension.createChecked({});
  // dispatch(
  //   setParentNodeMarkup(schema.nodes.panel, null, { panelType })(tr);
  // );
  // ```
  var setParentNodeMarkup = function setParentNodeMarkup(nodeType, type, attrs, marks) {
    return function (tr) {
      var parent = findParentNodeOfType(nodeType)(tr.selection);
      if (parent) {
        return cloneTr(tr.setNodeMarkup(parent.pos, type, Object.assign({}, parent.node.attrs, attrs), marks));
      }
      return tr;
    };
  };

  // :: (nodeType: union<NodeType, [NodeType]>) → (tr: Transaction) → Transaction
  // Returns a new transaction that sets a `NodeSelection` on a parent node of a `given nodeType`.
  //
  // ```javascript
  // dispatch(
  //   selectParentNodeOfType([tableCell, tableHeader])(state.tr)
  // );
  // ```
  var selectParentNodeOfType = function selectParentNodeOfType(nodeType) {
    return function (tr) {
      if (!isNodeSelection(tr.selection)) {
        var parent = findParentNodeOfType(nodeType)(tr.selection);
        if (parent) {
          return cloneTr(tr.setSelection(index_es$2.NodeSelection.create(tr.doc, parent.pos)));
        }
      }
      return tr;
    };
  };

  // :: (tr: Transaction) → Transaction
  // Returns a new transaction that deletes previous node.
  //
  // ```javascript
  // dispatch(
  //   removeNodeBefore(state.tr)
  // );
  // ```
  var removeNodeBefore = function removeNodeBefore(tr) {
    var position = findPositionOfNodeBefore(tr.selection);
    if (typeof position === 'number') {
      return removeNodeAtPos(position)(tr);
    }
    return tr;
  };

  // :: (selection: Selection) → boolean
  // Checks if current selection is a `NodeSelection`.
  //
  // ```javascript
  // if (isNodeSelection(tr.selection)) {
  //   // ...
  // }
  // ```
  var isNodeSelection = function isNodeSelection(selection) {
    return selection instanceof index_es$2.NodeSelection;
  };

  // (nodeType: union<NodeType, [NodeType]>) → boolean
  // Checks if the type a given `node` equals to a given `nodeType`.
  var equalNodeType = function equalNodeType(nodeType, node) {
    return Array.isArray(nodeType) && nodeType.indexOf(node.type) > -1 || node.type === nodeType;
  };

  // (tr: Transaction) → Transaction
  // Creates a new transaction object from a given transaction
  var cloneTr = function cloneTr(tr) {
    return Object.assign(Object.create(tr), tr).setTime(Date.now());
  };

  // (position: number, content: union<ProseMirrorNode, Fragment>) → (tr: Transaction) → Transaction
  // Returns a `replace` transaction that replaces a node at a given position with the given `content`.
  // It will return the original transaction if replacing is not possible.
  // `position` should point at the position immediately before the node.
  var replaceNodeAtPos = function replaceNodeAtPos(position, content) {
    return function (tr) {
      var node = tr.doc.nodeAt(position);
      var $pos = tr.doc.resolve(position);
      if (canReplace($pos, content)) {
        tr = tr.replaceWith(position, position + node.nodeSize, content);
        var start = tr.selection.$from.pos - 1;
        // put cursor inside of the inserted node
        tr = setTextSelection(Math.max(start, 0), -1)(tr);
        // move cursor to the start of the node
        tr = setTextSelection(tr.selection.$from.start())(tr);
        return cloneTr(tr);
      }
      return tr;
    };
  };

  // ($pos: ResolvedPos, doc: ProseMirrorNode, content: union<ProseMirrorNode, Fragment>, ) → boolean
  // Checks if replacing a node at a given `$pos` inside of the `doc` node with the given `content` is possible.
  var canReplace = function canReplace($pos, content) {
    var node = $pos.node($pos.depth);
    return node && node.type.validContent(content instanceof index_es.Fragment ? content : index_es.Fragment.from(content));
  };

  // (position: number) → (tr: Transaction) → Transaction
  // Returns a `delete` transaction that removes a node at a given position with the given `node`.
  // `position` should point at the position immediately before the node.
  var removeNodeAtPos = function removeNodeAtPos(position) {
    return function (tr) {
      var node = tr.doc.nodeAt(position);
      return cloneTr(tr.delete(position, position + node.nodeSize));
    };
  };

  // (schema: Schema) → {[key: string]: NodeType}
  // Returns a map where keys are tableRoles and values are NodeTypes.
  var tableNodeTypes = function tableNodeTypes(schema) {
    if (schema.cached.tableNodeTypes) {
      return schema.cached.tableNodeTypes;
    }
    var roles = {};
    Object.keys(schema.nodes).forEach(function (type) {
      var nodeType = schema.nodes[type];
      if (nodeType.spec.tableRole) {
        roles[nodeType.spec.tableRole] = nodeType;
      }
    });
    schema.cached.tableNodeTypes = roles;
    return roles;
  };

  // :: ($pos: ResolvedPos, content: union<ProseMirrorNode, Fragment>) → boolean
  // Checks if a given `content` can be inserted at the given `$pos`
  //
  // ```javascript
  // const { selection: { $from } } = state;
  // const node = state.schema.nodes.atom.createChecked();
  // if (canInsert($from, node)) {
  //   // ...
  // }
  // ```
  var canInsert = function canInsert($pos, content) {
    var index = $pos.index();

    if (content instanceof index_es.Fragment) {
      return $pos.parent.canReplace(index, index, content);
    } else if (content instanceof index_es.Node) {
      return $pos.parent.canReplaceWith(index, index, content.type);
    }
    return false;
  };

  // (node: ProseMirrorNode) → boolean
  // Checks if a given `node` is an empty paragraph
  var isEmptyParagraph = function isEmptyParagraph(node) {
    return !node || node.type.name === 'paragraph' && node.nodeSize === 2;
  };

  // ($pos: ResolvedPos) → ?{pos: number, start: number, node: ProseMirrorNode}
  // Iterates over parent nodes, returning a table node closest to a given `$pos`.
  //
  // ```javascript
  // const table = findTableClosestToPos(state.doc.resolve(10));
  // ```
  var findTableClosestToPos = function findTableClosestToPos($pos) {
    var predicate = function predicate(node) {
      return node.type.spec.tableRole && /table/i.test(node.type.spec.tableRole);
    };
    return findParentNodeClosestToPos($pos, predicate);
  };

  // :: (predicate: (node: ProseMirrorNode) → boolean) → (selection: Selection) → ?{pos: number, start: number, depth: number, node: ProseMirrorNode}
  // Iterates over parent nodes, returning the closest node and its start position `predicate` returns truthy for. `start` points to the start position of the node, `pos` points directly before the node.
  //
  // ```javascript
  // const predicate = node => node.type === schema.nodes.blockquote;
  // const parent = findParentNode(predicate)(selection);
  // ```
  var findParentNode = function findParentNode(predicate) {
    return function (selection) {
      var $from = selection.$from;

      for (var i = $from.depth; i > 0; i--) {
        var node = $from.node(i);
        if (predicate(node)) {
          return {
            pos: i > 0 ? $from.before(i) : 0,
            start: $from.start(i),
            depth: i,
            node: node
          };
        }
      }
    };
  };

  // :: ($pos: ResolvedPos, predicate: (node: ProseMirrorNode) → boolean) → ?{pos: number, start: number, depth: number, node: ProseMirrorNode}
  // Iterates over parent nodes starting from the given `$pos`, returning the closest node and its start position `predicate` returns truthy for. `start` points to the start position of the node, `pos` points directly before the node.
  //
  // ```javascript
  // const predicate = node => node.type === schema.nodes.blockquote;
  // const parent = findParentNodeClosestToPos(state.doc.resolve(5), predicate);
  // ```
  var findParentNodeClosestToPos = function findParentNodeClosestToPos($pos, predicate) {
    for (var i = $pos.depth; i > 0; i--) {
      var node = $pos.node(i);
      if (predicate(node)) {
        return {
          pos: i > 0 ? $pos.before(i) : 0,
          start: $pos.start(i),
          depth: i,
          node: node
        };
      }
    }
  };

  // :: (predicate: (node: ProseMirrorNode) → boolean, domAtPos: (pos: number) → {node: dom.Node, offset: number}) → (selection: Selection) → ?dom.Node
  // Iterates over parent nodes, returning DOM reference of the closest node `predicate` returns truthy for.
  //
  // ```javascript
  // const domAtPos = view.domAtPos.bind(view);
  // const predicate = node => node.type === schema.nodes.table;
  // const parent = findParentDomRef(predicate, domAtPos)(selection); // <table>
  // ```
  var findParentDomRef = function findParentDomRef(predicate, domAtPos) {
    return function (selection) {
      var parent = findParentNode(predicate)(selection);
      if (parent) {
        return findDomRefAtPos(parent.pos, domAtPos);
      }
    };
  };

  // :: (predicate: (node: ProseMirrorNode) → boolean) → (selection: Selection) → boolean
  // Checks if there's a parent node `predicate` returns truthy for.
  //
  // ```javascript
  // if (hasParentNode(node => node.type === schema.nodes.table)(selection)) {
  //   // ....
  // }
  // ```
  var hasParentNode = function hasParentNode(predicate) {
    return function (selection) {
      return !!findParentNode(predicate)(selection);
    };
  };

  // :: (nodeType: union<NodeType, [NodeType]>) → (selection: Selection) → ?{pos: number, start: number, depth: number, node: ProseMirrorNode}
  // Iterates over parent nodes, returning closest node of a given `nodeType`. `start` points to the start position of the node, `pos` points directly before the node.
  //
  // ```javascript
  // const parent = findParentNodeOfType(schema.nodes.paragraph)(selection);
  // ```
  var findParentNodeOfType = function findParentNodeOfType(nodeType) {
    return function (selection) {
      return findParentNode(function (node) {
        return equalNodeType(nodeType, node);
      })(selection);
    };
  };

  // :: ($pos: ResolvedPos, nodeType: union<NodeType, [NodeType]>) → ?{pos: number, start: number, depth: number, node: ProseMirrorNode}
  // Iterates over parent nodes starting from the given `$pos`, returning closest node of a given `nodeType`. `start` points to the start position of the node, `pos` points directly before the node.
  //
  // ```javascript
  // const parent = findParentNodeOfTypeClosestToPos(state.doc.resolve(10), schema.nodes.paragraph);
  // ```
  var findParentNodeOfTypeClosestToPos = function findParentNodeOfTypeClosestToPos($pos, nodeType) {
    return findParentNodeClosestToPos($pos, function (node) {
      return equalNodeType(nodeType, node);
    });
  };

  // :: (nodeType: union<NodeType, [NodeType]>) → (selection: Selection) → boolean
  // Checks if there's a parent node of a given `nodeType`.
  //
  // ```javascript
  // if (hasParentNodeOfType(schema.nodes.table)(selection)) {
  //   // ....
  // }
  // ```
  var hasParentNodeOfType = function hasParentNodeOfType(nodeType) {
    return function (selection) {
      return hasParentNode(function (node) {
        return equalNodeType(nodeType, node);
      })(selection);
    };
  };

  // :: (nodeType: union<NodeType, [NodeType]>, domAtPos: (pos: number) → {node: dom.Node, offset: number}) → (selection: Selection) → ?dom.Node
  // Iterates over parent nodes, returning DOM reference of the closest node of a given `nodeType`.
  //
  // ```javascript
  // const domAtPos = view.domAtPos.bind(view);
  // const parent = findParentDomRefOfType(schema.nodes.codeBlock, domAtPos)(selection); // <pre>
  // ```
  var findParentDomRefOfType = function findParentDomRefOfType(nodeType, domAtPos) {
    return function (selection) {
      return findParentDomRef(function (node) {
        return equalNodeType(nodeType, node);
      }, domAtPos)(selection);
    };
  };

  // :: (nodeType: union<NodeType, [NodeType]>) → (selection: Selection) → ?{pos: number, start: number, depth: number, node: ProseMirrorNode}
  // Returns a node of a given `nodeType` if it is selected. `start` points to the start position of the node, `pos` points directly before the node.
  //
  // ```javascript
  // const { extension, inlineExtension, bodiedExtension } = schema.nodes;
  // const selectedNode = findSelectedNodeOfType([
  //   extension,
  //   inlineExtension,
  //   bodiedExtension,
  // ])(selection);
  // ```
  var findSelectedNodeOfType = function findSelectedNodeOfType(nodeType) {
    return function (selection) {
      if (isNodeSelection(selection)) {
        var node = selection.node,
            $from = selection.$from;

        if (equalNodeType(nodeType, node)) {
          return { node: node, pos: $from.pos, depth: $from.depth };
        }
      }
    };
  };

  // :: (selection: Selection) → ?number
  // Returns position of the previous node.
  //
  // ```javascript
  // const pos = findPositionOfNodeBefore(tr.selection);
  // ```
  var findPositionOfNodeBefore = function findPositionOfNodeBefore(selection) {
    var nodeBefore = selection.$from.nodeBefore;

    var maybeSelection = index_es$2.Selection.findFrom(selection.$from, -1);
    if (maybeSelection && nodeBefore) {
      // leaf node
      var parent = findParentNodeOfType(nodeBefore.type)(maybeSelection);
      if (parent) {
        return parent.pos;
      }
      return maybeSelection.$from.pos;
    }
  };

  // :: (position: number, domAtPos: (pos: number) → {node: dom.Node, offset: number}) → dom.Node
  // Returns DOM reference of a node at a given `position`. If the node type is of type `TEXT_NODE` it will return the reference of the parent node.
  //
  // ```javascript
  // const domAtPos = view.domAtPos.bind(view);
  // const ref = findDomRefAtPos($from.pos, domAtPos);
  // ```
  var findDomRefAtPos = function findDomRefAtPos(position, domAtPos) {
    var dom = domAtPos(position);
    var node = dom.node.childNodes[dom.offset];
    return node && node.nodeType !== Node.TEXT_NODE ? node : dom.node;
  };

  // :: (node: ProseMirrorNode, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
  // Flattens descendants of a given `node`. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
  //
  // ```javascript
  // const children = flatten(node);
  // ```
  var flatten = function flatten(node) {
    var descend = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (!node) {
      throw new Error('Invalid "node" parameter');
    }
    var result = [];
    node.descendants(function (child, pos) {
      result.push({ node: child, pos: pos });
      if (!descend) {
        return false;
      }
    });
    return result;
  };

  // :: (node: ProseMirrorNode, predicate: (node: ProseMirrorNode) → boolean, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
  // Iterates over descendants of a given `node`, returning child nodes predicate returns truthy for. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
  //
  // ```javascript
  // const textNodes = findChildren(node, child => child.isText, false);
  // ```
  var findChildren = function findChildren(node, predicate, descend) {
    if (!node) {
      throw new Error('Invalid "node" parameter');
    } else if (!predicate) {
      throw new Error('Invalid "predicate" parameter');
    }
    return flatten(node, descend).filter(function (child) {
      return predicate(child.node);
    });
  };

  // :: (node: ProseMirrorNode, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
  // Returns text nodes of a given `node`. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
  //
  // ```javascript
  // const textNodes = findTextNodes(node);
  // ```
  var findTextNodes = function findTextNodes(node, descend) {
    return findChildren(node, function (child) {
      return child.isText;
    }, descend);
  };

  // :: (node: ProseMirrorNode, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
  // Returns inline nodes of a given `node`. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
  //
  // ```javascript
  // const inlineNodes = findInlineNodes(node);
  // ```
  var findInlineNodes = function findInlineNodes(node, descend) {
    return findChildren(node, function (child) {
      return child.isInline;
    }, descend);
  };

  // :: (node: ProseMirrorNode, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
  // Returns block descendants of a given `node`. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
  //
  // ```javascript
  // const blockNodes = findBlockNodes(node);
  // ```
  var findBlockNodes = function findBlockNodes(node, descend) {
    return findChildren(node, function (child) {
      return child.isBlock;
    }, descend);
  };

  // :: (node: ProseMirrorNode, predicate: (attrs: ?Object) → boolean, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
  // Iterates over descendants of a given `node`, returning child nodes predicate returns truthy for. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
  //
  // ```javascript
  // const mergedCells = findChildrenByAttr(table, attrs => attrs.colspan === 2);
  // ```
  var findChildrenByAttr = function findChildrenByAttr(node, predicate, descend) {
    return findChildren(node, function (child) {
      return !!predicate(child.attrs);
    }, descend);
  };

  // :: (node: ProseMirrorNode, nodeType: NodeType, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
  // Iterates over descendants of a given `node`, returning child nodes of a given nodeType. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
  //
  // ```javascript
  // const cells = findChildrenByType(table, schema.nodes.tableCell);
  // ```
  var findChildrenByType = function findChildrenByType(node, nodeType, descend) {
    return findChildren(node, function (child) {
      return child.type === nodeType;
    }, descend);
  };

  // :: (node: ProseMirrorNode, markType: markType, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
  // Iterates over descendants of a given `node`, returning child nodes that have a mark of a given markType. It doesn't descend into a `node` when descend argument is `false` (defaults to `true`).
  //
  // ```javascript
  // const nodes = findChildrenByMark(state.doc, schema.marks.strong);
  // ```
  var findChildrenByMark = function findChildrenByMark(node, markType, descend) {
    return findChildren(node, function (child) {
      return markType.isInSet(child.marks);
    }, descend);
  };

  // :: (node: ProseMirrorNode, nodeType: NodeType) → boolean
  // Returns `true` if a given node contains nodes of a given `nodeType`
  //
  // ```javascript
  // if (contains(panel, schema.nodes.listItem)) {
  //   // ...
  // }
  // ```
  var contains = function contains(node, nodeType) {
    return !!findChildrenByType(node, nodeType).length;
  };

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

  // :: (selection: Selection) → ?{pos: number, start: number, node: ProseMirrorNode}
  // Iterates over parent nodes, returning the closest table node.
  //
  // ```javascript
  // const table = findTable(selection);
  // ```
  var findTable = function findTable(selection) {
    return findParentNode(function (node) {
      return node.type.spec.tableRole && node.type.spec.tableRole === 'table';
    })(selection);
  };

  // :: (selection: Selection) → boolean
  // Checks if current selection is a `CellSelection`.
  //
  // ```javascript
  // if (isCellSelection(selection)) {
  //   // ...
  // }
  // ```
  var isCellSelection = function isCellSelection(selection) {
    return selection instanceof dist.CellSelection;
  };

  // :: (columnIndex: number) → (selection: Selection) → boolean
  // Checks if entire column at index `columnIndex` is selected.
  //
  // ```javascript
  // const className = isColumnSelected(i)(selection) ? 'selected' : '';
  // ```
  var isColumnSelected = function isColumnSelected(columnIndex) {
    return function (selection) {
      if (isCellSelection(selection)) {
        var $anchorCell = selection.$anchorCell,
            $headCell = selection.$headCell;

        var start = $anchorCell.start(-1);
        var map = dist.TableMap.get($anchorCell.node(-1));
        var anchor = map.colCount($anchorCell.pos - start);
        var head = map.colCount($headCell.pos - start);

        return selection.isColSelection() && columnIndex <= Math.max(anchor, head) && columnIndex >= Math.min(anchor, head);
      }

      return false;
    };
  };

  // :: (rowIndex: number) → (selection: Selection) → boolean
  // Checks if entire row at index `rowIndex` is selected.
  //
  // ```javascript
  // const className = isRowSelected(i)(selection) ? 'selected' : '';
  // ```
  var isRowSelected = function isRowSelected(rowIndex) {
    return function (selection) {
      if (isCellSelection(selection)) {
        var $anchorCell = selection.$anchorCell,
            $headCell = selection.$headCell;

        var anchor = $anchorCell.index(-1);
        var head = $headCell.index(-1);

        return selection.isRowSelection() && rowIndex <= Math.max(anchor, head) && rowIndex >= Math.min(anchor, head);
      }

      return false;
    };
  };

  // :: (selection: Selection) → boolean
  // Checks if entire table is selected
  //
  // ```javascript
  // const className = isTableSelected(selection) ? 'selected' : '';
  // ```
  var isTableSelected = function isTableSelected(selection) {
    if (isCellSelection(selection)) {
      return selection.isColSelection() && selection.isRowSelection();
    }

    return false;
  };

  // :: (columnIndex: number) → (selection: Selection) → ?[{pos: number, start: number, node: ProseMirrorNode}]
  // Returns an array of cells in a column at index `columnIndex`.
  //
  // ```javascript
  // const cells = getCellsInColumn(i)(selection); // [{node, pos}, {node, pos}]
  // ```
  var getCellsInColumn = function getCellsInColumn(columnIndex) {
    return function (selection) {
      var table = findTable(selection);
      if (table) {
        var map = dist.TableMap.get(table.node);
        if (columnIndex >= 0 && columnIndex <= map.width - 1) {
          var cells = map.cellsInRect({
            left: columnIndex,
            right: columnIndex + 1,
            top: 0,
            bottom: map.height
          });
          return cells.map(function (nodePos) {
            var node = table.node.nodeAt(nodePos);
            var pos = nodePos + table.start;
            return { pos: pos, start: pos + 1, node: node };
          });
        }
      }
    };
  };

  // :: (rowIndex: number) → (selection: Selection) → ?[{pos: number, start: number, node: ProseMirrorNode}]
  // Returns an array of cells in a row at index `rowIndex`.
  //
  // ```javascript
  // const cells = getCellsInRow(i)(selection); // [{node, pos}, {node, pos}]
  // ```
  var getCellsInRow = function getCellsInRow(rowIndex) {
    return function (selection) {
      var table = findTable(selection);
      if (table) {
        var map = dist.TableMap.get(table.node);
        if (rowIndex >= 0 && rowIndex <= map.height - 1) {
          var cells = map.cellsInRect({
            left: 0,
            right: map.width,
            top: rowIndex,
            bottom: rowIndex + 1
          });
          return cells.map(function (nodePos) {
            var node = table.node.nodeAt(nodePos);
            var pos = nodePos + table.start;
            return { pos: pos, start: pos + 1, node: node };
          });
        }
      }
    };
  };

  // :: (selection: Selection) → ?[{pos: number, start: number, node: ProseMirrorNode}]
  // Returns an array of all cells in a table.
  //
  // ```javascript
  // const cells = getCellsInTable(selection); // [{node, pos}, {node, pos}]
  // ```
  var getCellsInTable = function getCellsInTable(selection) {
    var table = findTable(selection);
    if (table) {
      var map = dist.TableMap.get(table.node);
      var cells = map.cellsInRect({
        left: 0,
        right: map.width,
        top: 0,
        bottom: map.height
      });
      return cells.map(function (nodePos) {
        var node = table.node.nodeAt(nodePos);
        var pos = nodePos + table.start;
        return { pos: pos, start: pos + 1, node: node };
      });
    }
  };

  // :: (columnIndex: number) → (tr: Transaction) → Transaction
  // Returns a new transaction that creates a `CellSelection` on a column at index `columnIndex`.
  //
  // ```javascript
  // dispatch(
  //   selectColumn(i)(state.tr)
  // );
  // ```
  var selectColumn = function selectColumn(columnIndex) {
    return function (tr) {
      var cells = getCellsInColumn(columnIndex)(tr.selection);
      if (cells) {
        var $anchor = tr.doc.resolve(cells[0].pos);
        var $head = tr.doc.resolve(cells[cells.length - 1].pos);
        return cloneTr(tr.setSelection(new dist.CellSelection($anchor, $head)));
      }
      return tr;
    };
  };

  // :: (rowIndex: number) → (tr: Transaction) → Transaction
  // Returns a new transaction that creates a `CellSelection` on a column at index `rowIndex`.
  //
  // ```javascript
  // dispatch(
  //   selectRow(i)(state.tr)
  // );
  // ```
  var selectRow = function selectRow(rowIndex) {
    return function (tr) {
      var cells = getCellsInRow(rowIndex)(tr.selection);
      if (cells) {
        var $anchor = tr.doc.resolve(cells[0].pos);
        var $head = tr.doc.resolve(cells[cells.length - 1].pos);
        return cloneTr(tr.setSelection(new dist.CellSelection($anchor, $head)));
      }
      return tr;
    };
  };

  // :: (selection: Selection) → (tr: Transaction) → Transaction
  // Returns a new transaction that creates a `CellSelection` on the entire table.
  //
  // ```javascript
  // dispatch(
  //   selectTable(i)(state.tr)
  // );
  // ```
  var selectTable = function selectTable(tr) {
    var cells = getCellsInTable(tr.selection);
    if (cells) {
      var $anchor = tr.doc.resolve(cells[0].pos);
      var $head = tr.doc.resolve(cells[cells.length - 1].pos);
      return cloneTr(tr.setSelection(new dist.CellSelection($anchor, $head)));
    }
    return tr;
  };

  // :: (cell: {pos: number, node: ProseMirrorNode}, schema: Schema) → (tr: Transaction) → Transaction
  // Returns a new transaction that clears the content of a given `cell`.
  //
  // ```javascript
  // const $pos = state.doc.resolve(13);
  // dispatch(
  //   emptyCell(findCellClosestToPos($pos), state.schema)(state.tr)
  // );
  // ```
  var emptyCell = function emptyCell(cell, schema) {
    return function (tr) {
      if (cell) {
        var content = tableNodeTypes(schema).cell.createAndFill().content;
        if (!cell.node.content.eq(content)) {
          tr.replaceWith(cell.pos, cell.pos + cell.node.nodeSize - 1, new index_es.Slice(content, 0, 0));
          return cloneTr(tr);
        }
      }
      return tr;
    };
  };

  // :: (columnIndex: number) → (tr: Transaction) → Transaction
  // Returns a new transaction that adds a new column at index `columnIndex`.
  //
  // ```javascript
  // dispatch(
  //   addColumnAt(i)(state.tr)
  // );
  // ```
  var addColumnAt = function addColumnAt(columnIndex) {
    return function (tr) {
      var table = findTable(tr.selection);
      if (table) {
        var map = dist.TableMap.get(table.node);
        if (columnIndex >= 0 && columnIndex <= map.width) {
          return cloneTr(dist.addColumn(tr, {
            map: map,
            tableStart: table.start,
            table: table.node
          }, columnIndex));
        }
      }
      return tr;
    };
  };

  // :: (rowIndex: number, clonePreviousRow?: boolean) → (tr: Transaction) → Transaction
  // Returns a new transaction that adds a new row at index `rowIndex`. Optionally clone the previous row.
  //
  // ```javascript
  // dispatch(
  //   addRowAt(i)(state.tr)
  // );
  // ```
  //
  // ```javascript
  // dispatch(
  //   addRowAt(i, true)(state.tr)
  // );
  // ```
  var addRowAt = function addRowAt(rowIndex, clonePreviousRow) {
    return function (tr) {
      var table = findTable(tr.selection);
      if (table) {
        var map = dist.TableMap.get(table.node);
        var cloneRowIndex = rowIndex - 1;

        if (clonePreviousRow && cloneRowIndex >= 0) {
          return cloneTr(cloneRowAt(cloneRowIndex)(tr));
        }

        if (rowIndex >= 0 && rowIndex <= map.height) {
          return cloneTr(dist.addRow(tr, {
            map: map,
            tableStart: table.start,
            table: table.node
          }, rowIndex));
        }
      }
      return tr;
    };
  };

  // :: (cloneRowIndex: number) → (tr: Transaction) → Transaction
  // Returns a new transaction that adds a new row after `cloneRowIndex`, cloning the row attributes at `cloneRowIndex`.
  //
  // ```javascript
  // dispatch(
  //   cloneRowAt(i)(state.tr)
  // );
  // ```
  var cloneRowAt = function cloneRowAt(rowIndex) {
    return function (tr) {
      var table = findTable(tr.selection);
      if (table) {
        var map = dist.TableMap.get(table.node);

        if (rowIndex >= 0 && rowIndex <= map.height) {
          var tableNode = table.node;
          var tableNodes = tableNodeTypes(tableNode.type.schema);

          var rowPos = table.start;
          for (var i = 0; i < rowIndex + 1; i++) {
            rowPos += tableNode.child(i).nodeSize;
          }

          var cloneRow = tableNode.child(rowIndex);
          // Re-create the same nodes with same attrs, dropping the node content.
          var cells = [];
          var rowWidth = 0;
          cloneRow.forEach(function (cell) {
            // If we're copying a row with rowspan somewhere, we dont want to copy that cell
            // We'll increment its span below.
            if (cell.attrs.rowspan === 1) {
              rowWidth += cell.attrs.colspan;
              cells.push(tableNodes[cell.type.spec.tableRole].createAndFill(cell.attrs, cell.marks));
            }
          });

          // If a higher row spans past our clone row, bump the higher row to cover this new row too.
          if (rowWidth < map.width) {
            var rowSpanCells = [];

            var _loop = function _loop(_i) {
              var foundCells = filterCellsInRow(_i, function (cell, tr) {
                var rowspan = cell.node.attrs.rowspan;
                var spanRange = _i + rowspan;
                return rowspan > 1 && spanRange > rowIndex;
              })(tr);
              rowSpanCells.push.apply(rowSpanCells, _toConsumableArray(foundCells));
            };

            for (var _i = rowIndex; _i >= 0; _i--) {
              _loop(_i);
            }

            if (rowSpanCells.length) {
              rowSpanCells.forEach(function (cell) {
                tr = setCellAttrs(cell, {
                  rowspan: cell.node.attrs.rowspan + 1
                })(tr);
              });
            }
          }

          return safeInsert(tableNodes.row.create(cloneRow.attrs, cells), rowPos)(tr);
        }
      }
      return tr;
    };
  };

  // :: (columnIndex: number) → (tr: Transaction) → Transaction
  // Returns a new transaction that removes a column at index `columnIndex`. If there is only one column left, it will remove the entire table.
  //
  // ```javascript
  // dispatch(
  //   removeColumnAt(i)(state.tr)
  // );
  // ```
  var removeColumnAt = function removeColumnAt(columnIndex) {
    return function (tr) {
      var table = findTable(tr.selection);
      if (table) {
        var map = dist.TableMap.get(table.node);
        if (columnIndex === 0 && map.width === 1) {
          return removeTable(tr);
        } else if (columnIndex >= 0 && columnIndex <= map.width) {
          dist.removeColumn(tr, {
            map: map,
            tableStart: table.start,
            table: table.node
          }, columnIndex);
          return cloneTr(tr);
        }
      }
      return tr;
    };
  };

  // :: (rowIndex: number) → (tr: Transaction) → Transaction
  // Returns a new transaction that removes a row at index `rowIndex`. If there is only one row left, it will remove the entire table.
  //
  // ```javascript
  // dispatch(
  //   removeRowAt(i)(state.tr)
  // );
  // ```
  var removeRowAt = function removeRowAt(rowIndex) {
    return function (tr) {
      var table = findTable(tr.selection);
      if (table) {
        var map = dist.TableMap.get(table.node);
        if (rowIndex === 0 && map.height === 1) {
          return removeTable(tr);
        } else if (rowIndex >= 0 && rowIndex <= map.height) {
          dist.removeRow(tr, {
            map: map,
            tableStart: table.start,
            table: table.node
          }, rowIndex);
          return cloneTr(tr);
        }
      }
      return tr;
    };
  };

  // :: (tr: Transaction) → Transaction
  // Returns a new transaction that removes a table node if the cursor is inside of it.
  //
  // ```javascript
  // dispatch(
  //   removeTable(state.tr)
  // );
  // ```
  var removeTable = function removeTable(tr) {
    var $from = tr.selection.$from;

    for (var depth = $from.depth; depth > 0; depth--) {
      var node = $from.node(depth);
      if (node.type.spec.tableRole === 'table') {
        return cloneTr(tr.delete($from.before(depth), $from.after(depth)));
      }
    }
    return tr;
  };

  // :: (tr: Transaction) → Transaction
  // Returns a new transaction that removes selected columns.
  //
  // ```javascript
  // dispatch(
  //   removeSelectedColumns(state.tr)
  // );
  // ```
  var removeSelectedColumns = function removeSelectedColumns(tr) {
    var _tr = tr,
        selection = _tr.selection;

    if (isTableSelected(selection)) {
      return removeTable(tr);
    }
    if (isCellSelection(selection)) {
      var table = findTable(selection);
      if (table) {
        var map = dist.TableMap.get(table.node);
        var rect = map.rectBetween(selection.$anchorCell.pos - table.start, selection.$headCell.pos - table.start);
        for (var i = rect.right - 1; i >= rect.left; i--) {
          tr = removeColumnAt(i)(tr);
        }
        return tr;
      }
    }
    return tr;
  };

  // :: (tr: Transaction) → Transaction
  // Returns a new transaction that removes selected rows.
  //
  // ```javascript
  // dispatch(
  //   removeSelectedRows(state.tr)
  // );
  // ```
  var removeSelectedRows = function removeSelectedRows(tr) {
    var _tr2 = tr,
        selection = _tr2.selection;

    if (isTableSelected(selection)) {
      return removeTable(tr);
    }
    if (isCellSelection(selection)) {
      var table = findTable(selection);
      if (table) {
        var map = dist.TableMap.get(table.node);
        var rect = map.rectBetween(selection.$anchorCell.pos - table.start, selection.$headCell.pos - table.start);
        for (var i = rect.bottom - 1; i >= rect.top; i--) {
          tr = removeRowAt(i)(tr);
        }
        return tr;
      }
    }
    return tr;
  };

  // :: ($pos: ResolvedPos) → (tr: Transaction) → Transaction
  // Returns a new transaction that removes a column closest to a given `$pos`.
  //
  // ```javascript
  // dispatch(
  //   removeColumnClosestToPos(state.doc.resolve(3))(state.tr)
  // );
  // ```
  var removeColumnClosestToPos = function removeColumnClosestToPos($pos) {
    return function (tr) {
      var rect = findCellRectClosestToPos($pos);
      if (rect) {
        return removeColumnAt(rect.left)(setTextSelection($pos.pos)(tr));
      }
      return tr;
    };
  };

  // :: ($pos: ResolvedPos) → (tr: Transaction) → Transaction
  // Returns a new transaction that removes a row closest to a given `$pos`.
  //
  // ```javascript
  // dispatch(
  //   removeRowClosestToPos(state.doc.resolve(3))(state.tr)
  // );
  // ```
  var removeRowClosestToPos = function removeRowClosestToPos($pos) {
    return function (tr) {
      var rect = findCellRectClosestToPos($pos);
      if (rect) {
        return removeRowAt(rect.top)(setTextSelection($pos.pos)(tr));
      }
      return tr;
    };
  };

  // :: (columnIndex: number, cellTransform: (cell: {pos: number, start: number, node: ProseMirrorNode}, tr: Transaction) → Transaction, setCursorToLastCell: ?boolean) → (tr: Transaction) → Transaction
  // Returns a new transaction that maps a given `cellTransform` function to each cell in a column at a given `columnIndex`.
  // It will set the selection into the last cell of the column if `setCursorToLastCell` param is set to `true`.
  //
  // ```javascript
  // dispatch(
  //   forEachCellInColumn(0, (cell, tr) => emptyCell(cell, state.schema)(tr))(state.tr)
  // );
  // ```
  var forEachCellInColumn = function forEachCellInColumn(columnIndex, cellTransform, setCursorToLastCell) {
    return function (tr) {
      var cells = getCellsInColumn(columnIndex)(tr.selection);
      if (cells) {
        for (var i = cells.length - 1; i >= 0; i--) {
          tr = cellTransform(cells[i], tr);
        }
        if (setCursorToLastCell) {
          var $pos = tr.doc.resolve(tr.mapping.map(cells[cells.length - 1].pos));
          tr.setSelection(index_es$2.Selection.near($pos));
        }
        return cloneTr(tr);
      }
      return tr;
    };
  };

  // :: (rowIndex: number, cellTransform: (cell: {pos: number, start: number, node: ProseMirrorNode}, tr: Transaction) → Transaction, setCursorToLastCell: ?boolean) → (tr: Transaction) → Transaction
  // Returns a new transaction that maps a given `cellTransform` function to each cell in a row at a given `rowIndex`.
  // It will set the selection into the last cell of the row if `setCursorToLastCell` param is set to `true`.
  //
  // ```javascript
  // dispatch(
  //   forEachCellInRow(0, (cell, tr) => setCellAttrs(cell, { background: 'red' })(tr))(state.tr)
  // );
  // ```
  var forEachCellInRow = function forEachCellInRow(rowIndex, cellTransform, setCursorToLastCell) {
    return function (tr) {
      var cells = getCellsInRow(rowIndex)(tr.selection);
      if (cells) {
        for (var i = cells.length - 1; i >= 0; i--) {
          tr = cellTransform(cells[i], tr);
        }
        if (setCursorToLastCell) {
          var $pos = tr.doc.resolve(tr.mapping.map(cells[cells.length - 1].pos));
          tr.setSelection(index_es$2.Selection.near($pos));
        }
      }
      return tr;
    };
  };

  // :: (cell: {pos: number, start: number, node: ProseMirrorNode}, attrs: Object) → (tr: Transaction) → Transaction
  // Returns a new transaction that sets given `attrs` to a given `cell`.
  //
  // ```javascript
  // dispatch(
  //   setCellAttrs(findCellClosestToPos($pos), { background: 'blue' })(tr);
  // );
  // ```
  var setCellAttrs = function setCellAttrs(cell, attrs) {
    return function (tr) {
      if (cell) {
        tr.setNodeMarkup(cell.pos, null, Object.assign({}, cell.node.attrs, attrs));
        return cloneTr(tr);
      }
      return tr;
    };
  };

  // :: (schema: Schema, rowsCount: ?number, colsCount: ?number, withHeaderRow: ?boolean) → Node
  // Returns a table node of a given size.
  // `withHeaderRow` defines whether the first row of the table will be a header row.
  //
  // ```javascript
  // const table = createTable(state.schema); // 3x3 table node
  // dispatch(
  //   tr.replaceSelectionWith(table).scrollIntoView()
  // );
  // ```
  var createTable = function createTable(schema) {
    var rowsCount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;
    var colsCount = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 3;
    var withHeaderRow = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

    var _tableNodeTypes = tableNodeTypes(schema),
        tableCell = _tableNodeTypes.cell,
        tableHeader = _tableNodeTypes.header_cell,
        tableRow = _tableNodeTypes.row,
        table = _tableNodeTypes.table;

    var cells = [];
    for (var i = 0; i < colsCount; i++) {
      cells.push(tableCell.createAndFill(null));
    }

    var headerCells = [];
    if (withHeaderRow) {
      for (var _i2 = 0; _i2 < colsCount; _i2++) {
        headerCells.push(tableHeader.createAndFill(null));
      }
    }

    var rows = [];
    for (var _i3 = 0; _i3 < rowsCount; _i3++) {
      rows.push(tableRow.createChecked(null, withHeaderRow && _i3 === 0 ? headerCells : cells));
    }

    return table.createChecked(null, rows);
  };

  // :: ($pos: ResolvedPos) → ?{pos: number, start: number, node: ProseMirrorNode}
  // Iterates over parent nodes, returning a table cell or a table header node closest to a given `$pos`.
  //
  // ```javascript
  // const cell = findCellClosestToPos(state.selection.$from);
  // ```
  var findCellClosestToPos = function findCellClosestToPos($pos) {
    var predicate = function predicate(node) {
      return node.type.spec.tableRole && /cell/i.test(node.type.spec.tableRole);
    };
    return findParentNodeClosestToPos($pos, predicate);
  };

  // :: ($pos: ResolvedPos) → ?{left: number, top: number, right: number, bottom: number}
  // Returns the rectangle spanning a cell closest to a given `$pos`.
  //
  // ```javascript
  // dispatch(
  //   findCellRectClosestToPos(state.selection.$from)
  // );
  // ```
  var findCellRectClosestToPos = function findCellRectClosestToPos($pos) {
    var cell = findCellClosestToPos($pos);
    if (cell) {
      var table = findTableClosestToPos($pos);
      var map = dist.TableMap.get(table.node);
      var cellPos = cell.pos - table.start;
      return map.rectBetween(cellPos, cellPos);
    }
  };

  var filterCellsInRow = function filterCellsInRow(rowIndex, predicate) {
    return function (tr) {
      var foundCells = [];
      var cells = getCellsInRow(rowIndex)(tr.selection);
      if (cells) {
        for (var j = cells.length - 1; j >= 0; j--) {
          if (predicate(cells[j], tr)) {
            foundCells.push(cells[j]);
          }
        }
      }

      return foundCells;
    };
  };

  exports.isNodeSelection = isNodeSelection;
  exports.canInsert = canInsert;
  exports.findParentNode = findParentNode;
  exports.findParentNodeClosestToPos = findParentNodeClosestToPos;
  exports.findParentDomRef = findParentDomRef;
  exports.hasParentNode = hasParentNode;
  exports.findParentNodeOfType = findParentNodeOfType;
  exports.findParentNodeOfTypeClosestToPos = findParentNodeOfTypeClosestToPos;
  exports.hasParentNodeOfType = hasParentNodeOfType;
  exports.findParentDomRefOfType = findParentDomRefOfType;
  exports.findSelectedNodeOfType = findSelectedNodeOfType;
  exports.findPositionOfNodeBefore = findPositionOfNodeBefore;
  exports.findDomRefAtPos = findDomRefAtPos;
  exports.flatten = flatten;
  exports.findChildren = findChildren;
  exports.findTextNodes = findTextNodes;
  exports.findInlineNodes = findInlineNodes;
  exports.findBlockNodes = findBlockNodes;
  exports.findChildrenByAttr = findChildrenByAttr;
  exports.findChildrenByType = findChildrenByType;
  exports.findChildrenByMark = findChildrenByMark;
  exports.contains = contains;
  exports.findTable = findTable;
  exports.isCellSelection = isCellSelection;
  exports.isColumnSelected = isColumnSelected;
  exports.isRowSelected = isRowSelected;
  exports.isTableSelected = isTableSelected;
  exports.getCellsInColumn = getCellsInColumn;
  exports.getCellsInRow = getCellsInRow;
  exports.getCellsInTable = getCellsInTable;
  exports.selectColumn = selectColumn;
  exports.selectRow = selectRow;
  exports.selectTable = selectTable;
  exports.emptyCell = emptyCell;
  exports.addColumnAt = addColumnAt;
  exports.addRowAt = addRowAt;
  exports.cloneRowAt = cloneRowAt;
  exports.removeColumnAt = removeColumnAt;
  exports.removeRowAt = removeRowAt;
  exports.removeTable = removeTable;
  exports.removeSelectedColumns = removeSelectedColumns;
  exports.removeSelectedRows = removeSelectedRows;
  exports.removeColumnClosestToPos = removeColumnClosestToPos;
  exports.removeRowClosestToPos = removeRowClosestToPos;
  exports.forEachCellInColumn = forEachCellInColumn;
  exports.forEachCellInRow = forEachCellInRow;
  exports.setCellAttrs = setCellAttrs;
  exports.createTable = createTable;
  exports.findCellClosestToPos = findCellClosestToPos;
  exports.findCellRectClosestToPos = findCellRectClosestToPos;
  exports.removeParentNodeOfType = removeParentNodeOfType;
  exports.replaceParentNodeOfType = replaceParentNodeOfType;
  exports.removeSelectedNode = removeSelectedNode;
  exports.replaceSelectedNode = replaceSelectedNode;
  exports.setTextSelection = setTextSelection;
  exports.safeInsert = safeInsert;
  exports.setParentNodeMarkup = setParentNodeMarkup;
  exports.selectParentNodeOfType = selectParentNodeOfType;
  exports.removeNodeBefore = removeNodeBefore;

  });

  unwrapExports(dist$1);
  var dist_1$1 = dist$1.isNodeSelection;
  var dist_2$1 = dist$1.canInsert;
  var dist_3$1 = dist$1.findParentNode;
  var dist_4$1 = dist$1.findParentNodeClosestToPos;
  var dist_5$1 = dist$1.findParentDomRef;
  var dist_6$1 = dist$1.hasParentNode;
  var dist_7$1 = dist$1.findParentNodeOfType;
  var dist_8$1 = dist$1.findParentNodeOfTypeClosestToPos;
  var dist_9$1 = dist$1.hasParentNodeOfType;
  var dist_10$1 = dist$1.findParentDomRefOfType;
  var dist_11$1 = dist$1.findSelectedNodeOfType;
  var dist_12$1 = dist$1.findPositionOfNodeBefore;
  var dist_13$1 = dist$1.findDomRefAtPos;
  var dist_14$1 = dist$1.flatten;
  var dist_15$1 = dist$1.findChildren;
  var dist_16$1 = dist$1.findTextNodes;
  var dist_17$1 = dist$1.findInlineNodes;
  var dist_18$1 = dist$1.findBlockNodes;
  var dist_19$1 = dist$1.findChildrenByAttr;
  var dist_20$1 = dist$1.findChildrenByType;
  var dist_21$1 = dist$1.findChildrenByMark;
  var dist_22$1 = dist$1.contains;
  var dist_23$1 = dist$1.findTable;
  var dist_24$1 = dist$1.isCellSelection;
  var dist_25$1 = dist$1.isColumnSelected;
  var dist_26$1 = dist$1.isRowSelected;
  var dist_27$1 = dist$1.isTableSelected;
  var dist_28$1 = dist$1.getCellsInColumn;
  var dist_29$1 = dist$1.getCellsInRow;
  var dist_30$1 = dist$1.getCellsInTable;
  var dist_31$1 = dist$1.selectColumn;
  var dist_32$1 = dist$1.selectRow;
  var dist_33$1 = dist$1.selectTable;
  var dist_34$1 = dist$1.emptyCell;
  var dist_35$1 = dist$1.addColumnAt;
  var dist_36$1 = dist$1.addRowAt;
  var dist_37$1 = dist$1.cloneRowAt;
  var dist_38$1 = dist$1.removeColumnAt;
  var dist_39 = dist$1.removeRowAt;
  var dist_40 = dist$1.removeTable;
  var dist_41 = dist$1.removeSelectedColumns;
  var dist_42 = dist$1.removeSelectedRows;
  var dist_43 = dist$1.removeColumnClosestToPos;
  var dist_44 = dist$1.removeRowClosestToPos;
  var dist_45 = dist$1.forEachCellInColumn;
  var dist_46 = dist$1.forEachCellInRow;
  var dist_47 = dist$1.setCellAttrs;
  var dist_48 = dist$1.createTable;
  var dist_49 = dist$1.findCellClosestToPos;
  var dist_50 = dist$1.findCellRectClosestToPos;
  var dist_51 = dist$1.removeParentNodeOfType;
  var dist_52 = dist$1.replaceParentNodeOfType;
  var dist_53 = dist$1.removeSelectedNode;
  var dist_54 = dist$1.replaceSelectedNode;
  var dist_55 = dist$1.setTextSelection;
  var dist_56 = dist$1.safeInsert;
  var dist_57 = dist$1.setParentNodeMarkup;
  var dist_58 = dist$1.selectParentNodeOfType;
  var dist_59 = dist$1.removeNodeBefore;

  const findOverlappingRangeIndex = (range, ranges) => {
      return ranges.findIndex(localRange => (localRange.from <= range.from && localRange.to >= range.from) ||
          (localRange.to >= range.to && localRange.from <= range.to) ||
          (localRange.from >= range.from && localRange.to <= range.to));
  };
  const mapAndMergeRanges = (ranges, mapping) => mergeRanges(mapRanges$1(ranges, mapping));
  const mapRanges$1 = (ranges, mapping) => ranges.map(range => (Object.assign(Object.assign({}, range), { from: mapping.map(range.from), to: mapping.map(range.to) })));
  const removeOverlappingRanges = (firstRanges, secondRanges, predicate) => {
      return firstRanges.reduce((acc, range) => (predicate && predicate(range)) ||
          findOverlappingRangeIndex(range, secondRanges) === -1
          ? acc.concat(range)
          : acc, []);
  };
  const mergeRange = (range1, range2) => (Object.assign(Object.assign({}, range1), { from: range1.from < range2.from ? range1.from : range2.from, to: range1.to > range2.to ? range1.to : range2.to }));
  const mergeRanges = (ranges) => ranges.reduce((acc, range) => {
      const index = findOverlappingRangeIndex(range, acc);
      if (index === -1) {
          return acc.concat(range);
      }
      const newRange = acc.slice();
      newRange.splice(index, 1, mergeRange(range, acc[index]));
      return newRange;
  }, []);
  const blockToRange = (input) => ({
      from: input.from,
      to: input.to
  });
  const expandRangeToParentBlockNode = (range, doc) => {
      try {
          const $fromPos = doc.resolve(range.from);
          const $toPos = doc.resolve(range.to);
          const parentNode = dist_3$1(node => node.isBlock)(new TextSelection($fromPos, $toPos));
          if (!parentNode) {
              return undefined;
          }
          return {
              from: parentNode.start,
              to: parentNode.start + parentNode.node.textContent.length
          };
      }
      catch (e) {
          return undefined;
      }
  };
  const getRangesOfParentBlockNodes = (ranges, doc) => {
      const matchRanges = ranges.reduce((acc, range) => {
          const expandedRange = expandRangeToParentBlockNode({ from: range.from, to: range.to }, doc);
          return acc.concat(expandedRange
              ? [
                  {
                      from: expandedRange.from,
                      to: clamp_1(expandedRange.to, doc.content.size)
                  }
              ]
              : []);
      }, []);
      return mergeRanges(matchRanges);
  };
  const expandRangesToParentBlockNode = (ranges, doc) => getRangesOfParentBlockNodes(ranges, doc);

  const createBlock = (doc, range, time = 0) => {
      const text = doc.textBetween(range.from, range.to, undefined, "\n");
      return Object.assign(Object.assign({ text }, range), { id: createBlockId(time, range.from, range.to) });
  };
  const createBlockId = (time, from, to) => `${time}-from:${from}-to:${to}`;

  const flatten$1 = (node, descend = true) => {
      const result = [];
      node.descendants((child, pos, parent) => {
          result.push({ node: child, parent, pos });
          if (!descend) {
              return false;
          }
      });
      return result;
  };
  const findChildren = (node, predicate, descend) => {
      return flatten$1(node, descend).filter(child => predicate(child.node));
  };
  const getBlocksFromDocument = (doc, time = 0) => {
      const ranges = [];
      doc.descendants((descNode, pos) => {
          if (!findChildren(descNode, _ => _.type.isBlock, false).length) {
              ranges.push(createBlock(doc, {
                  from: pos + 1,
                  to: pos + descNode.nodeSize
              }, time));
              return false;
          }
      });
      return ranges;
  };
  const getReplaceStepRangesFromTransaction = (tr) => getReplaceTransactions(tr).map((step) => {
      return {
          from: step.from,
          to: step.to
      };
  });
  const getReplaceTransactions = (tr) => tr.steps.filter(step => step instanceof ReplaceStep || step instanceof ReplaceAroundStep);

  const selectMatchByMatchId = (state, matchId) => state.currentMatches.find(match => match.matchId === matchId);
  const selectBlockQueriesInFlightForSet = (state, requestId) => {
      return state.requestsInFlight[requestId];
  };
  const selectSingleBlockInFlightById = (state, requestId, blockId) => {
      const blocksInFlight = selectBlockQueriesInFlightForSet(state, requestId);
      if (!blocksInFlight) {
          return;
      }
      return blocksInFlight.pendingBlocks.find(_ => _.block.id === blockId);
  };
  const selectBlockQueriesInFlightById = (state, requestId, blockIds) => blockIds
      .map(blockId => selectSingleBlockInFlightById(state, requestId, blockId))
      .filter(_ => !!_);
  const selectAllBlockQueriesInFlight = (state) => Object.values(state.requestsInFlight).reduce((acc, value) => acc.concat(value.pendingBlocks), []);
  const selectNewBlockInFlight = (oldState, newState) => Object.keys(newState.requestsInFlight).reduce((acc, requestId) => !oldState.requestsInFlight[requestId]
      ? acc.concat(Object.assign({ requestId }, selectBlockQueriesInFlightForSet(newState, requestId)))
      : acc, []);
  const selectPercentRemaining = (state) => {
      const [totalWork, totalRemainingWork] = Object.values(state.requestsInFlight).reduce(([totalWorkAcc, remainingWorkAcc], queryState) => {
          const allWork = queryState.totalBlocks * queryState.categoryIds.length;
          const remainingWork = queryState.pendingBlocks.reduce((acc, block) => acc + block.pendingCategoryIds.length, 0);
          return [totalWorkAcc + allWork, remainingWorkAcc + remainingWork];
      }, [0, 0]);
      return totalRemainingWork ? (totalRemainingWork / totalWork) * 100 : 0;
  };
  const selectAllAutoFixableMatches = (state) => state.currentMatches.filter(_ => _.replacement && _.replacement.text === _.message);

  const PROSEMIRROR_TYPERIGHTER_ACTION = "PROSEMIRROR_TYPERIGHTER_ACTION";
  const createInitialState = (doc, matches = []) => ({
      debug: false,
      requestMatchesOnDocModified: false,
      decorations: DecorationSet.create(doc, []),
      dirtiedRanges: [],
      currentMatches: matches,
      selectedMatch: undefined,
      hoverId: undefined,
      hoverInfo: undefined,
      requestsInFlight: {},
      requestPending: false,
      error: undefined
  });
  const createReducer = (expandRanges) => {
      const handleMatchesRequestForDirtyRanges = createHandleMatchesRequestForDirtyRanges(expandRanges);
      return (tr, incomingState, action) => {
          const state = tr.docChanged
              ? getNewStateFromTransaction(tr, incomingState)
              : incomingState;
          if (!action) {
              return state;
          }
          switch (action.type) {
              case NEW_HOVER_ID:
                  return handleNewHoverId(tr, state, action);
              case REQUEST_FOR_DIRTY_RANGES:
                  return handleMatchesRequestForDirtyRanges(tr, state, action);
              case REQUEST_FOR_DOCUMENT:
                  return handleMatchesRequestForDocument(tr, state, action);
              case REQUEST_SUCCESS:
                  return handleMatchesRequestSuccess(tr, state, action);
              case REQUEST_ERROR:
                  return handleMatchesRequestError(tr, state, action);
              case REQUEST_COMPLETE:
                  return handleRequestComplete(tr, state, action);
              case SELECT_MATCH:
                  return handleSelectMatch(tr, state, action);
              case APPLY_NEW_DIRTY_RANGES:
                  return handleNewDirtyRanges(tr, state, action);
              case SET_DEBUG_STATE:
                  return handleSetDebugState(tr, state, action);
              case SET_REQUEST_MATCHES_ON_DOC_MODIFIED:
                  return handleSetRequestOnDocModifiedState(tr, state, action);
              default:
                  return state;
          }
      };
  };
  const getNewStateFromTransaction = (tr, incomingState) => {
      const mappedRequestsInFlight = Object.entries(incomingState.requestsInFlight).reduce((acc, [requestId, requestsInFlight]) => {
          const mapping = new Mapping();
          mapping.appendMapping(requestsInFlight.mapping);
          mapping.appendMapping(tr.mapping);
          return Object.assign(Object.assign({}, acc), { [requestId]: Object.assign(Object.assign({}, requestsInFlight), { mapping }) });
      }, {});
      return Object.assign(Object.assign({}, incomingState), { decorations: incomingState.decorations.map(tr.mapping, tr.doc), dirtiedRanges: mapAndMergeRanges(incomingState.dirtiedRanges, tr.mapping), currentMatches: mapRanges$1(incomingState.currentMatches, tr.mapping), requestsInFlight: mappedRequestsInFlight });
  };
  const handleSelectMatch = (_, state, action) => {
      return Object.assign(Object.assign({}, state), { selectedMatch: action.payload.matchId });
  };
  const handleNewHoverId = (tr, state, action) => {
      let decorations = state.decorations;
      const incomingHoverId = action.payload.matchId;
      const currentHoverId = state.hoverId;
      const currentHoverDecorations = decorations.find(undefined, undefined, spec => (spec.id === currentHoverId || spec.id === incomingHoverId) &&
          spec.type === DECORATION_MATCH);
      decorations = decorations.remove(currentHoverDecorations);
      const decorationData = [{ id: incomingHoverId, isSelected: true }];
      if (incomingHoverId !== currentHoverId) {
          decorationData.push({ id: currentHoverId, isSelected: false });
      }
      decorations = decorationData.reduce((acc, hoverData) => {
          const output = selectMatchByMatchId(state, hoverData.id || "");
          if (!output) {
              return acc;
          }
          return decorations.add(tr.doc, createDecorationsForMatch(output, hoverData.isSelected, false));
      }, decorations);
      return Object.assign(Object.assign({}, state), { decorations, hoverId: action.payload.matchId, hoverInfo: action.payload.hoverInfo });
  };
  const handleNewDirtyRanges = (tr, state, { payload: { ranges: dirtiedRanges } }) => {
      let newDecorations = state.debug
          ? state.decorations.add(tr.doc, dirtiedRanges.map(range => createDebugDecorationFromRange(range)))
          : state.decorations;
      newDecorations = removeDecorationsFromRanges(newDecorations, dirtiedRanges);
      const currentMatches = state.currentMatches.filter(output => findOverlappingRangeIndex(output, dirtiedRanges) === -1);
      return Object.assign(Object.assign({}, state), { currentMatches, decorations: newDecorations, requestPending: state.requestMatchesOnDocModified ? true : false, dirtiedRanges: state.requestMatchesOnDocModified
              ? state.dirtiedRanges.concat(dirtiedRanges)
              : [] });
  };
  const createHandleMatchesRequestForDirtyRanges = (expandRanges) => (tr, state, { payload: { requestId, categoryIds } }) => {
      const ranges = expandRanges(state.dirtiedRanges, tr.doc);
      const blocks = ranges.map(range => createBlock(tr.doc, range, tr.time));
      return handleRequestStart(requestId, blocks, categoryIds)(tr, state);
  };
  const handleMatchesRequestForDocument = (tr, state, { payload: { requestId, categoryIds } }) => {
      return handleRequestStart(requestId, getBlocksFromDocument(tr.doc, tr.time), categoryIds)(tr, state);
  };
  const handleRequestStart = (requestId, blocks, categoryIds) => (tr, state) => {
      const decorations = state.debug
          ? removeDecorationsFromRanges(state.decorations, blocks, [
              DECORATION_DIRTY
          ]).add(tr.doc, blocks.map(range => createDebugDecorationFromRange(range, false)))
          : state.decorations;
      const newBlockQueriesInFlight = blocks.map(block => ({
          block,
          pendingCategoryIds: categoryIds
      }));
      return Object.assign(Object.assign({}, state), { decorations, dirtiedRanges: [], requestPending: false, requestsInFlight: Object.assign(Object.assign({}, state.requestsInFlight), { [requestId]: {
                  totalBlocks: newBlockQueriesInFlight.length,
                  pendingBlocks: newBlockQueriesInFlight,
                  mapping: tr.mapping,
                  categoryIds
              } }) });
  };
  const amendBlockQueriesInFlight = (state, requestId, blockId, categoryIds) => {
      const currentBlockQueriesInFlight = selectBlockQueriesInFlightForSet(state, requestId);
      if (!currentBlockQueriesInFlight) {
          return state.requestsInFlight;
      }
      const newBlockQueriesInFlight = Object.assign(Object.assign({}, currentBlockQueriesInFlight), { pendingBlocks: currentBlockQueriesInFlight.pendingBlocks.reduce((acc, blockInFlight) => {
              if (blockInFlight.block.id !== blockId) {
                  return acc.concat(blockInFlight);
              }
              const newBlockInFlight = Object.assign(Object.assign({}, blockInFlight), { pendingCategoryIds: blockInFlight.pendingCategoryIds.filter(id => !categoryIds.includes(id)) });
              return newBlockInFlight.pendingCategoryIds.length
                  ? acc.concat(newBlockInFlight)
                  : acc;
          }, []) });
      if (!newBlockQueriesInFlight.pendingBlocks.length) {
          return omit_1(state.requestsInFlight, requestId);
      }
      return Object.assign(Object.assign({}, state.requestsInFlight), { [requestId]: newBlockQueriesInFlight });
  };
  const handleMatchesRequestSuccess = (tr, state, { payload: { response } }) => {
      if (!response) {
          return state;
      }
      const requestsInFlight = selectBlockQueriesInFlightById(state, response.requestId, response.blocks.map(_ => _.id));
      if (!requestsInFlight.length) {
          return state;
      }
      let currentMatches = removeOverlappingRanges(state.currentMatches, requestsInFlight.map(_ => _.block), match => !response.categoryIds.includes(match.category.id));
      const decsToRemove = requestsInFlight.reduce((acc, blockInFlight) => acc.concat(state.decorations
          .find(blockInFlight.block.from, blockInFlight.block.to, spec => response.categoryIds.includes(spec.categoryId))
          .concat(state.debug
          ?
              state.decorations.find(undefined, undefined, _ => _.type === DECORATION_INFLIGHT)
          : [])), []);
      currentMatches = currentMatches.concat(mapRanges$1(response.matches, selectBlockQueriesInFlightForSet(state, response.requestId).mapping));
      currentMatches = removeOverlappingRanges(currentMatches, state.dirtiedRanges);
      const newDecorations = createDecorationsForMatches(response.matches);
      const newBlockQueriesInFlight = requestsInFlight.reduce((acc, blockInFlight) => amendBlockQueriesInFlight(Object.assign(Object.assign({}, state), { requestsInFlight: acc }), response.requestId, blockInFlight.block.id, response.categoryIds), state.requestsInFlight);
      return Object.assign(Object.assign({}, state), { requestsInFlight: newBlockQueriesInFlight, currentMatches, decorations: state.decorations
              .remove(decsToRemove)
              .add(tr.doc, newDecorations) });
  };
  const handleMatchesRequestError = (tr, state, { payload: { matchRequestError: { requestId, blockId, message } } }) => {
      if (!blockId) {
          return Object.assign(Object.assign({}, state), { message });
      }
      const requestsInFlight = selectBlockQueriesInFlightForSet(state, requestId);
      if (!requestsInFlight) {
          return state;
      }
      const blockInFlight = selectSingleBlockInFlightById(state, requestId, blockId);
      if (!blockInFlight) {
          return Object.assign(Object.assign({}, state), { message });
      }
      const dirtiedRanges = blockInFlight
          ? mapRanges$1([blockToRange(blockInFlight.block)], requestsInFlight.mapping)
          : [];
      const decsToRemove = dirtiedRanges.reduce((acc, range) => acc.concat(state.decorations.find(range.from, range.to, _ => _.type === DECORATION_INFLIGHT)), []);
      let decorations = state.decorations.remove(decsToRemove);
      if (dirtiedRanges.length && state.debug) {
          decorations = decorations.add(tr.doc, dirtiedRanges.map(range => createDebugDecorationFromRange(range)));
      }
      return Object.assign(Object.assign({}, state), { dirtiedRanges: dirtiedRanges.length
              ? mergeRanges(state.dirtiedRanges.concat(dirtiedRanges))
              : state.dirtiedRanges, decorations, requestsInFlight: amendBlockQueriesInFlight(state, requestId, blockId, []), error: message });
  };
  const handleRequestComplete = (_, state, { payload: { requestId } }) => {
      const requestInFlight = selectBlockQueriesInFlightForSet(state, requestId);
      const hasUnfinishedWork = requestInFlight &&
          requestInFlight.pendingBlocks.some(block => block.pendingCategoryIds.length);
      if (requestInFlight && hasUnfinishedWork) {
          console.warn(`Request ${requestId} was marked as complete, but there is still work remaining.`, requestInFlight.pendingBlocks);
      }
      return Object.assign(Object.assign({}, state), { requestsInFlight: omit_1(state.requestsInFlight, requestId) });
  };
  const handleSetDebugState = (_, state, { payload: { debug } }) => {
      return Object.assign(Object.assign({}, state), { debug });
  };
  const handleSetRequestOnDocModifiedState = (_, state, { payload: { requestMatchesOnDocModified } }) => {
      return Object.assign(Object.assign({}, state), { requestMatchesOnDocModified });
  };

  function getStateHoverInfoFromEvent(event, containerElement, heightMarkerElement) {
      if (!event.target ||
          !(event.target instanceof HTMLElement) ||
          !containerElement ||
          !(containerElement instanceof HTMLElement) ||
          !heightMarkerElement ||
          !(heightMarkerElement instanceof HTMLElement)) {
          return;
      }
      const { left: containerLeft, top: containerTop } = containerElement.getBoundingClientRect();
      const mouseOffsetX = event.clientX;
      const mouseOffsetY = event.clientY;
      const { offsetLeft, offsetTop, offsetHeight: height } = event.target;
      return {
          containerLeft,
          containerTop,
          offsetLeft,
          offsetTop,
          height,
          mouseClientX: mouseOffsetX,
          mouseClientY: mouseOffsetY,
          markerClientRects: event.target.getClientRects()
      };
  }

  const STORE_EVENT_NEW_MATCHES = "STORE_EVENT_NEW_MATCHES";
  const STORE_EVENT_NEW_STATE = "STORE_EVENT_NEW_STATE";
  const STORE_EVENT_NEW_DIRTIED_RANGES = "STORE_EVENT_DOCUMENT_DIRTIED";
  class Store {
      constructor() {
          this.subscribers = {
              [STORE_EVENT_NEW_STATE]: [],
              [STORE_EVENT_NEW_MATCHES]: [],
              [STORE_EVENT_NEW_DIRTIED_RANGES]: []
          };
          this.on("STORE_EVENT_NEW_STATE", _ => this.updateState(_));
      }
      emit(eventName, ...args) {
          this.subscribers[eventName].forEach((_) => _(...args));
      }
      removeEventListener(eventName, listener) {
          const index = this.subscribers[eventName].indexOf(listener);
          if (index === -1) {
              throw new Error(`[Store]: Attempted to unsubscribe, but no subscriber found for event ${eventName}`);
          }
          this.subscribers[eventName].splice(index, 1);
      }
      on(eventName, listener) {
          this.subscribers[eventName].push(listener);
      }
      getState() {
          return this.state;
      }
      updateState(state) {
          this.state = state;
      }
  }

  const compact = (value) => !!value;

  const requestMatchesForDocumentCommand = (requestId, categoryIds) => (state, dispatch) => {
      if (dispatch) {
          dispatch(state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, requestMatchesForDocument(requestId, categoryIds)));
      }
      return true;
  };
  const requestMatchesForDirtyRangesCommand = (requestId, categoryIds) => (state, dispatch) => {
      if (dispatch) {
          dispatch(state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, requestMatchesForDirtyRanges(requestId, categoryIds)));
      }
      return true;
  };
  const indicateHoverCommand = (matchId, hoverInfo) => (state, dispatch) => {
      if (dispatch) {
          dispatch(state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, newHoverIdReceived(matchId, hoverInfo)));
      }
      return true;
  };
  const stopHoverCommand = () => (state, dispatch) => {
      if (dispatch) {
          dispatch(state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, newHoverIdReceived(undefined, undefined)));
      }
      return true;
  };
  const selectMatchCommand = (matchId, getState) => (state, dispatch) => {
      const pluginState = getState(state);
      const output = selectMatchByMatchId(pluginState, matchId);
      if (!output) {
          return false;
      }
      if (dispatch) {
          dispatch(state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, selectMatch(matchId)));
      }
      return true;
  };
  const setDebugStateCommand = (debug) => (state, dispatch) => {
      if (dispatch) {
          dispatch(state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, setDebugState(debug)));
      }
      return true;
  };
  const setRequestOnDocModifiedState = (requestMatchesOnDocModified) => (state, dispatch) => {
      if (dispatch) {
          dispatch(state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, setRequestMatchesOnDocModified(requestMatchesOnDocModified)));
      }
      return true;
  };
  const applyMatcherResponseCommand = (matcherResponse) => (state, dispatch) => {
      if (dispatch) {
          dispatch(state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, requestMatchesSuccess(matcherResponse)));
      }
      return true;
  };
  const applyRequestErrorCommand = (matchRequestError) => (state, dispatch) => {
      if (dispatch) {
          dispatch(state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, requestError(matchRequestError)));
      }
      return true;
  };
  const applyRequestCompleteCommand = (requestId) => (state, dispatch) => {
      if (dispatch) {
          dispatch(state.tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, requestMatchesComplete(requestId)));
      }
      return true;
  };
  const applySuggestionsCommand = (suggestionOptions, getState) => (state, dispatch) => {
      const pluginState = getState(state);
      const suggestionsToApply = suggestionOptions
          .map(opt => {
          const maybeMatch = selectMatchByMatchId(pluginState, opt.matchId);
          return maybeMatch
              ? {
                  from: maybeMatch.from,
                  to: maybeMatch.to,
                  text: opt.text
              }
              : undefined;
      })
          .filter(compact);
      return maybeApplySuggestions(suggestionsToApply, state, dispatch);
  };
  const applyAutoFixableSuggestionsCommand = (getState) => (state, dispatch) => {
      const pluginState = getState(state);
      const suggestionsToApply = selectAllAutoFixableMatches(pluginState).map(output => ({
          from: output.from,
          to: output.to,
          text: output.suggestions && output.suggestions.length
              ? output.suggestions[0].text
              : undefined
      }));
      return maybeApplySuggestions(suggestionsToApply, state, dispatch);
  };
  const maybeApplySuggestions = (suggestionsToApply, state, dispatch) => {
      if (!suggestionsToApply.length) {
          return false;
      }
      if (dispatch) {
          const tr = state.tr;
          suggestionsToApply.forEach(({ from, to, text }) => text &&
              tr.replaceWith(tr.mapping.map(from), tr.mapping.map(to), state.schema.text(text)));
          dispatch(tr);
      }
      return true;
  };
  const createBoundCommands = (view, getState) => {
      const bindCommand = (action) => (...args) => action(...args)(view.state, view.dispatch);
      return {
          applySuggestions: (suggestionOpts) => applySuggestionsCommand(suggestionOpts, getState)(view.state, view.dispatch),
          selectMatch: (blockId) => selectMatchCommand(blockId, getState)(view.state, view.dispatch),
          applyAutoFixableSuggestions: () => applyAutoFixableSuggestionsCommand(getState)(view.state, view.dispatch),
          requestMatchesForDocument: bindCommand(requestMatchesForDocumentCommand),
          requestMatchesForDirtyRanges: bindCommand(requestMatchesForDirtyRangesCommand),
          indicateHover: bindCommand(indicateHoverCommand),
          stopHover: bindCommand(stopHoverCommand),
          setDebugState: bindCommand(setDebugStateCommand),
          setRequestOnDocModified: bindCommand(setRequestOnDocModifiedState),
          applyMatcherResponse: bindCommand(applyMatcherResponseCommand),
          applyRequestError: bindCommand(applyRequestErrorCommand),
          applyRequestComplete: bindCommand(applyRequestCompleteCommand)
      };
  };

  const createTyperighterPlugin = (options = {}) => {
      const { expandRanges = expandRangesToParentBlockNode, matches = [] } = options;
      const store = new Store();
      const reducer = createReducer(expandRanges);
      const plugin = new Plugin({
          key: new PluginKey("prosemirror-typerighter"),
          state: {
              init: (_, { doc }) => createInitialState(doc, matches),
              apply(tr, state) {
                  return reducer(tr, state, tr.getMeta(PROSEMIRROR_TYPERIGHTER_ACTION));
              }
          },
          appendTransaction(trs, oldState, newState) {
              const oldPluginState = plugin.getState(oldState);
              const newPluginState = plugin.getState(newState);
              const tr = newState.tr;
              const newDirtiedRanges = trs.reduce((acc, range) => acc.concat(getReplaceStepRangesFromTransaction(range)), []);
              if (newDirtiedRanges.length) {
                  if (newPluginState.requestMatchesOnDocModified) {
                      setTimeout(() => store.emit(STORE_EVENT_NEW_DIRTIED_RANGES));
                  }
                  return tr.setMeta(PROSEMIRROR_TYPERIGHTER_ACTION, applyNewDirtiedRanges(newDirtiedRanges));
              }
              const blockStates = selectNewBlockInFlight(oldPluginState, newPluginState);
              blockStates.forEach(({ requestId, pendingBlocks }) => store.emit(STORE_EVENT_NEW_MATCHES, requestId, pendingBlocks.map(_ => _.block)));
          },
          props: {
              decorations: state => {
                  return plugin.getState(state).decorations;
              },
              handleDOMEvents: {
                  mouseover: (view, event) => {
                      if (!event.target || !(event.target instanceof HTMLElement)) {
                          return false;
                      }
                      const target = event.target;
                      const targetAttr = target.getAttribute(DECORATION_ATTRIBUTE_ID);
                      const newMatchId = targetAttr ? targetAttr : undefined;
                      if (newMatchId === plugin.getState(view.state).hoverId) {
                          return false;
                      }
                      const matchDecoration = document.querySelector(`[${DECORATION_ATTRIBUTE_ID}="${newMatchId}"]`);
                      if (newMatchId &&
                          (!matchDecoration || !(matchDecoration instanceof HTMLElement))) {
                          console.warn(`No height marker found for id ${newMatchId}, or the returned marker is not an HTML element. This is odd - a height marker should be present. It's probably a bug.`);
                          return false;
                      }
                      const hoverInfo = getStateHoverInfoFromEvent(event, view.dom, matchDecoration);
                      if (newMatchId && hoverInfo) {
                          indicateHoverCommand(newMatchId, hoverInfo)(view.state, view.dispatch);
                      }
                      else {
                          stopHoverCommand()(view.state, view.dispatch);
                      }
                      return false;
                  }
              }
          },
          view(view) {
              return {
                  update: _ => store.emit(STORE_EVENT_NEW_STATE, plugin.getState(view.state))
              };
          }
      });
      return {
          plugin,
          store,
          getState: plugin.getState.bind(plugin)
      };
  };

  var n,u,t,i$1,o,r,f={},e=[],c=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord/i;function s(n,l){for(var u in l)n[u]=l[u];return n}function a(n){var l=n.parentNode;l&&l.removeChild(n);}function h(n,l,u){var t,i,o,r,f=arguments;if(l=s({},l),arguments.length>3)for(u=[u],t=3;t<arguments.length;t++)u.push(f[t]);if(null!=u&&(l.children=u),null!=n&&null!=n.defaultProps)for(i in n.defaultProps)void 0===l[i]&&(l[i]=n.defaultProps[i]);return r=l.key,null!=(o=l.ref)&&delete l.ref,null!=r&&delete l.key,v(n,l,r,o)}function v(l,u,t,i){var o={type:l,props:u,key:t,ref:i,__k:null,__:null,__b:0,__e:null,__d:null,__c:null,constructor:void 0};return n.vnode&&n.vnode(o),o}function d(n){return n.children}function y(n,l){this.props=n,this.context=l;}function m(n,l){if(null==l)return n.__?m(n.__,n.__.__k.indexOf(n)+1):null;for(var u;l<n.__k.length;l++)if(null!=(u=n.__k[l])&&null!=u.__e)return u.__e;return "function"==typeof n.type?m(n):null}function w(n){var l,u;if(null!=(n=n.__)&&null!=n.__c){for(n.__e=n.__c.base=null,l=0;l<n.__k.length;l++)if(null!=(u=n.__k[l])&&null!=u.__e){n.__e=n.__c.base=u.__e;break}return w(n)}}function g(l){(!l.__d&&(l.__d=!0)&&1===u.push(l)||i$1!==n.debounceRendering)&&((i$1=n.debounceRendering)||t)(k);}function k(){var n,l,t,i,o,r,f;for(u.sort(function(n,l){return l.__v.__b-n.__v.__b});n=u.pop();)n.__d&&(t=void 0,i=void 0,r=(o=(l=n).__v).__e,(f=l.__P)&&(t=[],i=T(f,o,s({},o),l.__n,void 0!==f.ownerSVGElement,null,t,null==r?m(o):r),$(t,o),i!=r&&w(o)));}function _(n,l,u,t,i,o,r,c,s){var h,v,p,d,y,w,g,k=u&&u.__k||e,_=k.length;if(c==f&&(c=null!=o?o[0]:_?m(u,0):null),h=0,l.__k=b(l.__k,function(u){if(null!=u){if(u.__=l,u.__b=l.__b+1,null===(p=k[h])||p&&u.key==p.key&&u.type===p.type)k[h]=void 0;else for(v=0;v<_;v++){if((p=k[v])&&u.key==p.key&&u.type===p.type){k[v]=void 0;break}p=null;}if(d=T(n,u,p=p||f,t,i,o,r,c,s),(v=u.ref)&&p.ref!=v&&(g||(g=[]),p.ref&&g.push(p.ref,null,u),g.push(v,u.__c||d,u)),null!=d){if(null==w&&(w=d),null!=u.__d)d=u.__d,u.__d=null;else if(o==p||d!=c||null==d.parentNode){n:if(null==c||c.parentNode!==n)n.appendChild(d);else {for(y=c,v=0;(y=y.nextSibling)&&v<_;v+=2)if(y==d)break n;n.insertBefore(d,c);}"option"==l.type&&(n.value="");}c=d.nextSibling,"function"==typeof l.type&&(l.__d=d);}}return h++,u}),l.__e=w,null!=o&&"function"!=typeof l.type)for(h=o.length;h--;)null!=o[h]&&a(o[h]);for(h=_;h--;)null!=k[h]&&A(k[h],k[h]);if(g)for(h=0;h<g.length;h++)z(g[h],g[++h],g[++h]);}function b(n,l,u){if(null==u&&(u=[]),null==n||"boolean"==typeof n)l&&u.push(l(null));else if(Array.isArray(n))for(var t=0;t<n.length;t++)b(n[t],l,u);else u.push(l?l("string"==typeof n||"number"==typeof n?v(null,n,null,null):null!=n.__e||null!=n.__c?v(n.type,n.props,n.key,null):n):n);return u}function x(n,l,u,t,i){var o;for(o in u)o in l||P(n,o,null,u[o],t);for(o in l)i&&"function"!=typeof l[o]||"value"===o||"checked"===o||u[o]===l[o]||P(n,o,l[o],u[o],t);}function C(n,l,u){"-"===l[0]?n.setProperty(l,u):n[l]="number"==typeof u&&!1===c.test(l)?u+"px":null==u?"":u;}function P(n,l,u,t,i){var o,r,f,e,c;if(i?"className"===l&&(l="class"):"class"===l&&(l="className"),"key"===l||"children"===l);else if("style"===l)if(o=n.style,"string"==typeof u)o.cssText=u;else {if("string"==typeof t&&(o.cssText="",t=null),t)for(r in t)u&&r in u||C(o,r,"");if(u)for(f in u)t&&u[f]===t[f]||C(o,f,u[f]);}else "o"===l[0]&&"n"===l[1]?(e=l!==(l=l.replace(/Capture$/,"")),c=l.toLowerCase(),l=(c in n?c:l).slice(2),u?(t||n.addEventListener(l,N,e),(n.l||(n.l={}))[l]=u):n.removeEventListener(l,N,e)):"list"!==l&&"tagName"!==l&&"form"!==l&&!i&&l in n?n[l]=null==u?"":u:"function"!=typeof u&&"dangerouslySetInnerHTML"!==l&&(l!==(l=l.replace(/^xlink:?/,""))?null==u||!1===u?n.removeAttributeNS("http://www.w3.org/1999/xlink",l.toLowerCase()):n.setAttributeNS("http://www.w3.org/1999/xlink",l.toLowerCase(),u):null==u||!1===u?n.removeAttribute(l):n.setAttribute(l,u));}function N(l){this.l[l.type](n.event?n.event(l):l);}function T(l,u,t,i,o,r,f,e,c){var a,h,v,p,m,w,g,k,x,C,P=u.type;if(void 0!==u.constructor)return null;(a=n.__b)&&a(u);try{n:if("function"==typeof P){if(k=u.props,x=(a=P.contextType)&&i[a.__c],C=a?x?x.props.value:a.__:i,t.__c?g=(h=u.__c=t.__c).__=h.__E:("prototype"in P&&P.prototype.render?u.__c=h=new P(k,C):(u.__c=h=new y(k,C),h.constructor=P,h.render=D),x&&x.sub(h),h.props=k,h.state||(h.state={}),h.context=C,h.__n=i,v=h.__d=!0,h.__h=[]),null==h.__s&&(h.__s=h.state),null!=P.getDerivedStateFromProps&&(h.__s==h.state&&(h.__s=s({},h.__s)),s(h.__s,P.getDerivedStateFromProps(k,h.__s))),p=h.props,m=h.state,v)null==P.getDerivedStateFromProps&&null!=h.componentWillMount&&h.componentWillMount(),null!=h.componentDidMount&&h.__h.push(h.componentDidMount);else {if(null==P.getDerivedStateFromProps&&null==h.__e&&null!=h.componentWillReceiveProps&&h.componentWillReceiveProps(k,C),!h.__e&&null!=h.shouldComponentUpdate&&!1===h.shouldComponentUpdate(k,h.__s,C)){for(h.props=k,h.state=h.__s,h.__d=!1,h.__v=u,u.__e=t.__e,u.__k=t.__k,h.__h.length&&f.push(h),a=0;a<u.__k.length;a++)u.__k[a]&&(u.__k[a].__=u);break n}null!=h.componentWillUpdate&&h.componentWillUpdate(k,h.__s,C),null!=h.componentDidUpdate&&h.__h.push(function(){h.componentDidUpdate(p,m,w);});}h.context=C,h.props=k,h.state=h.__s,(a=n.__r)&&a(u),h.__d=!1,h.__v=u,h.__P=l,a=h.render(h.props,h.state,h.context),u.__k=b(null!=a&&a.type==d&&null==a.key?a.props.children:a),null!=h.getChildContext&&(i=s(s({},i),h.getChildContext())),v||null==h.getSnapshotBeforeUpdate||(w=h.getSnapshotBeforeUpdate(p,m)),_(l,u,t,i,o,r,f,e,c),h.base=u.__e,h.__h.length&&f.push(h),g&&(h.__E=h.__=null),h.__e=null;}else u.__e=j(t.__e,u,t,i,o,r,f,c);(a=n.diffed)&&a(u);}catch(l){n.__e(l,u,t);}return u.__e}function $(l,u){n.__c&&n.__c(u,l),l.some(function(u){try{l=u.__h,u.__h=[],l.some(function(n){n.call(u);});}catch(l){n.__e(l,u.__v);}});}function j(n,l,u,t,i,o,r,c){var s,a,h,v,p,d=u.props,y=l.props;if(i="svg"===l.type||i,null==n&&null!=o)for(s=0;s<o.length;s++)if(null!=(a=o[s])&&(null===l.type?3===a.nodeType:a.localName===l.type)){n=a,o[s]=null;break}if(null==n){if(null===l.type)return document.createTextNode(y);n=i?document.createElementNS("http://www.w3.org/2000/svg",l.type):document.createElement(l.type),o=null;}if(null===l.type)null!=o&&(o[o.indexOf(n)]=null),d!==y&&(n.data=y);else if(l!==u){if(null!=o&&(o=e.slice.call(n.childNodes)),h=(d=u.props||f).dangerouslySetInnerHTML,v=y.dangerouslySetInnerHTML,!c){if(d===f)for(d={},p=0;p<n.attributes.length;p++)d[n.attributes[p].name]=n.attributes[p].value;(v||h)&&(v&&h&&v.__html==h.__html||(n.innerHTML=v&&v.__html||""));}x(n,y,d,i,c),l.__k=l.props.children,v||_(n,l,u,t,"foreignObject"!==l.type&&i,o,r,f,c),c||("value"in y&&void 0!==y.value&&y.value!==n.value&&(n.value=null==y.value?"":y.value),"checked"in y&&void 0!==y.checked&&y.checked!==n.checked&&(n.checked=y.checked));}return n}function z(l,u,t){try{"function"==typeof l?l(u):l.current=u;}catch(l){n.__e(l,t);}}function A(l,u,t){var i,o,r;if(n.unmount&&n.unmount(l),(i=l.ref)&&z(i,null,u),t||"function"==typeof l.type||(t=null!=(o=l.__e)),l.__e=l.__d=null,null!=(i=l.__c)){if(i.componentWillUnmount)try{i.componentWillUnmount();}catch(l){n.__e(l,u);}i.base=i.__P=null;}if(i=l.__k)for(r=0;r<i.length;r++)i[r]&&A(i[r],u,t);null!=o&&a(o);}function D(n,l,u){return this.constructor(n,u)}function E(l,u,t){var i,r,c;n.__&&n.__(l,u),r=(i=t===o)?null:t&&t.__k||u.__k,l=h(d,null,[l]),c=[],T(u,(i?u:t||u).__k=l,r||f,f,void 0!==u.ownerSVGElement,t&&!i?[t]:r?null:e.slice.call(u.childNodes),c,t||f,i),$(c,l);}n={__e:function(n,l){for(var u;l=l.__;)if((u=l.__c)&&!u.__)try{if(u.constructor&&null!=u.constructor.getDerivedStateFromError)u.setState(u.constructor.getDerivedStateFromError(n));else {if(null==u.componentDidCatch)continue;u.componentDidCatch(n);}return g(u.__E=u)}catch(l){n=l;}throw n}},y.prototype.setState=function(n,l){var u;u=this.__s!==this.state?this.__s:this.__s=s({},this.state),"function"==typeof n&&(n=n(u,this.props)),n&&s(u,n),null!=n&&this.__v&&(this.__e=!1,l&&this.__h.push(l),g(this));},y.prototype.forceUpdate=function(n){this.__v&&(this.__e=!0,n&&this.__h.push(n),g(this));},y.prototype.render=d,u=[],t="function"==typeof Promise?Promise.prototype.then.bind(Promise.resolve()):setTimeout,o=f,r=0;

  var t$1,u$1,r$1,i$2=[],o$1=n.__r,f$1=n.diffed,c$1=n.__c,e$1=n.unmount;function a$1(t){n.__h&&n.__h(u$1);var r=u$1.__H||(u$1.__H={t:[],u:[]});return t>=r.t.length&&r.t.push({}),r.t[t]}function v$1(n){return m$1(x$1,n)}function m$1(n,r,i){var o=a$1(t$1++);return o.__c||(o.__c=u$1,o.i=[i?i(r):x$1(void 0,r),function(t){var u=n(o.i[0],t);o.i[0]!==u&&(o.i[0]=u,o.__c.setState({}));}]),o.i}function p(n,r){var i=a$1(t$1++);q(i.o,r)&&(i.i=n,i.o=r,u$1.__H.u.push(i));}function F(){i$2.some(function(n){n.__P&&(n.__H.u.forEach(_$1),n.__H.u.forEach(g$1),n.__H.u=[]);}),i$2=[];}function _$1(n){n.m&&n.m();}function g$1(n){var t=n.i();"function"==typeof t&&(n.m=t);}function q(n,t){return !n||t.some(function(t,u){return t!==n[u]})}function x$1(n,t){return "function"==typeof t?t(n):t}n.__r=function(n){o$1&&o$1(n),t$1=0,(u$1=n.__c).__H&&(u$1.__H.u.forEach(_$1),u$1.__H.u.forEach(g$1),u$1.__H.u=[]);},n.diffed=function(t){f$1&&f$1(t);var u=t.__c;if(u){var o=u.__H;o&&o.u.length&&(1!==i$2.push(u)&&r$1===n.requestAnimationFrame||((r$1=n.requestAnimationFrame)||function(n){var t,u=function(){clearTimeout(r),cancelAnimationFrame(t),setTimeout(n);},r=setTimeout(u,100);"undefined"!=typeof window&&(t=requestAnimationFrame(u));})(F));}},n.__c=function(n,t){t.some(function(n){n.__h.forEach(_$1),n.__h=n.__h.filter(function(n){return !n.i||g$1(n)});}),c$1&&c$1(n,t);},n.unmount=function(n){e$1&&e$1(n);var t=n.__c;if(t){var u=t.__H;u&&u.t.forEach(function(n){return n.m&&n.m()});}};

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */

  function __awaiter(thisArg, _arguments, P, generator) {
      return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
          function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
          function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
  }

  const WikiSuggestion = ({ text, title, applySuggestion }) => {
      const [article, setArticle] = v$1(undefined);
      const [isLoading, setLoading] = v$1(false);
      const [error, setError] = v$1(undefined);
      p(() => {
          (() => __awaiter(void 0, void 0, void 0, function* () {
              setLoading(true);
              try {
                  setArticle(yield fetchWikiData(title));
              }
              catch (e) {
                  setError(e.message);
              }
              finally {
                  setLoading(false);
              }
          }))();
      }, [text]);
      return (h("div", { class: "WikiSuggestion__container" },
          h("div", { class: "WikiSuggestion__text" },
              h("div", { class: "WikiSuggestion__suggestion", onClick: applySuggestion }, text),
              article && (h(d, null,
                  h("div", { class: "WikiSuggestion__extract" },
                      article.extract.slice(0, 220),
                      "...",
                      h("a", { class: "WikiSuggestion__link", href: getWikiUrl(title), target: "_blank" })))),
              !article && isLoading && (h("div", { class: "WikiSuggestion__extract--placeholder" }))),
          h("div", { class: `WikiSuggestion__thumbnail ${isLoading &&
                "WikiSuggestion__thumbnail--placeholder"}`, style: {
                  backgroundImage: article && article.thumbnail
                      ? `url(${article.thumbnail.source})`
                      : ""
              } }),
          error ? h("p", null,
              "Error: ",
              error) : null));
  };
  const fetchWikiData = (title) => __awaiter(void 0, void 0, void 0, function* () {
      try {
          const response = yield fetch(getWikiApiUrl(title), {
              headers: new Headers([
                  ["Origin", window.location.origin],
                  ["Content-Type", "application/json; charset=UTF-8"]
              ])
          });
          const wikiResponse = yield response.json();
          const article = getArticleFromResponse(wikiResponse);
          if (!article) {
              throw new Error(`No articles found for resource with title ${title}`);
          }
          return article;
      }
      catch (e) {
          throw new Error(`Error parsing data from wikipedia: ${e.message}`);
      }
  });
  const getArticleFromResponse = (wikiResponse) => {
      return Object.values(wikiResponse.query.pages)[0];
  };
  const getWikiUrl = (resourceName) => `https://wikipedia.com/wiki/${resourceName}`;
  const getWikiApiUrl = (resourceName) => `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=pageimages|extracts&exintro&explaintext&piprop=thumbnail&pithumbsize=200&redirects=1&titles=${resourceName}&origin=*`;

  const Suggestion = ({ matchId, suggestion, applySuggestions }) => {
      const boundApplySuggestions = () => applySuggestions &&
          applySuggestions([
              {
                  matchId,
                  text: suggestion.text
              }
          ]);
      switch (suggestion.type) {
          case "TEXT_SUGGESTION": {
              return (h("div", { class: "MatchWidget__suggestion", onClick: boundApplySuggestions }, suggestion.text));
          }
          case "WIKI_SUGGESTION": {
              return (h(WikiSuggestion, Object.assign({}, suggestion, { applySuggestion: boundApplySuggestions })));
          }
      }
  };

  const SuggestionList = ({ suggestions, matchId, applySuggestions }) => {
      const [isOpen, setIsOpen] = v$1(false);
      const firstSuggestion = suggestions[0];
      const otherSuggestions = suggestions.slice(1);
      return (h("div", { className: "SidebarMatch__suggestion-list" },
          suggestions.length ? (h(Suggestion, { matchId: matchId, suggestion: firstSuggestion, applySuggestions: applySuggestions })) : null,
          !!otherSuggestions.length ? (h("div", { className: "Button SuggestionList__see-more", onClick: () => setIsOpen(!isOpen) },
              "See ",
              !isOpen ? "more" : "fewer",
              " suggestions (",
              otherSuggestions.length,
              ")")) : null,
          isOpen && (h(d, null, otherSuggestions.map(suggestion => (h(Suggestion, { matchId: matchId, suggestion: suggestion, applySuggestions: applySuggestions })))))));
  };

  class Match extends y {
      constructor() {
          super(...arguments);
          this.ref = null;
      }
      render({ match: { matchId, category, message, suggestions, replacement }, applySuggestions }) {
          const suggestionsToRender = replacement ? [replacement] : suggestions || [];
          return (h("div", { className: "MatchWidget__container" },
              h("div", { className: "MatchWidget", ref: _ => (this.ref = _) },
                  h("div", { className: "MatchWidget__type", style: { color: `#${category.colour}` } }, category.name),
                  h("div", { className: "MatchWidget__annotation" }, message),
                  suggestions && applySuggestions && (h("div", { className: "MatchWidget__suggestion-list" },
                      h(SuggestionList, { applySuggestions: applySuggestions, matchId: matchId, suggestions: suggestionsToRender }))))));
      }
  }

  class MatchOverlay extends y {
      constructor() {
          super(...arguments);
          this.state = {
              isVisible: false,
              left: undefined,
              top: undefined,
              hoverInfo: undefined,
              match: undefined
          };
          this.matchRef = undefined;
          this.handleMouseOver = (e) => e.stopPropagation();
          this.handleNotify = (state) => {
              const newState = {
                  isVisible: false,
                  left: 0,
                  top: 0
              };
              if (state.hoverId && state.hoverInfo) {
                  const match = selectMatchByMatchId(state, state.hoverId);
                  return this.setState(Object.assign({ hoverInfo: state.hoverInfo, match }, newState));
              }
              this.setState(Object.assign({ hoverInfo: undefined, match: undefined }, newState));
          };
          this.getCoordsFromHoverEvent = () => {
              if (!this.matchRef || !this.state.hoverInfo) {
                  return { left: 0, top: 0 };
              }
              const { left: tooltipLeft, top: tooltipTop, maxLeft: toolTipMaxLeft } = this.getIdealTooltipCoords(this.state.hoverInfo);
              const maxLeft = this.props.containerElement
                  ? (toolTipMaxLeft || this.props.containerElement.clientWidth) -
                      this.matchRef.ref.offsetWidth
                  : Infinity;
              return {
                  left: tooltipLeft < maxLeft ? tooltipLeft : maxLeft,
                  top: tooltipTop
              };
          };
          this.getIdealTooltipCoords = (hoverInfo) => {
              const spanRects = Array.from(hoverInfo.markerClientRects);
              const hoveredRect = spanRects.find(rect => this.areCoordsWithinClientRect(hoverInfo.mouseClientX, hoverInfo.mouseClientY, rect));
              const maxLeft = spanRects.length > 1
                  ? Math.max(...spanRects.map(_ => _.right))
                  : undefined;
              const absoluteLeft = hoveredRect ? hoveredRect.left : hoverInfo.mouseClientX;
              const absoluteTop = hoveredRect
                  ? hoveredRect.top + hoveredRect.height
                  : hoverInfo.mouseClientX;
              const left = absoluteLeft - hoverInfo.containerLeft;
              const top = absoluteTop - hoverInfo.containerTop;
              return { left, top, maxLeft };
          };
          this.areCoordsWithinClientRect = (x, y, rect) => {
              const padding = 2;
              const isInRect = !!(x >= rect.left - padding &&
                  x <= rect.left + rect.width + padding &&
                  y >= rect.top - padding &&
                  y <= rect.top + rect.height + padding);
              return isInRect;
          };
      }
      componentWillMount() {
          this.props.store.on(STORE_EVENT_NEW_STATE, this.handleNotify);
      }
      componentDidUpdate() {
          if (this.state.isVisible) {
              return;
          }
          const { left, top } = this.getCoordsFromHoverEvent();
          this.setState({
              isVisible: true,
              left,
              top
          });
      }
      render() {
          const { match, left, top } = this.state;
          if (!match || left === undefined || top === undefined) {
              return null;
          }
          return (h("div", { class: "TyperighterPlugin__overlay", onMouseOver: this.handleMouseOver },
              h("div", { class: "TyperighterPlugin__decoration-container", style: {
                      top: top - 1,
                      left
                  } },
                  h(Match, { ref: _ => (this.matchRef = _), match: match, applySuggestions: this.props.applySuggestions }))));
      }
  }

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

  /**
   * Adds `value` to the array cache.
   *
   * @private
   * @name add
   * @memberOf SetCache
   * @alias push
   * @param {*} value The value to cache.
   * @returns {Object} Returns the cache instance.
   */
  function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED$2);
    return this;
  }

  var _setCacheAdd = setCacheAdd;

  /**
   * Checks if `value` is in the array cache.
   *
   * @private
   * @name has
   * @memberOf SetCache
   * @param {*} value The value to search for.
   * @returns {number} Returns `true` if `value` is found, else `false`.
   */
  function setCacheHas(value) {
    return this.__data__.has(value);
  }

  var _setCacheHas = setCacheHas;

  /**
   *
   * Creates an array cache object to store unique values.
   *
   * @private
   * @constructor
   * @param {Array} [values] The values to cache.
   */
  function SetCache(values) {
    var index = -1,
        length = values == null ? 0 : values.length;

    this.__data__ = new _MapCache;
    while (++index < length) {
      this.add(values[index]);
    }
  }

  // Add methods to `SetCache`.
  SetCache.prototype.add = SetCache.prototype.push = _setCacheAdd;
  SetCache.prototype.has = _setCacheHas;

  var _SetCache = SetCache;

  /**
   * A specialized version of `_.some` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if any element passes the predicate check,
   *  else `false`.
   */
  function arraySome(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }

  var _arraySome = arraySome;

  /**
   * Checks if a `cache` value for `key` exists.
   *
   * @private
   * @param {Object} cache The cache to query.
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function cacheHas(cache, key) {
    return cache.has(key);
  }

  var _cacheHas = cacheHas;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG = 1,
      COMPARE_UNORDERED_FLAG = 2;

  /**
   * A specialized version of `baseIsEqualDeep` for arrays with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Array} array The array to compare.
   * @param {Array} other The other array to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `array` and `other` objects.
   * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
   */
  function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
        arrLength = array.length,
        othLength = other.length;

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false;
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(array);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var index = -1,
        result = true,
        seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new _SetCache : undefined;

    stack.set(array, other);
    stack.set(other, array);

    // Ignore non-index properties.
    while (++index < arrLength) {
      var arrValue = array[index],
          othValue = other[index];

      if (customizer) {
        var compared = isPartial
          ? customizer(othValue, arrValue, index, other, array, stack)
          : customizer(arrValue, othValue, index, array, other, stack);
      }
      if (compared !== undefined) {
        if (compared) {
          continue;
        }
        result = false;
        break;
      }
      // Recursively compare arrays (susceptible to call stack limits).
      if (seen) {
        if (!_arraySome(other, function(othValue, othIndex) {
              if (!_cacheHas(seen, othIndex) &&
                  (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                return seen.push(othIndex);
              }
            })) {
          result = false;
          break;
        }
      } else if (!(
            arrValue === othValue ||
              equalFunc(arrValue, othValue, bitmask, customizer, stack)
          )) {
        result = false;
        break;
      }
    }
    stack['delete'](array);
    stack['delete'](other);
    return result;
  }

  var _equalArrays = equalArrays;

  /**
   * Converts `map` to its key-value pairs.
   *
   * @private
   * @param {Object} map The map to convert.
   * @returns {Array} Returns the key-value pairs.
   */
  function mapToArray(map) {
    var index = -1,
        result = Array(map.size);

    map.forEach(function(value, key) {
      result[++index] = [key, value];
    });
    return result;
  }

  var _mapToArray = mapToArray;

  /**
   * Converts `set` to an array of its values.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the values.
   */
  function setToArray(set) {
    var index = -1,
        result = Array(set.size);

    set.forEach(function(value) {
      result[++index] = value;
    });
    return result;
  }

  var _setToArray = setToArray;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$1 = 1,
      COMPARE_UNORDERED_FLAG$1 = 2;

  /** `Object#toString` result references. */
  var boolTag$3 = '[object Boolean]',
      dateTag$3 = '[object Date]',
      errorTag$2 = '[object Error]',
      mapTag$5 = '[object Map]',
      numberTag$3 = '[object Number]',
      regexpTag$3 = '[object RegExp]',
      setTag$5 = '[object Set]',
      stringTag$3 = '[object String]',
      symbolTag$3 = '[object Symbol]';

  var arrayBufferTag$3 = '[object ArrayBuffer]',
      dataViewTag$4 = '[object DataView]';

  /** Used to convert symbols to primitives and strings. */
  var symbolProto$2 = _Symbol ? _Symbol.prototype : undefined,
      symbolValueOf$1 = symbolProto$2 ? symbolProto$2.valueOf : undefined;

  /**
   * A specialized version of `baseIsEqualDeep` for comparing objects of
   * the same `toStringTag`.
   *
   * **Note:** This function only supports comparing values with tags of
   * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {string} tag The `toStringTag` of the objects to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
    switch (tag) {
      case dataViewTag$4:
        if ((object.byteLength != other.byteLength) ||
            (object.byteOffset != other.byteOffset)) {
          return false;
        }
        object = object.buffer;
        other = other.buffer;

      case arrayBufferTag$3:
        if ((object.byteLength != other.byteLength) ||
            !equalFunc(new _Uint8Array(object), new _Uint8Array(other))) {
          return false;
        }
        return true;

      case boolTag$3:
      case dateTag$3:
      case numberTag$3:
        // Coerce booleans to `1` or `0` and dates to milliseconds.
        // Invalid dates are coerced to `NaN`.
        return eq_1(+object, +other);

      case errorTag$2:
        return object.name == other.name && object.message == other.message;

      case regexpTag$3:
      case stringTag$3:
        // Coerce regexes to strings and treat strings, primitives and objects,
        // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
        // for more details.
        return object == (other + '');

      case mapTag$5:
        var convert = _mapToArray;

      case setTag$5:
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG$1;
        convert || (convert = _setToArray);

        if (object.size != other.size && !isPartial) {
          return false;
        }
        // Assume cyclic values are equal.
        var stacked = stack.get(object);
        if (stacked) {
          return stacked == other;
        }
        bitmask |= COMPARE_UNORDERED_FLAG$1;

        // Recursively compare objects (susceptible to call stack limits).
        stack.set(object, other);
        var result = _equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
        stack['delete'](object);
        return result;

      case symbolTag$3:
        if (symbolValueOf$1) {
          return symbolValueOf$1.call(object) == symbolValueOf$1.call(other);
        }
    }
    return false;
  }

  var _equalByTag = equalByTag;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$2 = 1;

  /** Used for built-in method references. */
  var objectProto$e = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$b = objectProto$e.hasOwnProperty;

  /**
   * A specialized version of `baseIsEqualDeep` for objects with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG$2,
        objProps = _getAllKeys(object),
        objLength = objProps.length,
        othProps = _getAllKeys(other),
        othLength = othProps.length;

    if (objLength != othLength && !isPartial) {
      return false;
    }
    var index = objLength;
    while (index--) {
      var key = objProps[index];
      if (!(isPartial ? key in other : hasOwnProperty$b.call(other, key))) {
        return false;
      }
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(object);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);

    var skipCtor = isPartial;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key],
          othValue = other[key];

      if (customizer) {
        var compared = isPartial
          ? customizer(othValue, objValue, key, other, object, stack)
          : customizer(objValue, othValue, key, object, other, stack);
      }
      // Recursively compare objects (susceptible to call stack limits).
      if (!(compared === undefined
            ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
            : compared
          )) {
        result = false;
        break;
      }
      skipCtor || (skipCtor = key == 'constructor');
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor,
          othCtor = other.constructor;

      // Non `Object` object instances with different constructors are not equal.
      if (objCtor != othCtor &&
          ('constructor' in object && 'constructor' in other) &&
          !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
            typeof othCtor == 'function' && othCtor instanceof othCtor)) {
        result = false;
      }
    }
    stack['delete'](object);
    stack['delete'](other);
    return result;
  }

  var _equalObjects = equalObjects;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$3 = 1;

  /** `Object#toString` result references. */
  var argsTag$3 = '[object Arguments]',
      arrayTag$2 = '[object Array]',
      objectTag$4 = '[object Object]';

  /** Used for built-in method references. */
  var objectProto$f = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$c = objectProto$f.hasOwnProperty;

  /**
   * A specialized version of `baseIsEqual` for arrays and objects which performs
   * deep comparisons and tracks traversed objects enabling objects with circular
   * references to be compared.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} [stack] Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
    var objIsArr = isArray_1(object),
        othIsArr = isArray_1(other),
        objTag = objIsArr ? arrayTag$2 : _getTag(object),
        othTag = othIsArr ? arrayTag$2 : _getTag(other);

    objTag = objTag == argsTag$3 ? objectTag$4 : objTag;
    othTag = othTag == argsTag$3 ? objectTag$4 : othTag;

    var objIsObj = objTag == objectTag$4,
        othIsObj = othTag == objectTag$4,
        isSameTag = objTag == othTag;

    if (isSameTag && isBuffer_1(object)) {
      if (!isBuffer_1(other)) {
        return false;
      }
      objIsArr = true;
      objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
      stack || (stack = new _Stack);
      return (objIsArr || isTypedArray_1(object))
        ? _equalArrays(object, other, bitmask, customizer, equalFunc, stack)
        : _equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG$3)) {
      var objIsWrapped = objIsObj && hasOwnProperty$c.call(object, '__wrapped__'),
          othIsWrapped = othIsObj && hasOwnProperty$c.call(other, '__wrapped__');

      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object,
            othUnwrapped = othIsWrapped ? other.value() : other;

        stack || (stack = new _Stack);
        return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stack || (stack = new _Stack);
    return _equalObjects(object, other, bitmask, customizer, equalFunc, stack);
  }

  var _baseIsEqualDeep = baseIsEqualDeep;

  /**
   * The base implementation of `_.isEqual` which supports partial comparisons
   * and tracks traversed objects.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @param {boolean} bitmask The bitmask flags.
   *  1 - Unordered comparison
   *  2 - Partial comparison
   * @param {Function} [customizer] The function to customize comparisons.
   * @param {Object} [stack] Tracks traversed `value` and `other` objects.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   */
  function baseIsEqual(value, other, bitmask, customizer, stack) {
    if (value === other) {
      return true;
    }
    if (value == null || other == null || (!isObjectLike_1(value) && !isObjectLike_1(other))) {
      return value !== value && other !== other;
    }
    return _baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
  }

  var _baseIsEqual = baseIsEqual;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$4 = 1,
      COMPARE_UNORDERED_FLAG$2 = 2;

  /**
   * The base implementation of `_.isMatch` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to inspect.
   * @param {Object} source The object of property values to match.
   * @param {Array} matchData The property names, values, and compare flags to match.
   * @param {Function} [customizer] The function to customize comparisons.
   * @returns {boolean} Returns `true` if `object` is a match, else `false`.
   */
  function baseIsMatch(object, source, matchData, customizer) {
    var index = matchData.length,
        length = index,
        noCustomizer = !customizer;

    if (object == null) {
      return !length;
    }
    object = Object(object);
    while (index--) {
      var data = matchData[index];
      if ((noCustomizer && data[2])
            ? data[1] !== object[data[0]]
            : !(data[0] in object)
          ) {
        return false;
      }
    }
    while (++index < length) {
      data = matchData[index];
      var key = data[0],
          objValue = object[key],
          srcValue = data[1];

      if (noCustomizer && data[2]) {
        if (objValue === undefined && !(key in object)) {
          return false;
        }
      } else {
        var stack = new _Stack;
        if (customizer) {
          var result = customizer(objValue, srcValue, key, object, source, stack);
        }
        if (!(result === undefined
              ? _baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG$4 | COMPARE_UNORDERED_FLAG$2, customizer, stack)
              : result
            )) {
          return false;
        }
      }
    }
    return true;
  }

  var _baseIsMatch = baseIsMatch;

  /**
   * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` if suitable for strict
   *  equality comparisons, else `false`.
   */
  function isStrictComparable(value) {
    return value === value && !isObject_1(value);
  }

  var _isStrictComparable = isStrictComparable;

  /**
   * Gets the property names, values, and compare flags of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the match data of `object`.
   */
  function getMatchData(object) {
    var result = keys_1(object),
        length = result.length;

    while (length--) {
      var key = result[length],
          value = object[key];

      result[length] = [key, value, _isStrictComparable(value)];
    }
    return result;
  }

  var _getMatchData = getMatchData;

  /**
   * A specialized version of `matchesProperty` for source values suitable
   * for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function matchesStrictComparable(key, srcValue) {
    return function(object) {
      if (object == null) {
        return false;
      }
      return object[key] === srcValue &&
        (srcValue !== undefined || (key in Object(object)));
    };
  }

  var _matchesStrictComparable = matchesStrictComparable;

  /**
   * The base implementation of `_.matches` which doesn't clone `source`.
   *
   * @private
   * @param {Object} source The object of property values to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatches(source) {
    var matchData = _getMatchData(source);
    if (matchData.length == 1 && matchData[0][2]) {
      return _matchesStrictComparable(matchData[0][0], matchData[0][1]);
    }
    return function(object) {
      return object === source || _baseIsMatch(object, source, matchData);
    };
  }

  var _baseMatches = baseMatches;

  /**
   * Gets the value at `path` of `object`. If the resolved value is
   * `undefined`, the `defaultValue` is returned in its place.
   *
   * @static
   * @memberOf _
   * @since 3.7.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @param {*} [defaultValue] The value returned for `undefined` resolved values.
   * @returns {*} Returns the resolved value.
   * @example
   *
   * var object = { 'a': [{ 'b': { 'c': 3 } }] };
   *
   * _.get(object, 'a[0].b.c');
   * // => 3
   *
   * _.get(object, ['a', '0', 'b', 'c']);
   * // => 3
   *
   * _.get(object, 'a.b.c', 'default');
   * // => 'default'
   */
  function get(object, path, defaultValue) {
    var result = object == null ? undefined : _baseGet(object, path);
    return result === undefined ? defaultValue : result;
  }

  var get_1 = get;

  /**
   * The base implementation of `_.hasIn` without support for deep paths.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {Array|string} key The key to check.
   * @returns {boolean} Returns `true` if `key` exists, else `false`.
   */
  function baseHasIn(object, key) {
    return object != null && key in Object(object);
  }

  var _baseHasIn = baseHasIn;

  /**
   * Checks if `path` exists on `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @param {Function} hasFunc The function to check properties.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   */
  function hasPath(object, path, hasFunc) {
    path = _castPath(path, object);

    var index = -1,
        length = path.length,
        result = false;

    while (++index < length) {
      var key = _toKey(path[index]);
      if (!(result = object != null && hasFunc(object, key))) {
        break;
      }
      object = object[key];
    }
    if (result || ++index != length) {
      return result;
    }
    length = object == null ? 0 : object.length;
    return !!length && isLength_1(length) && _isIndex(key, length) &&
      (isArray_1(object) || isArguments_1(object));
  }

  var _hasPath = hasPath;

  /**
   * Checks if `path` is a direct or inherited property of `object`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   * @example
   *
   * var object = _.create({ 'a': _.create({ 'b': 2 }) });
   *
   * _.hasIn(object, 'a');
   * // => true
   *
   * _.hasIn(object, 'a.b');
   * // => true
   *
   * _.hasIn(object, ['a', 'b']);
   * // => true
   *
   * _.hasIn(object, 'b');
   * // => false
   */
  function hasIn(object, path) {
    return object != null && _hasPath(object, path, _baseHasIn);
  }

  var hasIn_1 = hasIn;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$5 = 1,
      COMPARE_UNORDERED_FLAG$3 = 2;

  /**
   * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
   *
   * @private
   * @param {string} path The path of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatchesProperty(path, srcValue) {
    if (_isKey(path) && _isStrictComparable(srcValue)) {
      return _matchesStrictComparable(_toKey(path), srcValue);
    }
    return function(object) {
      var objValue = get_1(object, path);
      return (objValue === undefined && objValue === srcValue)
        ? hasIn_1(object, path)
        : _baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG$5 | COMPARE_UNORDERED_FLAG$3);
    };
  }

  var _baseMatchesProperty = baseMatchesProperty;

  /**
   * The base implementation of `_.property` without support for deep paths.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function baseProperty(key) {
    return function(object) {
      return object == null ? undefined : object[key];
    };
  }

  var _baseProperty = baseProperty;

  /**
   * A specialized version of `baseProperty` which supports deep paths.
   *
   * @private
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function basePropertyDeep(path) {
    return function(object) {
      return _baseGet(object, path);
    };
  }

  var _basePropertyDeep = basePropertyDeep;

  /**
   * Creates a function that returns the value at `path` of a given object.
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Util
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   * @example
   *
   * var objects = [
   *   { 'a': { 'b': 2 } },
   *   { 'a': { 'b': 1 } }
   * ];
   *
   * _.map(objects, _.property('a.b'));
   * // => [2, 1]
   *
   * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
   * // => [1, 2]
   */
  function property(path) {
    return _isKey(path) ? _baseProperty(_toKey(path)) : _basePropertyDeep(path);
  }

  var property_1 = property;

  /**
   * The base implementation of `_.iteratee`.
   *
   * @private
   * @param {*} [value=_.identity] The value to convert to an iteratee.
   * @returns {Function} Returns the iteratee.
   */
  function baseIteratee(value) {
    // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
    // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
    if (typeof value == 'function') {
      return value;
    }
    if (value == null) {
      return identity_1;
    }
    if (typeof value == 'object') {
      return isArray_1(value)
        ? _baseMatchesProperty(value[0], value[1])
        : _baseMatches(value);
    }
    return property_1(value);
  }

  var _baseIteratee = baseIteratee;

  /**
   * Creates a base function for methods like `_.forIn` and `_.forOwn`.
   *
   * @private
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseFor(fromRight) {
    return function(object, iteratee, keysFunc) {
      var index = -1,
          iterable = Object(object),
          props = keysFunc(object),
          length = props.length;

      while (length--) {
        var key = props[fromRight ? length : ++index];
        if (iteratee(iterable[key], key, iterable) === false) {
          break;
        }
      }
      return object;
    };
  }

  var _createBaseFor = createBaseFor;

  /**
   * The base implementation of `baseForOwn` which iterates over `object`
   * properties returned by `keysFunc` and invokes `iteratee` for each property.
   * Iteratee functions may exit iteration early by explicitly returning `false`.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @returns {Object} Returns `object`.
   */
  var baseFor = _createBaseFor();

  var _baseFor = baseFor;

  /**
   * The base implementation of `_.forOwn` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Object} Returns `object`.
   */
  function baseForOwn(object, iteratee) {
    return object && _baseFor(object, iteratee, keys_1);
  }

  var _baseForOwn = baseForOwn;

  /**
   * Creates a `baseEach` or `baseEachRight` function.
   *
   * @private
   * @param {Function} eachFunc The function to iterate over a collection.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseEach(eachFunc, fromRight) {
    return function(collection, iteratee) {
      if (collection == null) {
        return collection;
      }
      if (!isArrayLike_1(collection)) {
        return eachFunc(collection, iteratee);
      }
      var length = collection.length,
          index = fromRight ? length : -1,
          iterable = Object(collection);

      while ((fromRight ? index-- : ++index < length)) {
        if (iteratee(iterable[index], index, iterable) === false) {
          break;
        }
      }
      return collection;
    };
  }

  var _createBaseEach = createBaseEach;

  /**
   * The base implementation of `_.forEach` without support for iteratee shorthands.
   *
   * @private
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array|Object} Returns `collection`.
   */
  var baseEach = _createBaseEach(_baseForOwn);

  var _baseEach = baseEach;

  /**
   * The base implementation of `_.map` without support for iteratee shorthands.
   *
   * @private
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  function baseMap(collection, iteratee) {
    var index = -1,
        result = isArrayLike_1(collection) ? Array(collection.length) : [];

    _baseEach(collection, function(value, key, collection) {
      result[++index] = iteratee(value, key, collection);
    });
    return result;
  }

  var _baseMap = baseMap;

  /**
   * The base implementation of `_.sortBy` which uses `comparer` to define the
   * sort order of `array` and replaces criteria objects with their corresponding
   * values.
   *
   * @private
   * @param {Array} array The array to sort.
   * @param {Function} comparer The function to define sort order.
   * @returns {Array} Returns `array`.
   */
  function baseSortBy(array, comparer) {
    var length = array.length;

    array.sort(comparer);
    while (length--) {
      array[length] = array[length].value;
    }
    return array;
  }

  var _baseSortBy = baseSortBy;

  /**
   * Compares values to sort them in ascending order.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {number} Returns the sort order indicator for `value`.
   */
  function compareAscending(value, other) {
    if (value !== other) {
      var valIsDefined = value !== undefined,
          valIsNull = value === null,
          valIsReflexive = value === value,
          valIsSymbol = isSymbol_1(value);

      var othIsDefined = other !== undefined,
          othIsNull = other === null,
          othIsReflexive = other === other,
          othIsSymbol = isSymbol_1(other);

      if ((!othIsNull && !othIsSymbol && !valIsSymbol && value > other) ||
          (valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol) ||
          (valIsNull && othIsDefined && othIsReflexive) ||
          (!valIsDefined && othIsReflexive) ||
          !valIsReflexive) {
        return 1;
      }
      if ((!valIsNull && !valIsSymbol && !othIsSymbol && value < other) ||
          (othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol) ||
          (othIsNull && valIsDefined && valIsReflexive) ||
          (!othIsDefined && valIsReflexive) ||
          !othIsReflexive) {
        return -1;
      }
    }
    return 0;
  }

  var _compareAscending = compareAscending;

  /**
   * Used by `_.orderBy` to compare multiple properties of a value to another
   * and stable sort them.
   *
   * If `orders` is unspecified, all values are sorted in ascending order. Otherwise,
   * specify an order of "desc" for descending or "asc" for ascending sort order
   * of corresponding values.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {boolean[]|string[]} orders The order to sort by for each property.
   * @returns {number} Returns the sort order indicator for `object`.
   */
  function compareMultiple(object, other, orders) {
    var index = -1,
        objCriteria = object.criteria,
        othCriteria = other.criteria,
        length = objCriteria.length,
        ordersLength = orders.length;

    while (++index < length) {
      var result = _compareAscending(objCriteria[index], othCriteria[index]);
      if (result) {
        if (index >= ordersLength) {
          return result;
        }
        var order = orders[index];
        return result * (order == 'desc' ? -1 : 1);
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to provide the same value for
    // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
    // for more details.
    //
    // This also ensures a stable sort in V8 and other engines.
    // See https://bugs.chromium.org/p/v8/issues/detail?id=90 for more details.
    return object.index - other.index;
  }

  var _compareMultiple = compareMultiple;

  /**
   * The base implementation of `_.orderBy` without param guards.
   *
   * @private
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
   * @param {string[]} orders The sort orders of `iteratees`.
   * @returns {Array} Returns the new sorted array.
   */
  function baseOrderBy(collection, iteratees, orders) {
    var index = -1;
    iteratees = _arrayMap(iteratees.length ? iteratees : [identity_1], _baseUnary(_baseIteratee));

    var result = _baseMap(collection, function(value, key, collection) {
      var criteria = _arrayMap(iteratees, function(iteratee) {
        return iteratee(value);
      });
      return { 'criteria': criteria, 'index': ++index, 'value': value };
    });

    return _baseSortBy(result, function(object, other) {
      return _compareMultiple(object, other, orders);
    });
  }

  var _baseOrderBy = baseOrderBy;

  /**
   * The base implementation of `_.rest` which doesn't validate or coerce arguments.
   *
   * @private
   * @param {Function} func The function to apply a rest parameter to.
   * @param {number} [start=func.length-1] The start position of the rest parameter.
   * @returns {Function} Returns the new function.
   */
  function baseRest(func, start) {
    return _setToString(_overRest(func, start, identity_1), func + '');
  }

  var _baseRest = baseRest;

  /**
   * Checks if the given arguments are from an iteratee call.
   *
   * @private
   * @param {*} value The potential iteratee value argument.
   * @param {*} index The potential iteratee index or key argument.
   * @param {*} object The potential iteratee object argument.
   * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
   *  else `false`.
   */
  function isIterateeCall(value, index, object) {
    if (!isObject_1(object)) {
      return false;
    }
    var type = typeof index;
    if (type == 'number'
          ? (isArrayLike_1(object) && _isIndex(index, object.length))
          : (type == 'string' && index in object)
        ) {
      return eq_1(object[index], value);
    }
    return false;
  }

  var _isIterateeCall = isIterateeCall;

  /**
   * Creates an array of elements, sorted in ascending order by the results of
   * running each element in a collection thru each iteratee. This method
   * performs a stable sort, that is, it preserves the original sort order of
   * equal elements. The iteratees are invoked with one argument: (value).
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Collection
   * @param {Array|Object} collection The collection to iterate over.
   * @param {...(Function|Function[])} [iteratees=[_.identity]]
   *  The iteratees to sort by.
   * @returns {Array} Returns the new sorted array.
   * @example
   *
   * var users = [
   *   { 'user': 'fred',   'age': 48 },
   *   { 'user': 'barney', 'age': 36 },
   *   { 'user': 'fred',   'age': 40 },
   *   { 'user': 'barney', 'age': 34 }
   * ];
   *
   * _.sortBy(users, [function(o) { return o.user; }]);
   * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 40]]
   *
   * _.sortBy(users, ['user', 'age']);
   * // => objects for [['barney', 34], ['barney', 36], ['fred', 40], ['fred', 48]]
   */
  var sortBy = _baseRest(function(collection, iteratees) {
    if (collection == null) {
      return [];
    }
    var length = iteratees.length;
    if (length > 1 && _isIterateeCall(collection, iteratees[0], iteratees[1])) {
      iteratees = [];
    } else if (length > 2 && _isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
      iteratees = [iteratees[0]];
    }
    return _baseOrderBy(collection, _baseFlatten(iteratees, 1), []);
  });

  var sortBy_1 = sortBy;

  /**
   * Creates an array with all falsey values removed. The values `false`, `null`,
   * `0`, `""`, `undefined`, and `NaN` are falsey.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Array
   * @param {Array} array The array to compact.
   * @returns {Array} Returns the new array of filtered values.
   * @example
   *
   * _.compact([0, 1, false, 2, '', 3]);
   * // => [1, 2, 3]
   */
  function compact$1(array) {
    var index = -1,
        length = array == null ? 0 : array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (value) {
        result[resIndex++] = value;
      }
    }
    return result;
  }

  var compact_1 = compact$1;

  /**
   * A specialized version of `_.reduce` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {*} [accumulator] The initial value.
   * @param {boolean} [initAccum] Specify using the first element of `array` as
   *  the initial value.
   * @returns {*} Returns the accumulated value.
   */
  function arrayReduce(array, iteratee, accumulator, initAccum) {
    var index = -1,
        length = array == null ? 0 : array.length;

    if (initAccum && length) {
      accumulator = array[++index];
    }
    while (++index < length) {
      accumulator = iteratee(accumulator, array[index], index, array);
    }
    return accumulator;
  }

  var _arrayReduce = arrayReduce;

  /**
   * The base implementation of `_.propertyOf` without support for deep paths.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Function} Returns the new accessor function.
   */
  function basePropertyOf(object) {
    return function(key) {
      return object == null ? undefined : object[key];
    };
  }

  var _basePropertyOf = basePropertyOf;

  /** Used to map Latin Unicode letters to basic Latin letters. */
  var deburredLetters = {
    // Latin-1 Supplement block.
    '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
    '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
    '\xc7': 'C',  '\xe7': 'c',
    '\xd0': 'D',  '\xf0': 'd',
    '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
    '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
    '\xcc': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
    '\xec': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
    '\xd1': 'N',  '\xf1': 'n',
    '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
    '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
    '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
    '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
    '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
    '\xc6': 'Ae', '\xe6': 'ae',
    '\xde': 'Th', '\xfe': 'th',
    '\xdf': 'ss',
    // Latin Extended-A block.
    '\u0100': 'A',  '\u0102': 'A', '\u0104': 'A',
    '\u0101': 'a',  '\u0103': 'a', '\u0105': 'a',
    '\u0106': 'C',  '\u0108': 'C', '\u010a': 'C', '\u010c': 'C',
    '\u0107': 'c',  '\u0109': 'c', '\u010b': 'c', '\u010d': 'c',
    '\u010e': 'D',  '\u0110': 'D', '\u010f': 'd', '\u0111': 'd',
    '\u0112': 'E',  '\u0114': 'E', '\u0116': 'E', '\u0118': 'E', '\u011a': 'E',
    '\u0113': 'e',  '\u0115': 'e', '\u0117': 'e', '\u0119': 'e', '\u011b': 'e',
    '\u011c': 'G',  '\u011e': 'G', '\u0120': 'G', '\u0122': 'G',
    '\u011d': 'g',  '\u011f': 'g', '\u0121': 'g', '\u0123': 'g',
    '\u0124': 'H',  '\u0126': 'H', '\u0125': 'h', '\u0127': 'h',
    '\u0128': 'I',  '\u012a': 'I', '\u012c': 'I', '\u012e': 'I', '\u0130': 'I',
    '\u0129': 'i',  '\u012b': 'i', '\u012d': 'i', '\u012f': 'i', '\u0131': 'i',
    '\u0134': 'J',  '\u0135': 'j',
    '\u0136': 'K',  '\u0137': 'k', '\u0138': 'k',
    '\u0139': 'L',  '\u013b': 'L', '\u013d': 'L', '\u013f': 'L', '\u0141': 'L',
    '\u013a': 'l',  '\u013c': 'l', '\u013e': 'l', '\u0140': 'l', '\u0142': 'l',
    '\u0143': 'N',  '\u0145': 'N', '\u0147': 'N', '\u014a': 'N',
    '\u0144': 'n',  '\u0146': 'n', '\u0148': 'n', '\u014b': 'n',
    '\u014c': 'O',  '\u014e': 'O', '\u0150': 'O',
    '\u014d': 'o',  '\u014f': 'o', '\u0151': 'o',
    '\u0154': 'R',  '\u0156': 'R', '\u0158': 'R',
    '\u0155': 'r',  '\u0157': 'r', '\u0159': 'r',
    '\u015a': 'S',  '\u015c': 'S', '\u015e': 'S', '\u0160': 'S',
    '\u015b': 's',  '\u015d': 's', '\u015f': 's', '\u0161': 's',
    '\u0162': 'T',  '\u0164': 'T', '\u0166': 'T',
    '\u0163': 't',  '\u0165': 't', '\u0167': 't',
    '\u0168': 'U',  '\u016a': 'U', '\u016c': 'U', '\u016e': 'U', '\u0170': 'U', '\u0172': 'U',
    '\u0169': 'u',  '\u016b': 'u', '\u016d': 'u', '\u016f': 'u', '\u0171': 'u', '\u0173': 'u',
    '\u0174': 'W',  '\u0175': 'w',
    '\u0176': 'Y',  '\u0177': 'y', '\u0178': 'Y',
    '\u0179': 'Z',  '\u017b': 'Z', '\u017d': 'Z',
    '\u017a': 'z',  '\u017c': 'z', '\u017e': 'z',
    '\u0132': 'IJ', '\u0133': 'ij',
    '\u0152': 'Oe', '\u0153': 'oe',
    '\u0149': "'n", '\u017f': 's'
  };

  /**
   * Used by `_.deburr` to convert Latin-1 Supplement and Latin Extended-A
   * letters to basic Latin letters.
   *
   * @private
   * @param {string} letter The matched letter to deburr.
   * @returns {string} Returns the deburred letter.
   */
  var deburrLetter = _basePropertyOf(deburredLetters);

  var _deburrLetter = deburrLetter;

  /** Used to match Latin Unicode letters (excluding mathematical operators). */
  var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;

  /** Used to compose unicode character classes. */
  var rsComboMarksRange = '\\u0300-\\u036f',
      reComboHalfMarksRange = '\\ufe20-\\ufe2f',
      rsComboSymbolsRange = '\\u20d0-\\u20ff',
      rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange;

  /** Used to compose unicode capture groups. */
  var rsCombo = '[' + rsComboRange + ']';

  /**
   * Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks) and
   * [combining diacritical marks for symbols](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks_for_Symbols).
   */
  var reComboMark = RegExp(rsCombo, 'g');

  /**
   * Deburrs `string` by converting
   * [Latin-1 Supplement](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
   * and [Latin Extended-A](https://en.wikipedia.org/wiki/Latin_Extended-A)
   * letters to basic Latin letters and removing
   * [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category String
   * @param {string} [string=''] The string to deburr.
   * @returns {string} Returns the deburred string.
   * @example
   *
   * _.deburr('déjà vu');
   * // => 'deja vu'
   */
  function deburr(string) {
    string = toString_1(string);
    return string && string.replace(reLatin, _deburrLetter).replace(reComboMark, '');
  }

  var deburr_1 = deburr;

  /** Used to match words composed of alphanumeric characters. */
  var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;

  /**
   * Splits an ASCII `string` into an array of its words.
   *
   * @private
   * @param {string} The string to inspect.
   * @returns {Array} Returns the words of `string`.
   */
  function asciiWords(string) {
    return string.match(reAsciiWord) || [];
  }

  var _asciiWords = asciiWords;

  /** Used to detect strings that need a more robust regexp to match words. */
  var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;

  /**
   * Checks if `string` contains a word composed of Unicode symbols.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {boolean} Returns `true` if a word is found, else `false`.
   */
  function hasUnicodeWord(string) {
    return reHasUnicodeWord.test(string);
  }

  var _hasUnicodeWord = hasUnicodeWord;

  /** Used to compose unicode character classes. */
  var rsAstralRange = '\\ud800-\\udfff',
      rsComboMarksRange$1 = '\\u0300-\\u036f',
      reComboHalfMarksRange$1 = '\\ufe20-\\ufe2f',
      rsComboSymbolsRange$1 = '\\u20d0-\\u20ff',
      rsComboRange$1 = rsComboMarksRange$1 + reComboHalfMarksRange$1 + rsComboSymbolsRange$1,
      rsDingbatRange = '\\u2700-\\u27bf',
      rsLowerRange = 'a-z\\xdf-\\xf6\\xf8-\\xff',
      rsMathOpRange = '\\xac\\xb1\\xd7\\xf7',
      rsNonCharRange = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf',
      rsPunctuationRange = '\\u2000-\\u206f',
      rsSpaceRange = ' \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000',
      rsUpperRange = 'A-Z\\xc0-\\xd6\\xd8-\\xde',
      rsVarRange = '\\ufe0e\\ufe0f',
      rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;

  /** Used to compose unicode capture groups. */
  var rsApos = "['\u2019]",
      rsBreak = '[' + rsBreakRange + ']',
      rsCombo$1 = '[' + rsComboRange$1 + ']',
      rsDigits = '\\d+',
      rsDingbat = '[' + rsDingbatRange + ']',
      rsLower = '[' + rsLowerRange + ']',
      rsMisc = '[^' + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + ']',
      rsFitz = '\\ud83c[\\udffb-\\udfff]',
      rsModifier = '(?:' + rsCombo$1 + '|' + rsFitz + ')',
      rsNonAstral = '[^' + rsAstralRange + ']',
      rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
      rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
      rsUpper = '[' + rsUpperRange + ']',
      rsZWJ = '\\u200d';

  /** Used to compose unicode regexes. */
  var rsMiscLower = '(?:' + rsLower + '|' + rsMisc + ')',
      rsMiscUpper = '(?:' + rsUpper + '|' + rsMisc + ')',
      rsOptContrLower = '(?:' + rsApos + '(?:d|ll|m|re|s|t|ve))?',
      rsOptContrUpper = '(?:' + rsApos + '(?:D|LL|M|RE|S|T|VE))?',
      reOptMod = rsModifier + '?',
      rsOptVar = '[' + rsVarRange + ']?',
      rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
      rsOrdLower = '\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])',
      rsOrdUpper = '\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])',
      rsSeq = rsOptVar + reOptMod + rsOptJoin,
      rsEmoji = '(?:' + [rsDingbat, rsRegional, rsSurrPair].join('|') + ')' + rsSeq;

  /** Used to match complex or compound words. */
  var reUnicodeWord = RegExp([
    rsUpper + '?' + rsLower + '+' + rsOptContrLower + '(?=' + [rsBreak, rsUpper, '$'].join('|') + ')',
    rsMiscUpper + '+' + rsOptContrUpper + '(?=' + [rsBreak, rsUpper + rsMiscLower, '$'].join('|') + ')',
    rsUpper + '?' + rsMiscLower + '+' + rsOptContrLower,
    rsUpper + '+' + rsOptContrUpper,
    rsOrdUpper,
    rsOrdLower,
    rsDigits,
    rsEmoji
  ].join('|'), 'g');

  /**
   * Splits a Unicode `string` into an array of its words.
   *
   * @private
   * @param {string} The string to inspect.
   * @returns {Array} Returns the words of `string`.
   */
  function unicodeWords(string) {
    return string.match(reUnicodeWord) || [];
  }

  var _unicodeWords = unicodeWords;

  /**
   * Splits `string` into an array of its words.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category String
   * @param {string} [string=''] The string to inspect.
   * @param {RegExp|string} [pattern] The pattern to match words.
   * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
   * @returns {Array} Returns the words of `string`.
   * @example
   *
   * _.words('fred, barney, & pebbles');
   * // => ['fred', 'barney', 'pebbles']
   *
   * _.words('fred, barney, & pebbles', /[^, ]+/g);
   * // => ['fred', 'barney', '&', 'pebbles']
   */
  function words(string, pattern, guard) {
    string = toString_1(string);
    pattern = guard ? undefined : pattern;

    if (pattern === undefined) {
      return _hasUnicodeWord(string) ? _unicodeWords(string) : _asciiWords(string);
    }
    return string.match(pattern) || [];
  }

  var words_1 = words;

  /** Used to compose unicode capture groups. */
  var rsApos$1 = "['\u2019]";

  /** Used to match apostrophes. */
  var reApos = RegExp(rsApos$1, 'g');

  /**
   * Creates a function like `_.camelCase`.
   *
   * @private
   * @param {Function} callback The function to combine each word.
   * @returns {Function} Returns the new compounder function.
   */
  function createCompounder(callback) {
    return function(string) {
      return _arrayReduce(words_1(deburr_1(string).replace(reApos, '')), callback, '');
    };
  }

  var _createCompounder = createCompounder;

  /**
   * Casts `array` to a slice if it's needed.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {number} start The start position.
   * @param {number} [end=array.length] The end position.
   * @returns {Array} Returns the cast slice.
   */
  function castSlice(array, start, end) {
    var length = array.length;
    end = end === undefined ? length : end;
    return (!start && end >= length) ? array : _baseSlice(array, start, end);
  }

  var _castSlice = castSlice;

  /** Used to compose unicode character classes. */
  var rsAstralRange$1 = '\\ud800-\\udfff',
      rsComboMarksRange$2 = '\\u0300-\\u036f',
      reComboHalfMarksRange$2 = '\\ufe20-\\ufe2f',
      rsComboSymbolsRange$2 = '\\u20d0-\\u20ff',
      rsComboRange$2 = rsComboMarksRange$2 + reComboHalfMarksRange$2 + rsComboSymbolsRange$2,
      rsVarRange$1 = '\\ufe0e\\ufe0f';

  /** Used to compose unicode capture groups. */
  var rsZWJ$1 = '\\u200d';

  /** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
  var reHasUnicode = RegExp('[' + rsZWJ$1 + rsAstralRange$1  + rsComboRange$2 + rsVarRange$1 + ']');

  /**
   * Checks if `string` contains Unicode symbols.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {boolean} Returns `true` if a symbol is found, else `false`.
   */
  function hasUnicode(string) {
    return reHasUnicode.test(string);
  }

  var _hasUnicode = hasUnicode;

  /**
   * Converts an ASCII `string` to an array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the converted array.
   */
  function asciiToArray(string) {
    return string.split('');
  }

  var _asciiToArray = asciiToArray;

  /** Used to compose unicode character classes. */
  var rsAstralRange$2 = '\\ud800-\\udfff',
      rsComboMarksRange$3 = '\\u0300-\\u036f',
      reComboHalfMarksRange$3 = '\\ufe20-\\ufe2f',
      rsComboSymbolsRange$3 = '\\u20d0-\\u20ff',
      rsComboRange$3 = rsComboMarksRange$3 + reComboHalfMarksRange$3 + rsComboSymbolsRange$3,
      rsVarRange$2 = '\\ufe0e\\ufe0f';

  /** Used to compose unicode capture groups. */
  var rsAstral = '[' + rsAstralRange$2 + ']',
      rsCombo$2 = '[' + rsComboRange$3 + ']',
      rsFitz$1 = '\\ud83c[\\udffb-\\udfff]',
      rsModifier$1 = '(?:' + rsCombo$2 + '|' + rsFitz$1 + ')',
      rsNonAstral$1 = '[^' + rsAstralRange$2 + ']',
      rsRegional$1 = '(?:\\ud83c[\\udde6-\\uddff]){2}',
      rsSurrPair$1 = '[\\ud800-\\udbff][\\udc00-\\udfff]',
      rsZWJ$2 = '\\u200d';

  /** Used to compose unicode regexes. */
  var reOptMod$1 = rsModifier$1 + '?',
      rsOptVar$1 = '[' + rsVarRange$2 + ']?',
      rsOptJoin$1 = '(?:' + rsZWJ$2 + '(?:' + [rsNonAstral$1, rsRegional$1, rsSurrPair$1].join('|') + ')' + rsOptVar$1 + reOptMod$1 + ')*',
      rsSeq$1 = rsOptVar$1 + reOptMod$1 + rsOptJoin$1,
      rsSymbol = '(?:' + [rsNonAstral$1 + rsCombo$2 + '?', rsCombo$2, rsRegional$1, rsSurrPair$1, rsAstral].join('|') + ')';

  /** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
  var reUnicode = RegExp(rsFitz$1 + '(?=' + rsFitz$1 + ')|' + rsSymbol + rsSeq$1, 'g');

  /**
   * Converts a Unicode `string` to an array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the converted array.
   */
  function unicodeToArray(string) {
    return string.match(reUnicode) || [];
  }

  var _unicodeToArray = unicodeToArray;

  /**
   * Converts `string` to an array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the converted array.
   */
  function stringToArray(string) {
    return _hasUnicode(string)
      ? _unicodeToArray(string)
      : _asciiToArray(string);
  }

  var _stringToArray = stringToArray;

  /**
   * Creates a function like `_.lowerFirst`.
   *
   * @private
   * @param {string} methodName The name of the `String` case method to use.
   * @returns {Function} Returns the new case function.
   */
  function createCaseFirst(methodName) {
    return function(string) {
      string = toString_1(string);

      var strSymbols = _hasUnicode(string)
        ? _stringToArray(string)
        : undefined;

      var chr = strSymbols
        ? strSymbols[0]
        : string.charAt(0);

      var trailing = strSymbols
        ? _castSlice(strSymbols, 1).join('')
        : string.slice(1);

      return chr[methodName]() + trailing;
    };
  }

  var _createCaseFirst = createCaseFirst;

  /**
   * Converts the first character of `string` to upper case.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category String
   * @param {string} [string=''] The string to convert.
   * @returns {string} Returns the converted string.
   * @example
   *
   * _.upperFirst('fred');
   * // => 'Fred'
   *
   * _.upperFirst('FRED');
   * // => 'FRED'
   */
  var upperFirst = _createCaseFirst('toUpperCase');

  var upperFirst_1 = upperFirst;

  /**
   * Converts `string` to
   * [start case](https://en.wikipedia.org/wiki/Letter_case#Stylistic_or_specialised_usage).
   *
   * @static
   * @memberOf _
   * @since 3.1.0
   * @category String
   * @param {string} [string=''] The string to convert.
   * @returns {string} Returns the start cased string.
   * @example
   *
   * _.startCase('--foo-bar--');
   * // => 'Foo Bar'
   *
   * _.startCase('fooBar');
   * // => 'Foo Bar'
   *
   * _.startCase('__FOO_BAR__');
   * // => 'FOO BAR'
   */
  var startCase = _createCompounder(function(result, word, index) {
    return result + (index ? ' ' : '') + upperFirst_1(word);
  });

  var startCase_1 = startCase;

  class SidebarMatch extends y {
      constructor() {
          super(...arguments);
          this.state = {
              isOpen: false
          };
          this.toggleOpen = () => {
              this.setState({ isOpen: !this.state.isOpen });
          };
          this.scrollToRange = (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.props.selectMatch(this.props.output.matchId);
              const decorationElement = document.querySelector(`[${DECORATION_ATTRIBUTE_ID}="${this.props.output.matchId}"]`);
              if (decorationElement) {
                  decorationElement.scrollIntoView({
                      behavior: "smooth"
                  });
              }
          };
          this.handleMouseEnter = () => {
              this.props.indicateHover(this.props.output.matchId);
          };
          this.handleMouseLeave = () => {
              this.props.stopHover();
          };
      }
      render() {
          const { output, applySuggestions, selectedMatch } = this.props;
          const color = `#${output.category.colour}`;
          const hasSuggestions = !!output.suggestions && !!output.suggestions.length;
          const suggestions = compact_1([
              output.replacement,
              ...(output.suggestions || [])
          ]);
          return (h("div", { className: `SidebarMatch__container ${selectedMatch === output.matchId
                ? "SidebarMatch__container--is-selected"
                : ""}`, style: { borderLeft: `2px solid ${color}` }, onMouseEnter: this.handleMouseEnter, onMouseLeave: this.handleMouseLeave, onClick: this.scrollToRange, title: "Click to scroll to this match" },
              h("div", { className: "SidebarMatch__header", onClick: hasSuggestions ? this.toggleOpen : undefined },
                  h("div", { className: "SidebarMatch__header-label" },
                      h("div", null,
                          h("div", { className: "SidebarMatch__header-match-text" }, output.matchedText),
                          h("div", { className: "SidebarMatch__header-description" }, output.message)),
                      h("div", { className: "SidebarMatch__header-meta" },
                          h("div", { className: "SidebarMatch__header-category", style: { color } }, startCase_1(output.category.name)),
                          hasSuggestions && (h("div", { className: "SidebarMatch__header-toggle-status" }, this.state.isOpen ? "-" : "+"))))),
              this.state.isOpen && (h("div", { className: "SidebarMatch__content" }, suggestions.length && (h("div", { className: "SidebarMatch__suggestion-list" },
                  h(SuggestionList, { applySuggestions: applySuggestions, matchId: output.matchId, suggestions: suggestions })))))));
      }
  }

  class Sidebar extends y {
      constructor() {
          super(...arguments);
          this.handleNewState = (pluginState) => {
              this.setState({
                  pluginState: Object.assign(Object.assign({}, pluginState), { currentMatches: sortBy_1(pluginState.currentMatches, "from") })
              });
              const oldKeys = this.state.pluginState
                  ? Object.keys(this.state.pluginState.requestsInFlight)
                  : [];
              const newKeys = Object.keys(pluginState.requestsInFlight);
              if (oldKeys.length && !newKeys.length) {
                  setTimeout(this.maybeResetLoadingBar, 300);
              }
              if (!oldKeys.length && newKeys.length) {
                  this.setState({ loadingBarVisible: true });
              }
          };
          this.maybeResetLoadingBar = () => {
              if (!this.state.pluginState ||
                  !!Object.keys(this.state.pluginState.requestsInFlight)) {
                  this.setState({ loadingBarVisible: false });
              }
          };
          this.getPercentRemaining = () => {
              const state = this.state.pluginState;
              if (!state) {
                  return 0;
              }
              return selectPercentRemaining(state);
          };
          this.getNoOfAutoFixableSuggestions = () => {
              const state = this.state.pluginState;
              if (!state) {
                  return 0;
              }
              return selectAllAutoFixableMatches(state).length;
          };
      }
      componentWillMount() {
          this.props.store.on(STORE_EVENT_NEW_STATE, this.handleNewState);
      }
      render() {
          const { applySuggestions, applyAutoFixableSuggestions, selectMatch, indicateHover, stopHover, contactHref } = this.props;
          const { currentMatches = [], requestsInFlight, selectedMatch } = this.state
              .pluginState || { selectedMatch: undefined };
          const hasMatches = !!(currentMatches && currentMatches.length);
          const noOfAutoFixableSuggestions = this.getNoOfAutoFixableSuggestions();
          const percentRemaining = this.getPercentRemaining();
          const isLoading = !!requestsInFlight && !!Object.keys(requestsInFlight).length;
          return (h("div", { className: "Sidebar__section" },
              h("div", { className: "Sidebar__header-container" },
                  h("div", { className: "Sidebar__header" },
                      h("span", null,
                          "Results ",
                          hasMatches && h("span", null,
                              "(",
                              currentMatches.length,
                              ") ")),
                      !!noOfAutoFixableSuggestions && (h("button", { class: "Button flex-align-right", onClick: applyAutoFixableSuggestions },
                          "Fix all (",
                          noOfAutoFixableSuggestions,
                          ")"))),
                  h("div", { className: "Sidebar__header-contact" },
                      h("a", { href: contactHref, target: "_blank" }, "Issue with a rule? Let us know!")),
                  this.state.loadingBarVisible && (h("div", { class: "LoadingBar", style: {
                          opacity: isLoading ? 1 : 0,
                          width: `${100 - percentRemaining}%`
                      } }))),
              h("div", { className: "Sidebar__content" },
                  hasMatches && (h("ul", { className: "Sidebar__list" }, currentMatches.map(output => (h("li", { className: "Sidebar__list-item", key: output.matchId },
                      h(SidebarMatch, { output: output, selectedMatch: selectedMatch, applySuggestions: applySuggestions, selectMatch: selectMatch, indicateHover: indicateHover, stopHover: stopHover })))))),
                  !hasMatches && (h("div", { className: "Sidebar__awaiting-match" }, "No matches to report.")))));
      }
  }

  var rngBrowser = createCommonjsModule$1(function (module) {
  // Unique ID creation requires a high quality random # generator.  In the
  // browser this is a little complicated due to unknown quality of Math.random()
  // and inconsistent support for the `crypto` API.  We do the best we can via
  // feature-detection

  // getRandomValues needs to be invoked in a context where "this" is a Crypto
  // implementation. Also, find the complete implementation of crypto on IE11.
  var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                        (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

  if (getRandomValues) {
    // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
    var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

    module.exports = function whatwgRNG() {
      getRandomValues(rnds8);
      return rnds8;
    };
  } else {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var rnds = new Array(16);

    module.exports = function mathRNG() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return rnds;
    };
  }
  });

  /**
   * Convert array of 16 byte values to UUID string format of the form:
   * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   */
  var byteToHex = [];
  for (var i$3 = 0; i$3 < 256; ++i$3) {
    byteToHex[i$3] = (i$3 + 0x100).toString(16).substr(1);
  }

  function bytesToUuid(buf, offset) {
    var i = offset || 0;
    var bth = byteToHex;
    // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
    return ([bth[buf[i++]], bth[buf[i++]], 
  	bth[buf[i++]], bth[buf[i++]], '-',
  	bth[buf[i++]], bth[buf[i++]], '-',
  	bth[buf[i++]], bth[buf[i++]], '-',
  	bth[buf[i++]], bth[buf[i++]], '-',
  	bth[buf[i++]], bth[buf[i++]],
  	bth[buf[i++]], bth[buf[i++]],
  	bth[buf[i++]], bth[buf[i++]]]).join('');
  }

  var bytesToUuid_1 = bytesToUuid;

  function v4(options, buf, offset) {
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options === 'binary' ? new Array(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || rngBrowser)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ++ii) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || bytesToUuid_1(rnds);
  }

  var v4_1 = v4;

  class Controls extends y {
      constructor() {
          super(...arguments);
          this.state = {
              isOpen: false,
              allCategories: [],
              currentCategories: [],
              isLoadingCategories: false,
              pluginState: undefined
          };
          this.handleNotify = (state) => {
              this.setState({ pluginState: state });
          };
          this.toggleOpenState = () => this.setState({ isOpen: !this.state.isOpen });
          this.setCategoryState = (categoryId, enabled) => {
              enabled
                  ? this.props.addCategory(categoryId)
                  : this.props.removeCategory(categoryId);
              this.setState({
                  currentCategories: this.props.getCurrentCategories()
              });
          };
          this.initCategories = () => __awaiter(this, void 0, void 0, function* () {
              const allCategories = yield this.fetchCategories();
              if (!allCategories) {
                  return;
              }
              this.setState({
                  currentCategories: allCategories
              });
              allCategories.forEach(category => this.props.addCategory(category.id));
          });
          this.fetchCategories = () => __awaiter(this, void 0, void 0, function* () {
              this.setState({ isLoadingCategories: true });
              try {
                  const allCategories = yield this.props.fetchCategories();
                  this.setState({
                      allCategories,
                      isLoadingCategories: false
                  });
                  return allCategories;
              }
              catch (e) {
                  this.setState({
                      isLoadingCategories: false
                  });
              }
          });
          this.requestMatchesForDocument = () => {
              this.props.requestMatchesForDocument(v4_1(), this.props.getCurrentCategories().map(_ => _.id));
          };
      }
      componentWillMount() {
          this.props.store.on(STORE_EVENT_NEW_STATE, this.handleNotify);
          this.initCategories();
      }
      render() {
          var _a;
          const { isOpen, isLoadingCategories } = this.state;
          return (h("div", { className: "Sidebar__section" },
              h("div", { className: "Sidebar__header-container" },
                  h("div", { className: "Sidebar__header Sidebar__header-toggle", onClick: this.toggleOpenState },
                      "Controls",
                      h("div", { className: "Sidebar__toggle-label" }, "Advanced"),
                      h("div", { className: "Sidebar__toggle", style: { transform: isOpen ? "" : "rotate(-90deg)" } }, "\u25BC"))),
              h("div", { className: "Sidebar__content" },
                  isOpen && (h("div", null,
                      h("div", { className: "Controls__row" },
                          "Select categories\u00A0",
                          isLoadingCategories && (h("span", { className: "Sidebar__loading-spinner" }, "|")),
                          h("button", { type: "button", class: "Button flex-align-right", onClick: this.fetchCategories }, "Refresh")),
                      this.state.allCategories.map(category => (h("div", { className: "Controls__row" },
                          h("label", { className: "Controls__label", for: "Controls__show-dirty-ranges" }, category.name),
                          h("div", { class: "Controls__input" },
                              h("input", { id: "Controls__show-dirty-ranges", type: "checkbox", checked: !!this.state.currentCategories.find(_ => _.id === category.id), className: "Input", onInput: (e) => this.setCategoryState(category.id, e.target.checked) }))))),
                      h("div", { className: "Controls__row" },
                          h("hr", null)))),
                  h("div", { className: "Controls__row" },
                      h("button", { type: "button", className: "Button", onClick: this.requestMatchesForDocument, disabled: this.state.pluginState &&
                              !!Object.keys(this.state.pluginState.requestsInFlight).length }, "Check whole document")),
                  h("div", { className: "Controls__row", style: "color:Red" }, (_a = this.state.pluginState) === null || _a === void 0 ? void 0 : _a.error))));
      }
  }

  const createView = (view, store, matcherService, commands, sidebarNode, controlsNode, contactHref) => {
      const overlayNode = document.createElement("div");
      const wrapperElement = document.createElement("div");
      wrapperElement.classList.add("TyperighterPlugin__container");
      view.dom.parentNode.replaceChild(wrapperElement, view.dom);
      wrapperElement.appendChild(view.dom);
      view.dom.insertAdjacentElement("afterend", overlayNode);
      E(h(MatchOverlay, { store: store, applySuggestions: (suggestionOpts) => {
              commands.applySuggestions(suggestionOpts);
              commands.stopHover();
          }, containerElement: wrapperElement }), overlayNode);
      E(h(Sidebar, { store: store, applySuggestions: commands.applySuggestions, applyAutoFixableSuggestions: commands.applyAutoFixableSuggestions, selectMatch: commands.selectMatch, indicateHover: commands.indicateHover, stopHover: commands.stopHover, contactHref: contactHref }), sidebarNode);
      E(h(Controls, { store: store, setDebugState: commands.setDebugState, setRequestOnDocModified: commands.setRequestOnDocModified, requestMatchesForDocument: commands.requestMatchesForDocument, fetchCategories: matcherService.fetchCategories, getCurrentCategories: matcherService.getCurrentCategories, addCategory: matcherService.addCategory, removeCategory: matcherService.removeCategory }), controlsNode);
  };

  class MatcherService {
      constructor(store, commands, adapter, initialThrottle = 2000) {
          this.store = store;
          this.commands = commands;
          this.adapter = adapter;
          this.initialThrottle = initialThrottle;
          this.currentCategories = [];
          this.allCategories = [];
          this.requestPending = false;
          this.fetchCategories = () => __awaiter(this, void 0, void 0, function* () {
              this.allCategories = yield this.adapter.fetchCategories();
              return this.allCategories;
          });
          this.getCurrentCategories = () => this.currentCategories;
          this.addCategory = (categoryId) => {
              const category = this.allCategories.find(_ => _.id === categoryId);
              if (!category) {
                  return;
              }
              this.currentCategories.push(category);
          };
          this.removeCategory = (categoryId) => {
              this.currentCategories = this.currentCategories.filter(_ => _.id !== categoryId);
          };
          this.scheduleRequest = () => {
              if (this.requestPending) {
                  return;
              }
              this.requestPending = true;
              setTimeout(() => this.requestFetchMatches(), this.currentThrottle);
          };
          this.currentThrottle = this.initialThrottle;
          this.store.on(STORE_EVENT_NEW_MATCHES, (requestId, requestsInFlight) => {
              this.fetchMatches(requestId, requestsInFlight);
          });
          this.store.on(STORE_EVENT_NEW_DIRTIED_RANGES, () => {
              this.scheduleRequest();
          });
      }
      fetchMatches(requestId, blocks) {
          return __awaiter(this, void 0, void 0, function* () {
              this.adapter.fetchMatches(requestId, blocks, this.currentCategories.map(_ => _.id), this.commands.applyMatcherResponse, this.commands.applyRequestError, this.commands.applyRequestComplete);
          });
      }
      requestFetchMatches() {
          this.requestPending = false;
          const pluginState = this.store.getState();
          if (!pluginState || selectAllBlockQueriesInFlight(pluginState).length) {
              return this.scheduleRequest();
          }
          const requestId = v4_1();
          this.commands.requestMatchesForDirtyRanges(requestId, this.getCurrentCategories().map(_ => _.id));
      }
  }

  /**
   * Gets the timestamp of the number of milliseconds that have elapsed since
   * the Unix epoch (1 January 1970 00:00:00 UTC).
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Date
   * @returns {number} Returns the timestamp.
   * @example
   *
   * _.defer(function(stamp) {
   *   console.log(_.now() - stamp);
   * }, _.now());
   * // => Logs the number of milliseconds it took for the deferred invocation.
   */
  var now = function() {
    return _root.Date.now();
  };

  var now_1 = now;

  /** Error message constants. */
  var FUNC_ERROR_TEXT$1 = 'Expected a function';

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeMax$1 = Math.max,
      nativeMin = Math.min;

  /**
   * Creates a debounced function that delays invoking `func` until after `wait`
   * milliseconds have elapsed since the last time the debounced function was
   * invoked. The debounced function comes with a `cancel` method to cancel
   * delayed `func` invocations and a `flush` method to immediately invoke them.
   * Provide `options` to indicate whether `func` should be invoked on the
   * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
   * with the last arguments provided to the debounced function. Subsequent
   * calls to the debounced function return the result of the last `func`
   * invocation.
   *
   * **Note:** If `leading` and `trailing` options are `true`, `func` is
   * invoked on the trailing edge of the timeout only if the debounced function
   * is invoked more than once during the `wait` timeout.
   *
   * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
   * until to the next tick, similar to `setTimeout` with a timeout of `0`.
   *
   * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
   * for details over the differences between `_.debounce` and `_.throttle`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to debounce.
   * @param {number} [wait=0] The number of milliseconds to delay.
   * @param {Object} [options={}] The options object.
   * @param {boolean} [options.leading=false]
   *  Specify invoking on the leading edge of the timeout.
   * @param {number} [options.maxWait]
   *  The maximum time `func` is allowed to be delayed before it's invoked.
   * @param {boolean} [options.trailing=true]
   *  Specify invoking on the trailing edge of the timeout.
   * @returns {Function} Returns the new debounced function.
   * @example
   *
   * // Avoid costly calculations while the window size is in flux.
   * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
   *
   * // Invoke `sendMail` when clicked, debouncing subsequent calls.
   * jQuery(element).on('click', _.debounce(sendMail, 300, {
   *   'leading': true,
   *   'trailing': false
   * }));
   *
   * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
   * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
   * var source = new EventSource('/stream');
   * jQuery(source).on('message', debounced);
   *
   * // Cancel the trailing debounced invocation.
   * jQuery(window).on('popstate', debounced.cancel);
   */
  function debounce(func, wait, options) {
    var lastArgs,
        lastThis,
        maxWait,
        result,
        timerId,
        lastCallTime,
        lastInvokeTime = 0,
        leading = false,
        maxing = false,
        trailing = true;

    if (typeof func != 'function') {
      throw new TypeError(FUNC_ERROR_TEXT$1);
    }
    wait = toNumber_1(wait) || 0;
    if (isObject_1(options)) {
      leading = !!options.leading;
      maxing = 'maxWait' in options;
      maxWait = maxing ? nativeMax$1(toNumber_1(options.maxWait) || 0, wait) : maxWait;
      trailing = 'trailing' in options ? !!options.trailing : trailing;
    }

    function invokeFunc(time) {
      var args = lastArgs,
          thisArg = lastThis;

      lastArgs = lastThis = undefined;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    }

    function leadingEdge(time) {
      // Reset any `maxWait` timer.
      lastInvokeTime = time;
      // Start the timer for the trailing edge.
      timerId = setTimeout(timerExpired, wait);
      // Invoke the leading edge.
      return leading ? invokeFunc(time) : result;
    }

    function remainingWait(time) {
      var timeSinceLastCall = time - lastCallTime,
          timeSinceLastInvoke = time - lastInvokeTime,
          timeWaiting = wait - timeSinceLastCall;

      return maxing
        ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
        : timeWaiting;
    }

    function shouldInvoke(time) {
      var timeSinceLastCall = time - lastCallTime,
          timeSinceLastInvoke = time - lastInvokeTime;

      // Either this is the first call, activity has stopped and we're at the
      // trailing edge, the system time has gone backwards and we're treating
      // it as the trailing edge, or we've hit the `maxWait` limit.
      return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
        (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
    }

    function timerExpired() {
      var time = now_1();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      // Restart the timer.
      timerId = setTimeout(timerExpired, remainingWait(time));
    }

    function trailingEdge(time) {
      timerId = undefined;

      // Only invoke if we have `lastArgs` which means `func` has been
      // debounced at least once.
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = lastThis = undefined;
      return result;
    }

    function cancel() {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
      lastInvokeTime = 0;
      lastArgs = lastCallTime = lastThis = timerId = undefined;
    }

    function flush() {
      return timerId === undefined ? result : trailingEdge(now_1());
    }

    function debounced() {
      var time = now_1(),
          isInvoking = shouldInvoke(time);

      lastArgs = arguments;
      lastThis = this;
      lastCallTime = time;

      if (isInvoking) {
        if (timerId === undefined) {
          return leadingEdge(lastCallTime);
        }
        if (maxing) {
          // Handle invocations in a tight loop.
          clearTimeout(timerId);
          timerId = setTimeout(timerExpired, wait);
          return invokeFunc(lastCallTime);
        }
      }
      if (timerId === undefined) {
        timerId = setTimeout(timerExpired, wait);
      }
      return result;
    }
    debounced.cancel = cancel;
    debounced.flush = flush;
    return debounced;
  }

  var debounce_1 = debounce;

  /** Error message constants. */
  var FUNC_ERROR_TEXT$2 = 'Expected a function';

  /**
   * Creates a throttled function that only invokes `func` at most once per
   * every `wait` milliseconds. The throttled function comes with a `cancel`
   * method to cancel delayed `func` invocations and a `flush` method to
   * immediately invoke them. Provide `options` to indicate whether `func`
   * should be invoked on the leading and/or trailing edge of the `wait`
   * timeout. The `func` is invoked with the last arguments provided to the
   * throttled function. Subsequent calls to the throttled function return the
   * result of the last `func` invocation.
   *
   * **Note:** If `leading` and `trailing` options are `true`, `func` is
   * invoked on the trailing edge of the timeout only if the throttled function
   * is invoked more than once during the `wait` timeout.
   *
   * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
   * until to the next tick, similar to `setTimeout` with a timeout of `0`.
   *
   * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
   * for details over the differences between `_.throttle` and `_.debounce`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to throttle.
   * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
   * @param {Object} [options={}] The options object.
   * @param {boolean} [options.leading=true]
   *  Specify invoking on the leading edge of the timeout.
   * @param {boolean} [options.trailing=true]
   *  Specify invoking on the trailing edge of the timeout.
   * @returns {Function} Returns the new throttled function.
   * @example
   *
   * // Avoid excessively updating the position while scrolling.
   * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
   *
   * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
   * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
   * jQuery(element).on('click', throttled);
   *
   * // Cancel the trailing throttled invocation.
   * jQuery(window).on('popstate', throttled.cancel);
   */
  function throttle(func, wait, options) {
    var leading = true,
        trailing = true;

    if (typeof func != 'function') {
      throw new TypeError(FUNC_ERROR_TEXT$2);
    }
    if (isObject_1(options)) {
      leading = 'leading' in options ? !!options.leading : leading;
      trailing = 'trailing' in options ? !!options.trailing : trailing;
    }
    return debounce_1(func, wait, {
      'leading': leading,
      'maxWait': wait,
      'trailing': trailing
    });
  }

  var throttle_1 = throttle;

  /**
   * The base implementation of `_.findIndex` and `_.findLastIndex` without
   * support for iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} predicate The function invoked per iteration.
   * @param {number} fromIndex The index to search from.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseFindIndex(array, predicate, fromIndex, fromRight) {
    var length = array.length,
        index = fromIndex + (fromRight ? 1 : -1);

    while ((fromRight ? index-- : ++index < length)) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }

  var _baseFindIndex = baseFindIndex;

  /**
   * The base implementation of `_.isNaN` without support for number objects.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
   */
  function baseIsNaN(value) {
    return value !== value;
  }

  var _baseIsNaN = baseIsNaN;

  /**
   * A specialized version of `_.indexOf` which performs strict equality
   * comparisons of values, i.e. `===`.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function strictIndexOf(array, value, fromIndex) {
    var index = fromIndex - 1,
        length = array.length;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  var _strictIndexOf = strictIndexOf;

  /**
   * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    return value === value
      ? _strictIndexOf(array, value, fromIndex)
      : _baseFindIndex(array, _baseIsNaN, fromIndex);
  }

  var _baseIndexOf = baseIndexOf;

  /**
   * A specialized version of `_.includes` for arrays without support for
   * specifying an index to search from.
   *
   * @private
   * @param {Array} [array] The array to inspect.
   * @param {*} target The value to search for.
   * @returns {boolean} Returns `true` if `target` is found, else `false`.
   */
  function arrayIncludes(array, value) {
    var length = array == null ? 0 : array.length;
    return !!length && _baseIndexOf(array, value, 0) > -1;
  }

  var _arrayIncludes = arrayIncludes;

  /**
   * This function is like `arrayIncludes` except that it accepts a comparator.
   *
   * @private
   * @param {Array} [array] The array to inspect.
   * @param {*} target The value to search for.
   * @param {Function} comparator The comparator invoked per element.
   * @returns {boolean} Returns `true` if `target` is found, else `false`.
   */
  function arrayIncludesWith(array, value, comparator) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (comparator(value, array[index])) {
        return true;
      }
    }
    return false;
  }

  var _arrayIncludesWith = arrayIncludesWith;

  /**
   * This method returns `undefined`.
   *
   * @static
   * @memberOf _
   * @since 2.3.0
   * @category Util
   * @example
   *
   * _.times(2, _.noop);
   * // => [undefined, undefined]
   */
  function noop() {
    // No operation performed.
  }

  var noop_1 = noop;

  /** Used as references for various `Number` constants. */
  var INFINITY$2 = 1 / 0;

  /**
   * Creates a set object of `values`.
   *
   * @private
   * @param {Array} values The values to add to the set.
   * @returns {Object} Returns the new set.
   */
  var createSet = !(_Set && (1 / _setToArray(new _Set([,-0]))[1]) == INFINITY$2) ? noop_1 : function(values) {
    return new _Set(values);
  };

  var _createSet = createSet;

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE$1 = 200;

  /**
   * The base implementation of `_.uniqBy` without support for iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} [iteratee] The iteratee invoked per element.
   * @param {Function} [comparator] The comparator invoked per element.
   * @returns {Array} Returns the new duplicate free array.
   */
  function baseUniq(array, iteratee, comparator) {
    var index = -1,
        includes = _arrayIncludes,
        length = array.length,
        isCommon = true,
        result = [],
        seen = result;

    if (comparator) {
      isCommon = false;
      includes = _arrayIncludesWith;
    }
    else if (length >= LARGE_ARRAY_SIZE$1) {
      var set = iteratee ? null : _createSet(array);
      if (set) {
        return _setToArray(set);
      }
      isCommon = false;
      includes = _cacheHas;
      seen = new _SetCache;
    }
    else {
      seen = iteratee ? [] : result;
    }
    outer:
    while (++index < length) {
      var value = array[index],
          computed = iteratee ? iteratee(value) : value;

      value = (comparator || value !== 0) ? value : 0;
      if (isCommon && computed === computed) {
        var seenIndex = seen.length;
        while (seenIndex--) {
          if (seen[seenIndex] === computed) {
            continue outer;
          }
        }
        if (iteratee) {
          seen.push(computed);
        }
        result.push(value);
      }
      else if (!includes(seen, computed, comparator)) {
        if (seen !== result) {
          seen.push(computed);
        }
        result.push(value);
      }
    }
    return result;
  }

  var _baseUniq = baseUniq;

  /**
   * This method is like `_.uniq` except that it accepts `iteratee` which is
   * invoked for each element in `array` to generate the criterion by which
   * uniqueness is computed. The order of result values is determined by the
   * order they occur in the array. The iteratee is invoked with one argument:
   * (value).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Array
   * @param {Array} array The array to inspect.
   * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
   * @returns {Array} Returns the new duplicate free array.
   * @example
   *
   * _.uniqBy([2.1, 1.2, 2.3], Math.floor);
   * // => [2.1, 1.2]
   *
   * // The `_.property` iteratee shorthand.
   * _.uniqBy([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
   * // => [{ 'x': 1 }, { 'x': 2 }]
   */
  function uniqBy(array, iteratee) {
    return (array && array.length) ? _baseUniq(array, _baseIteratee(iteratee)) : [];
  }

  var uniqBy_1 = uniqBy;

  /**
   * Creates a duplicate-free version of an array, using
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * for equality comparisons, in which only the first occurrence of each element
   * is kept. The order of result values is determined by the order they occur
   * in the array.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Array
   * @param {Array} array The array to inspect.
   * @returns {Array} Returns the new duplicate free array.
   * @example
   *
   * _.uniq([2, 1, 2]);
   * // => [2, 1]
   */
  function uniq(array) {
    return (array && array.length) ? _baseUniq(array) : [];
  }

  var uniq_1 = uniq;

  const convertTyperighterResponse = (requestId, response) => ({
      requestId,
      categoryIds: response.categoryIds,
      blocks: response.blocks,
      matches: response.matches.map(match => ({
          matchId: v4_1(),
          from: match.fromPos,
          to: match.toPos,
          matchedText: match.matchedText,
          message: match.shortMessage,
          category: match.rule.category,
          suggestions: match.suggestions,
          replacement: match.rule.replacement,
          markAsCorrect: match.markAsCorrect
      }))
  });
  class TyperighterAdapter {
      constructor(url, responseThrottleMs = 250) {
          this.url = url;
          this.responseThrottleMs = responseThrottleMs;
          this.responseBuffer = [];
          this.fetchMatches = (requestId, inputs, categoryIds, onMatchesReceived, onRequestError, _) => __awaiter(this, void 0, void 0, function* () {
              inputs.map((input) => __awaiter(this, void 0, void 0, function* () {
                  const body = {
                      requestId,
                      blocks: [input],
                      categoryIds
                  };
                  try {
                      const response = yield fetch(`${this.url}/check`, {
                          method: "POST",
                          headers: new Headers({
                              "Content-Type": "application/json"
                          }),
                          body: JSON.stringify(body)
                      });
                      if (response.status !== 200) {
                          throw new Error(`Error fetching matches. The server responded with status code ${response.status}: ${response.statusText}`);
                      }
                      const responseData = yield response.json();
                      this.responseBuffer.push(responseData);
                      this.throttledHandleResponse(requestId, onMatchesReceived);
                  }
                  catch (e) {
                      onRequestError({
                          requestId,
                          blockId: input.id,
                          message: e.message
                      });
                  }
              }));
          });
          this.fetchCategories = () => __awaiter(this, void 0, void 0, function* () {
              const response = yield fetch(`${this.url}/categories`, {
                  headers: new Headers({
                      "Content-Type": "application/json"
                  })
              });
              if (response.status !== 200) {
                  throw new Error(`Error fetching categories. The server responded with status code ${response.status}: ${response.statusText}`);
              }
              return yield response.json();
          });
          this.flushResponseBuffer = (requestId, onMatchesReceived) => {
              if (!this.responseBuffer.length) {
                  return;
              }
              const blocks = uniqBy_1(this.responseBuffer.flatMap(_ => _.blocks), "id");
              const categoryIds = uniq_1(this.responseBuffer.flatMap(_ => _.categoryIds));
              const matches = this.responseBuffer.flatMap(_ => _.matches);
              const socketMessage = {
                  blocks,
                  categoryIds,
                  matches,
                  requestId
              };
              onMatchesReceived(convertTyperighterResponse(requestId, socketMessage));
              this.responseBuffer = [];
          };
          this.throttledHandleResponse = throttle_1(this.flushResponseBuffer, this.responseThrottleMs);
      }
  }

  const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks
  });
  const contentElement = document.querySelector("#content") || document.createElement("content");
  const doc$1 = DOMParser.fromSchema(mySchema).parse(contentElement);
  if (contentElement && contentElement.parentElement) {
      contentElement.parentElement.removeChild(contentElement);
  }
  const historyPlugin = history();
  const editorElement = document.querySelector("#editor");
  const sidebarElement = document.querySelector("#sidebar");
  const controlsElement = document.querySelector("#controls");
  const { plugin: validatorPlugin, store, getState } = createTyperighterPlugin();
  if (editorElement && sidebarElement && controlsElement) {
      const view = new EditorView(editorElement, {
          state: EditorState.create({
              doc: doc$1,
              plugins: [
                  ...exampleSetup({
                      schema: mySchema,
                      history: false,
                      menuContent: buildMenuItems(mySchema).fullMenu
                  }),
                  historyPlugin,
                  validatorPlugin
              ]
          })
      });
      const commands = createBoundCommands(view, getState);
      const validationService = new MatcherService(store, commands, new TyperighterAdapter("http://localhost:9000"));
      createView(view, store, validationService, commands, sidebarElement, controlsElement, "mailto:example@typerighter.co.uk");
      window.editor = view;
      window.ProseMirrorDevTools.applyDevTools(view, { EditorState });
  }

}());
//# sourceMappingURL=bundle.js.map
