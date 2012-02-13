#
# BUILD minified JavaScript
# requires uglifyjs
#

bootmap:
	uglifyjs -nc ./src/bootmap.js > ./src/bootmap.min.js
	cp ./src/*.js ../gh-pages/current/
