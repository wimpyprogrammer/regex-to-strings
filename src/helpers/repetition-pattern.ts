import { Quantifier, Repetition } from 'regexp-tree/ast';
import Expander from '../Expander';
import Expansion from '../Expansion';
import Lazy, { lazily } from '../Lazy';
import sortRandom from '../sorts/fisher-yates-random';
import * as Guards from '../types/regexp-tree-guards';
import { iterateWithSorting } from './iterate-sorted';

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
	options: string[],
	length: number
): IterableIterator<string> {
	if (length <= 1) {
		return yield* sortRandom(options);
	}

	function* expandOption(option: string) {
		const children = calculatePermutations(options, length - 1);
		for (const child of children) {
			yield `${option}${child}`;
		}
	}

	yield* iterateWithSorting(options, lazily(expandOption));
}

/**
 * Expand an expression that repeats another expression, like "a{1,5}"
 * and "(\d|[a-m]){3,}".
 * @param node The Repetition expression to expand
 * @return The Expansion of node
 */
export function expandRepetition(this: Expander, node: Repetition): Expansion {
	const [minOccurrences, maxOccurrences] = getNumOccurrences(node.quantifier);
	const numOccurrenceOptions = [...fill(minOccurrences, maxOccurrences)];

	// Calculate all expansions upfront. This is necessary for sorting the results.
	// Make Lazy to avoid expanding the expression if it won't be used.
	const expansion = this.expandExpression(node.expression);
	const fnExpand = () => [...expansion.getIterator()];
	const expansions = new Lazy(fnExpand);

	function* expandNRepetitions(numOccurrences: number) {
		if (numOccurrences <= 0) {
			return yield '';
		}
		yield* calculatePermutations(expansions.value(), numOccurrences);
	}

	const getIterator = () =>
		iterateWithSorting(numOccurrenceOptions, lazily(expandNRepetitions));

	const totalNumPermutations = numOccurrenceOptions.reduce(
		(sum, numOccurrences) => sum + Math.pow(expansion.count, numOccurrences),
		0
	);

	return new Expansion(getIterator, totalNumPermutations);
}
