module.exports = {
	collectCoverageFrom: [
		'**/src/**/?*.(js|ts)',
		'!**/src/**/?*.d.ts',
		'!**/demo/src/**/?*.ts',
	],
	transform: {
		'^.+\\.[tj]s$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
	},
	transformIgnorePatterns: ['/node_modules/(?!escape-string-regexp/)'],
	preset: 'ts-jest',
	restoreMocks: true,
	testEnvironment: 'node',
	verbose: true,
};
