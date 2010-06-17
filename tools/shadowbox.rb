require 'fileutils'

module Shadowbox

  @source_dir = File.join(File.dirname(__FILE__), '..', 'source')
  #@compiler = File.join(File.dirname(__FILE__), 'compiler-20091217.jar')
  @compiler = File.join(File.dirname(__FILE__), 'yuicompressor-2.4.2.jar')

  # get the current version of the code from the source
  @current_version = File.open(File.join(@source_dir, 'core.js')) do |f|
    f.read.match(/version: ['"]([\w.]+)['"]/)[1]
  end

  %w{adapters languages players}.each do |dir|
    available = Dir.glob(File.join(@source_dir, dir, '*.js')).map do |file|
      File.basename(file, ".js")
    end
    instance_variable_set("@available_#{dir}".to_sym, available)
  end

  @default_adapter = "base"
  @default_language = "en"
  @default_players = @available_players.dup

  class << self
    attr_reader :source_dir, :compiler, :current_version
    attr_reader :available_adapters, :available_languages, :available_players
    attr_reader :default_adapter, :default_language, :default_players

    def valid_adapter?(adapter)
      @available_adapters.include?(adapter)
    end

    def valid_language?(language)
      @available_languages.include?(language)
    end

    def valid_player?(player)
      @available_players.include?(player)
    end

    def compress(file, outfile=nil)
      result = case file
               when /\.js$/
                 #%x<java -jar #{@compiler} --js #{file}>
                 %x<java -jar #{@compiler} --type js #{file}>
               when /\.css$/
                 css = File.read(file)
                 css.gsub!(/\/\*.*?\*\//m, '')
                 css.gsub!(/^\s+/, '')
                 css.gsub!(/(,|:)\s+/, '\1')
                 css.gsub!(/\s+\{/, '{')
                 css.gsub!(/(\{|;).*?(\S)/m, '\1\2')
                 css
               else
                 raise ArgumentError
               end

      if outfile
        File.open(outfile, 'w') {|f| f << result }
      else
        $stdout.puts result
      end
    end
  end

  class Builder
    include FileUtils

    DEFAULTS = {
      :target       => 'build',
      :adapter      => Shadowbox.default_adapter,
      :language     => Shadowbox.default_language,
      :players      => Shadowbox.default_players,
      :css_support  => true,
      :compress     => false
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
      raise ArgumentError, "Unknown adapter: #{adapter}" unless Shadowbox.valid_adapter?(adapter)
      raise ArgumentError, "Unknown language: #{language}" unless Shadowbox.valid_language?(language)
      players.each do |player|
        raise ArgumentError, "Unknown player: #{player}" unless Shadowbox.valid_player?(player)
      end
    end

    def run!
      validate!
      run
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

  private

    def root(*args)
      File.join(File.dirname(__FILE__), '..', *args)
    end

    def source(*args)
      File.join(Shadowbox.source_dir, *args)
    end

    def build(*args)
      File.join(target, *args)
    end

    def run
      mkdir_p target

      files = []
      files << 'intro'
      files << 'core'
      files << 'util'
      files << File.join('adapters', adapter)
      files << 'load'
      files << 'plugins'
      files << 'cache'
      files << 'find' if css_support
      files << 'flash' if requires_flash?
      files << File.join('languages', language)
      players.each do |player|
        files << File.join('players', player)
      end
      files << 'skin'
      files << 'outro'

      File.open(build('shadowbox.js'), 'w') do |f|
        files.each do |file|
          js = File.read(source(file) + '.js')
          js.
            sub!('@VERSION', Shadowbox.current_version).
            sub!('@DATE', 'Date: ' + Time.now.inspect) if file == 'intro'
          f.puts(js)
        end
      end

      resources = []
      resources << 'shadowbox.css'
      resources << 'loading.gif'
      resources += Dir[source('resources', '*.png')].map {|file| File.basename(file) }
      resources << 'player.swf' if players.include?('flv')
      resources << 'expressInstall.swf' if requires_flash?
      resources.each do |resource|
        cp source('resources', resource), build(resource)
      end

      cp root('README'),  build('README')
      cp root('LICENSE'), build('LICENSE')

      if compress
        js = build('shadowbox.js')
        Shadowbox.compress(js, js)
        css = build('shadowbox.css')
        Shadowbox.compress(css, css)
      end
    end
  end

end
