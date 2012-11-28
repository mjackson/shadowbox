require 'yuicompressor'
require 'shadowbox'

module Shadowbox
  # Outputs all files to stdout.
  class Target

    def flush!(compiler, compress=false)
      compiler.each do |file, contents|
        if compress
          case file
          when /\.js$/  then write(file, compress_js(contents))
          when /\.css$/ then write(file, compress_css(contents))
          else write(file, contents)
          end
        else
          write(file, contents)
        end
      end
    end

    def write(file, contents)
      puts "#{file}: #{contents}"
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
