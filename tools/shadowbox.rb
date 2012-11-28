require 'rack'

module Shadowbox

  autoload :Compiler,         'shadowbox/compiler'
  autoload :DirectoryTarget,  'shadowbox/directory_target'
  autoload :Target,           'shadowbox/target'
  autoload :ZipFileTarget,    'shadowbox/zip_file_target'

  @root_dir = File.expand_path('../..', __FILE__)
  @source_dir = File.join(@root_dir, 'source')
  @examples_dir = File.join(@root_dir, 'examples')

  # Get the current version of the code from the source.
  @version = File.open(File.join(@source_dir, 'shadowbox.js'), 'r') do |f|
    match = f.read.match(/shadowbox\.version = (['"])([\w.]+)\1/)
    match or raise "Unable to get current Shadowbox version from source"
    match[2]
  end

  class << self
    attr_reader :root_dir, :source_dir, :examples_dir, :version
  end

  def self.compile!(output_file, options={})
    compiler = Compiler.new(options)
    target_class = /\.zip$/ === output_file ? ZipFileTarget : DirectoryTarget
    target = target_class.new(output_file)
    target.flush!(compiler, options[:compress])
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
    Index.new(Rack::File.new(examples_dir))
  end

end
