(function ($) {
    "use strict";

    var bootmap = {
        options: {
            lat: { type: "float" },
            lng: { type: "float" },
            zoom: { type: "int", value: 8 },
            type: { type: "string" },
            input: { }
        }
    };

    var getData = function($elem, index) {
        return $elem.attr('data-' + index);
    };

    var getMapData = function($elem, options) {
        var data = {};
        var html = $.trim($elem.html());
        $.each(bootmap.options, function(index, option) {
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
        data.overlays = [];
        if (html) {
            data.overlays.push({
                input: $elem[0],
                $input: $elem,
                rawContent: html,
                json: $.parseJSON(html),
                editable: false
            });
        }
        if (data.input) {
            $(data.input).each(function() {
                var $this = $(this);
                var overlay = {
                    input: this,
                    $input: $this,
                    rawContent: $this.val(),
                    editable: $this.filter(":input").length > 0
                }
                if (overlay.rawContent) {
                    overlay.json = $.parseJSON(overlay.rawContent);
                }
                data.overlays.push(overlay);
            });
        }
        return data;
    };

    var createPath = function(coordinates) {
        var path = [];
        for (var i=0; i < coordinates.length; i++) {
            path.push(new google.maps.LatLng(
                coordinates[i][1],
                coordinates[i][0]
            ));
        }
        return path;
    };

    var createPaths = function(coordinates) {
        var paths = [];
        for (var i=0; i < coordinates.length; i++) {
            paths.push(createPath(coordinates[i]));
        }
        return paths;
    };

    var overlayType = function(overlay) {
        if (overlay instanceof google.maps.Marker) {
            return "Point";
        }
        if (overlay instanceof google.maps.Polyline) {
            return "LineString";
        }
        if (overlay instanceof google.maps.Polygon) {
            return "Polygon";
        }
        return null;
    };

    var overlayToJSON = function(overlay) {
        var type = overlayType(overlay);
        var path, paths = getPathsFromOverlay(overlay);
        var i, j, coord, coordinates = [];
        for (i=0; i < paths.length; i++) {
            path = paths[i];
            coordinates[i] = [];
            for (j=0; j < path.length; j++) {
                coord = path[j];
                coordinates[i][j] = [ coord.lng(), coord.lat() ]
            }
        }
        switch (type) {
            case "Point":
                coordinates = coordinates[0][0];
                break;
            case "LineString":
                coordinates = coordinates[0];
                break;
            case "Polygon":
                // fine
                break;
            default:
                coordinates = [];
        }
        return {
            type: type,
            coordinates: coordinates
        };
    };

    var onOverlayChange = function(overlay) {
        var json = overlayToJSON(overlay);
        overlay.overlayData.$input.filter(":input").val(printJSON(json));
    };

    var printJSON = function(json) {
        var i, temp = [];
        if ($.isArray(json)) {
            for(i = 0; i < json.length; i++) {
                temp.push(printJSON(json[i]));
            }
            return '[ ' + temp.join(', ') + ' ]';
        }
        if (typeof(json) === 'object') {
            $.each(json, function(index, value) {
                temp.push('"' + index + '": ' + printJSON(value));
            });
            return '{ ' + temp.join(', ') + ' }';
        }
        if (typeof(json) === 'string') {
            return '"' +json + '"';
        }
        return '' + json;
    };

    var addListenersToPolygon = function(overlay) {
        var callback = function() { onOverlayChange(overlay); };
        var i, path, paths = overlay.getPaths();
        for (i=0; i < paths.getLength(); i++) {
            path = paths.getAt(i);
            google.maps.event.addListener(path, 'insert_at', callback);
            google.maps.event.addListener(path, 'remove_at', callback);
            google.maps.event.addListener(path, 'set_at', callback);
        }
    };

    var addListenersToPolyline = function(overlay) {
        var callback = function() { onOverlayChange(overlay); };
        var path = overlay.getPath;
        google.maps.event.addListener(path, 'insert_at', callback);
        google.maps.event.addListener(path, 'remove_at', callback);
        google.maps.event.addListener(path, 'set_at', callback);
    };

    var createOverlay = function(overlayData) {
        var json = overlayData.json;
        var overlay = null;
        var overlayOptions = {
            strokeWeight: 3,
            fillColor: '#55FF55',
            fillOpacity: 0.5,
            editable: overlayData.editable

        };
        switch(json.type) {
            case 'Point':
                overlayOptions.position = new google.maps.LatLng(json.coordinates[1], json.coordinates[0]);
                overlay = new google.maps.Marker(overlayOptions);
                if (overlayOptions.editable) {
                    overlay.setDraggable(true);
                    google.maps.event.addListener(overlay, 'dragend', function() {
                        onOverlayChange(overlay);
                    });
                }
                break;
            case 'LineString':
                overlayOptions.path = createPath(json.coordinates);
                overlay = new google.maps.Polyline(overlayOptions);
                addListenersToPolyline(overlay);
                break;
            case 'Polygon':
                overlayOptions.paths = createPaths(json.coordinates);
                overlay = new google.maps.Polygon(overlayOptions);
                addListenersToPolygon(overlay);
                break;
        }
        if (overlay) {
            overlay.overlayData = overlayData;
        }
        return overlay;
    };
    
    var createMap = function(elem, mapData) {
        var center = new google.maps.LatLng(mapData.lat, mapData.lng);
        return new google.maps.Map(elem, {
            center: center,
            zoom: 8,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
    };

    var getPathsFromOverlay = function(overlay) {
        var paths, p;
        if (overlay.getPaths) {
            p = overlay.getPaths();
            paths = [];
            for (var i =0; i < p.getLength(); i++) {
                paths.push(p.getAt(i).getArray())
            }
        } else if (overlay.getPath) {
            paths = [ overlay.getPath().getArray() ];
        } else if (overlay.getPosition) {
            paths = [ [ overlay.getPosition() ] ];
        }
        return paths;
    };

    var getBoundsFromOverlay = function(overlay) {
        var bounds = new google.maps.LatLngBounds();
        var path, paths = getPathsFromOverlay(overlay);
        var i, j;
        for (i=0; i < paths.length; i++) {
            path = paths[i];
            for (j=0; j < path.length; j++) {
                bounds.extend(path[j]);
            }
        }
        return bounds;
    };

    bootmap.initElem = function(elem, options) {
        var i, overlay, bounds;
        var $elem = $(elem);
        var mapData = getMapData($elem, options);
        var map = createMap(elem, mapData);
        var drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            markerOptions: {
                draggable: true
            },
            polylineOptions: {
                editable: true
            },
            map: map
        });
        if (mapData.overlays.length) {
            bounds = new google.maps.LatLngBounds();
            for (i=0; i < mapData.overlays.length; i++) {
                overlay = createOverlay(mapData.overlays[i]);
                overlay.setMap(map);
                bounds.union(getBoundsFromOverlay(overlay));
            }
            map.fitBounds(bounds);
        }
        $elem.data({
            map: map,
            mapData: mapData
        });
    };

    bootmap.googleMapsLoaded = function() {
        return typeof(google) !== 'undefined' && typeof(google.maps) !== 'undefined' && typeof(google.maps.drawing) !== 'undefined';
    }

    bootmap.init = function() {
        $("[data-map]").bootmap();
    }

    $.fn.bootmap = function(options) {
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