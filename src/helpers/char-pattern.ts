import { Char } from 'regexp-tree/ast';
import Expander from '../Expander';
import Expansion from '../Expansion';
import * as Guards from '../types/regexp-tree-guards';

const alphaOffsetCharCode = 'a'.charCodeAt(0) - 1;

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected char type: ' + x);
}

function expandCharByCodePoint(this: Expander, codePoint: number) {
	const char = String.fromCodePoint(codePoint);

	const expanded =
		this.flags.includes('i') && char.toUpperCase() !== char.toLowerCase()
			? [char.toLowerCase(), char.toUpperCase()]
			: [char];
	const sortChars = () => this.sort(expanded);

	return new Expansion(sortChars, expanded.length);
}

/**
 * Translate an escaped control character like \cJ to the literal character
 * it matches (e.g. line feed).
 * @param escapedControlChar The escaped control character to convert
 * @return The Expansion of the literal equivalent of the control character
 */
function translateEscapedControlChar(escapedControlChar: Char) {
	// Get the last character of the sequence, e.g. "J"
	const controlChar = escapedControlChar.value.substr(-1);
	// Normalize the character to lowercase, since control characters are
	// case-insensitive, then convert to its decimal value.
	const controlCharCodeLower = controlChar.toLowerCase().charCodeAt(0);
	// Shift the decimal value from the alphanumeric range to the control range.
	const controlCharCodeTranslated = controlCharCodeLower - alphaOffsetCharCode;

	// Convert the shifted decimal char code to a literal character.
	const controlCharString = String.fromCharCode(controlCharCodeTranslated);

	return new Expansion([controlCharString], 1);
}

/**
 * Expand an expression which represents a single character in a
 * variety of formats like "a", "\141", "\x61", and "\u0061".
 * @param node The Char expression to expand
 * @return The Expansion of node
 */
export function expandChar(this: Expander, node: Char) {
	if (Guards.isSimpleChar(node)) {
		return expandCharByCodePoint.call(this, node.codePoint);
	} else if (['oct', 'hex', 'unicode'].includes(node.kind)) {
		return expandCharByCodePoint.call(this, node.codePoint);
	} else if (node.kind === 'control') {
		return translateEscapedControlChar(node);
	} else if (node.kind === 'decimal') {
		/* istanbul ignore next */
		const m = `"${node.value}" not removed by decimalCharToOctalCharTransform`;
		throw new Error(m);
	} else if (Number.isInteger(node.codePoint)) {
		return expandCharByCodePoint.call(this, node.codePoint);
	} else if (Guards.isMetaChar(node)) {
		/* istanbul ignore next */
		throw new Error(`"${node.value}" not removed by metaToCharClassTransform`);
	}

	/* istanbul ignore next */
	return assertNever(node);
}
