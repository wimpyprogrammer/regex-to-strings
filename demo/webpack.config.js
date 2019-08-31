// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolve } = require('path');

module.exports = {
	entry: './demo/src/demo.ts',
	mode: 'production',
	externals: {
		history: 'History',
		RegexColorizer: 'RegexColorizer',
	},
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
			{
				test: /\.s[ac]ss$/i,
				use: ['style-loader', 'css-loader', 'sass-loader'],
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
