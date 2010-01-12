module("cache");

test("Cache Contents", function() {
    var anchor2 = document.getElementById("anchor2");

    same(Shadowbox.getCache(anchor2), false, "Cache miss for new link object");

    Shadowbox.setup(anchor2);

    ok(Shadowbox.getCache(anchor2), "Cache contains newly setup object");

    var cacheObj = Shadowbox.getCache(anchor2);

    same(cacheObj.link, anchor2, "Cache object keeps reference to original link object");
    same(cacheObj.title, null, "Cache object has empty title");

    Shadowbox.teardown(anchor2);

    equals(Shadowbox.getCache(anchor2), false, "Cache miss for removed object");

    //equals(Shadowbox.cache.length, 1, "Cache count decrements when object is removed");
});


