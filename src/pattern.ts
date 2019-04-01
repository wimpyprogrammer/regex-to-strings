import { parse, transform } from 'regexp-tree';
import { Expression } from 'regexp-tree/ast';
import Expander from './Expander';
import transforms from './transforms/index';
import * as Guards from './types/regexp-tree-guards';

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected node type: ' + x);
}

export function* expand(pattern: string | RegExp) {
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

	const expander = new Expander(parsed.flags);
	yield* expander.expandNode(parsed.body);
}

export function* expandNode(
	this: Expander,
	node: Expression | null
): IterableIterator<string> {
	if (node === null) {
		yield '';
	} else if (Guards.isAlternative(node)) {
		yield* this.expandAlternative(node);
	} else if (Guards.isAssertion(node)) {
		yield '';
	} else if (Guards.isBackreference(node)) {
		yield* this.expandBackreference(node);
	} else if (Guards.isChar(node)) {
		yield* this.expandChar(node);
	} else if (Guards.isCharacterClass(node)) {
		yield* this.expandCharacterClass(node);
	} else if (Guards.isDisjunction(node)) {
		yield* this.expandNode(node.left);
		yield* this.expandNode(node.right);
	} else if (Guards.isGroup(node)) {
		yield* this.expandGroup(node);
	} else if (Guards.isRepetition(node)) {
		yield* this.expandRepetition(node);
	} else {
		/* istanbul ignore next */
		assertNever(node);
	}
}
