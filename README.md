BootMap
=======

Build online maps from HTML tags

Why?
----

Because of DRY. I kept writing the same simple JavaScript code over and over
for simple online maps.

There had to be an easier way.

After looking at the HTML5 data attributes and the way Bootstrap handled
dropdowns, I realized that you could build simple maps in plain HTML, and let
an elegant piece of JavaScript handle the rest.

Usage
-----

Insert into HTML like this:

    <div id="map1" data-map="map" data-lat="40" data-lng="4" style="width: 400px; height: 300px">map 1</div>


Author
------

**Dylan Verheul**

+ http://twitter.com/dyve
+ http://github.com/dyve

Copyright
---------
Copyright (c) Dylan Verheul 2012

License
-------

See LICENSE.txt file.