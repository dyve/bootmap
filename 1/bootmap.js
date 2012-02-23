(function ($) {
    "use strict";

    var bootmap = {
        mapParameters: {
            lat: { type:"float" },
            lng: { type:"float" },
            zoom: { type:"int", value:8 },
            input: { }
        },
        OverlayType: {
            POLYGON: "POLYGON",
            POLYLINE: "POLYLINE",
            MARKER: "MARKER"
        }
    };

    var createLatLng = function (coordinates) {
        var lat, lng;
        if ($.isArray(coordinates) && coordinates.length === 2) {
            lat = parseFloat(coordinates[1]);
            lng = parseFloat(coordinates[0]);
            if (!isNaN(lat) && !isNaN(lng)) {
                return new google.maps.LatLng(lat, lng);
            }
        }
        throw new Error("Invalid coordinate. Expected array with 2 floats, got " + printJSON(coordinates));
    };

    var createPath = function (coordinates) {
        var i, path = [];
        for (i = 0; i < coordinates.length; i++) {
            path.push(createLatLng(coordinates[i]));
        }
        return path;
    };

    var createPaths = function (coordinates) {
        var i, paths = [];
        for (i = 0; i < coordinates.length; i++) {
            paths.push(createPath(coordinates[i]));
        }
        return paths;
    };

    var createOverlay = function(type, coordinates, options, geomIndex) {
        var overlay;
        switch (type) {
            case bootmap.OverlayType.MARKER:
                overlay = createMarker(coordinates, options);
                break;
            case bootmap.OverlayType.POLYLINE:
                overlay = createPolyline(coordinates, options);
                break;
            case bootmap.OverlayType.POLYGON:
                overlay = createPolygon(coordinates, options);
                break;
            default:
                throw new Error("Ilegal overlay type: " + type);
        }
        overlay.geomIndex = geomIndex;
        return overlay;
    };

    var createMarker = function (coordinates, options, geomIndex) {
        var marker;
        var opts = $.extend({}, options);
        var editable = opts.editable;
        delete opts.editable;
        opts.position = createLatLng(coordinates);
        marker = new google.maps.Marker(opts);
        if (editable) {
            marker.setDraggable(true);
            google.maps.event.addListener(marker, 'dragend', function () {
                onOverlayChange(marker);
            });
        }
        return marker;
    };

    var createPolyline = function (coordinates, options) {
        var opts = $.extend({}, options);
        opts.path = createPath(coordinates);
        return new google.maps.Polyline(opts);
    }

    var createPolygon = function (coordinates, options) {
        var opts = $.extend({}, options);
        opts.paths = createPaths(coordinates);
        return new google.maps.Polygon(opts);
    }

    var getPathBounds = function (path) {
        var i, bounds = new google.maps.LatLngBounds();
        for (i = 0; i < path.getLength(); i++) {
            bounds.extend(path.getAt(i));
        }
        return bounds;
    }

    var getPolygonBounds = function (polygon) {
        var i, paths = polygon.getPaths();
        var bounds = new google.maps.LatLngBounds();
        for (i = 0; i < paths.getLength(); i++) {
            bounds.union(getPathBounds(paths.getAt(i)));
        }
        return bounds;
    }

    var wktPathsToCoordinates = function (wktPaths) {
        var paths = wktPaths
            .replace(/([\d\.])\s+([\d\.])/g, '$1#$2')
            .replace(/\s/g, '')
            .replace(/\(([\d\.])/g, '(($1')
            .replace(/([\d\.])\)/g, '$1))')
            .replace(/([\d\.])\,([\d\.])/g, '$1),($2')
            .replace(/\#/g, ',')
            .replace(/\)/g, ']')
            .replace(/\(/g, '[');
        try {
            paths = $.parseJSON(paths);
        } catch (e) {
            throw new Error("Cannot parse WKT path to coordinates array")
        }
        return paths;
    };

    var wktToGeom = function (wkt) {
        var type, pathsText, len, paths, pos = wkt.indexOf("(");
        if (pos === -1) {
            throw new Error("Invalid WKT, format not recognized");
        }
        type = $.trim(wkt.substr(0, pos)).toUpperCase();
        if (!type) {
            throw new Error("Invalid WKT, no type specified");
        }
        pathsText = wkt.substr(pos);
        paths = wktPathsToCoordinates(pathsText);
        switch (type) {
            case "POINT":
                if (paths.length !== 1) {
                    throw "Invalid WKT, type POINT should have 1 coordinate";
                }
                type = "Point";
                paths = paths[0];
                break;
            case "MULTIPOINT":
                type = "MultiPoint";
                // paths = paths;
                // TODO: Might have to fix path because WKT allows 2 notations
                break;
            case "LINESTRING":
                type = "LineString";
                // paths = paths;
                // TODO: Might have to fix path because WKT allows 2 notations
                break;
            case "MULTILINESTRING":
                type = "MultiLineString";
                // paths = paths;
                // TODO: Might have to fix path because WKT allows 2 notations
                break;
            case "POLYGON":
                type = "Polygon";
                // paths = paths;
                break;
            case "MULTIPOLYGON":
                type = "MultiPolygon";
                // paths = paths;
                break;
            default:
                throw "Invalid WKT, unknown type " + type;
        }
        return {
            type: type,
            coordinates: paths
        };
    };

    var textToGeom = function (text, type) {
        var geom;
        switch (type.toLowerCase()) {
            case "wkt":
                geom = wktToGeom(text);
                break;
            case "json":
                geom = $.parseJSON(text);
                break;
            default:
                geom = null;
                break;
        }
        return geom;
    };

    var getData = function ($elem, index) {
        return $elem.attr('data-' + index);
    };

    var parseLayerElem = function (elem) {
        var $elem = $(elem);
        var editable = $elem.filter(":input").length > 0;
        var text = editable ? $elem.val() : $elem.html();
        var type = getData($elem, "type");
        if (type && text) {
            return {
                elem: elem,
                $elem: $elem,
                text: text,
                type: type,
                geom: textToGeom(text, type),
                editable: editable
            };
        }
        return null;
    };

    var parseMapElem = function ($elem, options) {
        var layer, data = {};
        $.each(bootmap.mapParameters, function (index, option) {
            var value = options[index];
            if (undefined === value) {
                value = getData($elem, index);
            }
            switch (option.type) {
                case "int":
                    value = parseInt(value, 10);
                    if (isNaN(value)) {
                        value = option.value;
                    }
                    break;
                case "float":
                    value = parseFloat(value);
                    if (isNaN(value)) {
                        value = option.value;
                    }
                    break;
            }
            data[index] = value;
        });
        data.layers = [];
        layer = parseLayerElem($elem[0]);
        if (layer) {
            data.layers.push(layer);
        }
        if (data.input) {
            $(data.input).each(function () {
                layer = parseLayerElem(this);
                if (layer) {
                    data.layers.push(layer);
                }
            });
        }
        return data;
    };

    var overlayType = function (overlay) {
        if (overlay instanceof google.maps.Marker) {
            return bootmap.OverlayType.MARKER;
        }
        if (overlay instanceof google.maps.Polyline) {
            return bootmap.OverlayType.POLYLINE;
        }
        if (overlay instanceof google.maps.Polygon) {
            return bootmap.OverlayType.POLYGON;
        }
        return null;
    };

    var pathsToCoordinates = function(paths) {
        var i, result;
        if (paths instanceof google.maps.LatLng) {
            return [ paths.lng(), paths.lat() ];
        }
        result = [];
        for (i = 0; i < paths.length; i++) {
            result.push(pathsToCoordinates(paths[i]));
        }
        return result;
    };

    var getCoordinatesFromOverlay = function(overlay) {
        return pathsToCoordinates(
            getPathsFromOverlay(overlay)
        );
    };

    var overlayToGeom = function (overlay) {
        var type = overlayType(overlay);
        var coordinates = getCoordinatesFromOverlay(overlay);
        switch (type) {
            case bootmap.OverlayType.MARKER:
                type = 'Point';
                coordinates = coordinates[0][0];
                break;
            case bootmap.OverlayType.POLYLINE:
                type = 'LineString';
                coordinates = coordinates[0];
                break;
            case  bootmap.OverlayType.POLYGON:
                type = 'Polygon';
                // coords are fine
                break;
            default:
                throw new Error("Invalid overlay type: " + type);
        }
        return {
            type: type,
            coordinates: coordinates
        };
    };

    var changeGeom = function(geom, geomIndex, newGeom) {
        var nextGeom, j, i;
        i = geomIndex.split(',');
        j = parseInt(i.shift(), 10);
        if (i.length === 0) {
            if ($.isArray(geom)) {
                geom[j] = newGeom.coordinates;
            } else if (geom.type.substr(0, 5) === 'Multi') {
                geom.coordinates[j] = newGeom.coordinates;
            } else if (geom.type === 'GeometryCollection') {
                geom.geometries[j] = newGeom;
            } else {
                throw new Error("Invalid Geometry type: " + geom.type);
            }
        } else {
            if (geom.type === 'GeometryCollection') {
                nextGeom = geom.geometries[j];
            } else {
                throw new Error("Invalid Geometry type: " + geom.type);
            }
            changeGeom(nextGeom, i.join(','), newGeom);
        }
    };

    var onOverlayChange = function (overlay) {
        var newGeom = overlayToGeom(overlay);
        var geomIndex = overlay.geomIndex;
        if (geomIndex === '0') {
            overlay.layer.geom = newGeom;
        } else {
            if (geomIndex.substr(0, 2) !== '0,') {
                throw new Error('Invalid geomIndex ' + geomIndex);
            }
            changeGeom(overlay.layer.geom, geomIndex.substr(2), newGeom);
        }
        var type = overlay.layer.type;
        var output;
        switch (type) {
            case "wkt":
                output = printWKT(overlay.layer.geom);
                break;
            case "json":
                output = printJSON(overlay.layer.geom);
                break;
            default:
                throw "No output support for type " + type;
        }
        overlay.layer.$elem.filter(":input").val(output);
    };

    var coordinatesToWKT = function (coordinates) {
        var i, result;
        if (coordinates === null) {
            return ' EMPTY ';
        }
        if (!$.isArray(coordinates[0])) {
            return coordinates[0] + " " + coordinates[1];
        }
        result = [];
        for (i = 0; i < coordinates.length; i++) {
            result[i] = coordinatesToWKT(coordinates[i]);
        }
        return "(" + result.join(",") + ")";
    };

    var printWKT = function (geom) {
        var i, wkt;
        if (geom.type === "GeometryCollection") {
            wkt = [];
            for (i = 0; i < geom.geometries.length; i++) {
                wkt.push(printWKT(geom.geometries[i]));
            }
            wkt = "GEOMETRYCOLLECTION(" + wkt.join(",") + ")";
        } else {
            wkt = geom.type.toUpperCase() + coordinatesToWKT(geom.coordinates);
        }
        return wkt;
    };

    var printJSON = function (geom) {
        var i, temp = [];
        if ($.isArray(geom)) {
            for (i = 0; i < geom.length; i++) {
                temp.push(printJSON(geom[i]));
            }
            return '[ ' + temp.join(', ') + ' ]';
        }
        if (typeof(geom) === 'object') {
            $.each(geom, function (index, value) {
                temp.push('"' + index + '": ' + printJSON(value));
            });
            return '{ ' + temp.join(', ') + ' }';
        }
        if (typeof(geom) === 'string') {
            return '"' + geom + '"';
        }
        return '' + geom;
    };

    var addListenersToPolygon = function (overlay) {
        var callback = function () {
            onOverlayChange(overlay);
        };
        var i, path, paths = overlay.getPaths();
        for (i = 0; i < paths.getLength(); i++) {
            path = paths.getAt(i);
            google.maps.event.addListener(path, 'insert_at', callback);
            google.maps.event.addListener(path, 'remove_at', callback);
            google.maps.event.addListener(path, 'set_at', callback);
        }
    };

    var addListenersToPolyline = function (overlay) {
        var callback = function () {
            onOverlayChange(overlay);
        };
        var path = overlay.getPath;
        google.maps.event.addListener(path, 'insert_at', callback);
        google.maps.event.addListener(path, 'remove_at', callback);
        google.maps.event.addListener(path, 'set_at', callback);
    };

    /**
     * Create an array of overlays from a geometry
     * @param geom
     * @param overlayOptions
     * @return array
     */
    var createOverlaysFromGeom = function(geom, overlayOptions, geomIndex) {
        var i, result, newIndex;
        if (!geomIndex) {
            geomIndex = '0';
        }
        if (geom.type === "GeometryCollection") {
            result = [];
            for (i = 0; i < geom.geometries.length; i++) {
                newIndex = geomIndex + ',' + i;
                result.push(createOverlaysFromGeom(geom.geometries[i], overlayOptions, newIndex));
            }
        } else {
            var multiGeom = function(type, coordinates) {
                var overlays = [];
                for (i = 0; i < geom.coordinates.length; i++) {
                    newIndex = geomIndex + ',' + i;
                    overlays.push(createOverlaysFromGeom({
                        type: type,
                        coordinates: geom.coordinates[i]
                    }, overlayOptions, newIndex));
                }
                return overlays;
            };
            switch (geom.type) {
                case 'Point':
                    result = createOverlay(bootmap.OverlayType.MARKER, geom.coordinates, overlayOptions, geomIndex);
                    break;
                case 'LineString':
                    result = createOverlay(bootmap.OverlayType.POLYLINE, geom.coordinates, overlayOptions, geomIndex);
                    addListenersToPolyline(result);
                    break;
                case 'Polygon':
                    result = createOverlay(bootmap.OverlayType.POLYGON, geom.coordinates, overlayOptions, geomIndex);
                    addListenersToPolygon(result);
                    break;
                case 'MultiPoint':
                    result = multiGeom('Point', geom.coordinates);
                    break;
                case 'MultiLineString':
                    result = multiGeom('LineString', geom.coordinates);
                    break;
                case 'MultiPolygon':
                    result = multiGeom('Polygon', geom.coordinates);
                    break;
                default:
                    throw Error("Bootmap cannot handle geometries of type '" + geom.type + "'");
            }
        }
        return result;
    };

    var flattenArray = function(array) {
        var i, j, e, flat = [];
        if (!$.isArray(array)) {
            flat.push(array);
        } else {
            for (i = 0; i < array.length; i++) {
                e = flattenArray(array[i]);
                for (j = 0; j < e.length; j++) {
                    flat.push(e[j]);
                }
            }
        }
        return flat;
    };

    var createOverlaysFromLayer = function(layer) {
        var i, overlays = null;
        var overlayOptions = {
            editable: layer.editable
        };
        if (layer.type === "wkt-file") {
            overlays = new google.maps.KmlLayer(layer.text);
        } else {
            overlays = createOverlaysFromGeom(layer.geom, overlayOptions);
        }
        overlays = flattenArray(overlays);
        if (!$.isArray(overlays)) {
            overlays = [ overlays ];
        }
        for (i = 0; i < overlays.length; i++) {
            overlays[i].layer = layer;
        }
        return overlays;
    };

    var createMap = function (elem, mapData) {
        var center = new google.maps.LatLng(mapData.lat, mapData.lng);
        return new google.maps.Map(elem, {
            center: center,
            zoom: 8,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
    };

    var getPathsFromOverlay = function (overlay) {
        var paths, p;
        if (overlay.getPaths) {
            p = overlay.getPaths();
            paths = [];
            for (var i = 0; i < p.getLength(); i++) {
                paths.push(p.getAt(i).getArray());
            }
        } else if (overlay.getPath) {
            paths = [ overlay.getPath().getArray() ];
        } else if (overlay.getPosition) {
            paths = [
                [ overlay.getPosition() ]
            ];
        }
        return paths;
    };

    var getBoundsFromOverlay = function (overlay) {
        var bounds = new google.maps.LatLngBounds();
        var path, paths = getPathsFromOverlay(overlay);
        var i, j;
        if (paths) {
            for (i = 0; i < paths.length; i++) {
                path = paths[i];
                for (j = 0; j < path.length; j++) {
                    bounds.extend(path[j]);
                }
            }
        }
        return bounds;
    };

    var createOverlaysFromLayers = function(layers) {
        var i, j, o, overlays = [];
        for (i = 0; i < layers.length; i++) {
            o = createOverlaysFromLayer(layers[i]);
            for (j = 0; j < o.length; j++) {
                overlays.push(o[j]);
            }
        }
        return overlays;
    };

    bootmap.initElem = function (elem, options) {
        var i, overlay, overlays, bounds;
        var $elem = $(elem);
        var mapData = parseMapElem($elem, options);
        var map = createMap(elem, mapData);
        if (mapData.layers.length) {
            bounds = new google.maps.LatLngBounds();
            overlays = createOverlaysFromLayers(mapData.layers);
            for (i = 0; i < overlays.length; i++) {
                overlay = overlays[i];
                overlay.setMap(map);
                bounds.union(getBoundsFromOverlay(overlay));
            }
            map.fitBounds(bounds);
        }
        $elem.data({
            map:map,
            mapData:mapData
        });
    };

    bootmap.googleMapsLoaded = function () {
        return typeof(google) !== 'undefined' && typeof(google.maps) !== 'undefined' && typeof(google.maps.drawing) !== 'undefined';
    };

    bootmap.init = function () {
        $("[data-map]").bootmap();
    };

    $.fn.bootmap = function (options) {
        options = $.extend({}, $.fn.options, options);
        return this.each(function () {
            bootmap.initElem(this, options);
        });
    };

    $.fn.bootmap.defaults = {
    };

    window.bootmap = bootmap;

    $(function () {
        if (bootmap.googleMapsLoaded()) {
            bootmap.init();
        } else {
            $("body").append('<script src="//maps.googleapis.com/maps/api/js?libraries=drawing&sensor=false&callback=bootmap.init"></script>');
        }
    });

})(jQuery);