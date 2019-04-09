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
	yield* expander.expandNode(parsed.body);
}
