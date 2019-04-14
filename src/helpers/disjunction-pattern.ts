import { Disjunction } from 'regexp-tree/ast';
import Expander from '../Expander';

/**
 * Expand an expression which represents one of two options, like "(a|b}"
 * or "([0-5]|8+)".
 * If a regular expression has more than two options, like "(a|b|c|d)",
 * it will be parsed as multiple disjunctions like "(a|(b|(c|d)))"
 * @param node The Disjunction expression to expand
 * @returns An iterator that yields strings matched by node
 */
export function* expandDisjunction(this: Expander, node: Disjunction) {
	const expressions = [node.left, node.right];
	const sortedExpressions = this.sort(expressions);

	for (const expression of sortedExpressions) {
		yield* this.expandExpression(expression);
	}
}
