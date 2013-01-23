(function(bootmap, $) {

    // Shortcut to google.maps namespace
    var gm = google.maps;

    // Shortcut to create new google.maps.LatLng instance
    function ll(lat, lng) {
        return new gm.LatLng(lat, lng);
    }

    bootmap.setProvider('google', {

        createMap: function(elem, options) {
            var map = {};
            map.native = new gm.Map(elem, {
                center: ll(options.y, options.x),
                zoom: options.zoom | 7,
                mapTypeId: gm.MapTypeId.ROADMAP
            });
            return map;
        }

    });

})(window.bootmap, jQuery);