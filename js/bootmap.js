/**
 * @file bootmap.js
 * @author Dylan Verheul <dylan@dyve.net>
 * @license See LICENSE.txt
 */
(function($) {

    /**
     * Globally available window.bootmap object to serve as namespace
     */
    var bootmap = window.bootmap = {};

    /**
     * Registry of map providers
     */
    var providers = {};

    /**
     * Default provider (the first to be registered)
     */
    var defaultProviderName = null;

    /**
     * Translation function, to be implemented externally
     * @param text
     * @return {String}
     */
    function gettext(text) {
        return window.gettext ? window.gettext(text) : text;
    }

    /**
     * Error object to be thrown by BootMap
     * @param message
     * @return {Object}
     * @constructor
     */
    bootmap.Error = function(message) {
        var name = 'BootMap Error';
        return {
            name: name,
            message: message
        }
    };

    /**
     * Find a map provider by name
     * @param providerName
     * @return {Object}
     * @throws {bootmap.Error}
     */
    bootmap.getMapProvider = function(providerName) {
        if (providerName) {
            return providers[providerName];
        }
        if (defaultProviderName) {
            return providers[defaultProviderName];
        }
        throw new bootmap.Error(gettext('No map provider'));
    };

    /**
     * Register a map provider by name
     * @param providerName
     * @param provider
     * @param isDefault
     * @return {Object}
     */
    bootmap.setMapProvider = function(providerName, provider, isDefault) {
        providers[providerName] = provider;
        if (isDefault || !defaultProviderName) {
            defaultProviderName = providerName;
        }
        return provider;
    };

    /**
     * Create a generic map object
     * @param $mapCanvas
     * @return {Object}
     */
    bootmap.createMap = function($mapCanvas) {
        var data = $mapCanvas.data();
        var map = {
            provider: bootmap.getMapProvider(data['provider']),
            x: parseFloat(data['x']) | parseFloat(data['lng']),
            y: parseFloat(data['y']) | parseFloat(data['lat']),
            zoom: parseInt(data['zoom'], 10),
            parameters: $.parseJSON(data['parameters'] | {})
        };
        map.native = map.provider.createMap($mapCanvas[0], map);
        return map;
    };

    /**
     * Create a generic layer object
     * @param $mapCanvas
     * @return {Object}
     */
    bootmap.createLayer = function($mapLayer) {
        var data = $mapLayer.data();
        var provider = bootmap.getMapProvider(data['provider']);
        var format = data['format'];
        var $mapCanvas = $("#" + data['mapCanvas']);
        if (!format) {
            format = 'json';
        }
        var layer = {
            content: $mapLayer.html(),
            format: format,
            parameters: $.parseJSON(data['parameters'] | {})
        };
        layer.geometry = bootmap.createGeometry(layer.content, layer.format, layer.parameters);
        layer.native = provider.createLayer(layer.geometry, $mapCanvas.data('bootmap').map)
        return layer;
    };

    /**
     * Create a generic geometry object
     * @param content
     * @param format
     * @param options
     * @return {Object}
     */
    bootmap.createGeometry = function(content, format, options) {
        if (format === 'json') {
            return $.parseJSON(content);
        }
        throw new bootmap.Error(gettext('Unknown format for geometry'));
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