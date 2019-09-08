import { ClassRange, SimpleChar } from 'regexp-tree/ast';

export function createSimpleChar(value: string): SimpleChar {
	if (value.length !== 1) throw new Error('value must be a char');

	return {
		codePoint: value.codePointAt(0) || 0,
		kind: 'simple',
		symbol: value,
		type: 'Char',
		value,
	};
}

export function createEscapedSimpleChar(value: string): SimpleChar {
	return {
		...createSimpleChar(value),
		escaped: true,
	};
}

export function createSimpleChars(values: string): SimpleChar[] {
	return values.split('').map(createSimpleChar);
}

export function createClassRange(from: string, to: string): ClassRange {
	return {
		from: createSimpleChar(from),
		to: createSimpleChar(to),
		type: 'ClassRange',
	};
}
