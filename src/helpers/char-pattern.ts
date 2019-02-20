import { Node } from '../typings/regexp-tree';
import * as Guards from '../typings/regexp-tree-guards';

const optionsAlpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const optionsDigit = '0123456789';
const optionsWord = optionsAlpha + optionsDigit + '_';
const optionsWhitespaceNoBreak = ' \t';
const optionsWhitespace = optionsWhitespaceNoBreak + '\r\n';
const optionsOther = '~`!@#$%^&*()-=+<,>.?/[{]}|\\:;"\'';

const alphaOffsetCharCode = 'a'.charCodeAt(0) - 1;

function translateEscapedControlChar(escapedControlChar: Node.Char): string {
	const controlChar = escapedControlChar.value.substr(-1);
	const controlCharCodeLower = controlChar.toLowerCase().charCodeAt(0);
	const controlCharCodeTranslated = controlCharCodeLower - alphaOffsetCharCode;

	return String.fromCharCode(controlCharCodeTranslated);
}

function getMetaCharOptions(metaChar: string): string {
	switch (metaChar) {
		case '.':
			return optionsWord + optionsWhitespaceNoBreak + optionsOther;
		case '\\w':
			return optionsWord;
		case '\\W':
			return optionsWhitespace + optionsOther;
		case '\\d':
			return optionsDigit;
		case '\\D':
			return optionsAlpha + optionsWhitespace + optionsOther;
		case '\\s':
			return optionsWhitespace;
		case '\\S':
			return optionsWord + optionsOther;
		/* istanbul ignore next */
		default:
			throw new Error(`Unhandled character "${metaChar}"`);
	}
}

function pickRandomChar(charOptions: string): string {
	const numOptions = charOptions.length;
	const iRandom = Math.floor(Math.random() * numOptions);
	return charOptions[iRandom];
}

export function* expandChar(node: Node.Char): IterableIterator<string> {
	if (Guards.isSimpleChar(node)) {
		yield node.value;
	} else if (['oct', 'hex', 'unicode'].includes(node.kind)) {
		yield String.fromCodePoint(node.codePoint);
	} else if (node.kind === 'control') {
		yield translateEscapedControlChar(node);
	} else if (Number.isInteger(node.codePoint)) {
		yield String.fromCodePoint(node.codePoint);
	} else {
		const charOptions = getMetaCharOptions(node.value);
		yield pickRandomChar(charOptions);
	}
}
