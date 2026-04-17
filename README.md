# Jekyll mdui Theme

一个面向 GitHub Pages 的 Jekyll 单页文档主题，基于 mdui v2 组件实现。

你可以[在此预览其效果](https://stevezmt.top/jekyll-mdui-theme/)，或[立刻使用](#部署到-github-pages)。


## 功能

- mdui v2 原生组件布局（Top App Bar、Navigation Drawer、List、Button、Fab）
- Material Design 3 风格
- 自动生成文章目录（H1/H2/H3）
- 代码块复制按钮
- 预取
- 动态配色（基于 `theme_color` 生成 Material 配色）
- 亮色 / 暗色 / 自动主题切换
- 多页面流畅切换
- 响应式设计（适配手机、平板、桌面）
- 侧边栏文章卡片（标题 + URL 复制、Web Share、二维码）
- GitHub Pages 按钮（View on GitHub / Download .zip / Download .tar.gz）
- 旧浏览器兼容模式（IE11 等）：基础布局、链接可达、图片渲染、深浅色切换、代码复制

## 浏览器兼容策略

- 新式与主流浏览器：保持现有完整体验（mdui 组件、目录、分享、二维码、动画等）。
- IE11 及同代旧浏览器：自动进入兼容阅读模式，保证基础布局、超链接可达、图片渲染、深浅色切换和代码复制。
- IE6、noscript 及更旧环境：保证页面可读、图片可渲染、超链接可访问。
- 在兼容阅读模式/禁用 JavaScript 场景下，会自动隐藏依赖 JS 与 Web Components 的功能（如 App Bar、侧边栏抽屉、语言选单、二维码弹窗等）。
- 当 JavaScript 被禁用时，页面始终使用浅色模式。

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

4. 构建：

```bash
bundle exec jekyll build
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

<a href="https://github.com/new?template_name=jekyll-mdui-theme&template_owner=SteveZMTstudios">
  <img alt="Use this template" src="https://img.shields.io/badge/Use%20this%20template-2ea44f?style=for-the-badge&logo=github&logoColor=white">
</a>

点击上方按钮使用此模板创建仓库后，选择以下任一方式部署：

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

[MIT License](LICENSE)