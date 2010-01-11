module Shadowbox
  @source_dir = File.expand_path(File.dirname(__FILE__) + '/../source')

  # get the current version of the code from the source
  @current_version = File.open(@source_dir + '/core.js') do |f|
    f.read.match(/version: ['"]([\w.]+)['"]/)[1]
  end

  %w{adapters languages players}.each do |dir|
    available = Dir.glob(@source_dir + "/#{dir}/*.js").map do |file|
      File.basename(file, ".js")
    end
    instance_variable_set("@available_#{dir}".to_sym, available)
  end

  @default_adapter = "base"
  @default_language = "en"
  @default_players = @available_players.dup

  @compiler = File.join(File.dirname(__FILE__), 'compiler-20091217.jar')

  class << self
    attr_reader :source_dir, :current_version
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
                 %x<java -jar #{@compiler} --js #{file}>
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
end
