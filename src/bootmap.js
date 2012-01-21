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
        var feature = null;
        var overlay = null;
        var overlayOptions = {
            strokeWeight: 3,
             fillColor: '#55FF55',
             fillOpacity: 0.5,
             editable: true
        };
        if (geoJSON.type === 'Feature') {
            feature = geoJSON;
            geoJSON = geoJSON.geometry;
        }
        if (feature) {
            overlayOptions.title = feature.id;
        }
        switch(geoJSON.type) {
            case 'Point':
                overlayOptions.position = new google.maps.LatLng(geoJSON.coordinates[1], geoJSON.coordinates[0]);
                overlay = new google.maps.Marker(overlayOptions);
                break;
            case 'LineString':
                overlayOptions.path = createPath(geoJSON.coordinates);
                overlay = new google.maps.Polyline(overlayOptions);
                break;
            case 'Polygon':
                overlayOptions.paths = createPaths(geoJSON.coordinates);
                overlay = new google.maps.Polygon(overlayOptions);
                break;
        }
        if (overlay) {
            overlay.bootmap = {
                feature: feature,
                geoJSON: geoJSON
            }
        }
        return overlay;
    };

    var getOverlays = function(options) {
        var geoJSON, overlay, i;
        var overlays = [];
        for (i=0; i < options.overlays.length; i++) {
            overlay = createOverlay(options.overlays[i]);
            if (overlay) {
                overlays.push(overlay);
            }
        }
        return overlays;
    };

    bootmap.init = function(elem, options) {
        var $elem = $(elem);
        var map, overlays, i, bounds, mapBounds, union;
        var fit;
        options = getOptions($elem, options);
        fit = options.autoZoom;
        map = new google.maps.Map(elem, options.mapOptions);
        overlays = getOverlays(options);
        if (overlays.length) {
            bounds = new google.maps.LatLngBounds();
            for (i=0; i < overlays.length; i++) {
                bounds.union(getBoundsFromOverlay(overlays[i]));
                overlays[i].setMap(map);
            }
            mapBounds = map.getBounds();
            if (mapBounds) {
                union = new google.maps.LatLngBounds(mapBounds.getSouthWest(), mapBounds.getNorthEast());
                union.union(bounds);
                if (union.equals(mapBounds)) {
                    map.panToBounds(bounds);
                    fit = false;
                }
            }
            if (fit) {
                map.fitBounds(bounds);
            }
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