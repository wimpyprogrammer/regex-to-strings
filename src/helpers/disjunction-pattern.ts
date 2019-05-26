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
	const expansions = expressions.map(e => this.expandExpression(e));

	function* expandBothSides(this: Expander) {
		const sorted = this.sort(expansions);

		yield* sorted[0].getIterator();
		yield* sorted[1].getIterator();
	}
	const iterationsSum = expansions[0].count + expansions[1].count;

	return new Expansion(expandBothSides.bind(this), iterationsSum);
}
