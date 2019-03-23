import {
	Alternative,
	Assertion,
	Backreference,
	CapturingGroup,
	Char,
	CharacterClass,
	ClassRange,
	Disjunction,
	Expression,
	Group,
	NamedBackreference,
	NumericBackreference,
	Quantifier,
	RangeQuantifier,
	Repetition,
	SimpleChar,
	SimpleQuantifier,
	SpecialChar,
} from 'regexp-tree/ast';

export function isAlternative(node: Expression): node is Alternative {
	return node.type === 'Alternative';
}

export function isAssertion(node: Expression): node is Assertion {
	return node.type === 'Assertion';
}

export function isBackreference(node: Expression): node is Backreference {
	return node.type === 'Backreference';
}

export function isCapturingGroup(node: Group): node is CapturingGroup {
	return node.capturing;
}

export function isChar(node: Expression): node is Char {
	return node.type === 'Char';
}

export function isCharacterClass(node: Expression): node is CharacterClass {
	return node.type === 'CharacterClass';
}

export function isClassRange(
	node: CharacterClass['expressions'][0]
): node is ClassRange {
	return node.type === 'ClassRange';
}

export function isDisjunction(node: Expression): node is Disjunction {
	return node.type === 'Disjunction';
}

export function isGroup(node: Expression): node is Group {
	return node.type === 'Group';
}

export function isNamedBackreference(
	node: Backreference
): node is NamedBackreference {
	return node.kind === 'name';
}

export function isNumericBackreference(
	node: Backreference
): node is NumericBackreference {
	return node.kind === 'number';
}

export function isMetaChar(char: Char): char is SpecialChar {
	return char.kind === 'meta';
}

export function isRangeQuantifier(
	quantifier: Quantifier
): quantifier is RangeQuantifier {
	return quantifier.kind === 'Range';
}

export function isRepetition(node: Expression): node is Repetition {
	return node.type === 'Repetition';
}

export function isSimpleChar(char: Char): char is SimpleChar {
	return char.kind === 'simple';
}

export function isSimpleQuantifier(
	quantifier: Quantifier
): quantifier is SimpleQuantifier {
	return ['+', '*', '?'].includes(quantifier.kind);
}
