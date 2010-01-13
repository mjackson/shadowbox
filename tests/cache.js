module("cache");

test("Select/Find", function() {
    var sel = Shadowbox.select();
    ok(sel.length == 1, 'Automatically select all links with rel="shadowbox"');
    var anchor1 = document.getElementById('anchor1');
    var anchor2 = document.getElementById('anchor2');
    var sel = Shadowbox.select(anchor1);
    ok(sel.length == 1, 'Select one element when given explicitly');
    var sel = Shadowbox.select([anchor1, anchor2]);
    ok(sel.length == 2, 'Select multiple elements when given explicitly');
    ok(sel[0] == anchor1, 'Keep references to original elements');
});

test("Automatic Setup and Teardown", function() {
    Shadowbox.setup();
    var anchor1 = document.getElementById("anchor1");
    var cacheObj = Shadowbox.getCache(anchor1);
    ok(cacheObj, "Cache contains automatically setup object");
});

test("Manual Setup and Teardown", function() {
    var anchor2 = document.getElementById("anchor2");
    ok(Shadowbox.getCache(anchor2) == false, "Cache miss for new link object");
    Shadowbox.setup(anchor2);
    var cacheObj = Shadowbox.getCache(anchor2);
    ok(cacheObj, "Cache contains manually setup object");
});

test("Cache Object", function() {
    var anchor1 = document.getElementById("anchor1");
    var cacheObj = Shadowbox.getCache(anchor1);
    ok(cacheObj.link == anchor1, "Cache object keeps reference to original link element");
    ok(cacheObj.title == "Snow Leopard", "Cache object pulls title from link element");
    ok(cacheObj.options.animate === false, "Inline boolean option is parsed correctly");
    ok(cacheObj.options.animSequence === 'hw', "Inline string option is parsed correctly");
    var anchor2 = document.getElementById("anchor2");
    var cacheObj = Shadowbox.getCache(anchor2);
    equal(cacheObj.title, "", "Cache object has empty title");
});

test("Automatic Teardown", function() {
    var anchor1 = document.getElementById("anchor1");
    Shadowbox.teardown();
    equal(Shadowbox.getCache(anchor1), false, "Object successfully removed from cache");
});

test("Manual Teardown", function() {
    var anchor2 = document.getElementById("anchor2");
    Shadowbox.teardown(anchor2);
    equal(Shadowbox.getCache(anchor2), false, "Object successfully removed from cache");
});
