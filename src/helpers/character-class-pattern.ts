import { CharacterClass } from 'regexp-tree/ast';
import * as Guards from '../typings/regexp-tree-guards';

function* fill(start: number, end: number): IterableIterator<number> {
	for (let i = start; i <= end; i++) {
		yield i;
	}
}

function getReferencedCodePoints(
	expression: CharacterClass['expressions'][0]
): number[] {
	if (Guards.isClassRange(expression)) {
		const minCodePoint = expression.from.codePoint;
		const maxCodePoint = expression.to.codePoint;
		return [...fill(minCodePoint, maxCodePoint)];
	}

	return [expression.codePoint];
}

const allCharOptions =
	' \t\r\n' +
	'abcdefghijklmnopqrstuvwwxyz' +
	'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
	'0123456789' +
	'~`!@#$%^&*()-_=+<,>.?/[]{}|\\:;"\'';

const allCodePointOptions = allCharOptions
	.split('')
	.map(char => char.charCodeAt(0));

export function* expandCharacterClass(
	node: CharacterClass
): IterableIterator<string> {
	const referencedCodePoints = node.expressions.reduce(
		(accumulator, expression) => {
			const codePoints = getReferencedCodePoints(expression);
			return accumulator.concat(codePoints);
		},
		[] as number[]
	);

	yield* allCodePointOptions
		.filter(option => !node.negative || !referencedCodePoints.includes(option))
		.filter(option => node.negative || referencedCodePoints.includes(option))
		.map(codePoint => String.fromCodePoint(codePoint));
}
