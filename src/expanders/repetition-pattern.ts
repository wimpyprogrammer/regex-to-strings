import { Quantifier, Repetition } from 'regexp-tree/ast';
import Expander from '../Expander';
import Expansion from '../Expansion';
import * as Guards from '../types/regexp-tree-guards';
import {
	iteratePermutations,
	iterateWeightedByCount,
} from '../helpers/iterate-sorted';
import { fill } from '../helpers/utils';

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error(`Unexpected quantifier: ${x}`);
}

function getNumOccurrences(quantifier: Quantifier): [number, number] {
	/* istanbul ignore next */
	if (Guards.isSimpleQuantifier(quantifier)) {
		const transformer = 'simpleQuantifierToRangeQuantifierTransform';
		throw new Error(`"${quantifier.kind}" not removed by ${transformer}`);
	} else if (!Guards.isRangeQuantifier(quantifier)) {
		assertNever(quantifier);
	}

	const { from, to } = quantifier;
	// Cap unbounded quantifiers like * and +.
	// Otherwise there would be infinite expansions.
	return [from, to !== undefined ? to : 100];
}

/**
 * Expand an expression that repeats another expression, like "a{1,5}"
 * and "(\d|[a-m]){3,}".
 * @param node The Repetition expression to expand
 * @return The Expansion of node
 */
export function expandRepetition(this: Expander, node: Repetition): Expansion {
	const [minOccurrences, maxOccurrences] = getNumOccurrences(node.quantifier);
	const numOccurrenceOptions = fill(minOccurrences, maxOccurrences);

	const expansionOnce = this.expandExpression(node.expression);

	// Calculate the expansions for each quantity of repetition, like "a{1}",
	// "a{2}", "a{3}", etc.
	const allExpansions = numOccurrenceOptions.map(numOccurrences => {
		if (numOccurrences <= 0) {
			return Expansion.Blank;
		}

		const expansionNTimes = new Array<Expansion>(numOccurrences).fill(
			expansionOnce
		);
		const numPermutationsThisNumOccurrences =
			expansionOnce.count ** numOccurrences;

		return new Expansion(
			() => iteratePermutations(expansionNTimes),
			numPermutationsThisNumOccurrences
		);
	});
	const totalNumPermutations = allExpansions.reduce(
		(sum, { count }) => sum + count,
		0
	);

	// Return all of the expansions for all quantities of repetition.
	return new Expansion(
		() => iterateWeightedByCount(allExpansions),
		totalNumPermutations
	);
}
