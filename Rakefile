begin
  require 'bundler/setup'
  require 'rack'
  require 'thin'
rescue LoadError => e
  puts "You do not have the required RubyGems installed."
  puts "Try `gem install bundler && bundle install`"
  exit
end

tools = File.expand_path("../tools", __FILE__)
$LOAD_PATH.unshift(tools) unless $LOAD_PATH.include?(tools)

require 'shadowbox'

def output_file
  ENV['FILE'] || "shadowbox-#{Shadowbox.version}.zip"
end

def default_port
  (ENV['PORT'] || 3000).to_i
end

task :default => :build

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

desc "Serve examples over HTTP on $PORT, defaults to #{default_port}"
task :examples do
  # Create versions of assets that we can use to run the examples.
  Shadowbox.compile! Shadowbox.examples_dir, \
    :compress => false,
    :support_flash => true,
    :support_video => true

  app = Rack::CommonLogger.new(Shadowbox.examples_app)
  Rack::Handler::Thin.run(app, :Port => default_port)
end

desc "Remove all auto-generated files"
task :clean do
  sh 'rm -f shadowbox-*.zip'
  rm_f 'examples/shadowbox.js'
  rm_f 'examples/shadowbox.css'
  rm_f 'examples/shadowbox-icons.png'
  rm_f 'examples/shadowbox-controls.png'
end
