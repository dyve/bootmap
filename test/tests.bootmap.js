$(document).ready(function () {
    "use strict";

    var $map0 = $("#map1");
    var $map1 = $("#map1");

    module("Bootmap");

    test("Map data present on map element", function() {
        var mapData = $map0.data("mapData");
        console.log(mapData)
        equal(!mapData, false);
    });

});
