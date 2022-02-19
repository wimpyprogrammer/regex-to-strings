import * as indexLib from '.';
import * as patternLib from './pattern';

describe('index', () => {
	it('exposes count()', () => {
		expect(indexLib.count).toBe(patternLib.count);
	});

	it('exposes expand()', () => {
		expect(indexLib.expand).toBe(patternLib.expand);
	});

	it('exposes expandN()', () => {
		expect(indexLib.expandN).toBe(patternLib.expandN);
	});

	it('exposes expandAll()', () => {
		expect(indexLib.expandAll).toBe(patternLib.expandAll);
	});
});
