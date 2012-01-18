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
        }
    };

    function data($elem, index, defaultValue) {
        var data = $elem.attr("data-" + index);
        if (undefined === data) {
            data = $elem.data(index);
        }
        if (undefined === data) {
            data = defaultValue;
        }
        return data;
    };

    bootmap.getOptions = function($elem, options) {
        var result = {};
        $.each(bootmap.options, function(index, value) {
            result[index] = data($elem, index, value.defaultValue);
        });
        result = $.extend(result, options);
        $.each(result, function(index, value) {
            var o = bootmap.options[index];
            if (undefined !== o) {
                var v;
                switch (o.type) {
                    case "int":
                        v = parseInt(value, 10);
                        break;
                    case "float":
                        v = parseFloat(value);
                        break;
                }
                if (undefined !==v && !isNaN(v)) {
                    result[index] = v;
                }
            }
        });
        return result;
    }

    bootmap.init = function(elem, options) {
        var $elem = $(elem);
        var options = bootmap.getOptions($elem, options);
        options.center = new google.maps.LatLng(options.lat, options.lng);
        options.mapTypeId = google.maps.MapTypeId.ROADMAP;
        var map = new google.maps.Map(elem, options);
    };

    $.fn.bootmap = function(options) {
        return this.each(function () {
            return bootmap.init(this, options);
        });
    };

    $.fn.bootmap.defaults = {
        foreground:'red',
        background:'yellow'
    };

    $(function () {
        $("[data-map]").bootmap();
    });

    window.bootmap = bootmap;

})(jQuery);