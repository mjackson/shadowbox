def compress_js(input_path, output_path)
  Dir.chdir(File.dirname(__FILE__)) do
    compressor = File.join('libraries', 'yuicompressor', 'yuicompressor-2.4.2.jar')
    `java -jar #{compressor} #{input_path} -o #{output_path}`
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

desc %{Creates a build directory with compressed versions of the code}
task :build do
  require 'pathname'

  chdir(File.dirname(__FILE__)) do
    build_dir = Pathname.new('../build').expand_path
    build_dir.mkpath unless build_dir.exist?

    # compile source files to build directory
    Pathname.glob('**/*').each do |path|
      next unless path.file?

      # exclude Rakefile, PSD's, mediaplayer, and yuicompressor
      next if path.to_s =~ /(yuicompressor|mediaplayer|(rakefile|\.psd)$)/i

      build_file = Pathname.new build_dir.to_s + '/' + path.to_s

      unless build_file.exist?
        dir = build_file.dirname
        dir.mkpath unless dir.exist?
      else
        next unless build_file.mtime < path.mtime
      end

      if path.to_s =~ /\.js$/
        puts "compress #{path} #{build_file}"
        compress_js(path.to_s, build_file)
      elsif path.to_s =~ /\.css$/
        puts "compress #{path} #{build_file}"
        compress_css(path.to_s, build_file)
      else
        cp path.to_s, build_file.to_s
      end
    end
  end

  Rake::Task[:prune].invoke

  puts "Done!"
end

desc %{Prunes the build directory of any files that were removed from source since the last build}
task :prune do
  chdir(File.dirname(__FILE__)) do
    src_files = Dir['**/*']
    bld_dir = File.expand_path('../build')

    Dir[bld_dir + '/**/*'].each do |path|
      unless src_files.include?(path[(bld_dir.size + 1)..path.size])
        if File.directory?(path)
          sh %<rm -rf #{path}>
        else
          sh %<rm #{path}>
        end
      end
    end
  end
end

