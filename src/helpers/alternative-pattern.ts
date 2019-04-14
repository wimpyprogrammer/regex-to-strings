import { Alternative, Expression } from 'regexp-tree/ast';
import Expander from '../Expander';

function* traverseTree(
	this: Expander,
	tree: Expression[]
): IterableIterator<string> {
	if (!tree.length) {
		return;
	}

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

export function* expandAlternative(this: Expander, node: Alternative) {
	yield* traverseTree.call(this, node.expressions);
}
