import { Backreference, Group } from 'regexp-tree/ast';
import Expander from '../Expander';
import * as Guards from '../types/regexp-tree-guards';

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected backreference: ' + x);
}

const namedGroups: { [name: string]: string } = {};
const numberedGroups: { [num: number]: string } = {};

/**
 * Expand an expression which copies a Group elsewhere in
 * the regular expression, either by number or name.
 * @param node The Backreference expression to expand
 * @returns An iterator that yields strings matched by node
 */
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

/**
 * Expand an expression that wraps another expression, like "(a)"
 * and "(\d+|[a-d])". If the outer expression is "capturing", it has
 * an implicit numeric identifier and can have an explicit name.
 * @param node The Group expression to expand
 * @returns An iterator that yields strings matched by node
 */
export function* expandGroup(this: Expander, node: Group) {
	const generator = this.expandExpression(node.expression);

	for (const expression of generator) {
		// Store the expansion in case this Group is referenced
		// by a Backreference.
		if (Guards.isCapturingGroup(node)) {
			numberedGroups[node.number] = expression;

			if (node.name) {
				namedGroups[node.name] = expression;
			}
		}

		yield expression;
	}
}
