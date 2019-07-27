type IterableSource = (() => IterableIterator<string> | string[]) | string[];

function toIterable(
	getIterator: IterableSource
): () => IterableIterator<string> {
	return function* beginIterating() {
		yield* getIterator instanceof Function ? getIterator() : getIterator;
	};
}

export default class Expansion {
	/**
	 * A single blank string Expansion
	 */
	public static Blank: Expansion = new Expansion([''], 1);

	/**
	 * Zero string expansions
	 */
	public static Empty: Expansion = new Expansion([], 0);

	/**
	 * Get an iterator that yields strings matched by the pattern
	 */
	public getIterator: () => IterableIterator<string>;

	/**
	 * The total number of possible expansions of the pattern
	 */
	public count: number;

	public constructor(getIterator: IterableSource, count: Expansion['count']) {
		this.getIterator = toIterable(getIterator);
		this.count = count;
	}
}
