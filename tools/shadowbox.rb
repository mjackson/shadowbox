require 'fileutils'
require 'optparse'
require 'erb'

module Shadowbox
  @source_dir = File.expand_path(File.dirname(__FILE__) + '/../lib')

  # get the current version of the code from the source
  @current_version = File.open(@source_dir + '/shadowbox.js') do |f|
    f.read.match(/version: ['"]([\w.]+)['"]/)[1]
  end

  %w{adapters players languages}.each do |dir|
    available = Dir.glob(@source_dir + "/#{dir}/*.js").map do |file|
      file.match(/shadowbox-([-a-zA-Z]+?)\.js$/)[1]
    end
    instance_variable_set("@available_#{dir}".to_sym, available)
  end

  @default_adapter = "base"
  @default_players = @available_players.dup
  @default_language = "en"

  class << self
    attr_reader :source_dir, :current_version
    attr_reader :available_adapters, :available_players, :available_languages
    attr_reader :default_adapter, :default_players, :default_language

    def valid_adapter?(adapter)
      @available_adapters.include?(adapter)
    end

    def valid_player?(player)
      @available_players.include?(player)
    end

    def valid_language?(language)
      @available_languages.include?(language)
    end
  end

  class Builder
    NOTICE = %q{
    This directory contains a custom build of Shadowbox, and contains only a subset
    of its available features. All files necessary to run Shadowbox are combined into
    as few as possible in order to maximize efficiency in load and execution time.

    This particular build includes support for the following features:

    Language: <%=@language%>
    Adapter:  <%=@adapter%>
    Players:  <%=@players.join(', ')%>

    <%="Support for CSS selectors is also included via Sizzle.js <http://sizzlejs.com/>." if @use_sizzle%>
    <%="The code was compressed using the YUI Compressor <http://developer.yahoo.com/yui/compressor/>." if @compress%>

    For more information, please visit the Shadowbox website at http://shadowbox-js.com/.
    }.gsub(/^    /, '')

    class << self
      attr_reader :compressor
    end

    attr_reader :errors
    attr_accessor :compress, :adapter, :language, :players
    attr_accessor :use_sizzle, :use_swfobject, :target, :overwrite

    def initialize
      @errors = []

      @compress = false
      @version  = Shadowbox.current_version
      @adapter  = Shadowbox.default_adapter
      @language = Shadowbox.default_language
      @players  = Shadowbox.default_players

      @use_sizzle     = false
      @use_swfobject  = false # will be set automatically if needed
      @target         = "build"
      @overwrite      = true
    end

    def read_js(input_file)
      @compress ? compress_js(input_file) : File.read(input_file)
    end

    def read_css(input_file)
      @compress ? compress_css(input_file) : File.read(input_file)
    end

    def compress_js(input_file)
      compressor = File.dirname(__FILE__) + '/yuicompressor/yuicompressor-2.4.2.jar'
      %x<java -jar #{compressor} #{input_file}>
    end

    def compress_css(input_file)
      css = File.read(input_file)
      css.gsub!(/\/\*.*?\*\//m, '')
      css.gsub!(/^\s+/, '')
      css.gsub!(/(,|:)\s+/, '\1')
      css.gsub!(/\s+\{/, '{')
      css
    end

    def notice
      template = ERB.new(NOTICE)
      template.result(binding)
    end

    def run
      @errors = []

      # include swfobject if swf or flv players are being used
      @players.uniq!
      @use_swfobject = @players.include?('swf') || @players.include?('flv')

      @errors << %{Invalid adapter: #{@adapter}} unless Shadowbox.valid_adapter?(@adapter)
      @errors << %{Invalid language: #{@language}} unless Shadowbox.valid_language?(@language)
      invalid_players = @players.reject {|player| Shadowbox.valid_player?(player) }
      @errors << %{Invalid player(s): #{invalid_players.join(',')}} if invalid_players.any?

      make_target unless @errors.any?

      # stop here if there are any errors
      return false if @errors.any?

      source = Shadowbox.source_dir

      # create javascript file list
      jsfiles = []
      jsfiles << "shadowbox.js"
      jsfiles << File.join("adapters", "shadowbox-#{@adapter}.js")
      jsfiles << File.join("languages", "shadowbox-#{@language}.js")
      jsfiles += @players.map {|player| File.join("players", "shadowbox-#{player}.js") }
      jsfiles << File.join("libraries", "sizzle", "sizzle.js") if @use_sizzle
      jsfiles << File.join("libraries", "swfobject", "swfobject.js") if @use_swfobject

      # compile js
      js = jsfiles.map {|file| read_js(File.join(source, file)) }
      js << %<Shadowbox.options.players=["#{@players.join('","')}"];>
      js << %<Shadowbox.options.useSizzle=#{@use_sizzle};>
      File.open(File.join(@target, "shadowbox.js"), 'w') {|f| f.print js.join("\n") }

      # compile css
      css = read_css(File.join(source, "shadowbox.css"))
      File.open(File.join(@target, "shadowbox.css"), 'w') {|f| f.print css }

      # copy all other assets
      assets = File.join(@target, "assets")
      FileUtils.mkdir assets
      FileUtils.cp    Dir[File.join(source, "assets", "*.png")],    assets
      libraries = File.join(@target, "libraries")
      FileUtils.mkdir libraries
      FileUtils.cp_r  File.join(source, "libraries", "sizzle"),     libraries if @use_sizzle
      FileUtils.cp_r  File.join(source, "libraries", "swfobject"),  libraries if @use_swfobject

      FileUtils.cp File.dirname(__FILE__) + '/../README', @target
      FileUtils.cp File.dirname(__FILE__) + '/../LICENSE', @target
      File.open(File.join(@target, "BUILD"), 'w') {|f| f.print notice }

      true
    end

    def make_target
      target_dir = File.dirname(@target)
      if !File.writable?(target_dir)
        @errors << %{Target directory (#{target_dir}) is not writable}
      elsif File.exist?(@target)
        if @overwrite
          FileUtils.rm_rf(@target)
          FileUtils.mkdir_p(@target)
        else
          @errors << %{Target directory (#{@target}) already exists}
        end
      else
        FileUtils.mkdir_p(@target)
      end
    end
  end
end
