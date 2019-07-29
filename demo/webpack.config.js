// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolve } = require('path');

module.exports = {
	entry: './demo/demo.ts',
	mode: 'production',
	module: {
		rules: [
			{
				exclude: /node_modules/,
				test: /\.ts$/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							compilerOptions: { noEmit: false },
							configFile: resolve(__dirname, './tsconfig.json'),
						},
					},
				],
			},
		],
	},
	output: {
		filename: 'demo.js',
		path: __dirname,
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
};
