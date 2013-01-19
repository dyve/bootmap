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

    /**
     * Function that is run on page ready by jQuery
     */
    bootmap.init = function() {
        $("[data-role='map-canvas']").each(function() {
            var $mapCanvas = $(this);
            $mapCanvas.data('bootmap', true);
        });
    };

    /**
     * Run bootmap.init on page ready
     */
    bootmap.init();

})(window.bootmap$ || window.jQuery);