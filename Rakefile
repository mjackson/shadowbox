require 'bundler/setup'

tools_path = File.expand_path('../tools', __FILE__)
$LOAD_PATH.unshift(tools_path) unless $LOAD_PATH.include?(tools_path)

require 'shadowbox'

task :default => :build

def output_file
  ENV['FILE'] || "shadowbox-#{Shadowbox.version}.zip"
end

desc %{Create a custom build in $FILE, defaults to "#{output_file}"}
task :build do
  $stdout.write %{Creating build in "#{output_file}" ... }

  # To disable compression or similar use e.g. COMPRESS=0.
  Shadowbox.compile! output_file, \
    :compress => ENV['COMPRESS'] != '0',
    :support_flash => ENV['SUPPORT_FLASH'] != '0',
    :support_video => ENV['SUPPORT_VIDEO'] != '0'

  $stdout.puts "Done!"
end

desc "Remove all auto-generated files"
task :clean do
  sh 'rm -f shadowbox-*.zip'
end
