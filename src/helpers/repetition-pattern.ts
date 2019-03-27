import { Quantifier, Repetition } from 'regexp-tree/ast';
import { expandNode } from '../pattern';
import * as Guards from '../types/regexp-tree-guards';

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected quantifier: ' + x);
}

function getNumOccurrences(quantifier: Quantifier): [number, number] {
	/* istanbul ignore next */
	if (Guards.isSimpleQuantifier(quantifier)) {
		const transformer = 'simpleQuantifierToRangeQuantifierTransform';
		throw new Error(`"${quantifier.kind}" not removed by ${transformer}`);
	} else if (!Guards.isRangeQuantifier(quantifier)) {
		assertNever(quantifier);
	}

	const { from, to } = quantifier;
	return [from, to !== undefined ? to : 100];
}

export function* expandRepetition(node: Repetition) {
	const [minOccurrences, maxOccurrences] = getNumOccurrences(node.quantifier);

	const generator = expandNode(node.expression);

	for (const expansion of generator) {
		for (let i = minOccurrences; i <= maxOccurrences; i++) {
			yield expansion.repeat(i);
		}
	}
}
