# frozen_string_literal: true

require_relative "lib/jekyll-mdui-theme/version"

Gem::Specification.new do |spec|
  spec.name          = "jekyll-mdui-theme"
  spec.version       = JekyllThemeMdui::VERSION
  spec.authors       = ["SteveZMTstudios"]
  spec.email         = ["me@stevezmt.top"]

  spec.summary       = "A Material Design Jekyll theme built with mdui v2."
  spec.homepage      = "https://github.com/SteveZMTstudios/jekyll-mdui-theme"
  spec.license       = "MIT"

  spec.files = Dir.chdir(__dir__) do
    `git ls-files -z`.split("\x0").select do |file|
      file.start_with?("_layouts/", "_includes/", "assets/", "lib/") ||
        file == "LICENSE" ||
        file == "README.md" ||
        file.end_with?(".gemspec")
    end
  end

  spec.required_ruby_version = ">= 2.7.0"

  spec.add_runtime_dependency "jekyll", ">= 3.9", "< 5.0"
end
