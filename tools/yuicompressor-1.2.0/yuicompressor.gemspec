Gem::Specification.new do |s|
  s.name = 'yuicompressor'
  s.version = '1.2.0'
  s.date = '2010-08-04'

  s.summary = 'A YUI JavaScript and CSS compressor for Ruby and JRuby'
  s.description = 'A YUI JavaScript and CSS compressor for Ruby and JRuby'

  s.author = 'Michael Jackson'
  s.email = 'mjijackson@gmail.com'

  s.require_paths = %w< lib >

  s.files = Dir['lib/**/*'] +
    Dir['test/**/*'] +
    %w< yuicompressor.gemspec Rakefile README >

  s.test_files = s.files.select {|path| path =~ /^test\/.*_test.rb/ }

  s.add_development_dependency('rake')

  s.has_rdoc = true
  s.rdoc_options = %w< --line-numbers --inline-source --title YUICompressor --main YUICompressor >
  s.extra_rdoc_files = %w< README >

  s.homepage = 'http://github.com/mjijackson/yuicompressor'
end
