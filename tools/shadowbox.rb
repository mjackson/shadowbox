$LOAD_PATH.unshift(File.expand_path('../yuicompressor-1.2.0/lib', __FILE__))

require 'fileutils'
require 'yuicompressor'

module Shadowbox
  @source_dir = File.expand_path('../../source', __FILE__)

  # Get the current version of the code from the source.
  @current_version = File.open(File.join(@source_dir, 'core.js')) do |f|
    f.read.match(/version: (['"])([\w.]+)\1/)[2]
  end

  %w{players}.each do |dir|
    available = Dir.glob(File.join(@source_dir, dir, '*.js')).map do |file|
      File.basename(file, '.js')
    end
    instance_variable_set("@available_#{dir}".to_sym, available)
  end

  @default_players = @available_players.dup

  class << self
    attr_reader :source_dir, :compiler, :current_version
    attr_reader :available_players, :default_players

    def valid_player?(player)
      @available_players.include?(player)
    end
  end

  class Target
    include FileUtils

    def initialize(dir)
      raise ArgumentError, 'Invalid directory: %s' % dir unless File.directory?(dir)
      raise ArgumentError, 'Directory "%s" is not writable' % dir unless File.writable?(dir)
      @dir = dir
    end

    def []=(file, contents)
      dest = File.join(@dir, file)
      dest_dir = File.dirname(dest)
      mkdir_p(dest_dir) unless File.directory?(dest_dir)
      File.open(dest, 'w') do |f|
        f.write(contents)
      end
    end
  end

  class Builder
    DEFAULTS = {
      :players  => Shadowbox.default_players,
      :compress => false
    }

    attr_reader :data

    def initialize(data={})
      @data = DEFAULTS
      update!(data)
    end

    def requires_flash?
      players.include?('swf') || players.include?('flv')
    end

    def update!(data)
      data.each do |key, value|
        self[key] = value
      end
    end

    def validate!
      players.each do |player|
        raise ArgumentError, "Unknown player: #{player}" unless Shadowbox.valid_player?(player)
      end
    end

    def run!(target)
      validate!

      # Concatenate all JavaScript files.
      js = js_files.inject('') do |m, file|
        code = File.read(file)
        if File.basename(file) == 'intro.js'
          code.sub!('@VERSION', Shadowbox.current_version)
          code.sub!('@DATE', 'Date: ' + Time.now.inspect)
        end
        m << code
        m << "\n"
      end

      target['shadowbox.js'] = compress ? YUICompressor.compress_js(js) : js

      # Concatenate all CSS files.
      css = css_files.inject('') do |m, file|
        m << File.read(file)
        m << "\n"
      end

      target['shadowbox.css'] = compress ? YUICompressor.compress_css(css) : css

      # Copy all other resources.
      resource_files.each do |file|
        target[File.basename(file)] = File.read(file)
      end
    end

    def [](key)
      @data[key.to_sym]
    end

    def []=(key, value)
      sym = key.to_sym
      @data[sym] = value if @data.has_key?(sym)
      @data[sym]
    end

    def method_missing(sym, *args)
      if sym.to_s =~ /(.+)=$/
        self[$1] = args.first
      else
        self[sym]
      end
    end

    def js_files
      files = []

      files << 'intro'
      files << 'core'
      files << 'load'
      files << 'plugins'
      files << 'cache'
      files << 'flash' if requires_flash?
      files += players.map {|p| File.join('players', p) }
      files << 'skin'
      files << 'outro'

      files.map {|f| source(f) + '.js' }
    end

    def css_files
      [ source('resources', 'shadowbox.css') ]
    end

    def resource_files
      files = []

      files << source('resources', 'loading.gif')
      files += Dir.glob(source('resources', '*.png'))
      files << source('resources', 'player.swf') if players.include?('flv')
      files << source('resources', 'expressInstall.swf') if requires_flash?
      files << root('README')
      files << root('LICENSE')

      files
    end

  private

    def root(*args)
      File.join(File.dirname(Shadowbox.source_dir), *args)
    end

    def source(*args)
      File.join(Shadowbox.source_dir, *args)
    end
  end
end
