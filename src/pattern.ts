import { parse, transform } from 'regexp-tree';
import Expander from './Expander';
import Expansion from './Expansion';
// Circular reference for spying/mocking in tests
import { expand } from './pattern';
import transforms from './transforms/index';

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
 * @param sort An optional function for sorting variations during parsing.
 *             When omitted, variations are returned randomly.
 * @return The Expansion of pattern
 * @throws When pattern is invalid or unsupported syntax
 */
function unmockedExpand(
	pattern: string | RegExp,
	sort?: Expander['sort']
): Expansion {
	if (pattern === null) {
		return Expansion.Empty;
	} else if (!pattern) {
		return Expansion.Blank;
	}

	let parsed;

	if (pattern instanceof RegExp) {
		const transformed = transform(pattern, transforms);
		parsed = parse(transformed.toRegExp());
	} else {
		const transformed = transform(`/${pattern}/`, transforms);
		parsed = parse(transformed.toString());
	}

	const expander = new Expander(parsed.flags, sort);
	return expander.expandExpression(parsed.body);
}
export { unmockedExpand as expand };

/**
 * Calculate up to N strings that satisfy the regular expression pattern.
 * Return all strings or N strings, whichever is fewer.
 * @param pattern The regular expression to expand
 * @param maxExpansions The maximum number of expansions to return
 * @param sort An optional function for sorting variations during parsing.
 *             When omitted, variations are returned randomly.
 * @return A list of up to maxExpansions strings matched by pattern
 * @throws When pattern is invalid or unsupported syntax
 */
export function expandN(
	pattern: string | RegExp,
	maxExpansions: number,
	sort?: Expander['sort']
): string[] {
	const results = [];
	const generator = expand(pattern, sort).getIterator();

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
 * @param sort An optional function for sorting variations during parsing.
 *             When omitted, variations are returned randomly.
 * @return A list of strings matched by pattern
 * @throws When pattern is invalid or unsupported syntax
 */
export function expandAll(
	pattern: string | RegExp,
	sort?: Expander['sort']
): string[] {
	return [...expand(pattern, sort).getIterator()];
}
