import { Handler } from 'regexp-tree';
import { RangeQuantifier, SimpleQuantifier } from 'regexp-tree/ast';
import * as Guards from '../types/regexp-tree-guards';

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected quantifier kind: ' + x);
}

function getNumOccurrences(quantifier: SimpleQuantifier): [number, number?] {
	if (quantifier.kind === '?') {
		return [0, 1];
	} else if (quantifier.kind === '+') {
		return [1, undefined];
	} else if (quantifier.kind === '*') {
		return [0, undefined];
	}

	/* istanbul ignore next */
	return assertNever(quantifier.kind);
}

/**
 * Convert the ?, +, and * quantifiers to their equivalent ranges of
 * {0,1}, {1,}, and {0,} respectively
 */
const simpleQuantifierToRangeQuantifierTransform: Handler = {
	Quantifier(quantifierPath) {
		const { node: quantifier } = quantifierPath;

		if (!Guards.isSimpleQuantifier(quantifier)) {
			return;
		}

		const [minOccurrences, maxOccurrences] = getNumOccurrences(quantifier);

		const equivalentRangeQuantifier: RangeQuantifier = {
			from: minOccurrences,
			greedy: quantifier.greedy,
			kind: 'Range',
			to: maxOccurrences,
			type: 'Quantifier',
		};

		quantifierPath.replace(equivalentRangeQuantifier);
	},
};

export default simpleQuantifierToRangeQuantifierTransform;
