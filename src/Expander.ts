import { expandAlternative } from './helpers/alternative-pattern';
import { expandChar } from './helpers/char-pattern';
import { expandCharacterClass } from './helpers/character-class-pattern';
import { expandDisjunction } from './helpers/disjunction-pattern';
import { expandBackreference, expandGroup } from './helpers/group-pattern';
import { expandRepetition } from './helpers/repetition-pattern';
import { expandNode } from './pattern';
import sortRandom from './sorts/fisher-yates-random';

class Expander {
	public expandNode = expandNode;
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
}

export default Expander;
