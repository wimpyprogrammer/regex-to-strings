import type { transform } from 'regexp-tree';
import decimalCharToSimpleCharTransform from './decimal-char-to-simple-char-transform';
import metaToCharClassTransform from './meta-to-char-class-transform';
import simpleQuantifierToRangeQuantifierTransform from './simple-quantifier-to-range-quantifier-transform';

type TransformHandlers = Parameters<typeof transform>[1];

const transforms: TransformHandlers = [
	decimalCharToSimpleCharTransform,
	metaToCharClassTransform,
	simpleQuantifierToRangeQuantifierTransform,
];

export default transforms;
