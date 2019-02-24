import { CharacterClass } from 'regexp-tree/ast';
import * as Guards from '../typings/regexp-tree-guards';

function* fill(start: number, end: number): IterableIterator<number> {
	for (let i = start; i <= end; i++) {
		yield i;
	}
}

const codePointOptions: number[] = [].concat(
	/* A-Z */ [...fill(65, 90)],
	/* a-z */ [...fill(97, 122)]
);

export function* expandCharacterClass(
	node: CharacterClass
): IterableIterator<string> {
	for (const expression of node.expressions) {
		if (node.negative) {
			const isCodePointAllowed = (codePoint: number): boolean => {
				if (Guards.isClassRange(expression)) {
					const minCodePoint = expression.from.codePoint;
					const maxCodePoint = expression.to.codePoint;

					return codePoint < minCodePoint || maxCodePoint < codePoint;
				} else {
					return !node.expressions.some(
						exp => !Guards.isClassRange(exp) && exp.codePoint === codePoint
					);
				}
			};

			yield* codePointOptions
				.filter(isCodePointAllowed)
				.map(codePoint => String.fromCodePoint(codePoint));
		} else if (Guards.isClassRange(expression)) {
			const minCodePoint = expression.from.codePoint;
			const maxCodePoint = expression.to.codePoint;

			for (let i = minCodePoint; i <= maxCodePoint; i++) {
				yield String.fromCodePoint(i);
			}
		} else {
			yield String.fromCodePoint(expression.codePoint);
		}
	}
}
