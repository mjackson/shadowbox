require File.expand_path('../helper', __FILE__)

class CSSTest < Test::Unit::TestCase
  FILE = File.expand_path('../_files/test.css', __FILE__)
  CODE = File.read(FILE)

  def test_default_command_arguments
    args = command_arguments(default_css_options)

    if jruby?
      assert_equal([-1], args)
    else
      assert_equal([], args)
    end
  end

  def test_command_arguments
    if jruby?
      args = command_arguments(:type => 'css')
      assert_equal([-1], args)

      args = command_arguments(:type => 'css', :line_break => 80)
      assert_equal([80], args)

      args = command_arguments(:type => 'css', :non_existent => true)
      assert_equal([-1], args)
    else
      args = command_arguments(:type => 'css')
      assert_equal(%w< --type css >, args)

      args = command_arguments(:type => 'css', :line_break => 80)
      assert_equal(%w< --type css --line-break 80 >, args)

      args = command_arguments(:type => 'css', :non_existent => true)
      assert_equal(%w< --type css >, args)
    end
  end

  def test_default_options
    assert_equal (<<'CODE').chomp, compress_css(CODE)
.a-class{background-color:red;background-position:0 0}div#an-id{color:#fff}
CODE
  end

  def test_line_break_option
    assert_equal (<<'CODE').chomp, compress_css(CODE, :line_break => 0)
.a-class{background-color:red;background-position:0 0}
div#an-id{color:#fff}
CODE
  end

  def test_stream
    assert_equal (<<'CODE').chomp, compress_css(File.new(FILE, 'r'))
.a-class{background-color:red;background-position:0 0}div#an-id{color:#fff}
CODE
  end
end
