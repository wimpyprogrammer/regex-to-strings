import { Backreference, Group } from 'regexp-tree/ast';
import Expander from '../Expander';
import * as Guards from '../types/regexp-tree-guards';

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected backreference: ' + x);
}

const namedGroups: { [name: string]: string } = {};
const numberedGroups: { [num: number]: string } = {};

export function* expandBackreference(node: Backreference) {
	if (Guards.isNamedBackreference(node)) {
		yield namedGroups[node.reference];
	} else if (Guards.isNumericBackreference(node)) {
		yield numberedGroups[node.number];
	} else {
		/* istanbul ignore next */
		assertNever(node);
	}
}

export function* expandGroup(this: Expander, node: Group) {
	const generator = this.expandExpression(node.expression);

	for (const expression of generator) {
		if (Guards.isCapturingGroup(node)) {
			numberedGroups[node.number] = expression;

			if (node.name) {
				namedGroups[node.name] = expression;
			}
		}

		yield expression;
	}
}
