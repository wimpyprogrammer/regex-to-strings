import weightedRandomIndex from 'pandemonium/weighted-random-index';

/**
 * Randomly choose from a set of options.  Weight the choice by the value of each option.
 * For example, for options [3, 1] the first option is 3x more likely to be chosen.
 * @param weights The options to choose from
 * @returns The 0-based index of the selected option
 */
export default function chooseRandomWeight(weights: number[]): number {
	return weightedRandomIndex(weights);
}
