import { Handler } from 'regexp-tree';
import {
	AsExpression,
	AstClass,
	AstRegExp,
	Char,
	CharacterClass,
	SpecialChar,
} from 'regexp-tree/ast';
import * as Guards from '../types/regexp-tree-guards';
import {
	createClassRange,
	createEscapedSimpleChar,
	createSimpleChar,
	createSimpleChars,
} from './utils';

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
const optionsNewLine = createSimpleChar('\n');

function getMetaCharExpressions(
	metaChar: SpecialChar,
	regExpFlags: string
): CharacterClass['expressions'] {
	switch (metaChar.value) {
		case '.': {
			const dotAllOptions = regExpFlags.includes('s') ? [optionsNewLine] : [];

			return [
				...optionsAlpha,
				optionsDigit,
				...optionsWhitespaceNoBreak,
				...optionsOther,
				optionUnderscore,
				...dotAllOptions,
			];
		}
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
