import { Quantifier, Repetition } from 'regexp-tree/ast';
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

/**
 * Calculate all permutations of combining a set of strings a fixed number of times.
 * e.g. ['a', 'b'] of length 3 yields aaa, aab, aba, abb, baa, bab, bba, bbb
 * @param options The options to combine to create permutations
 * @param length The number of options to combine in a single permutation
 * @returns An iterator that yields all permutations of the given length
 */
function* calculatePermutations(
	this: Expander,
	options: string[],
	length: number
): IterableIterator<string> {
	if (length <= 1) {
		return yield* this.sort(options);
	}

	const calculatePermutationsBound = calculatePermutations.bind(this);
	function* expandOption(option: string) {
		const children = calculatePermutationsBound(options, length - 1);
		for (const child of children) {
			yield `${option}${child}`;
		}
	}

	yield* this.iterateWithSorting(options, expandOption);
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

	// Calculate all expansions upfront. This is necessary for sorting the results.
	// Avoid expanding the expression if it won't be used.
	const expansionsOfExpression =
		maxOccurrences <= 0 ? [] : [...this.expandExpression(node.expression)];

	const calculatePermutationsBound = calculatePermutations.bind(this);
	function* expandNRepetitions(numOccurrences: number) {
		if (numOccurrences <= 0) {
			return yield '';
		}
		yield* calculatePermutationsBound(expansionsOfExpression, numOccurrences);
	}

	yield* this.iterateWithSorting(numOccurrenceOptions, expandNRepetitions);
}
