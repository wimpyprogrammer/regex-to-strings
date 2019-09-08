/**
 * Generate an array full of sequential integers.
 * @param start The lowest integer in the array, inclusive
 * @param end The highest integer in the array, inclusive
 * @returns An array containing start, end, and all the integers in between
 */
export function fill(start: number, end: number): number[] {
	const result = new Array(1 + end - start);
	for (let i = start; i <= end; i++) {
		result[i - start] = i;
	}
	return result;
}
