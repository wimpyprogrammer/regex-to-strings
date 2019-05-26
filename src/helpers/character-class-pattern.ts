import { CharacterClass } from 'regexp-tree/ast';
import Expander from '../Expander';
import Expansion from '../Expansion';
import * as Guards from '../types/regexp-tree-guards';

function* fill(start: number, end: number): IterableIterator<number> {
	for (let i = start; i <= end; i++) {
		yield i;
	}
}

function getReferencedCodePoints(
	expression: CharacterClass['expressions'][0]
): number[] {
	// A ClassRange encompasses a range of code points
	if (Guards.isClassRange(expression)) {
		const minCodePoint = expression.from.codePoint;
		const maxCodePoint = expression.to.codePoint;
		return [...fill(minCodePoint, maxCodePoint)];
	}

	return [expression.codePoint];
}

const allCharOptions =
	' \t\r\n' +
	'abcdefghijklmnopqrstuvwxyz' +
	'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
	'0123456789' +
	'~`!@#$%^&*()-_=+<,>.?/[]{}|\\:;"\'';

const allCodePointOptions = allCharOptions
	.split('')
	.map(char => char.charCodeAt(0));

/**
 * Expand an expression which represents a single character from a
 * whitelist of options like "[abc]" and "[a-z1-5]", or a blacklist
 * of options like "[^123]" and "[^A-FW-Z]".
 * @param node The CharacterClass expression to expand
 * @return The Expansion of node
 */
export function expandCharacterClass(this: Expander, node: CharacterClass) {
	const applyCaseInsensitiveFlag = (accumulator: string[], char: string) => {
		if (this.flags.includes('i') && char.toLowerCase() !== char.toUpperCase()) {
			return accumulator.concat([char.toLowerCase(), char.toUpperCase()]);
		}

		return accumulator.concat(char);
	};

	const referencedCodePoints = node.expressions.reduce(
		(accumulator, expression) => {
			const codePoints = getReferencedCodePoints(expression);
			return accumulator.concat(codePoints);
		},
		[] as number[]
	);

	const expandedClass = allCodePointOptions
		// For a whitelist set, discard code points not referenced in the set
		.filter(option => !node.negative || !referencedCodePoints.includes(option))
		// For a blacklist set, discard code points referenced in the set
		.filter(option => node.negative || referencedCodePoints.includes(option))
		.map(codePoint => String.fromCodePoint(codePoint))
		.reduce(applyCaseInsensitiveFlag, []);
	const sortChars = () => this.sort(expandedClass);

	return new Expansion(sortChars, expandedClass.length);
}
