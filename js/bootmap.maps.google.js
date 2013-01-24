(function(bootmap, $) {

    // Namespace to later attach to bootmap
    var googleMap = {};

    // Shortcut to google.maps namespace
    var gm = google.maps;

    // Shortcut to create new google.maps.LatLng instance
    function ll(lat, lng) {
        return new gm.LatLng(lat, lng);
    }

    googleMap.createMap = function(elem, options) {
        return new gm.Map(elem, {
            center: ll(options.y, options.x),
            zoom: options.zoom | 7,
            mapTypeId: gm.MapTypeId.ROADMAP
        });
    };

    googleMap.createLatLngFromCoordinates = function(coordinates) {
        return ll(coordinates[1], coordinates[0]);
    };

    googleMap.createPathFromCoordinates = function(coordinates) {
        var i, path = [];
        for (i=0; i < coordinates.length; i++) {
            path[i] = googleMap.createLatLngFromCoordinates(coordinates[i]);
        }
        return path;
    };

    googleMap.createPathsFromCoordinates = function(coordinates) {
        var i, paths = [];
        for (i=0; i < coordinates.length; i++) {
            paths[i] = googleMap.createPathFromCoordinates(coordinates[i]);
        }
        return paths;
    };

    googleMap.createLayer = function(geometry, map, options) {
        console.log(map);
        if (geometry.type === 'Point') {
            return new gm.Marker({
                position: googleMap.createLatLngFromCoordinates(geometry.coordinates),
                map: map.native
            });
        }
        if (geometry.type === 'LineString') {
            return new gm.Polyline({
                path: googleMap.createPathFromCoordinates(geometry.coordinates),
                map: map.native
            });
        }
        if (geometry.type === 'Polygon') {
            return new gm.Polygon({
                paths: googleMap.createPathsFromCoordinates(geometry.coordinates),
                map: map.native
            });
        }
    };

    bootmap.setMapProvider('google', googleMap);

})(window.bootmap, jQuery);