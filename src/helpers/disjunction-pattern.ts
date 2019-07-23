import { Disjunction } from 'regexp-tree/ast';
import Expander from '../Expander';
import Expansion from '../Expansion';
import { iterateWeightedByCount } from './iterate-sorted';

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

	const expandBothSides = () => iterateWeightedByCount(expansions);
	const iterationsSum = expansions[0].count + expansions[1].count;

	return new Expansion(expandBothSides, iterationsSum);
}
