#
# BUILD minified JavaScript
# requires uglifyjs
#

BOOTMAP_MAJOR_VERSION = 2

bootmap:
	uglifyjs -nc ./src/bootmap.js > ./src/bootmap.min.js
	cp ./src/*.js ../gh-pages/current/
	mkdir -p ../gh-pages/${BOOTMAP_MAJOR_VERSION}/
	cp ./src/*.js ../gh-pages/${BOOTMAP_MAJOR_VERSION}/
