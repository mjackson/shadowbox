require 'fileutils'
require 'shadowbox'
require 'yuicompressor'

module Shadowbox
  class Target
    include FileUtils

    def initialize(output_dir, compress=false)
      @output_dir = output_dir
      @compress = !!compress
    end

    attr_accessor :output_dir, :compress

    def []=(file, contents)
      dest_file = File.join(@output_dir, file)
      dest_dir = File.dirname(dest_file)

      mkdir_p(dest_dir) unless File.directory?(dest_dir)

      if @compress
        if /\.js$/ === file
          contents = compress_js(contents)
        elsif /\.css$/ === file
          contents = compress_css(contents)
        end
      end

      File.open(dest_file, 'w') do |f|
        f.write(contents)
      end
    end

  private

    def compress_js(code)
      YUICompressor.compress_js(code, :munge => true)
    end

    def compress_css(code)
      YUICompressor.compress_css(code)
    end
  end
end
