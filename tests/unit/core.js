module("core");

test("Basic Requirements", function() {
    expect(4);
    ok(Array.prototype.push, "Array.push");
    ok(document.getElementById, "getElementById");
    ok(document.getElementsByTagName, "getElementsByTagName");
    ok(RegExp, "RegExp");
});

test("Shadowbox.getPlayer", function() {
    var g = Shadowbox.getPlayer;

    // flv
    equal(g("movie.flv"), "flv", ".flv");
    equal(g("movie.m4v"), "flv", ".m4v");

    // inline & iframe
    var h = document.location.href;
    equal(g(h), "iframe", "same document");
    equal(g(h + '#id'), "inline", "same document with hash");
    equal(g('/'), "iframe", "same domain, root document");
    equal(g('/#name'), "iframe", "same domain, root document with hash");
    equal(g('/index.html'), "iframe", "same domain, external document");
    equal(g('/index.html#name'), "iframe", "same domain, external document with hash");

    // img
    equal(g("some.bmp"), "img", ".bmp");
    equal(g("some.gif"), "img", ".gif");
    equal(g("some.jpg"), "img", ".jpg");
    equal(g("some.jpeg"), "img", ".jpeg");
    equal(g("some.png"), "img", ".png");

    // qt
    equal(g("movie.dv"), "qt", ".dv");
    equal(g("movie.mov"), "qt", ".mov");
    equal(g("movie.moov"), "qt", ".moov");
    equal(g("movie.movie"), "qt", ".movie");
    equal(g("movie.mp4"), "qt", ".mp4");

    // swf
    equal(g("movie.swf"), "swf", ".swf");

    // wmp
    equal(g("movie.asf"), "wmp", ".asf");
    equal(g("movie.wm"), "wmp", ".wm");
    equal(g("movie.wmv"), "wmp", ".wmv");

    // qtwmp
    equal(g("movie.avi"), "qtwmp", ".avi");
    equal(g("movie.mpg"), "qtwmp", ".mpg");
    equal(g("movie.mpeg"), "qtwmp", ".mpeg");
});
