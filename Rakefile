require 'fileutils'

def compress_js(input_path, output_path)
  Dir.chdir(File.dirname(__FILE__)) do
    compressor = File.join('tools', 'yuicompressor', 'yuicompressor-2.4.2.jar')
    %x<java -jar #{compressor} #{input_path} -o #{output_path}>
  end
end

def compress_css(input_path, output_path)
  css = File.read(input_path)
  css.gsub!(/\/\*.*?\*\//m, '')
  css.gsub!(/^\s+/, '')
  css.gsub!(/(,|:)\s+/, '\1')
  css.gsub!(/\s+\{/, '{')
  File.open(output_path, 'w') {|file| file.puts css }
end

desc %{Creates compressed versions of the source code in the build directory}
task :build do
  source_dir = File.dirname(__FILE__) + '/source'
  build_dir  = File.dirname(__FILE__) + '/build'

  Dir.glob(source_dir + '/**/*').each do |source_file|
    next if File.directory?(source_file)

    # skip mediaplayer and psd
    next if source_file =~ /(mediaplayer|\.psd$)/i

    build_file = build_dir + source_file[source_dir.size..source_file.size]

    if File.exist?(build_file)
      next unless File.mtime(build_file) < File.mtime(source_file)
    else
      build_file_dir = File.dirname(build_file)
      FileUtils.mkdir_p(build_file_dir) unless File.exist?(build_file_dir)
    end

    if source_file =~ /\.js$/
      puts "compress #{source_file} #{build_file}"
      compress_js(source_file, build_file)
    elsif source_file =~ /\.css$/
      puts "compress #{source_file} #{build_file}"
      compress_css(source_file, build_file)
    else
      cp source_file, build_file
    end
  end

  Rake::Task[:prune].invoke

  puts "Done!"
end

desc %{Prunes the build directory of any files that were removed from source since the last build}
task :prune do
  source_dir = File.dirname(__FILE__) + '/source'
  build_dir  = File.dirname(__FILE__) + '/build'
  source_files = Dir.glob(source_dir + '/**/*')

  Dir.glob(build_dir + '/**/*').each do |build_file|
    next unless File.exist?(build_file)
    source_file = source_dir + build_file[build_dir.size..build_file.size]
    unless source_files.include?(source_file)
      if File.directory?(build_file)
        FileUtils.rm_rf(build_file)
      else
        FileUtils.rm_f(build_file)
      end
    end
  end
end

