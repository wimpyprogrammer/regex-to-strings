import { parse } from 'regexp-tree';
import { expandAlternative } from './helpers/alternative-pattern';
import { expandChar } from './helpers/char-pattern';
import { expandCharacterClass } from './helpers/character-class-pattern';
import { expandBackreference, expandGroup } from './helpers/group-pattern';
import { expandRepetition } from './helpers/repetition-pattern';
import { Node } from './typings/regexp-tree';
import * as Guards from './typings/regexp-tree-guards';

export function* expand(pattern: string): IterableIterator<string> {
	if (!pattern) {
		return [];
	}

	const parsed: Node.RegExp = parse(`/${pattern}/`);

	yield* expandNode(parsed.body);
}

export function* expandNode(node: Node.Expression): IterableIterator<string> {
	if (Guards.isAlternative(node)) {
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
		throw new Error('Unexpected node type');
	}
}
