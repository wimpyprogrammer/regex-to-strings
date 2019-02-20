import { expandNode } from '../pattern';
import { Node } from '../typings/regexp-tree';
import {
	isCapturingGroup,
	isNamedBackreference,
	isNumericBackreference,
} from '../typings/regexp-tree-guards';

const namedGroups: { [name: string]: string } = {};
const numberedGroups: { [num: number]: string } = {};

export function* expandBackreference(
	node: Node.Backreference
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

export function* expandGroup(node: Node.Group): IterableIterator<string> {
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
