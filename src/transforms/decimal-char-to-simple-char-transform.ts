import escapeStringRegexp from 'escape-string-regexp';
import { Handler } from 'regexp-tree';
import { Char } from 'regexp-tree/ast';

// Workaround for https://github.com/DmitrySoshnikov/regexp-tree/issues/74.
// Interpret \#, \##, and \### escape sequences as Octal, not Decimal.
// Transform them to their basic character equivalents.
const decimalCharToSimpleCharTransform: Handler = {
	Char(charPath) {
		const { node } = charPath;
		const char = node as Char;

		if (char.kind !== 'decimal') {
			return;
		}

		const decimalAsOctal = parseInt(char.codePoint.toString(), 8);

		const simpleChar: Char = {
			codePoint: char.codePoint,
			kind: 'simple',
			symbol: escapeStringRegexp(String.fromCodePoint(decimalAsOctal)),
			type: 'Char',
			// parse() will reevaluate this value, so update it to something
			// that will match as a simple char on the next traversal.
			value: escapeStringRegexp(String.fromCodePoint(decimalAsOctal)),
		};

		charPath.replace(simpleChar);
	},
};

export default decimalCharToSimpleCharTransform;
