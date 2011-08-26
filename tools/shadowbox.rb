module Shadowbox
  autoload :Compiler, "shadowbox/compiler"
  autoload :Target, "shadowbox/target"

  @root_dir = File.expand_path('../..', __FILE__)
  @source_dir = File.join(@root_dir, 'source')
  @examples_dir = File.join(@root_dir, 'examples')
  @build_dir = File.join(@root_dir, 'build')

  # Get the current version of the code from the source.
  @version = File.open(File.join(@source_dir, 'shadowbox.js'), 'r') do |f|
    match = f.read.match(/shadowbox\.version = (['"])([\w.]+)\1/)
    match or raise "Unable to get current Shadowbox version from source"
    match[2]
  end

  class << self
    attr_reader :root_dir, :source_dir, :examples_dir, :build_dir, :version
  end

  def self.compile!(target_dir, options={})
    target = Target.new(target_dir, options[:compress])
    compiler = Compiler.new(options)
    compiler.run!(target)
  end

  class Index
    def initialize(app)
      @app = app
    end

    def call(env)
      env['PATH_INFO'] = '/index.html' if env['PATH_INFO'] == '/'
      @app.call(env)
    end
  end

  def self.examples_app
    require 'rack'

    dirs = [build_dir, examples_dir]
    app = Rack::Cascade.new(dirs.map {|dir| Rack::File.new(dir) })

    Index.new(app)
  end
end
