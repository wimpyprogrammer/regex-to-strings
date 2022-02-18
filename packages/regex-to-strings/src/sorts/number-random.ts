/**
 * @param min The min value to choose from, inclusive
 * @param max The max value to choose from, inclusive
 * @returns A random integer the falls within the specified range
 */
export default function chooseRandomInRange(min: number, max: number): number {
	// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
