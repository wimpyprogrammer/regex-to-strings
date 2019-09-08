import { Expression } from 'regexp-tree/ast';
import Expansion from './Expansion';
import { expandAlternative } from './expanders/alternative-pattern';
import { expandChar } from './expanders/char-pattern';
import { expandCharacterClass } from './expanders/character-class-pattern';
import { expandDisjunction } from './expanders/disjunction-pattern';
import { expandBackreference, expandGroup } from './expanders/group-pattern';
import { expandRepetition } from './expanders/repetition-pattern';
import * as Guards from './types/regexp-tree-guards';

/* istanbul ignore next */
function assertNever(x: never): never {
	throw new Error(`Unexpected node type: ${x}`);
}

class Expander {
	protected readonly expandAlternative = expandAlternative;

	protected readonly expandBackreference = expandBackreference;

	protected readonly expandChar = expandChar;

	protected readonly expandCharacterClass = expandCharacterClass;

	protected readonly expandDisjunction = expandDisjunction;

	protected readonly expandGroup = expandGroup;

	protected readonly expandRepetition = expandRepetition;

	protected readonly flags: string;

	/**
	 * Create a generator for strings that match regular expression
	 * patterns parsed by regexp-tree.
	 * @param flags The regular expression modifier flags
	 */
	public constructor(flags: string) {
		this.flags = flags;
	}

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
