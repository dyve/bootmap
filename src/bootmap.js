(function ($) {
    "use strict";

    var bootmap = {
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
                defaultValue: 8
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

    var getOption = function(index, $elem) {
        var o = bootmap.options[index];
        var value = data($elem, index, o.defaultValue);
        var v, skip = false;
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

    var getOptions = function($elem, options) {
        var center, result = {};
        $.each(bootmap.options, function(index, value) {
            result[index] = getOption(index, $elem);
        });
        if (!$.isArray(result.overlays)) {
            if (result.overlays) {
                result.overlays = [ result.overlays ];
            } else {
                result.overlays = [];
            }
        }
        center = new google.maps.LatLng(result.lat, result.lng);
        result.mapOptions = {
            center: center,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoom: result.zoom
        }
        if (result.markCenter) {
            result.overlays.push({
                "type": "Point",
                "coordinates": [ center.lng(), center.lat() ]
            });
        }
        return result;
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
        for (i=0; i < options.overlays.length; i++) {
            geoJSON = options.overlays[i];
            overlay = createOverlay(geoJSON);
            if (overlay) {
                overlay.setMap(map);
                map.setZoom(8);
            }
        }
    };

    bootmap.init = function(elem, options) {
        var map, $elem = $(elem);
        options = getOptions($elem, options);
        map = new google.maps.Map(elem, options.mapOptions);
        addOverlaysToMap(map, options);
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