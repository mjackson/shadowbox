begin
  require 'bundler/setup'
  require 'thin'
rescue LoadError => e
  puts "You do not have the required RubyGems installed."
  puts "Try `gem install bundler && bundle install`"
  exit
end

tools = File.expand_path("../tools", __FILE__)
$LOAD_PATH.unshift(tools) unless $LOAD_PATH.include?(tools)

require 'shadowbox'

def target_dir
  ENV['TARGET'] || 'build'
end

def default_port
  (ENV['PORT'] || 3000).to_i
end

task :default => :build

desc %{Create a custom build in $TARGET, defaults to "#{target_dir}"}
task :build do
  $stdout.write %{Creating build in "#{target_dir}" ... }

  # To disable compression or similar use e.g. COMPRESS=0.
  Shadowbox.compile! target_dir, \
    :compress => ENV['COMPRESS'] != '0',
    :support_flash => ENV['FLASH'] != '0',
    :support_video => ENV['VIDEO'] != '0',
    :combine_files => ENV['COMBINE'] != '0'

  $stdout.puts "Done!"
end

desc "Serve examples over HTTP on $PORT, defaults to #{default_port}"
task :serve do
  require 'rack'
  app = Rack::CommonLogger.new(Shadowbox.examples_app)
  Rack::Handler::Thin.run(app, :Port => default_port)
end
