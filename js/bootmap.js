/**
 * @file bootmap.js
 * @author Dylan Verheul <dylan@dyve.net>
 * @license See LICENSE.txt
 */
(function($) {

    /**
     * Globally available window.bootmap object to serve as namespace
     * @namespace bootmap
     */
    var bootmap = window.bootmap = {};
    var providers = {};
    var defaultProviderName = null;

    function getProvider(providerName) {
        if (providerName) {
            return providers[providerName];
        }
        return providers[defaultProviderName];
    };

    bootmap.setProvider = function(providerName, provider) {
        providers[providerName] = provider;
        if (!defaultProviderName) {
            defaultProviderName = providerName;
        }
    };

    bootmap.createMap = function($mapCanvas) {
        var data = $mapCanvas.data();
        var provider = getProvider(data['provider']);
        var options = {
            x: parseFloat(data['x']) | parseFloat(data['lng']),
            y: parseFloat(data['y']) | parseFloat(data['lat']),
            zoom: parseInt(data['zoom'], 10),
            parameters: $.parseJSON(data['parameters'] | {})
        };
        return provider.createMap($mapCanvas[0], options);
    };

    bootmap.Geometry = function(content, format, parameters) {
        var that = this;
        console.log(format);
        if (format === 'json') {
            function recurse(value) {
                var result;
                if ($.isArray(value)) {
                    result = [];
                    for (var i=0; i < value.length; i++) {
                        result[i] = recurse(value[i]);
                    }
                    return result;
                }
                if (typeof value === 'object') {
                    result = {};
                    $.each(function(i, v) {
                        result[i] = recurse[v];
                    });
                    return result;
                }
                return value;
            }
            var geom = $.parseJSON(content);
            console.log(content);
            console.log(geom)
            $.each(geom, function(index, value) {
                that[index] = recurse(value);
            });
        }
    };

    bootmap.createLayer = function($mapLayer) {
        var data = $mapLayer.data();
        var provider = getProvider(data['provider']);
        var format = data['format'];
        if (!format) {
            format = 'json';
        }
        var layer = {
            content: $mapLayer.html(),
            format: format,
            parameters: $.parseJSON(data['parameters'] | {})
        };
        layer.geom = new bootmap.Geometry(layer.content, layer.format, layer.parameters);
        return layer;
    };

    /**
     * Function that is run on page ready by jQuery
     */
    bootmap.init = function() {

        // Init every map canvas
        $("[data-role='map-canvas']").each(function() {
            var $mapCanvas = $(this);
            $mapCanvas.data('bootmap', {
                map: bootmap.createMap($mapCanvas)
            });
        });

        // Init every map layer
        $("[data-role='map-layer']").each(function() {
            var $mapLayer = $(this);
            $mapLayer.data('bootmap', {
                layer: bootmap.createLayer($mapLayer)
            });
        });

    };

    /**
     * Run bootmap.init on page ready
     */
    $(bootmap.init);

})(jQuery);