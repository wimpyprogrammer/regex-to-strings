import { parse, transform } from 'regexp-tree';
import Expander from './Expander';
import transforms from './transforms/index';

/**
 * Calculate strings that satisfy the regular expression pattern.
 * @param pattern The regular expression to expand
 * @param sort An optional function for sorting variations during parsing.
 *             When omitted, variations are returned randomly.
 * @returns An iterator that yields strings matched by pattern
 * @throws When pattern is invalid or unsupported syntax
 */
export function* expand(
	pattern: string | RegExp,
	sort?: Expander['sort']
): IterableIterator<string> {
	if (!pattern) {
		return [];
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
	yield* expander.expandExpression(parsed.body);
}

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
	const generator = expand(pattern, sort);

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
	return [...expand(pattern, sort)];
}
