import { Expression } from 'regexp-tree/ast';
import { expandAlternative } from './helpers/alternative-pattern';
import { expandChar } from './helpers/char-pattern';
import { expandCharacterClass } from './helpers/character-class-pattern';
import { expandDisjunction } from './helpers/disjunction-pattern';
import { expandBackreference, expandGroup } from './helpers/group-pattern';
import { expandRepetition } from './helpers/repetition-pattern';
import sortRandom from './sorts/fisher-yates-random';
import * as Guards from './types/regexp-tree-guards';

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error('Unexpected node type: ' + x);
}

class Expander {
	protected expandAlternative = expandAlternative;
	protected expandBackreference = expandBackreference;
	protected expandChar = expandChar;
	protected expandCharacterClass = expandCharacterClass;
	protected expandDisjunction = expandDisjunction;
	protected expandGroup = expandGroup;
	protected expandRepetition = expandRepetition;

	constructor(
		protected readonly flags: string,
		protected readonly sort: <T>(options: T[]) => T[] = sortRandom
	) {}

	public *expandExpression(
		this: Expander,
		node: Expression | null
	): IterableIterator<string> {
		if (node === null) {
			yield '';
		} else if (Guards.isAlternative(node)) {
			yield* this.expandAlternative(node);
		} else if (Guards.isAssertion(node)) {
			yield '';
		} else if (Guards.isBackreference(node)) {
			yield* this.expandBackreference(node);
		} else if (Guards.isChar(node)) {
			yield* this.expandChar(node);
		} else if (Guards.isCharacterClass(node)) {
			yield* this.expandCharacterClass(node);
		} else if (Guards.isDisjunction(node)) {
			yield* this.expandDisjunction(node);
		} else if (Guards.isGroup(node)) {
			yield* this.expandGroup(node);
		} else if (Guards.isRepetition(node)) {
			yield* this.expandRepetition(node);
		} else {
			/* istanbul ignore next */
			assertNever(node);
		}
	}
}

export default Expander;
