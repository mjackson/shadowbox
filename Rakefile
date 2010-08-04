require 'yaml'
require File.expand_path('../tools/shadowbox', __FILE__)

def builder(file=nil)
  file = (ENV['CONFIG'] || 'build.yml') unless file
  fail "Unable to find configuration file #{file}" unless File.exist?(file)
  Shadowbox::Builder.new(YAML.load_file(file))
end

def examples_builder
  builder File.join(File.dirname(__FILE__), 'examples', 'build.yml')
end

def tests_builder
  builder File.join(File.dirname(__FILE__), 'tests', 'build.yml')
end

task :default => :build

desc 'Create a custom build based on settings in build.yml (or $CONFIG)'
task :build do
  builder.run!
end

namespace :build do
  desc 'Create a build for running the examples'
  task :examples do
    examples_builder.run!
  end

  desc 'Create a build for running the tests'
  task :tests do
    tests_builder.run!
  end
end

desc 'Clean up all temporary files'
task :clean do
  files = [ builder.target, examples_builder.target, tests_builder.target ]
  files.each do |file|
    rm_rf file if File.exist?(file)
  end
end
