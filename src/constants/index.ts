const nbsp = String.fromCharCode(160);
const whitespace = ` \t\r\n${nbsp}`.split('');

const digits = '0123456789'.split('');

const basicLowercase = 'abcdefghijklmnopqrstuvwxyz'.split('');
const basicUppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const basicSpecial = '~`!@#$%^&*()-_=+<,>.?/[]{}|\\:;"\''.split('');

const extendedLowercase = 'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ'.split('');
const extendedUppercase = 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß'.split('');
const shy = String.fromCharCode(173);
const extendedSpecial = `¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿×÷${shy}`.split('');

// Special Windows-1252 display characters in the extended ASCII range
// https://www.ascii-code.com/#extendedASCIIDescription
const windows1252Special = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.split('');

const all = ([] as string[]).concat(
	whitespace,
	digits,
	basicLowercase,
	basicUppercase,
	basicSpecial,
	extendedLowercase,
	extendedUppercase,
	extendedSpecial,
	windows1252Special
);

export const Chars = { all };
