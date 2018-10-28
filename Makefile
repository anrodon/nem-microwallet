build:
	browserify src/js/renderFunctions.js -o src/js/scripts.js
	grunt
	rm src/js/scripts.js
