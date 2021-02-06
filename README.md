# regex-to-strings

[![npm package](https://badge.fury.io/js/regex-to-strings.svg)](https://badge.fury.io/js/regex-to-strings)
![node version](https://img.shields.io/node/v/regex-to-strings.svg)
![npm type definitions](https://img.shields.io/npm/types/regex-to-strings)
![Tests](https://github.com/wimpyprogrammer/regex-to-strings/workflows/Tests/badge.svg)
[![codecov](https://codecov.io/gh/wimpyprogrammer/regex-to-strings/branch/main/graph/badge.svg)](https://codecov.io/gh/wimpyprogrammer/regex-to-strings)
[![Known Vulnerabilities](https://snyk.io/test/github/wimpyprogrammer/regex-to-strings/badge.svg)](https://snyk.io/test/github/wimpyprogrammer/regex-to-strings)

Generate strings that match a Regular Expression pattern. Efficiently generate all possible matches, or only the quantity you need.

Have you ever:

- scrutinized a Regular Expression while trying to visualize what it does and doesn't match?
- crafted a list of strings to test whether a Regular Expression is working as intended?
- needed to generate filler data like phone numbers, addresses, zip codes, and email addresses?

`regex-to-strings` helps with problems like these!

## <a href="https://www.wimpyprogrammer.com/regex-to-strings/">Demo</a>

## API

### `expand(regExPattern)`

The `regExPattern` parameter supports three formats:

1. A `RegExp` object, like `/[a-z]/i`
1. A `string` that looks like a `RegExp` object, like `"/[a-z]/i"`
1. A `string` containing just a Regular Expression pattern, like `"[a-z]"`

The returned object contains two properties:

- `count`: The total number of strings that match `regExPattern`
- `getIterator()`: A [generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) that yields strings matched by `regExPattern`

```js
import { expand } from 'regex-to-strings';

const phoneNumberPattern = /((\(555\) ?)|(555-))?\d{3}-\d{4}/;
const phoneNumberExpander = expand(phoneNumberPattern);

console.log(phoneNumberExpander.count); // 40000000

for (const phoneNumber of phoneNumberExpander.getIterator()) {
	console.log(phoneNumber);
	// (555)547-4836
	// 476-2063
	// 467-2475
	// (555) 194-2532
	// (555)403-4986
	// 555-838-9771
	// etc.
}
```

---

### `count(regExPattern)`

A shortcut to the `count` property of `expand(regExPattern)`.

```js
import { count } from 'regex-to-strings';

const numStrings = count(/[a-z]{5}/i);
console.log(numStrings); // 380204032
```

---

### `expandN(regExPattern, n)`

A shortcut to take `n` strings from `expand(regExPattern).getIterator()`.

```js
import { expandN } from 'regex-to-strings';

const strings = expandN(/\d{3,5}/, 5);
console.log(strings); // ['84504', '94481', '3971', '69398', '7792']
```

If the Regular Expression matches fewer than `n` strings, the returned array will contain fewer than `n` elements.

```js
import { expandN } from 'regex-to-strings';

const strings = expandN(/[abc]/, 100);
console.log(strings); // ['b', 'a', 'c']
```

---

### `expandAll(regExPattern)`

A shortcut to get all strings from `expand(regExPattern).getIterator()`.

```js
import { expandAll } from 'regex-to-strings';

const strings = expandAll(/\d/);
console.log(strings); // ['6', '5', '0', '2', '7', '9', '4', '3', '1', '8']
```

## Notes

### Supported Regular Expression syntax

`regex-to-strings` uses [`regexp-tree`](https://www.npmjs.com/package/regexp-tree) to parse your Regular Expression, and so the Regular Expression syntax you can use is largely determined by that library. If your pattern is not recognized by `regex-to-strings`, [try parsing it with `regexp-tree`](https://astexplorer.net/#/gist/4ea2b52f0e546af6fb14f9b2f5671c1c/39b55944da3e5782396ffa1fea3ba68d126cd394) to see if the syntax is supported.

`regex-to-strings` also includes [extensive positive **and** negative tests](https://github.com/wimpyprogrammer/regex-to-strings/blob/main/src/pattern.spec.ts) that track which Regular Expression features are supported.

### Regular Expressions with unbounded repetition

Regular Expressions support many techniques for matching an unlimited number of characters. For example, the following patterns will match as many `a`'s as possible:

- `/a*/`
- `/a+/`
- `/a{7,}/`

When `regex-to-strings` encounters a repetition with no upper bound, it artificially sets an upper bound of **100**. This is done for many reasons, chiefly so that a simple pattern like `expandAll(/a+/)` will not cause an infinite loop.

This also affects the `count` calculation; `expand(/a+/).count` returns `100` rather than `Infinity`.

### Randomizing the results

`regex-to-strings` goes to great lengths to randomize the generated strings. Otherwise the results would be predictable, uninteresting, and probably unhelpful.

```js
// How results might appear without randomization
const strings = expandN(/\d+/, 10);
console.log(strings); // ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
```

Random selections occur throughout the string generation process to give you a thorough sampling of matching strings.

## Credits

`regex-to-strings` relies heavily on the [`regexp-tree`](https://www.npmjs.com/package/regexp-tree) Regular Expression parser by [Dmitry Soshnikov](https://github.com/DmitrySoshnikov). Thanks!
