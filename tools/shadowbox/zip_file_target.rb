require 'zip/zip'
require 'shadowbox'

module Shadowbox
  # Outputs all files to a zip archive.
  class ZipFileTarget < Target

    def initialize(output_file)
      @output_file = output_file
      @zip_file = Zip::ZipFile.open(output_file, Zip::ZipFile::CREATE)
    end

    attr_reader :output_file

    def flush!(compiler, compress=false)
      super
      @zip_file.close
    end

    def write(file, contents)
      @zip_file.get_output_stream(file) do |io|
        io.puts(contents)
      end
    end

  end
end
