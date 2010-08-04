require File.expand_path('../helper', __FILE__)

class JSTest < Test::Unit::TestCase
  FILE = File.expand_path('../_files/test.js', __FILE__)
  CODE = File.read(FILE)

  def test_default_command_arguments
    args = command_arguments(default_js_options)

    if jruby?
      assert_equal([-1], args)
    else
      assert_equal([], args)
    end
  end

  def test_command_arguments
    if jruby?
      args = command_arguments(:type => 'js')
      assert_equal([-1, false, false, false, true], args)

      args = command_arguments(:type => 'js', :optimize => true)
      assert_equal([-1, false, false, false, false], args)

      args = command_arguments(:type => 'js', :munge => true)
      assert_equal([-1, true, false, false, true], args)

      args = command_arguments(:type => 'js', :non_existent => true)
      assert_equal([-1, false, false, false, true], args)
    else
      args = command_arguments(:type => 'js')
      assert_equal(%w< --type js --nomunge --disable-optimizations >, args)

      args = command_arguments(:type => 'js', :optimize => true)
      assert_equal(%w< --type js --nomunge >, args)

      args = command_arguments(:type => 'js', :munge => true)
      assert_equal(%w< --type js --disable-optimizations >, args)

      args = command_arguments(:type => 'js', :non_existent => true)
      assert_equal(%w< --type js --nomunge --disable-optimizations >, args)
    end
  end

  def test_default_options
    assert_equal (<<'CODE').chomp, compress_js(CODE)
var Foo={a:1};Foo.bar=(function(baz){if(false){doSomething()}else{for(var index=0;index<baz.length;index++){doSomething(baz[index])}}})("hello");
CODE
  end

  def test_line_break_option
    assert_equal (<<'CODE').chomp, compress_js(CODE, :line_break => 0)
var Foo={a:1};
Foo.bar=(function(baz){if(false){doSomething()
}else{for(var index=0;
index<baz.length;
index++){doSomething(baz[index])
}}})("hello");
CODE
  end

  def test_munge_option
    assert_equal (<<'CODE').chomp, compress_js(CODE, :munge => true)
var Foo={a:1};Foo.bar=(function(b){if(false){doSomething()}else{for(var a=0;a<b.length;a++){doSomething(b[a])}}})("hello");
CODE
  end

  def test_optimize_option
    assert_equal (<<'CODE').chomp, compress_js(CODE, :optimize => false)
var Foo={"a":1};Foo["bar"]=(function(baz){if(false){doSomething()}else{for(var index=0;index<baz.length;index++){doSomething(baz[index])}}})("hello");
CODE
  end

  def test_preserve_semicolons_option
    assert_equal (<<'CODE').chomp, compress_js(CODE, :preserve_semicolons => true)
var Foo={a:1};Foo.bar=(function(baz){if(false){doSomething();}else{for(var index=0;index<baz.length;index++){doSomething(baz[index]);}}})("hello");
CODE
  end

  def test_stream
    assert_equal (<<'CODE').chomp, compress_js(File.new(FILE, 'r'))
var Foo={a:1};Foo.bar=(function(baz){if(false){doSomething()}else{for(var index=0;index<baz.length;index++){doSomething(baz[index])}}})("hello");
CODE
  end

  def test_large_stream
    assert compress_js(File.new(File.expand_path('../_files/jquery-1.4.2.js', __FILE__), 'r'))
  end
end
