import { Quantifier, Repetition } from 'regexp-tree/ast';
import Expander from '../Expander';
import * as Guards from '../types/regexp-tree-guards';

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected quantifier: ' + x);
}

function* fill(start: number, end: number): IterableIterator<number> {
	for (let i = start; i <= end; i++) {
		yield i;
	}
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

export function* expandRepetition(this: Expander, node: Repetition) {
	const [minOccurrences, maxOccurrences] = getNumOccurrences(node.quantifier);
	const numOccurrenceOptions = [...fill(minOccurrences, maxOccurrences)];

	const generator = this.expandExpression(node.expression);

	for (const expansion of generator) {
		const numOccurrenceOptionsSorted = this.sort(numOccurrenceOptions);

		for (const numOccurrences of numOccurrenceOptionsSorted) {
			yield expansion.repeat(numOccurrences);
		}
	}
}
