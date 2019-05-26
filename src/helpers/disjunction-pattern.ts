import { Disjunction } from 'regexp-tree/ast';
import Expander from '../Expander';
import Expansion from '../Expansion';

/**
 * Expand an expression which represents one of two options, like "(a|b}"
 * or "([0-5]|8+)".
 * If a regular expression has more than two options, like "(a|b|c|d)",
 * it will be parsed as multiple disjunctions like "(a|(b|(c|d)))"
 * @param node The Disjunction expression to expand
 * @return The Expansion of node
 */
export function expandDisjunction(this: Expander, node: Disjunction) {
	const expressions = [node.left, node.right];
	const sortedExpressions = this.sort(expressions);

	const expansion1 = this.expandExpression(sortedExpressions[0]);
	const expansion2 = this.expandExpression(sortedExpressions[1]);

	function* expandBothSides() {
		yield* expansion1.getIterator();
		yield* expansion2.getIterator();
	}
	const iterationsSum = expansion1.count + expansion2.count;

	return new Expansion(expandBothSides, iterationsSum);
}
