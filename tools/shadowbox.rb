require 'fileutils'
require 'optparse'
require 'erb'

module Shadowbox
  @source_dir = File.expand_path(File.dirname(__FILE__) + '/../source')

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

  @js_compiler = File.join(File.dirname(__FILE__), 'closure-compiler-20091217.jar')

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

    def compile(file, output=nil)
      result = case file
               when /\.js$/
                 %x<java -jar #{@js_compiler} --js #{file}>
               when /\.css$/
                 css = File.read(file)
                 css.gsub!(/\/\*.*?\*\//m, '')
                 css.gsub!(/^\s+/, '')
                 css.gsub!(/(,|:)\s+/, '\1')
                 css.gsub!(/\s+\{/, '{')
                 css
               else
                 raise ArgumentError
               end

      if output
        File.open(output, 'w') {|f| f.print result }
      else
        $stdout.puts result
      end
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

    For more information, please visit the Shadowbox website at http://shadowbox-js.com/.
    }.gsub(/^    /, '')

    attr_reader :errors
    attr_accessor :adapter, :language, :players, :use_sizzle, :use_swfobject, :target, :overwrite

    def initialize
      @errors        = []
      @version       = Shadowbox.current_version
      @adapter       = Shadowbox.default_adapter
      @language      = Shadowbox.default_language
      @players       = Shadowbox.default_players
      @use_sizzle    = false
      @use_swfobject = false # will be set automatically if needed
      @target        = "build"
      @overwrite     = true
    end

    def notice
      template = ERB.new(NOTICE)
      template.result(binding)
    end

    def source(*args)
      File.join(Shadowbox.source_dir, *args)
    end

    def target(*args)
      File.join(@target, *args)
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

      # create javascript file list
      jsfiles = []
      jsfiles << "shadowbox.js"
      jsfiles << ["adapters", "shadowbox-#{@adapter}.js"]
      jsfiles << ["languages", "shadowbox-#{@language}.js"]
      jsfiles += @players.map {|player| ["players", "shadowbox-#{player}.js"] }
      jsfiles << ["libraries", "sizzle", "sizzle.js"] if @use_sizzle
      jsfiles << ["libraries", "swfobject", "swfobject.js"] if @use_swfobject

      # compile js
      js = jsfiles.map {|paths| File.read(source(*paths)) }
      js << %<Shadowbox.options.players=["#{@players.join('","')}"];>
      js << %<Shadowbox.options.useSizzle=#{@use_sizzle};>
      File.open(target("shadowbox.js"), 'w') {|f| f.print js.join("\n") }

      # copy all other assets
      FileUtils.cp source("shadowbox.css"), target("shadowbox.css")
      FileUtils.mkdir target("assets")
      Dir[source("assets", "*.png")].each do |file|
        FileUtils.cp file, target("assets")
      end
      if @use_sizzle || @use_swfobject
        FileUtils.mkdir target("libraries")
        FileUtils.cp_r source("libraries", "sizzle"), target("libraries") if @use_sizzle
        FileUtils.cp_r source("libraries", "swfobject"), target("libraries") if @use_swfobject
      end

      FileUtils.cp source("..", "README"), target
      FileUtils.cp source("..", "LICENSE"), target
      File.open(target("BUILD"), 'w') {|f| f.print notice }

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
