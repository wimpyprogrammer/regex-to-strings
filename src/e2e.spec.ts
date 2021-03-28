import { count, expand, expandAll, expandN } from '.';

describe('count end-to-end', () => {
	it('returns a count of potential strings that match pattern', () => {
		const numStrings = count(/[a-z]{5}/i);

		expect(numStrings).toBe(380204032);
	});
});

describe('expand end-to-end', () => {
	const phoneNumberPattern = /((\(555\) ?)|(555-))?\d{3}-\d{4}/;

	it('returns a count of potential strings that match pattern', () => {
		const phoneNumberExpander = expand(phoneNumberPattern);

		expect(phoneNumberExpander).toHaveProperty('count', 40000000);
	});

	it('returns an iterator of strings that match pattern', () => {
		const phoneNumberExpander = expand(phoneNumberPattern);

		let i = 0;
		for (const phoneNumber of phoneNumberExpander.getIterator()) {
			expect(phoneNumber).toMatch(phoneNumberPattern);
			if (++i > 100) return;
		}
	});
});

describe('expandAll end-to-end', () => {
	it('returns all strings that match pattern', () => {
		const strings = expandAll(/\d/);

		expect(strings).toHaveLength(10);
		expect(strings).toEqual(
			expect.arrayContaining(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
		);
	});
});

describe('expandN end-to-end', () => {
	it('returns no more than N strings that match pattern', () => {
		const pattern = /\d{3,5}/;
		const strings = expandN(pattern, 5);

		expect(strings).toHaveLength(5);

		for (const string of strings) {
			expect(string).toMatch(pattern);
		}
	});

	it('returns fewer than N strings if not enough strings match pattern', () => {
		const strings = expandN(/[abc]/, 100);

		expect(strings).toHaveLength(3);
		expect(strings).toEqual(expect.arrayContaining(['a', 'b', 'c']));
	});
});
