module.exports = {
	collectCoverageFrom: ['**/src/**/?*.(js|ts)', '!**/src/**/?*.d.ts'],
	moduleFileExtensions: ['js', 'json', 'ts'],
	testMatch: ['**/src/**/?*.spec.(js|ts)'],
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
};
