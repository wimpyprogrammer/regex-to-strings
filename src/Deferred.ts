/**
 * A value that only executes each time value() is invoked.
 */
export default class Deferred<T> {
	constructor(protected readonly valueFn: () => T) {}

	public value(): T {
		return this.valueFn();
	}
}
