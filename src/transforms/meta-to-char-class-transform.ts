import { Handler, NodePath } from 'regexp-tree';
import {
	AstClass,
	AstRegExp,
	Char,
	CharacterClass,
	Group,
	SpecialChar,
} from 'regexp-tree/ast';
import * as Guards from '../typings/regexp-tree-guards';
import {
	createClassRange,
	createEscapedSimpleChar,
	createSimpleChars,
} from './utils';

const optionsAlpha = [createClassRange('a', 'z'), createClassRange('A', 'Z')];
const optionsDigit = createClassRange('0', '9');
const optionUnderscore = createEscapedSimpleChar('_');
const optionsWhitespaceNoBreak = createSimpleChars(' \t');
const optionsWhitespace = [
	...optionsWhitespaceNoBreak,
	...createSimpleChars('\r\n'),
];
const optionsOther = [
	...createSimpleChars('~`!@#$%^&*()=+<,>.?/[{}|:;"\''),
	createEscapedSimpleChar(']'),
	createEscapedSimpleChar('-'),
	createEscapedSimpleChar('\\'),
];

function getMetaCharExpressions(
	metaChar: SpecialChar
): CharacterClass['expressions'] {
	switch (metaChar.value) {
		case '.':
			return [
				...optionsAlpha,
				optionsDigit,
				...optionsWhitespaceNoBreak,
				...optionsOther,
				optionUnderscore,
			];
		case '\\w':
			return [...optionsAlpha, optionsDigit, optionUnderscore];
		case '\\W':
			return [...optionsWhitespace, ...optionsOther];
		case '\\d':
			return [optionsDigit];
		case '\\D':
			return [
				...optionsAlpha,
				...optionsWhitespace,
				...optionsOther,
				optionUnderscore,
			];
		case '\\s':
			return optionsWhitespace;
		case '\\S':
			return [...optionsAlpha, optionsDigit, ...optionsOther, optionUnderscore];
		default:
			return [];
	}
}

const metaToCharClassTransform: Handler = {
	Char(charPath) {
		const { index, node, parent, parentPath } = charPath;
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

		const parentReplacer = replacer[parent.type];
		parentReplacer(parentPath, index, characterClass);
	},
};

type NodeReplacer = {
	[parentType in AstClass]?: (
		parent: NodePath<AstClass>,
		iChild: number,
		replacement: CharacterClass
	) => void
};

const replacer: NodeReplacer = {
	Alternative: (parent, iChild, replacement) => {
		parent.getChild(iChild).replace(replacement);
	},

	CharacterClass: (parent, iChild, replacement) => {
		const parentNode = parent.node as CharacterClass;
		parentNode.expressions.splice(iChild, 1, ...replacement.expressions);
	},

	Group: (parent, _, replacement) => {
		const parentNode = parent.node as Group;
		parentNode.expression = replacement;
	},

	RegExp: (parent, _, replacement) => {
		const parentNode = parent.node as AstRegExp;
		parentNode.body = replacement;
	},
};

export default metaToCharClassTransform;
