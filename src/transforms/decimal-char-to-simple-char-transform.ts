import type { TransformHandlers } from 'regexp-tree';
import type { Char } from 'regexp-tree/ast';
import escapeStringRegexp from 'escape-string-regexp';

/**
 * Interpret \#, \##, and \### escape sequences as Octal, not Decimal.
 * Transform them to their basic character equivalents.
 * Workaround for https://github.com/DmitrySoshnikov/regexp-tree/issues/74.
 */
const decimalCharToSimpleCharTransform: TransformHandlers = {
	Char(charPath) {
		const { node: char } = charPath;

		if (char.kind !== 'decimal') {
			return;
		}

		const decimalAsOctal = parseInt(char.codePoint.toString(), 8);
		const convertedDecimalAsChar = String.fromCodePoint(decimalAsOctal);
		const charEscaped = escapeStringRegexp(convertedDecimalAsChar);

		const simpleChar: Char = {
			codePoint: char.codePoint,
			kind: 'simple',
			symbol: charEscaped,
			type: 'Char',
			// parse() will reevaluate this value, so update it to something
			// that will match as a simple char on the next traversal.
			value: charEscaped,
		};

		charPath.replace(simpleChar);
	},
};

export default decimalCharToSimpleCharTransform;
