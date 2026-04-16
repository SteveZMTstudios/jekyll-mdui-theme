# Jekyll mdui Theme

一个面向 GitHub Pages 的 Jekyll 单页文档主题，基于 mdui v2 组件实现。

## 功能

- mdui v2 原生组件布局（Top App Bar、Navigation Drawer、List、Button、Fab）
- 自动生成文章目录（H1/H2/H3）
- 代码块复制按钮
- 动态配色（基于 `theme_color` 生成 Material 配色）
- 亮色 / 暗色 / 自动主题切换
- 侧边栏文章分享卡片（标题 + URL 复制、Web Share、二维码）
- GitHub Pages 风格按钮（View on GitHub / Download .zip / Download .tar.gz）

## 本地预览

1. 安装依赖：

```bash
bundle install
```

2. 启动本地服务：

```bash
bundle exec jekyll serve
```

3. 访问：

```text
http://127.0.0.1:4000
```

## 配置

编辑 [_config.yml](_config.yml)：

```yml
title: Your Site Title
description: Your site description
repository: octocat/hello-world
show_downloads: true
theme_color: "#0b57d0"
url: "https://<username>.github.io"
baseurl: "" # 用户主页仓库留空；项目仓库填 "/<repo>"
```

### 关键项说明

- `repository`：用于生成 hero 区域仓库名、GitHub 按钮和下载链接
- `show_downloads`：`true` 或未定义时显示三枚按钮，`false` 时隐藏
- `theme_color`：动态配色种子色
- `url` + `baseurl`：控制站点绝对链接和资源路径

## 部署到 GitHub Pages

### 方式一：从分支直接发布（简单）

1. 将本仓库内容推送到你的 GitHub 仓库。
2. 进入仓库 Settings -> Pages。
3. 在 Build and deployment 中选择 Deploy from a branch。
4. Source 选择 `main` 分支（`/(root)`）。
5. 等待构建完成后访问站点。

### 方式二：GitHub Actions 发布（推荐）

1. 在仓库 Settings -> Pages 中将 Source 切换到 GitHub Actions。
2. 添加 Jekyll Pages 官方工作流（`jekyll.yml`）。
3. 推送后由 Actions 自动构建和部署。

## 用户主页仓库与项目仓库

- 用户主页仓库：`<username>.github.io`
  - `url`: `https://<username>.github.io`
  - `baseurl`: `""`
- 项目仓库：`<repo>`
  - `url`: `https://<username>.github.io`
  - `baseurl`: `"/<repo>"`

## 可选：覆盖 GitHub 自动变量

主题会优先使用 GitHub Pages 注入的 `site.github.*` 变量（例如 `site.github.repository_url`、`site.github.zip_url`）。

如果你想自定义这些地址，可在 `_config.yml` 添加：

```yml
github:
  repository_url: https://example.com/your-repo
  zip_url: https://example.com/download.zip
  tar_url: https://example.com/download.tar.gz
```

## 许可证

MIT