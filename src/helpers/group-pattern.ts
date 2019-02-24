import { Backreference, Group } from 'regexp-tree/ast';
import { expandNode } from '../pattern';
import {
	isCapturingGroup,
	isNamedBackreference,
	isNumericBackreference,
} from '../typings/regexp-tree-guards';

const namedGroups: { [name: string]: string } = {};
const numberedGroups: { [num: number]: string } = {};

export function* expandBackreference(
	node: Backreference
): IterableIterator<string> {
	if (isNamedBackreference(node)) {
		yield namedGroups[node.reference];
	} else if (isNumericBackreference(node)) {
		yield numberedGroups[node.number];
	} else {
		/* istanbul ignore next */
		throw new Error('Unexpected backreference');
	}
}

export function* expandGroup(node: Group): IterableIterator<string> {
	const generator = expandNode(node.expression);

	for (const expression of generator) {
		if (isCapturingGroup(node)) {
			numberedGroups[node.number] = expression;

			if (node.name) {
				namedGroups[node.name] = expression;
			}
		}

		yield expression;
	}
}
