const whitespace = ` \t\r\n`.split('');

const digits = '0123456789'.split('');

const basicLowercase = 'abcdefghijklmnopqrstuvwxyz'.split('');
const basicUppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const basicSpecial = '~`!@#$%^&*()-_=+<,>.?/[]{}|\\:;"\''.split('');

const all = ([] as string[]).concat(
	whitespace,
	digits,
	basicLowercase,
	basicUppercase,
	basicSpecial
);

export const Chars = { all };
