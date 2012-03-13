#
# BUILD minified JavaScript
# requires uglifyjs
#

BOOTMAP_MAJOR_VERSION = 2
PAGES_DIR = ./gh-pages/

bootmap:
	uglifyjs -nc ./assets/bootmap.js > ./assets/bootmap.min.js

#
# MAKE FOR GH-PAGES (for @dyve only)
#

gh-pages: bootmap
	rm -r ${PAGES_DIR}assets
	cp -r ./assets ${PAGES_DIR}assets
	mkdir -p ${PAGES_DIR}${BOOTMAP_MAJOR_VERSION}
	cp ./assets/*.js ${PAGES_DIR}${BOOTMAP_MAJOR_VERSION}
	rm ${PAGES_DIR}*.html
	cp ./*.html ${PAGES_DIR}
