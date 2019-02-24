import { Quantifier, Repetition } from 'regexp-tree/ast';
import { expandNode } from '../pattern';
import * as Guards from '../typings/regexp-tree-guards';

function getNumOccurrences(quantifier: Quantifier): [number, number] {
	let minOccurrences = 0;
	let maxOccurrences = 100;

	if (Guards.isSimpleQuantifier(quantifier)) {
		if (quantifier.kind === '?') {
			maxOccurrences = 1;
		} else if (quantifier.kind === '+') {
			minOccurrences = 1;
		} else if (quantifier.kind === '*') {
			// Keep defaults
		} else {
			/* istanbul ignore next */
			throw new Error(`Unknown kind ${quantifier.kind}`);
		}
	} else if (Guards.isRangeQuantifier(quantifier)) {
		minOccurrences = quantifier.from;

		if ('to' in quantifier) {
			maxOccurrences = quantifier.to;
		}
	} else {
		/* istanbul ignore next */
		throw new Error(`Unknown quantifier ${quantifier}`);
	}

	return [minOccurrences, maxOccurrences];
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
