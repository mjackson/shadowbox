require 'yaml'
require File.expand_path('../tools/shadowbox', __FILE__)

def get_config(file)
  fail "Unable to find configuration file #{file}" unless File.exist?(file)
  YAML.load_file(file)
end

def run_builder(config)
  target_dir = config.delete('target') || 'build'
  mkdir_p(target_dir)
  target = Shadowbox::Target.new(target_dir)

  Shadowbox::Builder.new(config).run!(target)
end

def builder_config
  get_config(ENV['CONFIG'] || 'build.yml')
end

def examples_builder_config
  get_config File.join(File.dirname(__FILE__), 'examples', 'build.yml')
end

def tests_builder_config
  get_config File.join(File.dirname(__FILE__), 'tests', 'build.yml')
end

task :default => :build

desc 'Create a custom build based on settings in build.yml (or $CONFIG)'
task :build do
  run_builder(builder_config)
end

namespace :build do
  desc 'Create a build for running the examples'
  task :examples do
    run_builder(examples_builder_config)
  end

  desc 'Create a build for running the tests'
  task :tests do
    run_builder(tests_builder_config)
  end
end

desc 'Clean up all temporary files'
task :clean do
  configs = [ builder_config, examples_builder_config, tests_builder_config ]
  configs.each do |config|
    target = config.key?('target') && config['target']
    rm_rf(target) if File.exist?(target)
  end
end
