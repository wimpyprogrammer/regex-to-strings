import { Disjunction } from 'regexp-tree/ast';
import Expander from '../Expander';

export function* expandDisjunction(this: Expander, node: Disjunction) {
	const expressions = [node.left, node.right];
	const sortedExpressions = this.sort(expressions);

	for (const expression of sortedExpressions) {
		yield* this.expandNode(expression);
	}
}
