import { when } from 'jest-when';
import { Chars } from './constants';
import Expansion from './Expansion';
import { fill } from './helpers/utils';
import * as patternLib from './pattern';
import * as randomSort from './sorts/fisher-yates-random';
import * as chooseRandom from './sorts/number-random';
import * as chooseRandomWeighted from './sorts/weighted-random';

function measureAverageTime(fn: () => void, numTrials: number) {
	let totalTime = 0;

	for (let i = 0; i < numTrials; i++) {
		const startTime = Date.now();
		fn();
		const endTime = Date.now();
		totalTime += endTime - startTime;
	}

	return totalTime / numTrials;
}

describe('count', () => {
	const { count } = patternLib;

	it('passes pattern to expand()', () => {
		when(jest.spyOn(patternLib, 'expand'))
			.calledWith('test')
			.mockReturnValue(new Expansion(['a', 'b', 'c'], 3));

		const result = count('test');

		expect(result).toEqual(3);
	});

	it('normalizes pattern with toRegExp()', () => {
		when(jest.spyOn(patternLib, 'toRegExp'))
			.calledWith('/test/')
			.mockReturnValue('/[123]/');

		const result = count('/test/');

		expect(result).toEqual(3);
	});

	it('does not sort to calculate count', () => {
		const sortFn = jest.spyOn(randomSort, 'default');

		count(/([ab]|(c|[d-e]){2,3})f(g?) \1/);

		expect(sortFn).not.toHaveBeenCalled();
	});

	it('counts null as zero patterns', () => {
		const result = count((null as unknown) as string);
		expect(result).toBe(0);
	});

	it('counts undefined as one pattern', () => {
		const result = count((undefined as unknown) as string);
		expect(result).toBe(1);
	});

	it.each<[RegExp | string, number]>([
		[new RegExp(''), 1], // eslint-disable-line prefer-regex-literals
		[/abc/, 1],
		[/\d/, 10],
		[/ab?/, 2],
		[/a{0,5}/, 6],
		[/a*/, 101],
		[/[ab]{3}/, 2 ** 3],
		[/(a|b|c|d|e|f|g)/, 7],
		[/aAa/i, 2 ** 3],
		[/[A-I]/, 9],
		[/[^\W]/, 26 + 26 + 10 + 1], // upper and lower alphanumeric, and underscore
		[/([ab]|(c|[d-e]){2,3})f(g?)/, 76],
		['(?<foo>a|b) \\k<foo> \\1', 2],
	])(
		'counts total number of patterns: %p',
		(input: RegExp | string, expectedCount: number) => {
			const result = count(input);
			expect(result).toEqual(expectedCount);
		}
	);

	it('is performant', () => {
		const trial = () => count(/([ab]|(c|[d-e]){2,3})(\w?) \1/);
		const averageTime = measureAverageTime(trial, 5);
		expect(averageTime).toBeLessThanOrEqual(10);
	});
});

describe('expand', () => {
	const { expand, expandAll, expandN } = patternLib;
	let sortFn: jest.SpyInstance;
	let randomWeightedFn: jest.SpyInstance;
	let randomFn: jest.SpyInstance;

	beforeEach(() => {
		// Keep a stable order for consistent tests.
		sortFn = jest
			.spyOn(randomSort, 'default')
			.mockImplementation((items) => [...items]);

		randomWeightedFn = jest
			.spyOn(chooseRandomWeighted, 'default')
			.mockImplementation(() => 0);

		randomFn = jest
			.spyOn(chooseRandom, 'default')
			.mockImplementation((minValue) => minValue);
	});

	it('normalizes pattern with toRegExp()', () => {
		when(jest.spyOn(patternLib, 'toRegExp'))
			.calledWith('/test/')
			.mockReturnValue('/foo/');

		const result = expand('/test/');

		expect([...result.getIterator()]).toEqual(['foo']);
	});

	it('returns an empty list for null', () => {
		const result = expandAll((null as unknown) as string);
		expect(result).toEqual([]);

		// Mirror this JavaScript behavior
		const nativeRegex = new RegExp((null as unknown) as string);
		expect(nativeRegex.test('')).toBe(false);
	});

	it.each(['', undefined])(
		'returns an empty string for %p',
		(input?: string) => {
			const result = expandAll(input as string);
			expect(result).toEqual(['']);

			// Mirror this JavaScript behavior
			const nativeRegex = new RegExp(input as string);
			expect(nativeRegex.test('')).toBe(true);
		}
	);

	it.each(['(', '[0-9', '*', '\\', '[z-a]', '/a', 'a/'])(
		'throws on malformed pattern %p',
		(input: string) => {
			expect(() => expandAll(input)).toThrow();
		}
	);

	it('reproduces static patterns', () => {
		const result = expandAll('abcáï®');
		expect(result).toEqual(['abcáï®']);
	});

	it('reproduces static alternation patterns', () => {
		const result = expandAll('abc†|xyz‡');
		expect(result).toEqual(['abc†', 'xyz‡']);
	});

	it('expands single-character groups', () => {
		const result = expandAll('ba(r)');
		expect(result).toEqual(['bar']);
	});

	it('expands multi-character groups', () => {
		const result = expandAll('foo(bar½)');
		expect(result).toEqual(['foobar½']);
	});

	it('expands single-character alternation groups', () => {
		const result = expandAll('ba(r|z)');
		expect(result).toEqual(['bar', 'baz']);
	});

	it('expands multi-character alternation groups', () => {
		const result = expandAll('b(ar†|az‡)');
		expect(result).toEqual(['bar†', 'baz‡']);
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

	it.each([/foob{0}/, /foo(bar){0}/])(
		'expands non-occurring character %p',
		(optional: RegExp) => {
			const result = expandAll(optional);
			expect(result).toEqual(['foo']);
		}
	);

	it.each([/abc?/, /abc??/])(
		'expands optional character %p',
		(optional: RegExp) => {
			const result = expandAll(optional);
			expect(result).toEqual(['ab', 'abc']);
		}
	);

	it.each([/a(bc)?/, /a(bc)??/])(
		'expands optional group %p',
		(optionalGroup: RegExp) => {
			const result = expandAll(optionalGroup);
			expect(result).toEqual(['a', 'abc']);
		}
	);

	it.each([/abc*/, /abc*?/])(
		'expands optionally repeating character %p',
		(optionalRepeat: RegExp) => {
			const result = expandN(optionalRepeat, 5);
			expect(result).toEqual(['ab', 'abc', 'abcc', 'abccc', 'abcccc']);
		}
	);

	it.each([/a(bc)*/, /a(bc)*?/])(
		'expands optionally repeating group %p',
		(optionalRepeatGroup: RegExp) => {
			const result = expandN(optionalRepeatGroup, 4);
			expect(result).toEqual(['a', 'abc', 'abcbc', 'abcbcbc']);
		}
	);

	it.each([/abc+/, /abc+?/])(
		'expands repeating character %p',
		(repeat: RegExp) => {
			const result = expandN(repeat, 5);
			expect(result).toEqual(['abc', 'abcc', 'abccc', 'abcccc', 'abccccc']);
		}
	);

	it.each([/a(bc)+/, /a(bc)+?/])(
		'expands repeating group %p',
		(repeat: RegExp) => {
			const result = expandN(repeat, 4);
			expect(result).toEqual(['abc', 'abcbc', 'abcbcbc', 'abcbcbcbc']);
		}
	);

	it.each([/ab…+/, /ab…+?/])(
		'expands repeating extended ASCII character %p',
		(repeat: RegExp) => {
			const result = expandN(repeat, 5);
			expect(result).toEqual(['ab…', 'ab……', 'ab………', 'ab…………', 'ab……………']);
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

	it('expands extended ASCII single-character set', () => {
		const result = expandAll('[ÁÉÍÓÚÝ]');
		expect(result).toEqual(['Á', 'É', 'Í', 'Ó', 'Ú', 'Ý']);
	});

	it('expands alphabetic range character set', () => {
		const result = expandAll('[a-f]');
		expect(result).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
	});

	it('expands numeric range character set', () => {
		const result = expandAll('[0-5]');
		expect(result).toEqual(['0', '1', '2', '3', '4', '5']);
	});

	it('expands extended ASCII range character set', () => {
		const result = expandAll('[À-Æ]');
		expect(result).toEqual(['À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ']);
	});

	it('expands permutations of sibling character sets', () => {
		const result = expandAll('[ab]c[de]f');
		expect(result).toEqual(['acdf', 'acef', 'bcdf', 'bcef']);
	});

	it('deeply expands permutations of nested character sets', () => {
		const result = expandAll('([ab]|(c|[d-e]){2,3})f(g?)');
		expect(result).toEqual([
			'af',
			'afg',
			'bf',
			'bfg',
			'ccf',
			'ccfg',
			'cdf',
			'cdfg',
			'cef',
			'cefg',
			'dcf',
			'dcfg',
			'ddf',
			'ddfg',
			'def',
			'defg',
			'ecf',
			'ecfg',
			'edf',
			'edfg',
			'eef',
			'eefg',
			'cccf',
			'cccfg',
			'ccdf',
			'ccdfg',
			'ccef',
			'ccefg',
			'cdcf',
			'cdcfg',
			'cddf',
			'cddfg',
			'cdef',
			'cdefg',
			'cecf',
			'cecfg',
			'cedf',
			'cedfg',
			'ceef',
			'ceefg',
			'dccf',
			'dccfg',
			'dcdf',
			'dcdfg',
			'dcef',
			'dcefg',
			'ddcf',
			'ddcfg',
			'dddf',
			'dddfg',
			'ddef',
			'ddefg',
			'decf',
			'decfg',
			'dedf',
			'dedfg',
			'deef',
			'deefg',
			'eccf',
			'eccfg',
			'ecdf',
			'ecdfg',
			'ecef',
			'ecefg',
			'edcf',
			'edcfg',
			'eddf',
			'eddfg',
			'edef',
			'edefg',
			'eecf',
			'eecfg',
			'eedf',
			'eedfg',
			'eeef',
			'eeefg',
		]);
	});

	it('expands negated alphabetic character set', () => {
		function testExpansion(expansion: string) {
			expect(expansion).toHaveLength(1);
			expect(expansion).toMatch(/[^abc]/);
		}

		const result = expandAll('[^abc]');
		expect(result).toHaveLength(218);
		result.forEach(testExpansion);
	});

	it('expands negated numeric character set', () => {
		function testExpansion(expansion: string) {
			expect(expansion).toHaveLength(1);
			expect(expansion).toMatch(/[^246]/);
		}

		const result = expandAll('[^246]');
		expect(result).toHaveLength(218);
		result.forEach(testExpansion);
	});

	it('expands negated extended ASCII character set', () => {
		function testExpansion(expansion: string) {
			expect(expansion).toHaveLength(1);
			expect(expansion).toMatch(/[^ÁÉÍÓÚÝ]/);
		}

		const result = expandAll('[^ÁÉÍÓÚÝ]');
		expect(result).toHaveLength(215);
		result.forEach(testExpansion);
	});

	it('expands negated alphabetic range character set', () => {
		function testExpansion(expansion: string) {
			expect(expansion).toHaveLength(1);
			expect(expansion).toMatch(/[^a-p]/);
		}

		const result = expandAll('[^a-p]');
		expect(result).toHaveLength(205);
		result.forEach(testExpansion);
	});

	it('expands negated numeric range character set', () => {
		function testExpansion(expansion: string) {
			expect(expansion).toHaveLength(1);
			expect(expansion).toMatch(/[^0-8]/);
		}

		const result = expandAll('[^0-8]');
		expect(result).toHaveLength(212);
		result.forEach(testExpansion);
	});

	it('expands negated extended ASCII range character set', () => {
		function testExpansion(expansion: string) {
			expect(expansion).toHaveLength(1);
			expect(expansion).toMatch(/[^À-Æ]/);
		}

		const result = expandAll('[^À-Æ]');
		expect(result).toHaveLength(214);
		result.forEach(testExpansion);
	});

	it('expands negated character set with multiple ranges', () => {
		function testExpansion(expansion: string) {
			expect(expansion).toHaveLength(1);
			expect(expansion).toMatch(/[^aeiou0-5A-Tð-ö]/);
		}

		const result = expandAll('[^aeiou0-5A-Tð-ö]');
		expect(result).toHaveLength(183);
		result.forEach(testExpansion);
	});

	it.each([/a{5}/, /a{5}?/])(
		'expands exact quantifier pattern %p',
		(exactQuantifier: RegExp) => {
			const result = expandAll(exactQuantifier);
			expect(result).toEqual(['aaaaa']);
		}
	);

	it.each([/a{2,6}/, /a{2,6}?/])(
		'expands range quantifier pattern %p',
		(rangeQuantifier: RegExp) => {
			const result = expandAll(rangeQuantifier);
			expect(result).toEqual(['aa', 'aaa', 'aaaa', 'aaaaa', 'aaaaaa']);
		}
	);

	it.each([/a{3,}/, /a{3,}?/])(
		'expands range quantifier pattern without upper bound %p',
		(rangeQuantifierNoUpper: RegExp) => {
			const result = expandN(rangeQuantifierNoUpper, 5);
			expect(result).toEqual(['aaa', 'aaaa', 'aaaaa', 'aaaaaa', 'aaaaaaa']);
		}
	);

	it.each([/./, /\w/, /\W/, /\d/, /\D/, /\s/, /\S/])(
		'expands the single character class %p',
		(charClass: RegExp) => {
			function testExpansion(expansion: string) {
				expect(expansion).toHaveLength(1);
				expect(expansion).toMatch(charClass);
			}

			const result = expandAll(charClass);
			expect(result.length).toBeGreaterThan(1);
			result.forEach(testExpansion);
		}
	);

	it.each([/[\w]/, /[\W]/, /[\d]/, /[\D]/, /[\s]/, /[\S]/])(
		'expands the single character class %p in set',
		(charClassSet: RegExp) => {
			function testExpansion(expansion: string) {
				expect(expansion).toHaveLength(1);
				expect(expansion).toMatch(charClassSet);
			}

			const result = expandAll(charClassSet);
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

			const result = expandAll(charClassSet);
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

			const result = expandAll(charClassSet);
			expect(result.length).toBeGreaterThan(1);
			result.forEach(testExpansion);
		}
	);

	it.each([/\w\w\w/, /\w\d\s/, /\W\w\w/, /\W\D\S/, /\s\w\S/, /\d\W\D/])(
		'expands the multiple character class %p',
		(charClassSet: RegExp) => {
			// Too many possible combinations - limit to 1,000
			const result = expandN(charClassSet, 1000);
			expect(result).toHaveLength(1000);
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

			const result = expandAll(charClassSet);
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

			const result = expandAll(charClassSet);
			expect(result.length).toBeGreaterThan(1);
			result.forEach(testExpansion);
		}
	);

	it.each([/(\w|\d)/, /(\W|\D)/, /(\d|\D)/, /(\w|\d|\s)/])(
		'expands the character class in disjunction %p',
		(metaDisjunction: RegExp) => {
			function testExpansion(expansion: string) {
				expect(expansion).toHaveLength(1);
				expect(expansion).toMatch(metaDisjunction);
			}

			const result = expandAll(metaDisjunction);
			expect(result.length).toBeGreaterThan(1);
			result.forEach(testExpansion);
		}
	);

	it.each([/[^\w\W]/, /[^\d\D]/, /[^\s\S]/, /[^\w\D]/, /[^\W\S]/, /[^0-9\D]/])(
		'returns zero expansions for impossible set %p',
		(charClassSet: RegExp) => {
			const result = expandAll(charClassSet);
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
			const result = expandN(charClassSet, 1000);
			expect(result).toHaveLength(1000);
			result.forEach(testExpansion);
		}
	);

	it.each([/(.|\r)/s, /[\s\S]/, /[\w\W]/, /[\d\D]/])(
		'includes all supported characters in %p',
		(regex) => {
			const result = expandAll(regex);

			expect(result).toHaveLength(Chars.all.length);
			Chars.all.forEach((char) => {
				expect(result).toContain(char);
			});
		}
	);

	it('expands repeated character class', () => {
		const allTwoDigitNumbers = fill(0, 99).map((num) =>
			num.toString().padStart(2, '0')
		);

		const result = expandAll(/\d{2}/);
		expect(result).toEqual(allTwoDigitNumbers);
	});

	it('ignores boundary anchors', () => {
		const result = expandAll('\\bzz\\b \\Bzzz\\B \\bzzzz\\B');
		expect(result).toEqual(['zz zzz zzzz']);
	});

	it('ignores beginning and end anchors', () => {
		const result = expandAll('$foo bar^');
		expect(result).toEqual(['foo bar']);
	});

	it('ignores positive lookahead', () => {
		const result = expandAll('foo (?=\\w+)');
		expect(result).toEqual(['foo ']);
	});

	it('ignores negative lookahead', () => {
		const result = expandAll('foo (?!\\w+)');
		expect(result).toEqual(['foo ']);
	});

	it('ignores positive lookbehind', () => {
		const result = expandAll('foo (?<=\\w+)');
		expect(result).toEqual(['foo ']);
	});

	it('ignores negative lookbehind', () => {
		const result = expandAll('foo (?<!\\w+)');
		expect(result).toEqual(['foo ']);
	});

	it.each([/\+/, /\53/, /\053/, /\x2B/, /\u002B/])(
		'expands escaped character %p',
		(escapedPlus: RegExp) => {
			const result = expandAll(escapedPlus);
			expect(result).toEqual(['+']);
		}
	);

	it.each([/\t/, /\n/, /\r/, /\v/, /\f/, /\0/])(
		'verbatim expands control character %p',
		(controlCharacter: RegExp) => {
			const result = expandAll(controlCharacter);
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
			const result = expandAll(controlCharacter);
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

	it('expands multiple patterns with numbered backreferences concurrently', () => {
		const iterator1 = expand('(a|b) \\1').getIterator();
		const iterator2 = expand('(y|z) \\1').getIterator();

		expect(iterator1.next().value).toBe('a a');
		expect(iterator2.next().value).toBe('y y');
		expect(iterator1.next().value).toBe('b b');
		expect(iterator2.next().value).toBe('z z');
	});

	it('expands multiple patterns with named backreferences concurrently', () => {
		const iterator1 = expand('(?<foo>a|b) \\k<foo>').getIterator();
		const iterator2 = expand('(?<foo>y|z) \\k<foo>').getIterator();

		expect(iterator1.next().value).toBe('a a');
		expect(iterator2.next().value).toBe('y y');
		expect(iterator1.next().value).toBe('b b');
		expect(iterator2.next().value).toBe('z z');
	});

	it('is performant', () => {
		const trial = () => expand(/([ab]|(c|[ù-ü]){2,3})(\w?) \1/);
		const averageTime = measureAverageTime(trial, 5);
		expect(averageTime).toBeLessThanOrEqual(10);
	});

	describe('Sorting', () => {
		function isUnique<T>(item: T, iItem: number, all: T[]) {
			return all.indexOf(item) === iItem;
		}

		// Re-enable the normal sorting behavior
		beforeEach(() => {
			[sortFn, randomWeightedFn, randomFn].forEach((mockFn) =>
				mockFn.mockRestore()
			);
		});

		it.each([/\d/, /a+/, /(a|b|c|d|e|f|g)/, /aaaaaaaa/i, /[A-I]/])(
			'randomly sorts patterns: %p',
			(input: RegExp) => {
				const multipleRuns = Array.from(new Array(20), () =>
					expandAll(input).join()
				);
				const uniqueRuns = multipleRuns.filter(isUnique);
				expect(uniqueRuns.length).toBeGreaterThan(1);
			}
		);

		it.each<[RegExp, string[]]>([
			[/\d/, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']],
			[/a{0,5}/, ['', 'a', 'aa', 'aaa', 'aaaa', 'aaaaa']],
			[/[ab]{3}/, ['aaa', 'aab', 'aba', 'abb', 'baa', 'bab', 'bba', 'bbb']],
			[/(a|b|c|d|e|f|g)/, ['a', 'b', 'c', 'd', 'e', 'f', 'g']],
			[/aAä/i, ['aaä', 'aaÄ', 'aAä', 'Aaä', 'aAÄ', 'AaÄ', 'AAä', 'AAÄ']],
			[/[A-I]/, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']],
		])(
			'sorts patterns without losing accuracy: %p',
			(input: RegExp, allExpansions: string[]) => {
				const result = expandAll(input);
				expect(result).toEqual(expect.arrayContaining(allExpansions));
				expect(result).toHaveLength(allExpansions.length);
			}
		);

		it('sorts number of repetitions', () => {
			let resultsAllTrials: string[] = [];
			for (let i = 0, numTrials = 50; i < numTrials; i++) {
				const results = expandN(/[ab]{1,2}/, 2);
				resultsAllTrials = resultsAllTrials.concat(results);
			}
			const resultsByLength = resultsAllTrials.map((result) => result.length);
			const uniqueLengths = resultsByLength.filter(isUnique);

			expect(uniqueLengths.length).toBeGreaterThan(1);
		});

		[
			/\w\w\w/,
			/\w{3}/,
			/[a-z][a-z][a-z]/i,
			/(\d|\W|[a-z])(\d|\W|[a-z])(\d|\W|[a-z])/,
		].forEach((input: RegExp) => {
			it.each([1, 2, 3])(
				`sorts all levels of pattern ${input}: level %p`,
				(iChar: number) => {
					const results = expandN(input, 50);

					const resultsThisChar = results.map((result) =>
						result.charAt(iChar - 1)
					);
					const uniqueThisChar = resultsThisChar.filter(isUnique);

					expect(uniqueThisChar.length).toBeGreaterThan(1);
				}
			);
		});
	});

	describe('RegEx flags', () => {
		it.each([/aB/, /\141\102/, /\x61\x42/, /\u0061\u0042/])(
			'expands exact casing when the case-insensitive flag is omitted: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['aB']);
			}
		);

		it.each([/àÑ/, /\340\321/, /\xE0\xD1/, /\u00E0\u00D1/])(
			'expands extended ASCII exact casing when the case-insensitive flag is omitted: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['àÑ']);
			}
		);

		it.each([/aB/i, /\141\102/i, /\x61\x42/i, /\u0061\u0042/i])(
			'expands casing variants when the case-insensitive flag is included: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['ab', 'aB', 'Ab', 'AB']);
			}
		);

		it.each([/àÑ/i, /\340\321/i, /\xE0\xD1/i, /\u00E0\u00D1/i])(
			'expands extended ASCII casing variants when the case-insensitive flag is included: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['àñ', 'àÑ', 'Àñ', 'ÀÑ']);
			}
		);

		it.each([/4%/i, /\64\45/i, /\x34\x25/i, /\u0034\u0025/i])(
			'does not expand uncased characters when the case-insensitive flag is included: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['4%']);
			}
		);

		it.each([/©×/i, /\251\327/i, /\xA9\xD7/i, /\u00A9\u00D7/i])(
			'does not expand uncased extended ASCII characters when the case-insensitive flag is included: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['©×']);
			}
		);

		it.each([/[aB]/, /[\141\102]/, /[\x61\x42]/, /[\u0061\u0042]/])(
			'expands exact casing in static set when the case-insensitive flag is omitted: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['a', 'B']);
			}
		);

		it.each([/[àÑ]/, /[\340\321]/, /[\xE0\xD1]/, /[\u00E0\u00D1]/])(
			'expands extended ASCII exact casing in static set when the case-insensitive flag is omitted: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['à', 'Ñ']);
			}
		);

		it.each([/[aB]/i, /[\141\102]/i, /[\x61\x42]/i, /[\u0061\u0042]/i])(
			'expands casing variants in static set when the case-insensitive flag is included: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['a', 'A', 'b', 'B']);
			}
		);

		it.each([/[àÑ]/i, /[\340\321]/i, /[\xE0\xD1]/i, /[\u00E0\u00D1]/i])(
			'expands extended ASCII casing variants in static set when the case-insensitive flag is included: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['à', 'À', 'ñ', 'Ñ']);
			}
		);

		it.each([/[4%]/i, /[\64\45]/i, /[\x34\x25]/i, /[\u0034\u0025]/i])(
			'does not expand uncased characters in static set when the case-insensitive flag is included: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['4', '%']);
			}
		);

		it.each([/[©×]/i, /[\251\327]/i, /[\xA9\xD7]/i, /[\u00A9\u00D7]/i])(
			'does not expand uncased extended ASCII characters in static set when the case-insensitive flag is included: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['©', '×']);
			}
		);

		it.each([/[a-d]/, /[\141-\144]/, /[\x61-\x64]/, /[\u0061-\u0064]/])(
			'expands exact casing in range set when the case-insensitive flag is omitted: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['a', 'b', 'c', 'd']);
			}
		);

		it.each([/[Ì-Ï]/, /[\314-\317]/, /[\xCC-\xCF]/, /[\u00CC-\u00CF]/])(
			'expands extended ASCII exact casing in range set when the case-insensitive flag is omitted: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['Ì', 'Í', 'Î', 'Ï']);
			}
		);

		it.each([/[a-d]/i, /[\141-\144]/i, /[\x61-\x64]/i, /[\u0061-\u0064]/i])(
			'expands casing variants in range set when the case-insensitive flag is included: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['a', 'A', 'b', 'B', 'c', 'C', 'd', 'D']);
			}
		);

		it.each([/[Ì-Ï]/i, /[\314-\317]/i, /[\xCC-\xCF]/i, /[\u00CC-\u00CF]/i])(
			'expands extended ASCII casing variants in range set when the case-insensitive flag is included: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['ì', 'Ì', 'í', 'Í', 'î', 'Î', 'ï', 'Ï']);
			}
		);

		it.each([/[1-4]/i, /[\61-\64]/i, /[\x31-\x34]/i, /[\u0031-\u0034]/i])(
			'does not expand uncased characters in range set when the case-insensitive flag is included: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['1', '2', '3', '4']);
			}
		);

		it.each([/[¼-¿]/i, /[\274-\277]/i, /[\xBC-\xBF]/i, /[\u00BC-\u00BF]/i])(
			'does not expand extended ASCII uncased characters in range set when the case-insensitive flag is included: %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).toEqual(['¼', '½', '¾', '¿']);
			}
		);

		it.each(['.', /./])(
			'does not expand the dot character to a newline when the dotall flag is omitted %#',
			(input: string | RegExp) => {
				const result = expandAll(input);
				expect(result).not.toContain('\n');
			}
		);

		it('expands the dot character to a newline when the dotall flag is included', () => {
			const result = expandAll(/./s);
			expect(result).toContain('\n');
		});
	});

	describe('unsupported RegEx features, for reference', () => {
		it.each([
			// From https://www.regular-expressions.info/refrepeat.html
			['possessive optional quantifier', 'a?+'],
			['possessive optional repeating quantifier', 'a*+'],
			['possessive repeating quantifier', 'a++'],
			['possessive fixed range quantifier', 'a{1,2}+'],
			['possessive range quantifier without upper bound', 'a{1,}+'],

			// From https://www.regular-expressions.info/refext.html
			['capture group', "(?'x'abc)"],
			['capture group', '(?P<x>abc)'],
			['capture group with duplicate names', '(?<x>a)|(?<x>b)'],
			['capture group with numeric name', '(?<20>a)'],
			['capture group with negative number name', '(?<-17>abc)'],
			['backreference', '(?<x>a) (?P=x)'],
			['backreference nested with group', '(?<x>a\\k<x>?)'],
			['nested backreference', '(?<x>a\\k<x>?){3}'],
			['forward reference', '(\\k<x>?(?<x>a)){3}'],

			// From https://www.regular-expressions.info/posixbrackets.html#coll
			['POSIX collation sequence', '[[.span-ll.]]'],

			// From https://www.regular-expressions.info/refadv.html
			['pattern with comment', 'a(?#foobar)b'],
			['branch reset group', '(x)(?|(a)|(bc)|(def))\\2'],
			['atomic group', 'a(?>bc|b)c'],
			['lookaround conditional', '(?(?<=a)b|c)'],
			['implicit lookahead conditional', '(?(\\d{2})7|c)'],
			['conditional', '(a)?(?(1)b|c)'],
			['conditional', '(a)?(?(+1)b|c)'],
			['relative conditional', '(a)?(?(-1)b|c)'],
			['named conditional', '(?<one>a)?(?(one)b|c)'],
			['named conditional', '(?<one>a)?(?(<one>)b|c)'],
			['named conditional', "(?'one'a)?(?('one')b|c)"],

			// From https://www.regular-expressions.info/refrecurse.html
			['balancing group', '(?<l>\\w)+\\w?(\\k<l>(?<-l>))+(?(l)(?!))'],
			['balancing group', "(?'l'\\w)+\\w?(\\k'l'(?'-l'))+(?(l)(?!))"],
			['recursion', 'a(?R)?z'],
			['recursion', 'a(?0)?z'],
			['subroutine call', 'a(b(?1)?y)z'],
			['relative subroutine call', 'a(b(?-1)?y)z'],
			['forward subroutine call', '(?+1)x([ab])'],
			['named subroutine call', 'a(?<x>b(?&x)?y)z'],
			['named subroutine call', 'a(?P<x>b(?P>x)?y)z'],
			['named subroutine call', "a(?'x'b\\g'x'?y)z"],
			['subroutine definitions', '(?(DEFINE)([ab]))x(?1)y(?1)z'],
		])('throws on RegEx syntax: %s /%s/', (_: string, input: string) => {
			expect(() => expandAll(input)).toThrow();
		});

		[
			// From https://www.regular-expressions.info/refmodifiers.html
			'^', // Reset
			'i', // Case insensitive
			'c', // Case sensitive
			'x', // Free-spacing
			'xx', // Free-spacing
			't', // Exact spacing
			's', // Single-line, Tcl single-line
			'm', // Multi-line, Single-line, Tcl multi-line
			'n', // Tcl multi-line, Explicit capture
			'p', // Tcl "partial" newline-sensitive
			'd', // Tcl "weird" newline-sensitive, UNIX lines
			'J', // Duplicate named groups
			'U', // Ungreedy quantifiers
			'b', // POSIX BRE
			'e', // POSIX ERE
			'q', // Literal
			'X', // Extra syntax
		].forEach((modeModifier) => {
			it.each([
				['positive at start', `(?${modeModifier})test`],
				['positive in middle', `te(?${modeModifier})st`],
				['negative at start', `(?-${modeModifier})test`],
				['negative in middle', `te(?-${modeModifier})st`],
				['positive with other modifiers', `(?${modeModifier}-i)test`],
				['negative with other modifiers', `(?i-${modeModifier})test`],
				['group', `(?${modeModifier}te)st`],
				['group as positive modifier', `(?${modeModifier}-i:te)st`],
				['group as negative modifier', `(?i-${modeModifier}:te)st`],
			])(
				'throws on RegEx mode modifier: %s /%s/',
				(_: string, input: string) => {
					expect(() => expandAll(input)).toThrow();
				}
			);
		});

		// From https://javascript.info/regexp-unicode#the-u-flag
		it('does not support RegEx "u" flag for static character set', () => {
			const result = expandAll(/[𝒳𝒴]/u);
			expect(result).not.toEqual(['𝒳', '𝒴']);
		});

		it('does not support RegEx "u" flag for range character set', () => {
			expect(() => expandAll(/[𝒳-𝒵]/u)).toThrow();
		});

		it('does not recognize RegEx syntax: hexadecimal escaped character', () => {
			const result = expandAll(/\x{2B}/);
			expect(result).toEqual(['x{2B}']);
		});

		it('does not recognize RegEx syntax: unicode escaped character', () => {
			const result = expandAll(/\u{002B}/);
			expect(result).toEqual(['u{002B}']);
		});

		it.each([/a{,5}/, /a{,5}?/])(
			'does not recognize RegEx syntax: range quantifier pattern without lower bound %p',
			(rangeQuantifierNoLower: RegExp) => {
				const result = expandAll(rangeQuantifierNoLower);
				expect(result.pop()).toEqual('a{,5}');
			}
		);

		it('does not recognize RegEx syntax: line break character \\R', () => {
			const result = expandAll(/\R/);
			expect(result).toEqual(['R']);
		});

		it('does not recognize RegEx syntax: not a line break character \\N', () => {
			const result = expandAll(/\N/);
			expect(result).toEqual(['N']);
		});

		it.each<[string, RegExp]>([
			// From https://www.regular-expressions.info/refcharclass.html
			['subtraction', /[c-m-[j-z]]/],
			['intersection', /[a-i&&c-z]/],
			['nested intersection', /[a-i&&[c-z]]/],
		])(
			'does not recognize RegEx syntax: character class %s %p',
			(_: string, input: RegExp) => {
				const result = expandAll(input);
				expect(result).not.toEqual(['c', 'd', 'e', 'f', 'g', 'h', 'i']);
			}
		);

		[
			// From https://www.regular-expressions.info/posixbrackets.html#class
			'alnum',
			'alpha',
			'ascii',
			'blank',
			'cntrl',
			'digit',
			'graph',
			'lower',
			'print',
			'punct',
			'space',
			'upper',
			'word',
			'xdigit',

			// From https://www.regular-expressions.info/refcharclass.html
			'd', // digit
			's', // space
			'w', // word
			'l', // lower
			'u', // upper
			'h', // blank
			'V', // vertical whitespace
		].forEach((posixClass) => {
			it.each([
				['', `[[:${posixClass}:]]`],
				['negative', `[[:^${posixClass}:]]`],
			])(
				'does not recognize RegEx syntax: %s POSIX class /%s/',
				(_: string, input: string) => {
					const result = expandAll(input);
					expect(result.pop()).toEqual(':]');
				}
			);
		});

		[
			// From https://www.regular-expressions.info/posixbrackets.html#class
			'Alnum',
			'Alpha',
			'ASCII',
			'Blank',
			'Cntrl',
			'Digit',
			'Graph',
			'Lower',
			'Print',
			'Punct',
			'Space',
			'Upper',
			'Word',
			'XDigit',
		].forEach((javaPosixClass) => {
			it.each([`\p{${javaPosixClass}}`, `\p{Is${javaPosixClass}}`])(
				`does not recognize RegEx syntax: Java ${javaPosixClass} POSIX class /%s/`,
				(input: string) => {
					const result = expandAll(input);
					expect(result).toHaveLength(1);
					expect(result[0]).toMatch(/^p{/);
				}
			);
		});

		[
			// From https://www.regular-expressions.info/unicode.html#script
			'Common',
			'Arabic',
			'Armenian',
			'Bengali',
			'Bopomofo',
			'Braille',
			'Buhid',
			'Canadian_Aboriginal',
			'Cherokee',
			'Cyrillic',
			'Devanagari',
			'Ethiopic',
			'Georgian',
			'Greek',
			'Gujarati',
			'Gurmukhi',
			'Han',
			'Hangul',
			'Hanunoo',
			'Hebrew',
			'Hiragana',
			'Inherited',
			'Kannada',
			'Katakana',
			'Khmer',
			'Lao',
			'Latin',
			'Limbu',
			'Malayalam',
			'Mongolian',
			'Myanmar',
			'Ogham',
			'Oriya',
			'Runic',
			'Sinhala',
			'Syriac',
			'Tagalog',
			'Tagbanwa',
			'TaiLe',
			'Tamil',
			'Telugu',
			'Thaana',
			'Thai',
			'Tibetan',
			'Yi',
		].forEach((unicodeScript) => {
			it.each([`\p{${unicodeScript}}`, `\p{Is${unicodeScript}}`])(
				'does not recognize RegEx syntax: Unicode script /%s/',
				(input: string) => {
					const result = expandAll(input);
					expect(result).toHaveLength(1);
					expect(result[0]).toMatch(/^p{/);
				}
			);
		});

		[
			// From https://www.regular-expressions.info/unicode.html#block
			'Basic_Latin',
			'Latin-1_Supplement',
			'Latin_Extended-A',
			'Latin_Extended-B',
			'IPA_Extensions',
			'Spacing_Modifier_Letters',
			'Combining_Diacritical_Marks',
			'Greek_and_Coptic',
			'Cyrillic',
			'Cyrillic_Supplementary',
			'Armenian',
			'Hebrew',
			'Arabic',
			'Syriac',
			'Thaana',
			'Devanagari',
			'Bengali',
			'Gurmukhi',
			'Gujarati',
			'Oriya',
			'Tamil',
			'Telugu',
			'Kannada',
			'Malayalam',
			'Sinhala',
			'Thai',
			'Lao',
			'Tibetan',
			'Myanmar',
			'Georgian',
			'Hangul_Jamo',
			'Ethiopic',
			'Cherokee',
			'Unified_Canadian_Aboriginal_Syllabics',
			'Ogham',
			'Runic',
			'Tagalog',
			'Hanunoo',
			'Buhid',
			'Tagbanwa',
			'Khmer',
			'Mongolian',
			'Limbu',
			'Tai_Le',
			'Khmer_Symbols',
			'Phonetic_Extensions',
			'Latin_Extended_Additional',
			'Greek_Extended',
			'General_Punctuation',
			'Superscripts_and_Subscripts',
			'Currency_Symbols',
			'Combining_Diacritical_Marks_for_Symbols',
			'Letterlike_Symbols',
			'Number_Forms',
			'Arrows',
			'Mathematical_Operators',
			'Miscellaneous_Technical',
			'Control_Pictures',
			'Optical_Character_Recognition',
			'Enclosed_Alphanumerics',
			'Box_Drawing',
			'Block_Elements',
			'Geometric_Shapes',
			'Miscellaneous_Symbols',
			'Dingbats',
			'Miscellaneous_Mathematical_Symbols-A',
			'Supplemental_Arrows-A',
			'Braille_Patterns',
			'Supplemental_Arrows-B',
			'Miscellaneous_Mathematical_Symbols-B',
			'Supplemental_Mathematical_Operators',
			'Miscellaneous_Symbols_and_Arrows',
			'CJK_Radicals_Supplement',
			'Kangxi_Radicals',
			'Ideographic_Description_Characters',
			'CJK_Symbols_and_Punctuation',
			'Hiragana',
			'Katakana',
			'Bopomofo',
			'Hangul_Compatibility_Jamo',
			'Kanbun',
			'Bopomofo_Extended',
			'Katakana_Phonetic_Extensions',
			'Enclosed_CJK_Letters_and_Months',
			'CJK_Compatibility',
			'CJK_Unified_Ideographs_Extension_A',
			'Yijing_Hexagram_Symbols',
			'CJK_Unified_Ideographs',
			'Yi_Syllables',
			'Yi_Radicals',
			'Hangul_Syllables',
			'High_Surrogates',
			'High_Private_Use_Surrogates',
			'Low_Surrogates',
			'Private_Use_Area',
			'CJK_Compatibility_Ideographs',
			'Alphabetic_Presentation_Forms',
			'Arabic_Presentation_Forms-A',
			'Variation_Selectors',
			'Combining_Half_Marks',
			'CJK_Compatibility_Forms',
			'Small_Form_Variants',
			'Arabic_Presentation_Forms-B',
			'Halfwidth_and_Fullwidth_Forms',
			'Specials',
		].forEach((unicodeBlock) => {
			it.each([
				['', `\p{${unicodeBlock}}`],
				['', `\p{Is${unicodeBlock}}`],
				['', `\p{In${unicodeBlock}}`],
				['lowercase', `\p{In${unicodeBlock.toLowerCase()}}`],
			])(
				`does not recognize RegEx syntax: ${unicodeBlock} Unicode block %s /%s/`,
				(_, input) => {
					const result = expandAll(input);
					expect(result).toHaveLength(1);
					expect(result[0]).toMatch(/^p{/);
				}
			);

			if (unicodeBlock.includes('_')) {
				it.each([
					['no underscores', `\p{${unicodeBlock.replace('_', '')}}`],
					['hyphens for underscores', `\p{${unicodeBlock.replace('_', '-')}}`],
					['spaces for underscores', `\p{${unicodeBlock.replace('_', ' ')}}`],
				])(
					`does not recognize RegEx syntax: ${unicodeBlock} Unicode block %s /%s/`,
					(_, input) => {
						const result = expandAll(input);
						expect(result).toHaveLength(1);
						expect(result[0]).toMatch(/^p{/);
					}
				);
			}

			if (unicodeBlock.includes('-')) {
				it.each([
					['no hyphens', `\p{${unicodeBlock.replace('-', '')}}`],
					['underscores for hyphens', `\p{${unicodeBlock.replace('-', '_')}}`],
					['spaces for hyphens', `\p{${unicodeBlock.replace('-', ' ')}}`],
				])(
					`does not recognize RegEx syntax: ${unicodeBlock} Unicode block %s /%s/`,
					(_, input) => {
						const result = expandAll(input);
						expect(result).toHaveLength(1);
						expect(result[0]).toMatch(/^p{/);
					}
				);
			}
		});

		[
			// From https://www.regular-expressions.info/unicode.html#category
			'Letter',
			'L',
			'Lowercase_Letter',
			'Ll',
			'Uppercase_Letter',
			'Lu',
			'Titlecase_Letter',
			'Lt',
			'Cased_Letter',
			'L&',
			'Modifier_Letter',
			'Lm',
			'Other_Letter',
			'Lo',
			'Mark',
			'M',
			'Non_Spacing_Mark',
			'Mn',
			'Spacing_Combining_Mark',
			'Mc',
			'Enclosing_Mark',
			'Me',
			'Separator',
			'Z',
			'Space_Separator',
			'Zs',
			'Line_Separator',
			'Zl',
			'Paragraph_Separator',
			'Zp',
			'Symbol',
			'S',
			'Math_Symbol',
			'Sm',
			'Currency_Symbol',
			'Sc',
			'Modifier_Symbol',
			'Sk',
			'Other_Symbol',
			'So',
			'Number',
			'N',
			'Decimal_Digit_Number',
			'Nd',
			'Letter_Number',
			'Nl',
			'Other_Number',
			'No',
			'Punctuation',
			'P',
			'Dash_Punctuation',
			'Pd',
			'Open_Punctuation',
			'Ps',
			'Close_Punctuation',
			'Pe',
			'Initial_Punctuation',
			'Pi',
			'Final_Punctuation',
			'Pf',
			'Connector_Punctuation',
			'Pc',
			'Other_Punctuation',
			'Po',
			'Other',
			'C',
			'Control',
			'Cc',
			'Format',
			'Cf',
			'Private_Use',
			'Co',
			'Surrogate',
			'Cs',
			'Unassigned',
			'Cn',
		].forEach((unicodeCategory) => {
			it.each([
				['Longhand format', `\p{${unicodeCategory}}`],
				['Longhand format', `\p{Is${unicodeCategory}}`],
				['Longhand negative format', `\p{^${unicodeCategory}}`],
			])(
				`does not recognize RegEx syntax: ${unicodeCategory} Unicode category %s /%s/`,
				(_: string, input: string) => {
					const result = expandAll(input);
					expect(result).toHaveLength(1);
					expect(result[0]).toMatch(/^p{/);
				}
			);

			it.each([
				['Longhand negative format', `\P{${unicodeCategory}}`],
				['Longhand double negative format', `\P{^${unicodeCategory}}`],
			])(
				`does not recognize RegEx syntax: ${unicodeCategory} Unicode category %s /%s/`,
				(_: string, input: string) => {
					const result = expandAll(input);
					expect(result).toHaveLength(1);
					expect(result[0]).toMatch(/^P{/);
				}
			);
		});

		// From https://www.regular-expressions.info/unicode.html#category
		['L', 'M', 'Z', 'S', 'N', 'P', 'C'].forEach((unicodeCategory) => {
			it.each([`\p${unicodeCategory}`])(
				'does not recognize RegEx syntax: Unicode category shorthand format /%s/',
				(input: string) => {
					const result = expandAll(input);
					expect(result).toHaveLength(1);
					expect(result[0]).toMatch(/^p/);
				}
			);

			it.each([`\P${unicodeCategory}`])(
				'does not recognize RegEx syntax: Unicode category shorthand negative format /%s/',
				(input: string) => {
					const result = expandAll(input);
					expect(result).toHaveLength(1);
					expect(result[0]).toMatch(/^P/);
				}
			);
		});

		// From https://www.regular-expressions.info/posixbrackets.html#eq
		it('does not recognize RegEx syntax: POSIX character equivalent', () => {
			const result = expandAll('[[=e=]]');
			expect(result).toEqual(['e]', '=]', '[]']);
		});

		it('does not recognize RegEx syntax: grapheme \\X', () => {
			const result = expandAll(/\X/);
			expect(result).toEqual(['X']);
		});

		it.each<[string, RegExp | string]>([
			// From https://www.regular-expressions.info/refcharacters.html
			['Escape sequence', /Qab abE/],
			['Octal escape sequence', /\o{141}\o{142} \o{141}\o{142}/],

			// From https://www.regular-expressions.info/refanchors.html
			['Start attempt anchor', /\Aab \Aab/],
			['Start attempt anchor', /\Gab \Gab/],
			['Start string anchor', /\`ab ab/],
			['End string anchor', /ab ab\z/],
			['End string anchor', /ab ab\Z/],
			['End string anchor', /ab ab\'/],

			// From https://www.regular-expressions.info/refwordboundaries.html
			['Tcl boundary anchor', /ab\y \yab/],
			['Tcl negated boundary anchor', /a\Yb a\Yb/],
			['Tcl start boundary anchor', /a\mb a\mb/],
			['Tcl end boundary anchor', /ab\M ab\M/],
			['GNU start boundary anchor', /\<ab \<ab/],
			['GNU end boundary anchor', /ab\> ab\>/],
			['POSIX start boundary anchor', /[[:<:]]ab [[:<:]]ab/],
			['POSIX end boundary anchor', /ab[[:>:]] ab[[:>:]]/],

			// From https://www.regular-expressions.info/refadv.html
			['backreference in lookbehind', /(ab) (?<=\1)/],
			['marker to ignore preceeding text', /ignore this \Kab ab/],

			// From https://www.regular-expressions.info/refext.html
			['numbered backreference before group', '\\1 (ab)'],
			['named backreference before group', '\\k<x> (?<x>ab)'],
			['backreference', "(?<x>ab) \\k'x'"],
			['backreference', '(?<x>ab) \\k{x}'],
			['backreference', '(?<x>ab) \\g{x}'],
			['failed backreference', '(?<x>ab)? \\k<x>'],
		])('does not recognize RegEx syntax: %s %p', (_, input) => {
			const result = expandAll(input);
			expect(result).not.toEqual(['ab ab']);
		});

		it.each<RegExp>([
			// From https://www.regular-expressions.info/refrecurse.html
			/a\g<0>?z/,
			/ag'0'?z/,
		])('does not recognize RegEx syntax: recursion %p', (input: RegExp) => {
			const result = expandN(input, 3);
			expect(result).not.toEqual(['az', 'aazz', 'aaazzz']);
		});

		it.each([
			// From https://www.regular-expressions.info/refrecurse.html
			['', 'a(b\\g<1>?y)z'],
			['', "a(b\\g'1'?y)z"],
			['relative', 'a(b\\g<-1>?y)z'],
			['relative', "a(b\\g'-1'?y)z"],
			['named', 'a(?<x>b\\g<x>?y)z'],
		])(
			'does not recognize RegEx syntax: %s subroutine call /%s/',
			(_: string, input: string) => {
				const result = expandN(input, 3);
				expect(result).not.toEqual(['abyz', 'abbyyz', 'abbbyyyz']);
			}
		);

		it.each<RegExp>([
			// From https://www.regular-expressions.info/refrecurse.html
			/\g<+1>x([ab])/,
			/\g'+1'x([ab])/,
		])(
			'does not recognize RegEx syntax: forward subroutine call %p',
			(input: RegExp) => {
				const result = expandAll(input);
				expect(result).not.toEqual(['axa', 'axb', 'bxa', 'bxb']);
			}
		);
	});
});

describe('expandN', () => {
	const { expandN } = patternLib;

	it('passes pattern to expand()', () => {
		when(jest.spyOn(patternLib, 'expand'))
			.calledWith('test')
			.mockReturnValue(new Expansion(['1', '2', '3'], 3));

		const result = expandN('test', 10);

		expect(result).toEqual(['1', '2', '3']);
	});

	it('normalizes pattern with toRegExp()', () => {
		when(jest.spyOn(patternLib, 'toRegExp'))
			.calledWith('/test/')
			.mockReturnValue('/foo/');

		const result = expandN('/test/', 10);

		expect(result).toEqual(['foo']);
	});

	it('returns at most the specified number of expansions', () => {
		const result = expandN(/\d\d\d\d\d/, 10);
		expect(result).toHaveLength(10);
	});

	it('returns all expansions if fewer than the specified limit', () => {
		const result = expandN(/[abc]/, 10);
		expect(result).toHaveLength(3);
	});

	it('is performant', () => {
		const trial = () => expandN(/([ab]|(c|[d-e]){2,3})(\w?) \1/, 1000);
		const averageTime = measureAverageTime(trial, 5);
		expect(averageTime).toBeLessThanOrEqual(200);
	});
});

describe('expandAll', () => {
	const { expandAll } = patternLib;

	it('passes pattern to expand()', () => {
		when(jest.spyOn(patternLib, 'expand'))
			.calledWith('test')
			.mockReturnValue(new Expansion(['7', '8', '9'], 3));

		const result = expandAll('test');

		expect(result).toEqual(['7', '8', '9']);
	});

	it('normalizes pattern with toRegExp()', () => {
		when(jest.spyOn(patternLib, 'toRegExp'))
			.calledWith('/test/')
			.mockReturnValue('/foo/');

		const result = expandAll('/test/');

		expect(result).toEqual(['foo']);
	});

	it('returns all expansions', () => {
		const result = expandAll(/\d\d\d\d\d/);
		expect(result).toHaveLength(100000);
	});

	it('is performant', () => {
		const trial = () => expandAll(/([ab]|(c|[d-e]){2,3})(\w?) \1/);
		const averageTime = measureAverageTime(trial, 5);
		expect(averageTime).toBeLessThanOrEqual(1000);
	});
});

describe('toRegExp', () => {
	const { toRegExp } = patternLib;

	it('preserves a RegExp pattern as-is', () => {
		const pattern = /[123]/gim;
		const result = toRegExp(pattern);
		expect(result).toBe(pattern);
	});

	it('converts RegEx-like string pattern to RegExp', () => {
		const result = toRegExp('/[123]/');
		expect(result).toStrictEqual(/[123]/);
	});

	it('converts RegEx-like string pattern with flags to RegExp', () => {
		const result = toRegExp('/[123]/igm');
		expect(result).toStrictEqual(/[123]/gim);
	});

	it.each([
		'abc',
		'[abc]',
		'/abc',
		'abc/',
		'abc/i',
		'a/bc/',
		'a/bc/i',
		'\\/abc/i',
		'/abc\\/i',
		'/abc/i/',
	])(
		'converts non-RegEx-like string pattern %p to RegEx-like string',
		(input: string) => {
			const result = toRegExp(input);
			expect(result).toBe(`/${input}/`);
		}
	);

	it('converts non-RegEx-like string pattern to RegEx-like string', () => {
		const result = toRegExp('[123]');
		expect(result).toBe('/[123]/');
	});

	it('applies and drops the "s" flag for compatibility with older RegEx engines', () => {
		const result = toRegExp('/./s');
		expect(result).toStrictEqual(/[\0-\uFFFF]/);
	});

	it('transforms named groups for compatibility with older RegEx engines', () => {
		const result = toRegExp('/(?<name>a)\\k<name>/');
		expect(result).toStrictEqual(/(a)\1/);
	});

	it('drops the "x" flag for compatibility with older RegEx engines', () => {
		const result = toRegExp('/./x');
		expect(result).toStrictEqual(/./);
	});

	it('is performant', () => {
		const trial = () => toRegExp('/[123]/igm');
		const averageTime = measureAverageTime(trial, 5);
		expect(averageTime).toBeLessThanOrEqual(3);
	});
});
