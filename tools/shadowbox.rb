module Shadowbox
  @source_dir = File.dirname(__FILE__) + '/../source'

  # get the current version of the code from the source
  @current_version = File.open(@source_dir + '/shadowbox.js') do |f|
    f.read.match(/version: ['"]([\w.]+)['"]/)[1]
  end

  %w{adapters players languages}.each do |p|
    valid = Dir.glob(@source_dir + "/#{p}/*.js").map do |f|
      f.match(/shadowbox-(.+?)\.js/)[1]
    end
    instance_variable_set("@valid_#{p}".to_sym, valid)
  end

  class << self
    attr_reader :source_dir, :current_version, :valid_adapters, :valid_players, :valid_languages

    def valid_adapter?(adapter)
      @valid_adapters.include?(adapter)
    end

    def valid_player?(player)
      @valid_players.include?(player)
    end

    def valid_language?(language)
      @valid_languages.include?(language)
    end
  end
end

require 'fileutils'
require 'md5'
require 'optparse'
require File.dirname(__FILE__)

module Shadowbox
  class Builder
    attr_reader :argv, :errors, :version, :adapter, :compress, :format, :language, :output, :players
    attr_reader :sizzle, :swfobject

    def initialize(argv)
      @argv = argv
      @errors = []
      @version = Shadowbox.current_version
      @adapter    = 'base'
      @compress   = false
      @format     = 'zip'
      @language   = 'en'
      @output     = 'tmp'
      @players    = ['img']
      @sizzle     = false
      @swfobject  = false
      parse!
    end

    def hash
      uniq = [compress, language, adapter, players, sizzle].flatten
      MD5.new(uniq.to_s).to_s
    end

    def name
      "shadowbox-custom-#{version}"
    end

    def path
      File.join(output, hash)
    end

    def filename
      name + '.' + format
    end

    def filepath
      File.join(path, filename)
    end

    def parser
      @parser ||= OptionParser.new do |opts|
        opts.banner = "Usage: #{$PROGRAM_NAME} [options]"
        opts.separator ""

        opts.on("-aADAPTER", "--adapter=ADAPTER", %{The adapter to use, defaults to "#{@adapter}"}) {|adapter| @adapter = adapter }
        opts.on("-c", "--compress", %{Compress the code}) { @compress = true }
        opts.on("-fFORMAT", "--format=FORMAT", %{The format to use for compression, defaults to "#{@format}"}) {|format| @format = format }
        opts.on("-lLANGUAGE", "--language=LANGUAGE", %{The language to use, defaults to "#{@language}"}) {|language| @language = language }
        opts.on("-oOUTPUT", "--output-dir=OUTPUT", %{The directory to put the build in, defaults to #{@output}}) {|output| @output = output }
        opts.on("-pPLAYERS", "--players=PLAYERS", %{A comma-separated list of players to include, defaults to "#{@players.join(',')}"}) {|players| @players = players.split(',') }
        opts.on("-s", "--sizzle", "Include CSS selector support using Sizzle.js") { @sizzle = true }

        opts.on_tail("-h", "--help", "Show this message") { puts opts; exit }
      end
    end

    def parse!
      parser.parse! @argv

      @output = File.expand_path(@output)
      @format = 'zip' unless @format == 'tgz'
      @players.uniq!

      # include swfobject if swf or flv players are being used
      @swfobject = players.include?('swf') || players.include?('flv')

      @errors << %{Invalid adapter: #{adapter}} unless Shadowbox.valid_adapter?(adapter)
      @errors << %{Invalid language: #{language}} unless Shadowbox.valid_language?(language)
      invalid_players = players.select {|p| !Shadowbox.valid_player?(p) }
      @errors << %{Invalid player(s): #{invalid_players.join(',')}} if invalid_players.any?
      @errors << %{Invalid output directory} unless File.writable?(output)
    end

    def run
      return if File.exist?(filepath)

      src = compress ? 'build' : 'source'
      out = File.join(path, name)
      FileUtils.mkdir_p "#{out}/libraries"

      # compile all js files into one (including sizzle and swfobject)
      jsfiles = [
        "shadowbox.js",
        "adapters/shadowbox-#{adapter}.js",
        "languages/shadowbox-#{language}.js"
      ] + players.map {|p| "players/shadowbox-#{p}.js" }
      jsfiles << "libraries/sizzle/sizzle.js" if sizzle
      jsfiles << "libraries/swfobject/swfobject.js" if swfobject

      js = jsfiles.map {|f| File.read(File.join(src, f)) }
      js << %<Shadowbox.options.players=["#{players.join('","')}"];>
      js << %<Shadowbox.options.useSizzle=#{sizzle};>
      File.open("#{out}/shadowbox.js", 'w') {|f| f.print js.join("\n") }

      # css and resources
      FileUtils.cp "#{src}/shadowbox.css", "#{out}/"
      FileUtils.cp_r "#{src}/resources", "#{out}/"

      # swfobject/sizzle libraries
      FileUtils.cp_r "#{src}/libraries/swfobject", "#{out}/libraries/" if swfobject
      FileUtils.cp_r "#{src}/libraries/sizzle", "#{out}/libraries/" if sizzle

      # readme, license, and build notice
      FileUtils.cp "#{src}/README", "#{out}/"
      FileUtils.cp "#{src}/LICENSE", "#{out}/"
      File.open("#{out}/BUILD", 'w') {|f| f.print notice }

      # create the archive
      Dir.chdir(path) do
        if format == "zip"
          %x<zip -rq #{name}.zip #{name}>
        else # tgz
          %x<tar czf #{name}.tgz #{name}>
        end
      end

      FileUtils.rm_rf out
    end

    # generates a notice for this specific build
    def notice
      msg = "This is a custom build of Shadowbox version #{version} that contains only a\n" +
            "subset of the features available. It was compiled using the build tool at\n" +
            "<http://shadowbox-js.com/download.html>. This particular build includes support\n" +
            "for the following:\n\n" +
            "adapter:  #{adapter}\n" +
            "language: #{language}\n" +
            "players:  #{players.join(', ')}\n\n"
      msg << "The code was compressed using YUI Compressor <http://developer.yahoo.com/yui/compressor/>.\n" if compress
      msg << "Support for CSS selectors is also included via Sizzle.js <http://sizzlejs.com/>.\n" if sizzle
      msg
    end

    def errors!
      abort(@errors.join("\n")) if @errors.any?
    end

    def run!
      errors!
      run
      errors!
    end
  end
end
