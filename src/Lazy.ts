import Deferred from './Deferred';

/**
 * A value that only executes when value() is invoked.
 * The result is stored and reused on subsequent calls.
 */
export default class Lazy<T> extends Deferred<T> {
	protected hasEvaluated: boolean = false;
	protected evaluated: T;

	constructor(protected readonly valueFn: () => T) {
		super(valueFn);
	}

	public value(): T {
		if (!this.hasEvaluated) {
			this.evaluated = this.valueFn();
			this.hasEvaluated = true;
		}

		return this.evaluated;
	}
}

/**
 * Wrap a function to run lazily.
 * @param valueFn The function to wrap.
 * @returns A Lazy object that lazily runs valueFn.
 */
export function lazily<T>(valueFn: (...args: any[]) => T) {
	return (...args: any[]) => new Lazy(() => valueFn(...args));
}
