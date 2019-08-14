// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolve } = require('path');

module.exports = {
	entry: './demo/src/demo.ts',
	mode: 'production',
	module: {
		rules: [
			{
				test: /-worker\.ts$/,
				use: [
					{
						loader: 'worker-loader',
						options: { publicPath: 'lib/' },
					},
				],
			},
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
		path: resolve(__dirname, './lib'),
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
};
