#
# BUILD minified JavaScript
# requires uglifyjs
#

BOOTMAP_MAJOR_VERSION = 2

bootmap:
	uglifyjs -nc ./assets/bootmap.js > ./assets/bootmap.min.js

#
# MAKE FOR GH-PAGES (for @dyve only)
#

gh-pages: bootmap
	rm -r ../gh-pages/assets
	cp -r ./assets ../gh-pages/assets
	mkdir -p ../gh-pages/${BOOTMAP_MAJOR_VERSION}
	cp ./assets/*.js ../gh-pages/${BOOTMAP_MAJOR_VERSION}
	rm ../gh-pages/*.html
	cp ./*.html ../gh-pages
