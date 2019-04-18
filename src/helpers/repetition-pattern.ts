import { Expression, Quantifier, Repetition } from 'regexp-tree/ast';
import Expander from '../Expander';
import * as Guards from '../types/regexp-tree-guards';

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected quantifier: ' + x);
}

function* fill(start: number, end: number): IterableIterator<number> {
	for (let i = start; i <= end; i++) {
		yield i;
	}
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

function* repeatExpression(
	this: Expander,
	expression: Expression,
	currentDepth: number
): IterableIterator<string> {
	if (currentDepth <= 0) {
		return yield '';
	}

	const thisLevel = this.expandExpression(expression);

	for (const thisLevelPermutation of thisLevel) {
		let isLevelComplete = true;

		const remainingLevels = repeatExpression.call(
			this,
			expression,
			currentDepth - 1
		);

		for (const remainingLevelPermutation of remainingLevels) {
			isLevelComplete = false;
			yield `${thisLevelPermutation}${remainingLevelPermutation}`;
		}

		if (isLevelComplete) {
			yield thisLevelPermutation;
		}
	}
}

/**
 * Expand an expression that repeats another expression, like "a{1,5}"
 * and "(\d|[a-m]){3,}".
 * @param node The Repetition expression to expand
 * @returns An iterator that yields strings matched by node
 */
export function* expandRepetition(this: Expander, node: Repetition) {
	const [minOccurrences, maxOccurrences] = getNumOccurrences(node.quantifier);
	const numOccurrenceOptions = [...fill(minOccurrences, maxOccurrences)];

	const numOccurrenceOptionsSorted = this.sort(numOccurrenceOptions);

	for (const numOccurrences of numOccurrenceOptionsSorted) {
		yield* repeatExpression.call(this, node.expression, numOccurrences);
	}
}
