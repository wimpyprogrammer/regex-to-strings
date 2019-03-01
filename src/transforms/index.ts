import { Handler } from 'regexp-tree';
import metaToCharClassTransform from './meta-to-char-class-transform';

const transforms: Handler[] = [metaToCharClassTransform];

export default transforms;
