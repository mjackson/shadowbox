require 'fileutils'
require 'shadowbox'

module Shadowbox
  # Outputs all files to a given directory.
  class DirectoryTarget < Target

    include FileUtils

    def initialize(output_dir)
      @output_dir = output_dir
    end

    attr_reader :output_dir

    def write(file_name, contents)
      dest_file = File.join(output_dir, file_name)
      dest_dir = File.dirname(dest_file)
      mkdir_p(dest_dir) unless File.directory?(dest_dir)
      File.open(dest_file, 'w') do |f|
        f.write(contents)
      end
    end

  end
end
