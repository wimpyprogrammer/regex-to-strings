import Expansion from '../Expansion';
import chooseRandomInRange from '../sorts/number-random';
import chooseRandomWeighted from '../sorts/weighted-random';

/**
 * Return all strings from a set of expansions.  Randomize the order of the returned strings.
 * For example, the patterns /[ab]/ and /[12]/ might return ['b', '1', '2', 'a'].
 * @param options The expansions to choose from
 * @return An iterator that yields the randomly chosen strings
 */
export function* iterateWeightedByCount(
	options: Expansion[]
): IterableIterator<string> {
	const iterators = options.map(option => option.getIterator());
	const weights = options.map(option => option.count);

	while (iterators.length > 0) {
		// Randomly choose an option, weighted by the size of the expansion.
		// For example, \d{3} will be chosen 10x more often than \d{2}.
		const iRandom = chooseRandomWeighted(weights);
		const { done, value } = iterators[iRandom].next();

		if (done) {
			// We've exhausted expansions for this iterator.
			// Remove it from the list of options.
			iterators.splice(iRandom, 1);
			weights.splice(iRandom, 1);
		} else {
			yield value;
			// Update weight to reflect the remaining count.
			weights[iRandom]--;
		}
	}
}

/**
 * Return strings for all permutations of a set of expansions.  Randomize the order of the
 * returned strings.
 * For example, the patterns /[ab]/ and /[12]/ might return ['a2', 'b1', 'a1', 'b2'].
 * @param expansions The expansions to combine in each permutation
 * @return An iterator that yields the permutations, ordered randomly
 */
export function* iteratePermutations(
	expansions: Expansion[]
): IterableIterator<string> {
	const [thisExpansion, ...childExpansions] = expansions;
	const thisIterator = thisExpansion.getIterator();
	let numCompletedValuesThisIterator = 0;

	if (expansions.length <= 1) {
		// Reached the end of the recursion, yield all iterations
		// of the final expansion.
		return yield* thisIterator;
	}

	// Yield all permutations of one value from the current iterator with
	// all values from the child expansions.
	function* iterateChildPermutations() {
		const { done, value: thisValue } = thisIterator.next();
		if (done) {
			return;
		}
		const childIterator = iteratePermutations(childExpansions);
		for (const childValue of childIterator) {
			yield `${thisValue}${childValue}`;
		}
		numCompletedValuesThisIterator++;
	}

	const inProgressIterators: Array<IterableIterator<string>> = [];

	while (numCompletedValuesThisIterator < thisExpansion.count) {
		let iRandom = chooseRandomInRange(0, thisExpansion.count - 1);

		if (iRandom > inProgressIterators.length - 1) {
			inProgressIterators.push(iterateChildPermutations());
			iRandom = inProgressIterators.length - 1;
		}

		const { done, value } = inProgressIterators[iRandom].next();

		if (done) {
			// We've exhausted permutations for this value of the current iterator.
			inProgressIterators.splice(iRandom, 1);
		} else {
			yield value;
		}
	}
}
