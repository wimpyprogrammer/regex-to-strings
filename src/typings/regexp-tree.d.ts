declare module 'regexp-tree/ast' {
	export type AstClass =
		| 'Char'
		| 'ClassRange'
		| 'CharacterClass'
		| 'Alternative'
		| 'Disjunction'
		| 'Group'
		| 'Backreference'
		| 'Repetition'
		| 'Quantifier'
		| 'Assertion'
		| 'RegExp';

	interface Base<T> {
		type: T;
		loc?: {
			source: string;
			start: number;
			end: number;
		};
	}

	export interface SimpleChar extends Base<'Char'> {
		value: string;
		kind: 'simple';
		escaped?: true;
		codePoint: number;
		symbol: string;
	}

	export interface SpecialChar extends Base<'Char'> {
		value: string;
		kind: 'meta' | 'control' | 'hex' | 'decimal' | 'oct' | 'unicode';
		codePoint: number;
		symbol: string;
	}

	export type Char = SimpleChar | SpecialChar;

	export interface ClassRange extends Base<'ClassRange'> {
		from: Char;
		to: Char;
	}

	export interface CharacterClass extends Base<'CharacterClass'> {
		negative?: true;
		expressions: (Char | ClassRange)[];
	}

	export interface Alternative extends Base<'Alternative'> {
		expressions: Expression[];
	}

	export interface Disjunction extends Base<'Disjunction'> {
		left: Expression | null;
		right: Expression | null;
	}

	export interface CapturingGroup extends Base<'Group'> {
		capturing: true;
		number: number;
		name?: string;
		expression: Expression | null;
	}

	export interface NoncapturingGroup extends Base<'Group'> {
		capturing: false;
		expression: Expression | null;
	}

	export type Group = CapturingGroup | NoncapturingGroup;

	export interface NumericBackreference extends Base<'Backreference'> {
		kind: 'number';
		number: number;
		reference: number;
	}

	export interface NamedBackreference extends Base<'Backreference'> {
		kind: 'name';
		number: number;
		reference: string;
	}

	export type Backreference = NumericBackreference | NamedBackreference;

	export interface Repetition extends Base<'Repetition'> {
		expression: Expression;
		quantifier: Quantifier;
	}

	export interface SimpleQuantifier extends Base<'Quantifier'> {
		kind: '+' | '*' | '?';
		greedy: boolean;
	}

	export interface RangeQuantifier extends Base<'Quantifier'> {
		kind: 'Range';
		from: number;
		to?: number;
		greedy: boolean;
	}

	export type Quantifier = SimpleQuantifier | RangeQuantifier;

	export interface SimpleAssertion extends Base<'Assertion'> {
		kind: '^' | '$' | '\\b' | '\\B';
	}

	export interface LookaroundAssertion extends Base<'Assertion'> {
		kind: 'Lookahead' | 'Lookbehind';
		negative?: true;
		assertion: Expression | null;
	}

	export type Assertion = SimpleAssertion | LookaroundAssertion;

	export type Expression =
		| Char
		| CharacterClass
		| Alternative
		| Disjunction
		| Group
		| Backreference
		| Repetition
		| Assertion;

	export interface AstRegExp extends Base<'RegExp'> {
		body: Expression | null;
		flags: string;
	}

	export interface TransformResult {
		getAST(): AstRegExp;
		getBodyString(): string;
		getFlags(): string;
		toRegExp(): RegExp;
		toString(): string;
	}
}

declare module 'regexp-tree' {
	import { AstClass, AstRegExp, Base, TransformResult } from 'regexp-tree/ast';
	interface ParserOptions {
		captureLocations?: boolean;
	}

	export function parse(s: string | RegExp, options?: ParserOptions): AstRegExp;

	export function generate(ast: AstRegExp): string;

	export function toRegExp(regexp: string): RegExp;

	type Handler = { [nodeType in AstClass]?: (path: Base<nodeType>) => void };

	type Handlers = Array<Handler> | Handler;

	export function transform(
		s: string | RegExp | AstRegExp,
		handlers: Handlers
	): TransformResult;
}
