import Expander from '../Expander';

interface IOptionLookup {
	[index: string]: IterableIterator<string>;
	[index: number]: IterableIterator<string>;
}

/**
 * Repeatedly choose from options and yield the corresponding expansion.
 * The options are sorted before each selection.
 * This technique allows expansions to be thoroughly sorted. Otherwise
 * the sorting might only apply to one character at a time while the
 * other characters are unchanged, e.g. \d\d -> 48, 42, 49, 43, 41, 45...
 * @param optionsToSort The list of options to choose from
 * @param createIterable A function to create the iterable for each option
 * @return An iterator that yields expansions for each option
 */
export function* iterateWithSorting<T extends string | number>(
	this: Expander,
	optionsToSort: T[],
	createIterable: (option: T) => IterableIterator<string>
): IterableIterator<string> {
	const iterableSource = optionsToSort.reduce<IOptionLookup>(
		(accumulator, option) => {
			accumulator[option] = createIterable(option);
			return accumulator;
		},
		{}
	);

	let availableOptions = [...optionsToSort];

	while (availableOptions.length > 0) {
		// Sort and choose the first option.
		availableOptions = this.sort(availableOptions);
		const option = availableOptions[0];
		const outputForOption = iterableSource[option].next();

		if (outputForOption.done) {
			// We've exhausted expansions for this number of occurrences.
			// Remove it from the list of options.
			availableOptions.splice(0, 1);
		} else {
			yield outputForOption.value;
		}
	}
}
