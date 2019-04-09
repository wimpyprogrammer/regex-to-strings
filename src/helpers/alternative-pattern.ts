import { Alternative, Expression } from 'regexp-tree/ast';
import Expander from '../Expander';

function* traverseTree(
	this: Expander,
	tree: Expression[]
): IterableIterator<string> {
	if (!tree.length) {
		return;
	}

	const firstBranch = this.expandNode(tree[0]);

	for (const firstBranchPermutation of firstBranch) {
		const restOfTree = traverseTree.call(this, tree.slice(1));
		let restOfTreeHasPermutations = false;

		for (const restOfTreePermutation of restOfTree) {
			restOfTreeHasPermutations = true;
			yield firstBranchPermutation.concat(restOfTreePermutation);
		}

		if (!restOfTreeHasPermutations) {
			yield firstBranchPermutation;
		}
	}
}

export function* expandAlternative(this: Expander, node: Alternative) {
	const sortedExpressions = this.sort(node.expressions);

	yield* traverseTree.call(this, sortedExpressions);
}
