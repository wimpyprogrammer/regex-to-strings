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

	it('expands optional characters', () => {
		const result = expandAll('abc?');
		expect(result).toEqual(['ab', 'abc']);
	});

	it('expands optional groups', () => {
		const result = expandAll('a(bc)?');
		expect(result).toEqual(['a', 'abc']);
	});

	it('expands optionally repeating characters', () => {
		const result = expandSome('abc*', 5);
		expect(result).toEqual(['ab', 'abc', 'abcc', 'abccc', 'abcccc']);
	});

	it('expands optionally repeating groups', () => {
		const result = expandSome('a(bc)*', 4);
		expect(result).toEqual(['a', 'abc', 'abcbc', 'abcbcbc']);
	});

	it('expands repeating characters', () => {
		const result = expandSome('abc+', 5);
		expect(result).toEqual(['abc', 'abcc', 'abccc', 'abcccc', 'abccccc']);
	});

	it('expands repeating groups', () => {
		const result = expandSome('a(bc)+', 4);
		expect(result).toEqual(['abc', 'abcbc', 'abcbcbc', 'abcbcbcbc']);
	});

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

	it('expands exact quantifier patterns', () => {
		const result = expandAll('a{5}');
		expect(result).toEqual(['aaaaa']);
	});

	it('expands range quantifier patterns', () => {
		const result = expandAll('a{2,6}');
		expect(result).toEqual(['aa', 'aaa', 'aaaa', 'aaaaa', 'aaaaaa']);
	});

	it('expands range quantifier patterns without upper bound', () => {
		const result = expandSome('a{3,}', 5);
		expect(result).toEqual(['aaa', 'aaaa', 'aaaaa', 'aaaaaa', 'aaaaaaa']);
	});

	it.each([/./, /\w/, /\W/, /\d/, /\D/, /\s/, /\S/])(
		'expands the single character class %p',
		(charClass: RegExp) => {
			const result = expandAll(charClass.source);
			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(1);
			expect(result[0]).toMatch(charClass);
		}
	);

	it.each([/\w\w\w/, /\w\d\s/, /\W\w\w/, /\W\D\S/, /\s\w\S/, /\d\W\D/])(
		'expands the multiple character class %p',
		(charClassSet: RegExp) => {
			const result = expandAll(charClassSet.source);
			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(3);
			expect(result[0]).toMatch(charClassSet);
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

	it.each([/\+/, /\053/, /\x2B/, /\u002B/])(
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

	it.each([/\cJ/, /\cj/, /\cK/, /\ck/, /\cL/, /\cl/, /\cM/, /\cm/])(
		'verbatim expands escaped control character %p',
		(controlCharacter: RegExp) => {
			const result = expandAll(controlCharacter.source);
			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(1);
			expect(result[0]).toMatch(controlCharacter);
		}
	);
});
