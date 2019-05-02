import Deferred from './Deferred';

describe('Deferred', () => {
	it('does not evaluate value on creation', () => {
		const valueFn = jest.fn();
		new Deferred(valueFn); // tslint:disable-line:no-unused-expression

		expect(valueFn).not.toHaveBeenCalled();
	});

	describe('value()', () => {
		it('returns lazy value', () => {
			const valueFn = () => 'deferred value';
			const deferred = new Deferred(valueFn);

			expect(deferred.value()).toBe('deferred value');
		});

		it('returns the same value on multiple calls', () => {
			const valueFn = () => 'multiple calls';
			const deferred = new Deferred(valueFn);

			for (let i = 0; i < 5; i++) {
				expect(deferred.value()).toBe('multiple calls');
			}
		});

		it('evaluates value on every call', () => {
			const valueFn = jest.fn();
			const deferred = new Deferred(valueFn);

			for (let i = 0; i < 5; i++) {
				deferred.value();
			}

			expect(valueFn).toHaveBeenCalledTimes(5);
		});
	});
});
