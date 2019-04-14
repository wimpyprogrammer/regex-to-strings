import { Alternative, Expression } from 'regexp-tree/ast';
import Expander from '../Expander';

function* traverseTree(
	this: Expander,
	tree: Expression[]
): IterableIterator<string> {
	if (!tree.length) {
		return;
	}

	/**
	 * Recursively expand all expressions in the alternative. Then
	 * combine all the permutations of the expansions. This is
	 * necessary to expand deep, complex expressions like [12](3+|\d)
	 */

	const firstBranch = this.expandExpression(tree[0]);

	for (const firstBranchPermutation of firstBranch) {
		const restOfTree = traverseTree.call(this, tree.slice(1));
		let isEndOfTree = true;

		for (const restOfTreePermutation of restOfTree) {
			isEndOfTree = false;
			yield `${firstBranchPermutation}${restOfTreePermutation}`;
		}

		if (isEndOfTree) {
			yield firstBranchPermutation;
		}
	}
}

/**
 * Expand an expression that itself is a series of expressions, such as
 * "abc", "a[bc]", "a(b|c)", or "a\d+".
 * @param node The Alternative expression to expand
 * @returns An iterator that yields strings matched by node
 */
export function* expandAlternative(this: Expander, node: Alternative) {
	yield* traverseTree.call(this, node.expressions);
}
