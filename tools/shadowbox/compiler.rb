require 'shadowbox'

module Shadowbox
  class Compiler
    def initialize(options)
      @source_dir = options[:source_dir] || Shadowbox.source_dir
      raise ArgumentError, %{Invalid directory: #{@source_dir}} unless File.directory?(@source_dir)
      raise ArgumentError, %{Directory "#{@source_dir}" is not readable} unless File.readable?(@source_dir)
      @support_flash = !!options[:support_flash]
      @support_video = !!options[:support_video]
      @combine_files = !!options[:combine_files]
    end

    attr_accessor :source_dir, :support_flash, :support_video, :combine_files

    def requires_flash?
      @support_flash || @support_video
    end

    def js_files
      files = []
      files << source('shadowbox.js')
      files << source('shadowbox-flash.js') if requires_flash?
      files << source('shadowbox-video.js') if @support_video
      files
    end

    def css_files
      files = []
      files << source('shadowbox.css')
      files << source('shadowbox-video.css') if @support_video
      files
    end

    def resource_files
      files = []
      files << source('shadowbox-icons.png')
      files << source('shadowbox-controls.png') if @support_video
      files
    end

    def run!(target)
      date = Time.now.inspect

      js = js_files.inject([]) do |memo, file|
        name = File.basename(file)
        code = File.read(file)

        # Replace @VERSION and @DATE markers in shadowbox.js.
        if name == 'shadowbox.js'
          code.sub!('@VERSION', Shadowbox.version)
          code.sub!('@DATE', date)
        end

        memo << [name, code]
      end

      css = css_files.inject([]) do |memo, file|
        name = File.basename(file)
        code = File.read(file)

        # Replace @VERSION and @DATE markers in shadowbox.css.
        if name == 'shadowbox.css'
          code.sub!('@VERSION', Shadowbox.version)
          code.sub!('@DATE', date)
        end

        memo << [name, code]
      end

      if @combine_files
        # Concatenate all js/css files into shadowbox.js and shadowbox.css.
        target['shadowbox.js'] = js.map {|name, code| code }.join("\n")
        target['shadowbox.css'] = css.map {|name, code| code }.join("\n")
      else
        (js + css).each {|name, code| target[name] = code }
      end

      # Copy all other resources.
      resource_files.each do |file|
        target[File.basename(file)] = File.read(file)
      end
    end

  private

    def source(*args)
      File.join(@source_dir, *args)
    end
  end
end
