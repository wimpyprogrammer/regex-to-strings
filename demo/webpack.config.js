/// <reference types="node" />;
/* eslint-disable @typescript-eslint/no-var-requires */
const { resolve } = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
	entry: './src/demo.ts',
	mode: 'production',
	externals: {
		history: 'History',
		lodash: '_',
		RegexColorizer: 'RegexColorizer',
	},
	plugins: [new CleanWebpackPlugin()],
	module: {
		rules: [
			{
				test: /worker[/]index\.ts$/,
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
							projectReferences: true,
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
