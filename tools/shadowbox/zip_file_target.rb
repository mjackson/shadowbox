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

    def write(file_name, contents)
      @zip_file.get_output_stream(file_name) do |io|
        io.puts(contents)
      end
    end

    def finish!
      @zip_file.close
    end

  end
end
