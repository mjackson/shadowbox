// here's a comment
var Foo = { "a": 1 };
Foo["bar"] = (function(baz) {
  /* here's a
     multiline comment */
  if (false) {
    doSomething();
  } else {
    for (var index = 0; index < baz.length; index++) {
      doSomething(baz[index]);
    }
  }
})("hello");
