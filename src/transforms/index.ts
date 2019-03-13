import { Handler } from 'regexp-tree';
import metaToCharClassTransform from './meta-to-char-class-transform';
import simpleQuantifierToRangeQuantifierTransform from './simple-quantifier-to-range-quantifier-transform';

const transforms: Handler[] = [
	metaToCharClassTransform,
	simpleQuantifierToRangeQuantifierTransform,
];

export default transforms;
