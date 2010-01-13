module("core");

test("Basic Requirements", function() {
    expect(4);
    ok(Array.prototype.push, "Array.push");
    ok(document.getElementById, "getElementById");
    ok(document.getElementsByTagName, "getElementsByTagName");
    ok(RegExp, "RegExp");
});

test("Script Path", function() {
    var scriptPath = document.location.href.replace(/index\.html$/, 'build/');
    ok(Shadowbox.path == scriptPath, "Script path was determined correctly");
});
