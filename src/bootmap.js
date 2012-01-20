(function ($) {
    "use strict";

    var bootmap = {
        defaultZoom: 8,
        options: {
            lat: {
                type: "float",
                defaultValue: 52
            },
            lng: {
                type: "float",
                defaultValue: 4
            },
            zoom: {
                type: "int",
                defaultValue: 0
            },
            markCenter: {
                type: "bool",
                defaultValue: false
            },
            overlays: {
                type: "json",
                defaultValue: ''
            }
        },
        registry: {
        }
    };

    var dashToCamel = function(str) {
        return str.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
    };

    var camelToDash = function(str) {
        return str.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
    };

    var data = function ($elem, indexCamel, defaultValue) {
        var attr = "data-" + camelToDash(indexCamel);
        var data = $elem.attr(attr);
        if (undefined === data) {
            data = $elem.data(indexCamel);
        }
        if (undefined === data) {
            data = defaultValue;
        }
        return data;
    };

    var getOption = function(index, $elem, opts) {
        var o = bootmap.options[index];
        var value, v, skip = false;
        if (opts && undefined !== opts[index]) {
            value = opts[index];
        } else {
            value = data($elem, index, o.defaultValue);
        }
        switch (o.type) {
            case "int":
                v = parseInt(value, 10);
                skip = isNaN(v);
                break;
            case "float":
                v = parseFloat(value);
                skip = isNaN(v);
                break;
            case "json":
                v = $.parseJSON(value);
                break;
            default:
                v = value;
        }
        if (skip) {
            v = o.defaultValue;
        }
        return v;
    };

    var getOptions = function($elem, opts) {
        var center, options = {};
        $.each(bootmap.options, function(index, value) {
            options[index] = getOption(index, $elem, opts);
        });
        if (!$.isArray(options.overlays)) {
            if (options.overlays) {
                options.overlays = [ options.overlays ];
            } else {
                options.overlays = [];
            }
        }
        center = new google.maps.LatLng(options.lat, options.lng);
        options.autoZoom = options.overlays.length && !options.zoom;
        options.zoom = options.zoom ? options.zoom : bootmap.defaultZoom;
        options.mapOptions = {
            center: center,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoom: options.zoom
        }
        if (options.markCenter) {
            options.overlays.push({
                "type": "Point",
                "coordinates": [ center.lng(), center.lat() ]
            });
        }
        return options;
    };

    var getPathFromOverlay = function(overlay) {
        var paths;
        if (overlay.getPath) {
            paths = overlay.getPath().getArray();
        } else if (overlay.getPosition) {
            paths = [ overlay.getPosition() ];
        }
        return paths;
    };

    var getBoundsFromOverlay = function(overlay) {
        var bounds = new google.maps.LatLngBounds();
        var path = getPathFromOverlay(overlay);
        var j;
        for (j=0; j < path.length; j++) {
            bounds.extend(path[j]);
        }
        return bounds;
    };

    var createPath = function(coordinates) {
        var path = [];
        var length = coordinates.length;
        for (var i=0; i < length; i++) {
            var coord = coordinates[i];
            path.push(new google.maps.LatLng(coord[1], coord[0]));
        }
        return path;
    };

    var createPaths = function(coordinates) {
        var paths = [];
        var length = coordinates.length;
        for (var i=0; i < length; i++) {
            paths.push(createPath(coordinates[i]));
        }
        return paths;
    };

    var createOverlay = function(geoJSON) {
        var overlayOptions = {
            strokeWeight: 3,
             fillColor: '#55FF55',
             fillOpacity: 0.5
        };
        switch(geoJSON.type) {
            case 'Point':
                overlayOptions.position = new google.maps.LatLng(geoJSON.coordinates[1], geoJSON.coordinates[0]);
                return new google.maps.Marker(overlayOptions);
            case 'LineString':
                overlayOptions.path = createPath(geoJSON.coordinates);
                return new google.maps.Polyline(overlayOptions);
            case 'Polygon':
                overlayOptions.paths = createPaths(geoJSON.coordinates);
                return new google.maps.Polygon(overlayOptions);
        }
        return null;
    };

    var addOverlaysToMap = function(map, options) {
        var i, overlay, geoJSON;
        var bounds;
        if (options.autoZoom) {
            bounds = new google.maps.LatLngBounds();
        }
        for (i=0; i < options.overlays.length; i++) {
            geoJSON = options.overlays[i];
            overlay = createOverlay(geoJSON);
            if (overlay) {
                overlay.setMap(map);
                if (options.autoZoom) {
                    bounds.union(getBoundsFromOverlay(overlay));
                }
            }
        }
        if (options.autoZoom) {
            map.fitBounds(bounds);
        }
    };

    bootmap.init = function(elem, options) {
        var map, $elem = $(elem);
        options = getOptions($elem, options);
        map = new google.maps.Map(elem, options.mapOptions);
        addOverlaysToMap(map, options);
        console.log(map.getZoom());
        if (!options.zoom && map.getZoom() > bootmap.defaultZoom) {
            map.setZoom(bootmap.defaultZoom);
        }
    };

    $.fn.bootmap = function(options) {
        return this.each(function () {
            return bootmap.init(this, options);
        });
    };

    $.fn.bootmap.defaults = {
    };

    $(function () {
        $("[data-map]").bootmap();
    });

    window.bootmap = bootmap;

})(jQuery);