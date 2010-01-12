module("core");

test("Basic Requirements", function() {
    expect(4);
    ok(Array.prototype.push, "Array.push");
    ok(document.getElementById, "getElementById");
    ok(document.getElementsByTagName, "getElementsByTagName");
    ok(RegExp, "RegExp");
});
