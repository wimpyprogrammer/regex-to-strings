import { Node } from './regexp-tree';

export function isAlternative(node: Node.Expression): node is Node.Alternative {
	return node.type === 'Alternative';
}

export function isAssertion(node: Node.Expression): node is Node.Assertion {
	return node.type === 'Assertion';
}

export function isBackreference(
	node: Node.Expression
): node is Node.Backreference {
	return node.type === 'Backreference';
}

export function isChar(node: Node.Expression): node is Node.Char {
	return node.type === 'Char';
}

export function isCharacterClass(
	node: Node.Expression
): node is Node.CharacterClass {
	return node.type === 'CharacterClass';
}

export function isClassRange(
	node: Node.CharacterClass['expressions'][0]
): node is Node.ClassRange {
	return node.type === 'ClassRange';
}

export function isDisjunction(node: Node.Expression): node is Node.Disjunction {
	return node.type === 'Disjunction';
}

export function isGroup(node: Node.Expression): node is Node.Group {
	return node.type === 'Group';
}

export function isRangeQuantifier(
	quantifier: Node.Quantifier
): quantifier is Node.RangeQuantifier {
	return quantifier.kind === 'Range';
}

export function isRepetition(node: Node.Expression): node is Node.Repetition {
	return node.type === 'Repetition';
}

export function isSimpleChar(char: Node.Char): char is Node.SimpleChar {
	return char.kind === 'simple';
}

export function isSimpleQuantifier(
	quantifier: Node.Quantifier
): quantifier is Node.SimpleQuantifier {
	return ['+', '*', '?'].includes(quantifier.kind);
}
