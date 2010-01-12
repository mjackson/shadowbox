module("cache");

test("Select/Find", function() {
    var sel = Shadowbox.select();

    same(sel.length, 1, 'Automatically select all links with rel="shadowbox"');

    var anchor1 = document.getElementById('anchor1'),
        anchor2 = document.getElementById('anchor2');

    var sel = Shadowbox.select(anchor1);

    same(sel.length, 1, 'Select one element when given explicitly');

    var sel = Shadowbox.select([anchor1, anchor2]);

    same(sel.length, 2, 'Select multiple elements when given explicitly');
    same(sel[0], anchor1, 'Keep references to original elements');
});

test("Automatic Setup", function() {
    var anchor1 = document.getElementById("anchor1");

    // should already be there from call to Shadowbox.init
    var cacheObj = Shadowbox.getCache(anchor1);

    ok(cacheObj, 'Cache contains automatically setup object');
    same(cacheObj.link, anchor1, "Cache object keeps reference to original link element");
    same(cacheObj.title, "Snow Leopard", "Cache object pulls title from link element");
});

test("Manual Setup", function() {
    var anchor2 = document.getElementById("anchor2");

    same(Shadowbox.getCache(anchor2), false, "Cache miss for new link object");

    Shadowbox.setup(anchor2);

    var cacheObj = Shadowbox.getCache(anchor2);

    ok(cacheObj, "Cache contains manually setup object");
    same(cacheObj.title, null, "Cache object has empty title");

    Shadowbox.teardown(anchor2);

    equals(Shadowbox.getCache(anchor2), false, "Cache miss for removed object");
});
