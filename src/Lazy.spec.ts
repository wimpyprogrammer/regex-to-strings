import Lazy, { lazily } from './lazy';

describe('Lazy', () => {
	it('does not evaluate value on creation', () => {
		const valueFn = jest.fn();
		new Lazy(valueFn); // tslint:disable-line:no-unused-expression

		expect(valueFn).not.toHaveBeenCalled();
	});

	describe('value()', () => {
		it('returns lazy value', () => {
			const valueFn = () => 'lazy value';
			const lazy = new Lazy(valueFn);

			expect(lazy.value()).toBe('lazy value');
		});

		it('returns the same value on multiple calls', () => {
			const valueFn = () => 'multiple calls';
			const lazy = new Lazy(valueFn);

			for (let i = 0; i < 5; i++) {
				expect(lazy.value()).toBe('multiple calls');
			}
		});

		it('evaluates value once', () => {
			const valueFn = jest.fn();
			const lazy = new Lazy(valueFn);

			for (let i = 0; i < 5; i++) {
				lazy.value();
			}

			expect(valueFn).toHaveBeenCalledTimes(1);
		});
	});
});

describe('lazily', () => {
	it('does not evaluate value on creation', () => {
		const valueFn = jest.fn();
		lazily(valueFn);

		expect(valueFn).not.toHaveBeenCalled();
	});

	it('does not evaluate value on invocation', () => {
		const valueFn = jest.fn();
		lazily(valueFn)();

		expect(valueFn).not.toHaveBeenCalled();
	});

	it('passes arguments to valueFn', () => {
		const valueFn = jest.fn();
		const lazy = lazily(valueFn)('a', 'b', 'c');

		lazy.value();

		expect(valueFn).toHaveBeenCalledWith('a', 'b', 'c');
	});
});
