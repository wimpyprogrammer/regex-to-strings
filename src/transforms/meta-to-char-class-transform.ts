import { Handler } from 'regexp-tree';
import {
	AsExpression,
	AstClass,
	AstRegExp,
	Char,
	CharacterClass,
	SpecialChar,
} from 'regexp-tree/ast';
import { Chars } from '../constants';
import * as Guards from '../types/regexp-tree-guards';
import { createEscapedSimpleChar, createSimpleChar } from './utils';

type Replace<ParentType extends AstClass> = (
	parentNode: AsExpression<ParentType>,
	replacement: CharacterClass,
	child: Char
) => void;
type NodeReplacer = { [parentType in AstClass]?: Replace<parentType> };

/* eslint no-param-reassign: ["error", { "ignorePropertyModificationsFor": ["parentNode"] }] */
const replacer: NodeReplacer = {
	Alternative: (parentNode, replacement, child) => {
		const iChild = parentNode.expressions.indexOf(child);
		if (iChild > -1) {
			parentNode.expressions[iChild] = replacement;
		}
	},

	CharacterClass: (parentNode, replacement, child) => {
		const iChild = parentNode.expressions.indexOf(child);
		if (iChild > -1) {
			parentNode.expressions.splice(iChild, 1, ...replacement.expressions);
		}
	},

	Disjunction: (parentNode, replacement, child) => {
		if (parentNode.left === child) {
			parentNode.left = replacement;
		} else if (parentNode.right === child) {
			parentNode.right = replacement;
		}
	},

	Group: (parentNode, replacement) => {
		parentNode.expression = replacement;
	},

	RegExp: (parentNode, replacement) => {
		parentNode.body = replacement;
	},

	Repetition: (parentNode, replacement) => {
		parentNode.expression = replacement;
	},
};

const optionsAlpha = Chars.basicAlpha.map(createSimpleChar);
const optionsDigit = Chars.digits.map(createSimpleChar);

const optionsWhitespace = Chars.whitespace.map(createSimpleChar);

const needEscape = [']', '-', '\\'];
const noEscape = Chars.basicSpecial.filter(c => !needEscape.includes(c));
const optionsOther = [
	...noEscape.map(createSimpleChar),
	...needEscape.map(createEscapedSimpleChar),
];

const optionsExtended = Chars.extended.map(createSimpleChar);

function getMetaCharExpressions(
	metaChar: SpecialChar,
	regExpFlags: string
): CharacterClass['expressions'] {
	switch (metaChar.value) {
		case '.': {
			const optionsNewLine = createSimpleChar('\n');
			const optionsDotAll = regExpFlags.includes('s') ? [optionsNewLine] : [];
			const whitespaceNoBreaks = Chars.whitespace.filter(
				c => !'\r\n'.includes(c)
			);
			const optionsWhitespaceNoBreak = whitespaceNoBreaks.map(createSimpleChar);

			return [
				...optionsAlpha,
				...optionsDigit,
				...optionsWhitespaceNoBreak,
				...optionsOther,
				...optionsExtended,
				...optionsDotAll,
			];
		}
		case '\\w':
			return [...optionsAlpha, ...optionsDigit];
		case '\\W':
			return [...optionsWhitespace, ...optionsOther, ...optionsExtended];
		case '\\d':
			return optionsDigit;
		case '\\D':
			return [
				...optionsAlpha,
				...optionsWhitespace,
				...optionsOther,
				...optionsExtended,
			];
		case '\\s':
			return optionsWhitespace;
		case '\\S':
			return [
				...optionsAlpha,
				...optionsDigit,
				...optionsOther,
				...optionsExtended,
			];
		default:
			return [];
	}
}

/**
 * Convert meta character classes like "\d", "\W", and "." to their ranged character
 * set equivalents like "[0-9]" and "[ \t\r\n~`!@#$%^&*()=+<,>.?/[{}|:;"'\]\-\\]".
 */
interface MetaToCharClassTransform extends Handler {
	flags: string;
}
const metaToCharClassTransform: MetaToCharClassTransform = {
	flags: '',

	init(ast: AstRegExp) {
		this.flags = ast.flags;
	},

	Char(charPath) {
		const { node: char, parent, parentPath } = charPath;

		if (!parent || !parentPath || !replacer[parent.type]) {
			return;
		}

		if (!Guards.isMetaChar(char)) {
			return;
		}

		const charClassExpressions = getMetaCharExpressions(char, this.flags);

		if (!charClassExpressions.length) {
			return;
		}

		const characterClass: CharacterClass = {
			expressions: charClassExpressions,
			type: 'CharacterClass',
		};

		const replaceParent = replacer[parent.type] as Replace<typeof parent.type>;
		replaceParent(parentPath.node, characterClass, char);
	},
};

export default metaToCharClassTransform;
