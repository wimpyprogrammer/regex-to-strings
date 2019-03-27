import { parse, transform } from 'regexp-tree';
import { Expression } from 'regexp-tree/ast';
import { expandAlternative } from './helpers/alternative-pattern';
import { expandChar } from './helpers/char-pattern';
import { expandCharacterClass } from './helpers/character-class-pattern';
import { expandBackreference, expandGroup } from './helpers/group-pattern';
import { expandRepetition } from './helpers/repetition-pattern';
import transforms from './transforms/index';
import * as Guards from './types/regexp-tree-guards';

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected node type: ' + x);
}

export function* expand(pattern: string) {
	if (!pattern) {
		return [];
	}

	const transformed = transform(`/${pattern}/`, transforms);

	const parsed = parse(transformed.toString());

	yield* expandNode(parsed.body);
}

export function* expandNode(node: Expression | null): IterableIterator<string> {
	if (node === null) {
		yield '';
	} else if (Guards.isAlternative(node)) {
		yield* expandAlternative(node);
	} else if (Guards.isAssertion(node)) {
		yield '';
	} else if (Guards.isBackreference(node)) {
		yield* expandBackreference(node);
	} else if (Guards.isChar(node)) {
		yield* expandChar(node);
	} else if (Guards.isCharacterClass(node)) {
		yield* expandCharacterClass(node);
	} else if (Guards.isDisjunction(node)) {
		yield* expandNode(node.left);
		yield* expandNode(node.right);
	} else if (Guards.isGroup(node)) {
		yield* expandGroup(node);
	} else if (Guards.isRepetition(node)) {
		yield* expandRepetition(node);
	} else {
		/* istanbul ignore next */
		assertNever(node);
	}
}
