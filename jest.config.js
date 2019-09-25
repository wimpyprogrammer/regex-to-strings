module.exports = {
	collectCoverageFrom: [
		'**/src/**/?*.(js|ts)',
		'!**/src/**/?*.d.ts',
		'!**/demo/src/**/?*.ts',
	],
	globals: {
		'ts-jest': {
			tsConfig: 'tsconfig.test.json',
		},
	},
	preset: 'ts-jest',
	restoreMocks: true,
	testEnvironment: 'node',
	verbose: true,
};
