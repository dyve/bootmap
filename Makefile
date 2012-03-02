#
# BUILD minified JavaScript
# requires uglifyjs
#

BOOTMAP_MAJOR_VERSION = 2

bootmap:
	uglifyjs -nc ./src/bootmap.js > ./src/bootmap.min.js

#
# MAKE FOR GH-PAGES (for @dyve only)
#

gh-pages: bootmap
	mkdir -p ../gh-pages/src
	cp ./src/*.js ../gh-pages/src
	mkdir -p ../gh-pages/${BOOTMAP_MAJOR_VERSION}
	cp ./src/*.js ../gh-pages/${BOOTMAP_MAJOR_VERSION}
	rm ../gh-pages/*.html
	cp ./docs/*html ../gh-pages

sdist: gh-pages
	cd ../gh-pages
	git add *
	git commit -a -m "Updated gh-pages from Makefile"
	git push
