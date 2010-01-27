module("util");

test("getStyle", function() {
    var el = document.getElementById("test"),
        getStyle = Shadowbox.getStyle;
    equal(getStyle(el, "height"), "20px");
    equal(getStyle(el, "width"), "20px");
    equal(getStyle(el, "marginTop"), "5px");
    equal(getStyle(el, "borderTopWidth"), "5px");
});
