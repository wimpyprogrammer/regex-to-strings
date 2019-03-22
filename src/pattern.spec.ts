import { expand } from './pattern';

describe('expand', () => {
	function expandAll(input: string) {
		return [...expand(input)];
	}

	function expandSome(input: string, maxExpansions: number) {
		const results = [];
		const generator = expand(input);

		let expansion = generator.next();
		while (!expansion.done && results.length < maxExpansions) {
			results.push(expansion.value);
			expansion = generator.next();
		}

		return results;
	}

	it.each(['', null, undefined])(
		'returns an empty list for %p',
		(input: string) => {
			expect(expandAll(input)).toEqual([]);
		}
	);

	it.each(['(', '[0-9', '*', '\\', '[z-a]'])(
		'throws on malformed pattern %p',
		(input: string) => {
			expect(() => expandAll(input)).toThrow();
		}
	);

	it('reproduces static patterns', () => {
		const result = expandAll('abc');
		expect(result).toEqual(['abc']);
	});

	it('reproduces static alternation patterns', () => {
		const result = expandAll('abc|xyz');
		expect(result).toEqual(['abc', 'xyz']);
	});

	it('expands single-character groups', () => {
		const result = expandAll('ba(r)');
		expect(result).toEqual(['bar']);
	});

	it('expands multi-character groups', () => {
		const result = expandAll('foo(bar)');
		expect(result).toEqual(['foobar']);
	});

	it('expands single-character alternation groups', () => {
		const result = expandAll('ba(r|z)');
		expect(result).toEqual(['bar', 'baz']);
	});

	it('expands multi-character alternation groups', () => {
		const result = expandAll('b(ar|az)');
		expect(result).toEqual(['bar', 'baz']);
	});

	it('expands nested alternation groups', () => {
		const result = expandAll('M(a(ine|ryland|ssachusetts))');
		expect(result).toEqual(['Maine', 'Maryland', 'Massachusetts']);
	});

	it('expands empty alternation groups', () => {
		const result = expandAll('foo(|)');
		expect(result).toEqual(['foo', 'foo']);
	});

	it('expands partially empty alternation groups', () => {
		const result = expandAll('ba(|r)');
		expect(result).toEqual(['ba', 'bar']);
	});

	it.each([/abc?/, /abc??/])(
		'expands optional character %p',
		(optional: RegExp) => {
			const result = expandAll(optional.source);
			expect(result).toEqual(['ab', 'abc']);
		}
	);

	it.each([/a(bc)?/, /a(bc)??/])(
		'expands optional group %p',
		(optionalGroup: RegExp) => {
			const result = expandAll(optionalGroup.source);
			expect(result).toEqual(['a', 'abc']);
		}
	);

	it.each([/abc*/, /abc*?/])(
		'expands optionally repeating character %p',
		(optionalRepeat: RegExp) => {
			const result = expandSome(optionalRepeat.source, 5);
			expect(result).toEqual(['ab', 'abc', 'abcc', 'abccc', 'abcccc']);
		}
	);

	it.each([/a(bc)*/, /a(bc)*?/])(
		'expands optionally repeating group %p',
		(optionalRepeatGroup: RegExp) => {
			const result = expandSome(optionalRepeatGroup.source, 4);
			expect(result).toEqual(['a', 'abc', 'abcbc', 'abcbcbc']);
		}
	);

	it.each([/abc+/, /abc+?/])(
		'expands repeating character %p',
		(repeat: RegExp) => {
			const result = expandSome(repeat.source, 5);
			expect(result).toEqual(['abc', 'abcc', 'abccc', 'abcccc', 'abccccc']);
		}
	);

	it.each([/a(bc)+/, /a(bc)+?/])(
		'expands repeating group %p',
		(repeat: RegExp) => {
			const result = expandSome(repeat.source, 4);
			expect(result).toEqual(['abc', 'abcbc', 'abcbcbc', 'abcbcbcbc']);
		}
	);

	it('expands alphabetic single-character set', () => {
		const result = expandAll('[aeiou]');
		expect(result).toEqual(['a', 'e', 'i', 'o', 'u']);
	});

	it('expands numeric single-character set', () => {
		const result = expandAll('[234789]');
		expect(result).toEqual(['2', '3', '4', '7', '8', '9']);
	});

	it('expands alphabetic range character set', () => {
		const result = expandAll('[a-f]');
		expect(result).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
	});

	it('expands numeric range character set', () => {
		const result = expandAll('[0-5]');
		expect(result).toEqual(['0', '1', '2', '3', '4', '5']);
	});

	it('expands negated alphabetic character set', () => {
		function testExpansion(expansion: string) {
			expect(expansion).toHaveLength(1);
			expect(expansion).toMatch(/[^abc]/);
		}

		const result = expandAll('[^abc]');
		expect(result.length).toBeGreaterThan(1);
		result.forEach(testExpansion);
	});

	it('expands negated numeric character set', () => {
		function testExpansion(expansion: string) {
			expect(expansion).toHaveLength(1);
			expect(expansion).toMatch(/[^246]/);
		}

		const result = expandAll('[^246]');
		expect(result.length).toBeGreaterThan(1);
		result.forEach(testExpansion);
	});

	it('expands negated alphabetic range character set', () => {
		function testExpansion(expansion: string) {
			expect(expansion).toHaveLength(1);
			expect(expansion).toMatch(/[^a-p]/);
		}

		const result = expandAll('[^a-p]');
		expect(result.length).toBeGreaterThan(1);
		result.forEach(testExpansion);
	});

	it('expands negated numeric range character set', () => {
		function testExpansion(expansion: string) {
			expect(expansion).toHaveLength(1);
			expect(expansion).toMatch(/[^0-8]/);
		}

		const result = expandAll('[^0-8]');
		expect(result.length).toBeGreaterThan(1);
		result.forEach(testExpansion);
	});

	it('expands negated character set with multiple ranges', () => {
		function testExpansion(expansion: string) {
			expect(expansion).toHaveLength(1);
			expect(expansion).toMatch(/[^aeiou0-5A-T]/);
		}

		const result = expandAll('[^aeiou0-5A-T]');
		expect(result.length).toBeGreaterThan(1);
		result.forEach(testExpansion);
	});

	it.each([/a{5}/, /a{5}?/])(
		'expands exact quantifier pattern %p',
		(exactQuantifier: RegExp) => {
			const result = expandAll(exactQuantifier.source);
			expect(result).toEqual(['aaaaa']);
		}
	);

	it.each([/a{2,6}/, /a{2,6}?/])(
		'expands range quantifier pattern %p',
		(rangeQuantifier: RegExp) => {
			const result = expandAll(rangeQuantifier.source);
			expect(result).toEqual(['aa', 'aaa', 'aaaa', 'aaaaa', 'aaaaaa']);
		}
	);

	it.each([/a{3,}/, /a{3,}?/])(
		'expands range quantifier pattern without upper bound %p',
		(rangeQuantifierNoUpper: RegExp) => {
			const result = expandSome(rangeQuantifierNoUpper.source, 5);
			expect(result).toEqual(['aaa', 'aaaa', 'aaaaa', 'aaaaaa', 'aaaaaaa']);
		}
	);

	it.each([/./, /\w/, /\W/, /\d/, /\D/, /\s/, /\S/])(
		'expands the single character class %p',
		(charClass: RegExp) => {
			const result = expandAll(charClass.source);
			expect(result.length).toBeGreaterThan(1);
			expect(result[0]).toHaveLength(1);
			expect(result[0]).toMatch(charClass);
		}
	);

	it.each([/[\w]/, /[\W]/, /[\d]/, /[\D]/, /[\s]/, /[\S]/])(
		'expands the single character class %p in set',
		(charClassSet: RegExp) => {
			function testExpansion(expansion: string) {
				expect(expansion).toHaveLength(1);
				expect(expansion).toMatch(charClassSet);
			}

			const result = expandAll(charClassSet.source);
			expect(result.length).toBeGreaterThan(1);
			result.forEach(testExpansion);
		}
	);

	it.each([/[^\w]/, /[^\W]/, /[^\d]/, /[^\D]/, /[^\s]/, /[^\S]/])(
		'expands the single character class %p in negated set',
		(charClassSet: RegExp) => {
			function testExpansion(expansion: string) {
				expect(expansion).toHaveLength(1);
				expect(expansion).toMatch(charClassSet);
			}

			const result = expandAll(charClassSet.source);
			expect(result.length).toBeGreaterThan(1);
			result.forEach(testExpansion);
		}
	);

	it.each([/(\w)/, /(\W)/, /(\d)/, /(\D)/, /(\s)/, /(\S)/])(
		'expands the single character class %p in group',
		(charClassSet: RegExp) => {
			function testExpansion(expansion: string) {
				expect(expansion).toHaveLength(1);
				expect(expansion).toMatch(charClassSet);
			}

			const result = expandAll(charClassSet.source);
			expect(result.length).toBeGreaterThan(1);
			result.forEach(testExpansion);
		}
	);

	it.each([/\w\w\w/, /\w\d\s/, /\W\w\w/, /\W\D\S/, /\s\w\S/, /\d\W\D/])(
		'expands the multiple character class %p',
		(charClassSet: RegExp) => {
			const result = expandAll(charClassSet.source);
			expect(result.length).toBeGreaterThan(1);
			expect(result[0]).toHaveLength(3);
			expect(result[0]).toMatch(charClassSet);
		}
	);

	it.each([/[\w\d\s]/, /[\W\w\S]/, /[\W\D\S]/, /[\s\w\S]/, /[\d\W\D]/])(
		'expands the multiple character class %p in set',
		(charClassSet: RegExp) => {
			function testExpansion(expansion: string) {
				expect(expansion).toHaveLength(1);
				expect(expansion).toMatch(charClassSet);
			}

			const result = expandAll(charClassSet.source);
			expect(result.length).toBeGreaterThan(1);
			result.forEach(testExpansion);
		}
	);

	it.each([/[^\w\d\s]/, /[^\W\d\s]/, /[^\W\D\s]/, /[^\w\d\S]/])(
		'expands the multiple character class %p in negated set',
		(charClassSet: RegExp) => {
			function testExpansion(expansion: string) {
				expect(expansion).toHaveLength(1);
				expect(expansion).toMatch(charClassSet);
			}

			const result = expandAll(charClassSet.source);
			expect(result.length).toBeGreaterThan(1);
			result.forEach(testExpansion);
		}
	);

	it.each([/[^\w\W]/, /[^\d\D]/, /[^\s\S]/, /[^\w\D]/, /[^\W\S]/, /[^0-9\D]/])(
		'returns zero expansions for impossible set %p',
		(charClassSet: RegExp) => {
			const result = expandAll(charClassSet.source);
			expect(result).toHaveLength(0);
		}
	);

	it.each([/(\w\d\s)/, /(\W\w\S)/, /(\W\D\S)/, /(\s\w\S)/, /(\d\W\D)/])(
		'expands the multiple character class %p in group',
		(charClassSet: RegExp) => {
			function testExpansion(expansion: string) {
				expect(expansion).toHaveLength(3);
				expect(expansion).toMatch(charClassSet);
			}

			// Too many possible combinations - limit to 1,000
			const result = expandSome(charClassSet.source, 1000);
			expect(result).toHaveLength(1000);
			result.forEach(testExpansion);
		}
	);

	it('ignores boundary anchors', () => {
		const result = expandAll('\\bzz\\b \\Bzzz\\B \\bzzzz\\B');
		expect(result).toEqual(['zz zzz zzzz']);
	});

	it('ignores beginning and end anchors', () => {
		const result = expandAll('$foo bar^');
		expect(result).toEqual(['foo bar']);
	});

	it.each([/\+/, /\43/, /\053/, /\x2B/, /\u002B/])(
		'expands escaped character %p',
		(escapedPlus: RegExp) => {
			const result = expandAll(escapedPlus.source);
			expect(result).toEqual(['+']);
		}
	);

	it.each([/\t/, /\n/, /\r/, /\v/, /\f/, /\0/])(
		'verbatim expands control character %p',
		(controlCharacter: RegExp) => {
			const result = expandAll(controlCharacter.source);
			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(1);
			expect(result[0]).toMatch(controlCharacter);
		}
	);

	it.each(['\t', '\n', '\r', '\v', '\f', '\0'])(
		'verbatim expands literal control character %#',
		(literalControlCharacter: string) => {
			const result = expandAll(literalControlCharacter);
			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(1);
			expect(result[0]).toMatch(new RegExp(literalControlCharacter));
		}
	);

	it.each([/\cJ/, /\cj/, /\cK/, /\ck/, /\cL/, /\cl/, /\cM/, /\cm/])(
		'verbatim expands escaped control character %p',
		(controlCharacter: RegExp) => {
			const result = expandAll(controlCharacter.source);
			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(1);
			expect(result[0]).toMatch(controlCharacter);
		}
	);

	it('expands static numbered backreferences', () => {
		const result = expandAll('(a) \\1 (z) \\2');
		expect(result).toEqual(['a a z z']);
	});

	it('expands static numbered backreferences with noncapturing groups', () => {
		const result = expandAll('(?:ignored) (a) \\1');
		expect(result).toEqual(['ignored a a']);
	});

	it('expands static named backreferences', () => {
		const result = expandAll('(?<foo>a) \\k<foo> (?<bar>z) \\k<bar>');
		expect(result).toEqual(['a a z z']);
	});

	it('expands static named backreferences with noncapturing groups', () => {
		const result = expandAll('(?:ignored) (?<foo>a) \\k<foo>');
		expect(result).toEqual(['ignored a a']);
	});

	it('expands static named and numbered backreferences', () => {
		const result = expandAll('(?<foo>a) \\k<foo> \\1 (?<bar>z) \\2 \\k<bar>');
		expect(result).toEqual(['a a a z z z']);
	});

	it('expands alternation group numbered backreferences', () => {
		const result = expandAll('(a|b) \\1 (y|z) \\2');
		expect(result).toEqual(['a a y y', 'a a z z', 'b b y y', 'b b z z']);
	});

	it('expands alternation group numbered backreferences with noncapturing groups', () => {
		const result = expandAll('(?:ignored) (a|z) \\1');
		expect(result).toEqual(['ignored a a', 'ignored z z']);
	});

	it('expands alternation group named backreferences', () => {
		const result = expandAll('(?<foo>a|b) \\k<foo> (?<bar>y|z) \\k<bar>');
		expect(result).toEqual(['a a y y', 'a a z z', 'b b y y', 'b b z z']);
	});

	it('expands alternation group named backreferences with noncapturing groups', () => {
		const result = expandAll('(?:ignored) (?<foo>a|z) \\k<foo>');
		expect(result).toEqual(['ignored a a', 'ignored z z']);
	});

	it('expands alternation group named and numbered backreferences', () => {
		const result = expandAll(
			'(?<foo>a|b) \\k<foo> \\1 (?<bar>y|z) \\2 \\k<bar>'
		);
		expect(result).toEqual([
			'a a a y y y',
			'a a a z z z',
			'b b b y y y',
			'b b b z z z',
		]);
	});

	it('expands backreferences with numeric names', () => {
		const result = expandAll('(?<20>a) \\k<20> (?<50>z) \\k<50>');
		expect(result).toEqual(['a a z z']);
	});
});
