import { Handler } from 'regexp-tree';
import { Char, CharacterClass, SpecialChar } from 'regexp-tree/ast';
import * as Guards from '../typings/regexp-tree-guards';
import {
	createClassRange,
	createEscapedSimpleChar,
	createSimpleChar,
	createSimpleChars,
} from './utils';

const optionsAlpha = [createClassRange('a', 'z'), createClassRange('A', 'Z')];
const optionsDigit = createClassRange('0', '9');
const optionsWord = [...optionsAlpha, optionsDigit, createSimpleChar('_')];
const optionsWhitespaceNoBreak = createSimpleChars(' \t');
const optionsWhitespace = [
	...optionsWhitespaceNoBreak,
	...createSimpleChars('\r\n'),
];
const optionsOther = [
	...createSimpleChars('~`!@#$%^&*()-=+<,>.?/[{}|\\:;"\''),
	createEscapedSimpleChar(']'),
];

function getMetaCharExpressions(
	metaChar: SpecialChar
): CharacterClass['expressions'] {
	switch (metaChar.value) {
		case '.':
			return [...optionsWord, ...optionsWhitespaceNoBreak, ...optionsOther];
		case '\\w':
			return optionsWord;
		case '\\W':
			return [...optionsWhitespace, ...optionsOther];
		case '\\d':
			return [optionsDigit];
		case '\\D':
			return [...optionsAlpha, ...optionsWhitespace, ...optionsOther];
		case '\\s':
			return optionsWhitespace;
		case '\\S':
			return [...optionsWord, ...optionsOther];
		default:
			return [];
	}
}

const metaToCharClassTransform: Handler = {
	Char(charPath) {
		const { node } = charPath;
		const char = node as Char;

		if (!Guards.isMetaChar(char)) {
			return;
		}

		const charClassExpressions = getMetaCharExpressions(char);

		if (!charClassExpressions.length) {
			return;
		}

		const characterClass: CharacterClass = {
			expressions: charClassExpressions,
			type: 'CharacterClass',
		};

		charPath.replace(characterClass);
	},
};

export default metaToCharClassTransform;
