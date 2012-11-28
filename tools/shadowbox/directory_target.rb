require 'fileutils'
require 'shadowbox'

module Shadowbox
  # Outputs all files to a given directory.
  class DirectoryTarget < Target

    def initialize(output_dir)
      @output_dir = output_dir
    end

    attr_reader :output_dir

    include FileUtils

    def write(file, contents)
      dest_file = File.join(output_dir, file)
      dest_dir = File.dirname(dest_file)
      mkdir_p(dest_dir) unless File.directory?(dest_dir)
      File.open(dest_file, 'w') do |f|
        f.write(contents)
      end
    end

  end
end
