import { Disjunction } from 'regexp-tree/ast';
import Expander from '../Expander';

export function* expandDisjunction(this: Expander, node: Disjunction) {
	const expressions = [node.left, node.right];

	for (const expression of expressions) {
		yield* this.expandNode(expression);
	}
}
