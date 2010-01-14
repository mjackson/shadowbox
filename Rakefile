require 'yaml'
require File.dirname(__FILE__) + '/tools/shadowbox'

def use_params(params_file)
  fail "Unable to find configuration file #{params_file}" unless File.exist?(params_file)
  $PARAMS = YAML.load_file(params_file)
end

def version
  Shadowbox.current_version
end

def source(*args)
  File.join(Shadowbox.source_dir, *args)
end

def build(*args)
  File.join($PARAMS["target"], *args)
end

# run the build task with params from the given file, then revert params
def sub_build(params_file)
  params = $PARAMS
  use_params(params_file)
  Rake::Task[:build].invoke
  $PARAMS = params
end

$CONFIG = ENV['CONFIG'] || "build.yml"

use_params($CONFIG)

# set up default parameters
$PARAMS["target"] ||= "build"
$PARAMS["adapter"] = Shadowbox.default_adapter unless $PARAMS["adapter"] && Shadowbox.valid_adapter?($PARAMS["adapter"])
$PARAMS["language"] = Shadowbox.default_language unless $PARAMS["language"] && Shadowbox.valid_language?($PARAMS["language"])
if $PARAMS["players"]
  $PARAMS["players"] = $PARAMS["players"].select {|player| Shadowbox.valid_player?(player) }
else
  $PARAMS["players"] = Shadowbox.default_players
end
$PARAMS["css_support"] = true unless $PARAMS.has_key?("css_support")
$PARAMS["compress"] = true unless $PARAMS.has_key?("compress")

task :default => [:build]

desc "Create a custom build based on settings in #{$CONFIG}"
task :build do |t|
  mkdir_p $PARAMS["target"]

  files = []
  files << "intro"
  files << "util"
  files << File.join("adapters", $PARAMS["adapter"])
  files << "core"
  files << "plugins"
  files << "cache"
  files << "find" if $PARAMS["css_support"]
  files << "flash" unless ($PARAMS["players"] & ["swf", "flv"]).empty?
  files << File.join("languages", $PARAMS["language"])
  $PARAMS["players"].each do |player|
    files << File.join("players", player) if Shadowbox.valid_player?(player)
  end
  files << "skin"
  files << "outro"

  File.open(build("shadowbox.js"), 'w') do |f|
    files.each do |file|
      js = File.read(source(file) + ".js")
      js.gsub!('@VERSION', version).gsub!('@DATE', "Date: " + Time.now.inspect) if file == "intro"
      f << js + "\n"
    end
  end

  resources = Dir[source('resources/*.png')].map {|file| File.basename(file) }
  resources << 'shadowbox.css'
  resources << 'player.swf' if $PARAMS['players'].include?('flv')
  resources << 'expressInstall.swf' unless ($PARAMS["players"] & ["swf", "flv"]).empty?
  resources.each do |resource|
    cp source('resources', resource), build(resource)
  end

  cp File.dirname(__FILE__) + '/README', build('README')
  cp File.dirname(__FILE__) + '/LICENSE', build('LICENSE')

  if $PARAMS["compress"]
    js = build('shadowbox.js')
    Shadowbox.compress(js, js)
    css = build('shadowbox.css')
    Shadowbox.compress(css, css)
  end

  # this task may be run several times in one invocation
  Rake::Task[t.name].reenable
end

namespace :build do
  desc "Create a build for running the examples"
  task :examples do
    sub_build(File.dirname(__FILE__) + '/examples/build.yml')
  end

  desc "Create a build for running the tests"
  task :tests do
    sub_build(File.dirname(__FILE__) + '/tests/build.yml')
  end
end

desc "Clean up all temporary files"
task :clean do
  files = [
    $PARAMS['target'],
    File.dirname(__FILE__) + '/examples/build',
    File.dirname(__FILE__) + '/tests/build'
  ]

  files.each do |file|
    rm_rf file if File.exist?(file)
  end
end
