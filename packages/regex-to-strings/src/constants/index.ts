const nbsp = String.fromCharCode(160);
const whitespace = ` \t\r\n${nbsp}`.split('');

const digits = '0123456789'.split('');

const underscore = '_';
const basicLowercase = 'abcdefghijklmnopqrstuvwxyz'.split('');
const basicUppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const basicAlpha = [...basicLowercase, ...basicUppercase, underscore];

const basicSpecial = '~`!@#$%^&*()-=+<,>.?/[]{}|\\:;"\''.split('');

const extendedLowercase = 'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ'.split('');
const extendedUppercase = 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß'.split('');
const shy = String.fromCharCode(173);
const extendedSpecial = `¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿×÷${shy}`.split('');

// Special Windows-1252 display characters in the extended ASCII range
// https://www.ascii-code.com/#extendedASCIIDescription
const windows1252Special = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.split('');

const extended = [
	...extendedLowercase,
	...extendedUppercase,
	...extendedSpecial,
	...windows1252Special,
];

const all = [
	...whitespace,
	...digits,
	...basicAlpha,
	...basicSpecial,
	...extended,
];

export const Chars = {
	all,
	basicAlpha,
	basicSpecial,
	digits,
	extended,
	whitespace,
};
