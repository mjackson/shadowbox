require 'rake/clean'
require 'yaml'
require 'tools/shadowbox'

def source_version
  Shadowbox.current_version
end

def package(ext)
  "shadowbox-" + source_version + ext
end

def build_config
  'tools/build.conf'
end

task :default => [:build]

desc "Create a custom build directory based on settings in #{build_config}."
task :build do
  fail "Cannot find build configuration file #{build_config}" unless File.exist?(build_config)
  params = YAML.load_file(build_config)

  builder = Shadowbox::Builder.new
  builder.target = 'build'
  builder.overwrite = true
  %w{adapter language players use_sizzle compress}.each do |c|
    builder.send("#{c}=", params[c]) if params.has_key?(c)
  end

  fail builder.errors.join("\n") unless builder.run
  puts "Complete!"
end

CLEAN.include 'build'

desc "Build packages."
task :package => %w{.tar.gz .zip}.map {|ext| package(ext) }

directory 'pkg'
CLOBBER.include 'pkg'

file package('.tar.gz') => 'pkg' do |f|
  sh "git archive --prefix=shadowbox-#{source_version}/ --format=tar HEAD | gzip > pkg/#{f.name}"
end

file package('.zip') => 'pkg' do |f|
  sh "git archive --prefix=shadowbox-#{source_version}/ --format=zip HEAD > pkg/#{f.name}"
end
