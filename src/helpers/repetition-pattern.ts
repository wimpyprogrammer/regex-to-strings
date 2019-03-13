import { Quantifier, Repetition } from 'regexp-tree/ast';
import { expandNode } from '../pattern';
import * as Guards from '../typings/regexp-tree-guards';

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected quantifier: ' + x);
}

function getNumOccurrences(quantifier: Quantifier): [number, number] {
	/* istanbul ignore else */
	if (Guards.isRangeQuantifier(quantifier)) {
		const { from, to } = quantifier;
		return [from, to !== undefined ? to : 100];
	} else if (Guards.isSimpleQuantifier(quantifier)) {
		const transformer = 'simpleQuantifierToRangeQuantifierTransform';
		throw new Error(`"${quantifier.kind}" not removed by ${transformer}`);
	} else {
		/* istanbul ignore next */
		assertNever(quantifier);
	}
}

export function* expandRepetition(node: Repetition): IterableIterator<string> {
	const [minOccurrences, maxOccurrences] = getNumOccurrences(node.quantifier);

	const generator = expandNode(node.expression);

	for (const expansion of generator) {
		for (let i = minOccurrences; i <= maxOccurrences; i++) {
			yield expansion.repeat(i);
		}
	}
}
