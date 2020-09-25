import { CharacterClass } from 'regexp-tree/ast';
import { Chars } from '../constants';
import Expander from '../Expander';
import Expansion from '../Expansion';
import sortRandom from '../sorts/fisher-yates-random';
import * as Guards from '../types/regexp-tree-guards';
import { fill } from '../helpers/utils';

function getReferencedCodePoints(
	expression: CharacterClass['expressions'][0]
): number[] {
	// A ClassRange encompasses a range of code points
	if (Guards.isClassRange(expression)) {
		const minCodePoint = expression.from.codePoint;
		const maxCodePoint = expression.to.codePoint;
		return fill(minCodePoint, maxCodePoint);
	}

	return [expression.codePoint];
}

const allCodePointOptions = Chars.all.map(char => char.charCodeAt(0));

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
	const sortChars = () => sortRandom(expandedClass);

	return new Expansion(sortChars, expandedClass.length);
}
