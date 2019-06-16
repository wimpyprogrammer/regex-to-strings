import { Expression } from 'regexp-tree/ast';
import Expansion from './Expansion';
import { expandAlternative } from './helpers/alternative-pattern';
import { expandChar } from './helpers/char-pattern';
import { expandCharacterClass } from './helpers/character-class-pattern';
import { expandDisjunction } from './helpers/disjunction-pattern';
import { expandBackreference, expandGroup } from './helpers/group-pattern';
import { iterateWithSorting } from './helpers/iterate-sorted';
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

	protected iterateWithSorting = iterateWithSorting;
	protected sort = sortRandom;

	/**
	 * Create a generator for strings that match regular expression
	 * patterns parsed by regexp-tree.
	 * @param flags The regular expression modifier flags
	 */
	constructor(protected readonly flags: string) {}

	/**
	 * Identify and expand an expression of any type.
	 * @param expression The expression to expand
	 * @returns The Expansion of pattern
	 */
	public expandExpression(
		this: Expander,
		expression: Expression | null
	): Expansion {
		if (expression === null) {
			return Expansion.Blank;
		} else if (Guards.isAlternative(expression)) {
			return this.expandAlternative(expression);
		} else if (Guards.isAssertion(expression)) {
			return Expansion.Blank;
		} else if (Guards.isBackreference(expression)) {
			return this.expandBackreference(expression);
		} else if (Guards.isChar(expression)) {
			return this.expandChar(expression);
		} else if (Guards.isCharacterClass(expression)) {
			return this.expandCharacterClass(expression);
		} else if (Guards.isDisjunction(expression)) {
			return this.expandDisjunction(expression);
		} else if (Guards.isGroup(expression)) {
			return this.expandGroup(expression);
		} else if (Guards.isRepetition(expression)) {
			return this.expandRepetition(expression);
		}

		/* istanbul ignore next */
		return assertNever(expression);
	}
}

export default Expander;
