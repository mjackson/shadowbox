module("cache");

test("select", function() {
    var sel = Shadowbox.select();
    equal(sel.length, 3, 'Automatically select all links with rel="shadowbox"');
    var link1 = document.getElementById('link1');
    var link2 = document.getElementById('link2');
    var sel = Shadowbox.select(link1);
    equal(sel.length, 1, 'Select one element when given explicitly');
    var sel = Shadowbox.select([link1, link2]);
    equal(sel.length, 2, 'Select multiple elements when given in an array');
    equal(sel[0], link1, 'Keep references to original elements');
    var sel = Shadowbox.select(document.getElementById('main').getElementsByTagName('a'));
    equal(sel.length, 4, 'Select multiple elements when given in a node list');
});

test("setup (automatic)", function() {
    Shadowbox.setup();
    var link1 = document.getElementById("link1");
    var cacheObj = Shadowbox.getCache(link1);
    ok(cacheObj, "Cache contains automatically setup object");
});

test("setup (manual)", function() {
    var link2 = document.getElementById("link2");
    ok(Shadowbox.getCache(link2) == false, "Cache miss for new link object");
    Shadowbox.setup(link2);

    var cacheObj = Shadowbox.getCache(link2);
    ok(cacheObj, "Cache contains manually setup object");
});

test("buildObject", function() {
    var link1 = document.getElementById("link1");
    var cacheObj = Shadowbox.getCache(link1);
    ok(cacheObj.link == link1, "Cache object keeps reference to original link element");
    ok(cacheObj.title == "Snow Leopard", "Cache object pulls title from link element");
    ok(cacheObj.options.animate === false, "Inline boolean option is parsed correctly");
    ok(cacheObj.options.animSequence === 'hw', "Inline string option is parsed correctly");

    var link2 = document.getElementById("link2");
    var cacheObj = Shadowbox.getCache(link2);
    equal(cacheObj.title, "", "Cache object has empty title");
});

test("teardown (automatic)", function() {
    var link1 = document.getElementById("link1");
    Shadowbox.teardown();
    equal(Shadowbox.getCache(link1), false, "Object successfully removed from cache");
});

test("teardown (manual)", function() {
    var link2 = document.getElementById("link2");
    Shadowbox.teardown(link2);
    equal(Shadowbox.getCache(link2), false, "Object successfully removed from cache");
});
