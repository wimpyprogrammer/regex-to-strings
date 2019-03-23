import { Char } from 'regexp-tree/ast';
import * as Guards from '../types/regexp-tree-guards';

const alphaOffsetCharCode = 'a'.charCodeAt(0) - 1;

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected char type: ' + x);
}

function translateEscapedControlChar(escapedControlChar: Char): string {
	const controlChar = escapedControlChar.value.substr(-1);
	const controlCharCodeLower = controlChar.toLowerCase().charCodeAt(0);
	const controlCharCodeTranslated = controlCharCodeLower - alphaOffsetCharCode;

	return String.fromCharCode(controlCharCodeTranslated);
}

export function* expandChar(node: Char): IterableIterator<string> {
	if (Guards.isSimpleChar(node)) {
		yield node.value;
	} else if (['oct', 'hex', 'unicode'].includes(node.kind)) {
		yield String.fromCodePoint(node.codePoint);
	} else if (node.kind === 'control') {
		yield translateEscapedControlChar(node);
	} else if (Number.isInteger(node.codePoint)) {
		yield String.fromCodePoint(node.codePoint);
	} else if (Guards.isMetaChar(node)) {
		/* istanbul ignore next */
		throw new Error(`"${node.value}" not removed by metaToCharClassTransform`);
	} else {
		/* istanbul ignore next */
		assertNever(node);
	}
}
