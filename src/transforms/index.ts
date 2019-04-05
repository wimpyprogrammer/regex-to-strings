import { Handler } from 'regexp-tree';
import decimalCharToSimpleCharTransform from './decimal-char-to-simple-char-transform';
import metaToCharClassTransform from './meta-to-char-class-transform';
import simpleQuantifierToRangeQuantifierTransform from './simple-quantifier-to-range-quantifier-transform';

const transforms: Handler[] = [
	decimalCharToSimpleCharTransform,
	metaToCharClassTransform,
	simpleQuantifierToRangeQuantifierTransform,
];

export default transforms;
