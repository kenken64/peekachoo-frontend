var path = require("node:path");
var webpack = require("webpack");
var HtmlWebpackPlugin = require("html-webpack-plugin");
require("dotenv").config();

// Phaser webpack config
var phaserModule = path.join(__dirname, "/node_modules/phaser/");
var phaser = path.join(phaserModule, "src/phaser.js");

var definePlugin = new webpack.DefinePlugin({
	__DEV__: JSON.stringify(JSON.parse(process.env.BUILD_DEV || "false")),
	WEBGL_RENDERER: true,
	CANVAS_RENDERER: true,
	"process.env.API_URL": JSON.stringify(
		process.env.VITE_API_URL || "http://localhost:3000/api",
	),
	"process.env.RAZORPAY_KEY_ID": JSON.stringify(
		process.env.RAZORPAY_KEY_ID || "",
	),
});

module.exports = {
	entry: {
		app: [path.resolve(__dirname, "src/main.ts")],
		vendor: ["phaser"],
	},
	output: {
		path: path.resolve(__dirname, "build"),
		publicPath: "./",
		filename: "js/bundle.js",
	},
	plugins: [
		definePlugin,
		new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
		new webpack.optimize.UglifyJsPlugin({
			drop_console: true,
			minimize: true,
			output: {
				comments: false,
			},
		}),
		new webpack.optimize.CommonsChunkPlugin({
			name: "vendor" /* chunkName= */,
			filename: "js/vendor.bundle.js" /* filename= */,
		}),
		new HtmlWebpackPlugin({
			filename: "index.html",
			template: "./src/index.html",
			chunks: ["vendor", "app"],
			chunksSortMode: "manual",
			minify: {
				removeAttributeQuotes: true,
				collapseWhitespace: true,
				html5: true,
				minifyCSS: true,
				minifyJS: true,
				minifyURLs: true,
				removeComments: true,
				removeEmptyAttributes: true,
			},
			hash: true,
		}),
	],
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: [/\.vert$/, /\.frag$/],
				use: "raw-loader",
			},
		],
	},
	node: {
		fs: "empty",
		net: "empty",
		tls: "empty",
	},
	resolve: {
		extensions: [".ts", ".js"],
		alias: {
			phaser: phaser,
		},
	},
};
