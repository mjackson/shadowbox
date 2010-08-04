lib = File.expand_path('../../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)

require 'test/unit'
require 'yuicompressor'

class Test::Unit::TestCase
  include YUICompressor
end
