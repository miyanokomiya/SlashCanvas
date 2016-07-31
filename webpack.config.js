// $ webpack

var webpack = require("webpack");

module.exports = {
	entry: './src/slashCanvas/App.js',
	output: {
		path: './dest/',
		filename: 'SlashCanvas.js',
		library: 'SlashCanvas',
		libraryTarget: 'umd'
	},
	module: {
		loaders: [
			// { test: /\.html$/, loader: 'html' }
		]
	},
	//	devtool: 'source-map',
	resolve : {
		root : "./src/",
		alias : {
			jquery : "lib/jquery-2.1.3.min",
			matter : "lib/matter-0.8.0"
		}
	},
	plugins: [
		new webpack.optimize.UglifyJsPlugin({
			compress: { warnings: false }
		})
	]
};
