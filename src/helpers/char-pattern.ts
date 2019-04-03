import { Char } from 'regexp-tree/ast';
import Expander from 'src/Expander';
import * as Guards from '../types/regexp-tree-guards';

const alphaOffsetCharCode = 'a'.charCodeAt(0) - 1;

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected char type: ' + x);
}

function expandCharByCodePoint(this: Expander, codePoint: number) {
	const char = String.fromCodePoint(codePoint);

	if (this.flags.includes('i') && char.toUpperCase() !== char.toLowerCase()) {
		return [char.toLowerCase(), char.toUpperCase()];
	}

	return [char];
}

function translateEscapedControlChar(escapedControlChar: Char): string {
	const controlChar = escapedControlChar.value.substr(-1);
	const controlCharCodeLower = controlChar.toLowerCase().charCodeAt(0);
	const controlCharCodeTranslated = controlCharCodeLower - alphaOffsetCharCode;

	return String.fromCharCode(controlCharCodeTranslated);
}

export function* expandChar(this: Expander, node: Char) {
	if (Guards.isSimpleChar(node)) {
		yield* expandCharByCodePoint.call(this, node.codePoint);
	} else if (['oct', 'hex', 'unicode'].includes(node.kind)) {
		yield* expandCharByCodePoint.call(this, node.codePoint);
	} else if (node.kind === 'control') {
		yield translateEscapedControlChar(node);
	} else if (Number.isInteger(node.codePoint)) {
		yield* expandCharByCodePoint.call(this, node.codePoint);
	} else if (Guards.isMetaChar(node)) {
		/* istanbul ignore next */
		throw new Error(`"${node.value}" not removed by metaToCharClassTransform`);
	} else {
		/* istanbul ignore next */
		assertNever(node);
	}
}
