require 'yuicompressor'
require 'shadowbox'

module Shadowbox
  class Compiler

    def initialize(options)
      @source_dir = options[:source_dir] || Shadowbox.source_dir
      raise ArgumentError, %{Invalid directory: #{@source_dir}} unless File.directory?(@source_dir)
      raise ArgumentError, %{Directory "#{@source_dir}" is not readable} unless File.readable?(@source_dir)
      @support_flash = !!options[:support_flash]
      @support_video = !!options[:support_video]
    end

    attr_accessor :source_dir, :support_flash, :support_video

    def requires_flash?
      @support_flash || @support_video
    end

    def js_files
      files = []
      files << source_path('shadowbox.js')
      files << source_path('shadowbox-flash.js') if requires_flash?
      files << source_path('shadowbox-video.js') if @support_video
      files
    end

    def css_files
      files = []
      files << source_path('shadowbox.css')
      files << source_path('shadowbox-video.css') if @support_video
      files
    end

    def resource_files
      files = []
      files << source_path('shadowbox-icons.png')
      files << source_path('shadowbox-controls.png') if @support_video
      files
    end

    def each(&block)
      hash = Hash.new

      hash['shadowbox.js'] = js_files.inject('') do |memo, file|
        code = File.read(file)
        code.sub!('@VERSION', Shadowbox.version) if File.basename(file) == 'shadowbox.js'
        memo << code
      end

      hash['shadowbox.css'] = css_files.inject('') do |memo, file|
        code = File.read(file)
        code.sub!('@VERSION', Shadowbox.version) if File.basename(file) == 'shadowbox.css'
        memo << code
      end

      resource_files.each do |file|
        hash[File.basename(file)] = File.read(file)
      end

      hash.each(&block)
    end

    def flush!(target, compress=false)
      each do |file_name, contents|
        if compress
          case file_name
          when /\.js$/  then target.write(file_name, compress_js(contents))
          when /\.css$/ then target.write(file_name, compress_css(contents))
          else target.write(file_name, contents)
          end
        else
          target.write(file_name, contents)
        end
      end
    end

  private

    def source_path(*args)
      File.join(@source_dir, *args)
    end

    def compress_js(code)
      YUICompressor.compress_js(code, :munge => true)
    end

    def compress_css(code)
      YUICompressor.compress_css(code)
    end

  end
end
