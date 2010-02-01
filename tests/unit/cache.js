module("cache");

test("select", function() {
    var sel = Shadowbox.select();
    equal(sel.length, 3, 'Automatically select all links with rel="shadowbox"');
});

test("select (with a single element)", function() {
    var link1 = document.getElementById("link1");
    var sel = Shadowbox.select(link1);
    equal(sel.length, 1, "Select a single element");
});

test("select (with an array)", function() {
    var link1 = document.getElementById("link1");
    var link2 = document.getElementById("link2");
    var sel = Shadowbox.select([link1, link2]);
    equal(sel.length, 2, "Select multiple elements when given in an array");
});

test("select (with a node list)", function() {
    var sel = Shadowbox.select(document.getElementById("main").getElementsByTagName("a"));
    equal(sel.length, 4, "Select multiple elements when given in a node list");
});

test("select (with a CSS selector)", function() {
    var sel = Shadowbox.select("#main a");
    equal(sel.length, 4, "Select multiple elements when given a CSS selector");
});

test("setup/teardown (automatic)", function() {
    var link1 = document.getElementById("link1");
    Shadowbox.setup();
    var cacheObj = Shadowbox.getCache(link1);
    ok(cacheObj, "Cache contains automatically setup object");
    Shadowbox.teardown();
    equal(Shadowbox.getCache(link1), false, "Object successfully removed from cache");
});

test("setup/teardown (manual)", function() {
    var link2 = document.getElementById("link2");
    Shadowbox.setup(link2);
    var cacheObj = Shadowbox.getCache(link2);
    ok(cacheObj, "Cache contains manually setup object");
    Shadowbox.teardown(link2);
    equal(Shadowbox.getCache(link2), false, "Object successfully removed from cache");
});
