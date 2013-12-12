module Shadowbox

  autoload :Compiler,         'shadowbox/compiler'
  autoload :DirectoryTarget,  'shadowbox/directory_target'
  autoload :Target,           'shadowbox/target'
  autoload :ZipFileTarget,    'shadowbox/zip_file_target'

  @source_dir = File.expand_path('../../source', __FILE__)

  # Get the current version of the code from the source.
  @version = File.open(File.join(@source_dir, 'shadowbox.js'), 'r') do |f|
    match = f.read.match(/shadowbox\.version = (['"])([\w.]+)\1/)
    match or raise "Unable to get current Shadowbox version from source"
    match[2]
  end

  class << self
    attr_reader :source_dir, :version
  end

  def self.compile!(output_file, options={})
    compiler = Compiler.new(options)
    target_class = /\.zip$/ === output_file ? ZipFileTarget : DirectoryTarget
    target = target_class.new(output_file)
    compiler.flush!(target, options[:compress])
    target.finish!
  end

end
