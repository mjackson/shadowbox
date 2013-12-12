require 'shadowbox'

module Shadowbox
  # Outputs all files to stdout.
  class Target

    def write(file_name, contents)
      puts "#{file_name}: #{contents}"
    end

    def finish!; end

  end
end
