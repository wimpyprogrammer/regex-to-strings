import { Alternative, Expression } from 'regexp-tree/ast';
import Expander from '../Expander';
import Expansion from '../Expansion';

function* iteratePermutations(head: Expansion, tail: Expansion) {
	if (tail.count <= 0) {
		return yield* head.getIterator();
	}

	for (const headPermutation of head.getIterator()) {
		for (const tailPermutation of tail.getIterator()) {
			yield `${headPermutation}${tailPermutation}`;
		}
	}
}

function traverseTree(this: Expander, tree: Expression[]): Expansion {
	if (!tree.length) {
		return Expansion.Empty;
	}

	/**
	 * Recursively expand all expressions in the alternative. Then
	 * combine all the permutations of the expansions. This is
	 * necessary to expand deep, complex expressions like [12](3+|\d)
	 */

	const firstBranch = this.expandExpression(tree[0]);
	const restOfTree = traverseTree.call(this, tree.slice(1));

	if (restOfTree.count <= 0) {
		return firstBranch;
	}

	const numPermutations = firstBranch.count * restOfTree.count;
	const iterator = () => iteratePermutations(firstBranch, restOfTree);
	return new Expansion(iterator, numPermutations);
}

/**
 * Expand an expression that itself is a series of expressions, such as
 * "abc", "a[bc]", "a(b|c)", or "a\d+".
 * @param node The Alternative expression to expand
 * @return The Expansion of node
 */
export function expandAlternative(this: Expander, node: Alternative) {
	return traverseTree.call(this, node.expressions);
}
