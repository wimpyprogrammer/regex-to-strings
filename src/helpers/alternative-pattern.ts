import { expandNode } from '../pattern';
import { Node } from '../typings/regexp-tree';

function* traverseTree(tree: Node.Expression[]): IterableIterator<string> {
	if (!tree.length) {
		return;
	}

	const firstBranch = expandNode(tree[0]);

	for (const firstBranchPermutation of firstBranch) {
		const restOfTree = traverseTree(tree.slice(1));
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

export function* expandAlternative(
	node: Node.Alternative
): IterableIterator<string> {
	yield* traverseTree(node.expressions);
}
