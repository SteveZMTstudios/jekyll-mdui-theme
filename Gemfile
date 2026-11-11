source "https://rubygems.org"

gemspec

# ---------------------------------------------------------------------------
# 本地开发 / 构建依赖
#
# 这里刻意不再引入 github-pages。它会锁定一整套历史依赖：
#   - 旧版 github-pages（如 232）-> jekyll-remote-theme 0.4.3 ->
#     `rubyzip >= 1.3.0, < 3.0`，于是 rubyzip 被卡在 2.4.1，
#     即 CVE-2026-85396（High，路径穿越，修复版本 >= 3.4.0），无法通过
#     升级其他依赖绕过。
#   - Jekyll 3.10 / Rouge 3.x / Ruby Sass 3.7（已 EOL，不再收安全修复）。
#
# 注意本仓库是"主题仓库"，不是"使用主题的站点仓库"：
#   - 本仓库 _config.yml 用 theme: null，没有 remote_theme，因此本地构建
#     不需要 jekyll-remote-theme 插件（它只对消费者站点有意义）。
#   - 主题以 remote_theme 分发时，托管构建用的是 GitHub 侧的插件版本，
#     本仓库升级 Jekyll 不会改变使用者的构建结果。
#
# 需要做环境对照验证时，请使用 gemfiles/ 下的独立环境：
#   - gemfiles/github_pages.gemfile   复刻 GitHub Pages 托管构建
#   - gemfiles/remote_theme.gemfile   验证 remote_theme 消费路径
# ---------------------------------------------------------------------------

# 显式声明意向版本（gemspec 中保留 >= 3.9 以兼容 Jekyll 3 的只读消费场景）
gem "jekyll", "~> 4.4"

# Ruby >= 3.0 起 WEBrick 不再随标准库分发，jekyll serve 需要显式引入
gem "webrick", "~> 1.9"

group :jekyll_plugins do
  # 提供 site.github.*，布局用它生成 View on GitHub / 下载按钮
  gem "jekyll-github-metadata", "~> 2.16"
end

# jekyll-github-metadata -> octokit 使用 faraday 的重试中间件；Faraday 2.x 起
# 该中间件被拆成独立 gem，缺了它构建时会打印 "install faraday-retry" 提示。
gem "faraday-retry", "~> 2.2"

# ---------------------------------------------------------------------------
# 安全下限：只抬高"本来就存在于依赖图里"的传递依赖的最低版本，取值来自
# ruby-advisory-db 的 patched_versions。升级依赖后请复核，避免下限被回退：
#   bundle exec bundle-audit check --update
# ---------------------------------------------------------------------------
gem "addressable", ">= 2.9.1"      # GHSA-4w5q-wg7v-w6gp 等 7 项（Jekyll / octokit 传递依赖）
gem "concurrent-ruby", ">= 1.3.7"  # CVE-2026-54904 / 54905 / 54906（i18n 传递依赖）
gem "json", ">= 2.21.2"            # CVE-2026-71847（Jekyll 传递依赖）

group :development do
  # 依赖漏洞自检：bundle exec bundle-audit check --update
  gem "bundler-audit", "~> 0.9", require: false
end

