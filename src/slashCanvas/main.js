/**
 *
 */
require.config({
    baseUrl: './src/',

    paths: {
        jquery: 'lib/jquery-2.1.3.min',
        matter: 'lib/matter-0.8.0',
    },

    shim: {
    	matter: {
            exports: 'Matter'
        },
        jquery: {
            exports: 'jquery'
        },
    }
});

define(function(require) {
	var App = require("slashCanvas/App");
	var app = new App("main", {
		image : "./game.png",
		width : 400,
		height : 400,
		gravityY : 0,
		blockScale : 0.8
	});

	new App("sub", {
		image : "./OkadaSpace.JPG",
		width : 400,
		height : 600,
		gravityX : 1
	});
});