BootMap
=======

Build online maps from valid HTML5

Why?
----

I kept writing the same simple JavaScript code over and over for simple online maps. There had to be an easier way.

After looking at the HTML5 data attributes and the way Bootstrap handled JavaScript plugins, I realized that you could
build maps in plain HTML, and let an elegant piece of JavaScript handle the rest.

Usage
-----

Insert into HTML like this:

    <div id="map1" data-role="map-canvas" style="width: 400px; height: 300px">map 1</div>

	<span data-role="map-feature">
		{
			"type": "Point",
			"coordinates": [4, 52]
		}
	</span>

Author
------

**Dylan Verheul**

+ http://twitter.com/dyve
+ http://github.com/dyve

Copyright
---------
Copyright (c) Dylan Verheul 2012-2013

License
-------

See LICENSE.txt file.