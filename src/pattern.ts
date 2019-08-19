import { compatTranspile, parse, transform } from 'regexp-tree';
import Expander from './Expander';
import Expansion from './Expansion';
// Circular reference for spying/mocking in tests
// eslint-disable-next-line import/no-self-import
import { expand } from './pattern';
import transforms from './transforms/index';

// From https://triin.net/2011/10/19/Meta_Regular_Expression
const regexAsStringPattern = /^\/([^/\[\\]|\\.|\[([^\]\\]|\\.)*\])*\/[a-z]*$/i;

/**
 * Calculate how many strings satisfy the regular expression pattern.
 * @param pattern The regular expression to expand
 * @return The total number of strings that satisfy the regular expression
 * @throws When pattern is invalid or unsupported syntax
 */
export function count(pattern: string | RegExp): number {
	return expand(pattern).count;
}

/**
 * Calculate strings that satisfy the regular expression pattern.
 * @param pattern The regular expression to expand
 * @return The Expansion of pattern
 * @throws When pattern is invalid or unsupported syntax
 */
function unmockedExpand(pattern: string | RegExp): Expansion {
	if (pattern === null) {
		return Expansion.Empty;
	} else if (!pattern) {
		return Expansion.Blank;
	}

	let patternFormatted: string | RegExp;

	if (pattern instanceof RegExp) {
		patternFormatted = pattern;
	} else if (regexAsStringPattern.test(pattern.trim())) {
		// The string looks like RegEx, e.g. "/abc/i"
		patternFormatted = compatTranspile(pattern).toRegExp();
	} else {
		patternFormatted = `/${pattern}/`;
	}

	// Run custom RegEx mutations in /transforms
	const transformed = transform(patternFormatted, transforms);

	// Process the RegEx logic into a regexp-tree
	const parsed = parse(transformed.toString());

	// Create an expansion generator with regex-to-strings
	const expander = new Expander(parsed.flags);
	return expander.expandExpression(parsed.body);
}
export { unmockedExpand as expand };

/**
 * Calculate up to N strings that satisfy the regular expression pattern.
 * Return all strings or N strings, whichever is fewer.
 * @param pattern The regular expression to expand
 * @param maxExpansions The maximum number of expansions to return
 * @return A list of up to maxExpansions strings matched by pattern
 * @throws When pattern is invalid or unsupported syntax
 */
export function expandN(
	pattern: string | RegExp,
	maxExpansions: number
): string[] {
	const results = [];
	const generator = expand(pattern).getIterator();

	let expansion = generator.next();
	while (!expansion.done && results.length < maxExpansions) {
		results.push(expansion.value);
		expansion = generator.next();
	}

	return results;
}

/**
 * Calculate all strings that satisfy the regular expression pattern.
 * @param pattern The regular expression to expand
 * @return A list of strings matched by pattern
 * @throws When pattern is invalid or unsupported syntax
 */
export function expandAll(pattern: string | RegExp): string[] {
	return [...expand(pattern).getIterator()];
}
