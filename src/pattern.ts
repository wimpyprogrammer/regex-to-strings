import { parse, transform } from 'regexp-tree';
import Expander from './Expander';
import transforms from './transforms/index';

export function* expand(pattern: string | RegExp, sort?: Expander['sort']) {
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

export function expandN(
	input: string | RegExp,
	maxExpansions: number,
	sort?: Expander['sort']
) {
	const results = [];
	const generator = expand(input, sort);

	let expansion = generator.next();
	while (!expansion.done && results.length < maxExpansions) {
		results.push(expansion.value);
		expansion = generator.next();
	}

	return results;
}

export function expandAll(input: string | RegExp, sort?: Expander['sort']) {
	return [...expand(input, sort)];
}
