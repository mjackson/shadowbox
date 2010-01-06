require 'rake/clean'
require 'yaml'
require 'tools/shadowbox'

def source_version; Shadowbox.current_version end
def package(ext); "shadowbox-" + source_version + ext end
def build_config; 'tools/build.yml' end
def build_target; 'build' end

task :default => [:build]

desc "Create a custom build directory based on settings in #{build_config}."
task :build do
  fail "Cannot find build configuration file #{build_config}" unless File.exist?(build_config)
  params = YAML.load_file(build_config)

  builder = Shadowbox::Builder.new
  builder.target = build_target
  builder.overwrite = true
  params.each do |key, value|
    writer = key + '='
    builder.send(writer, value) if builder.respond_to?(writer)
  end

  fail builder.errors.join("\n") unless builder.run

  if params['compress']
    js = File.join(builder.target, 'shadowbox.js')
    Shadowbox.compress(js, js)
    css = File.join(builder.target, 'shadowbox.css')
    Shadowbox.compress(css, css)
  end

  puts "Complete!"
end

CLEAN.include build_target

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
