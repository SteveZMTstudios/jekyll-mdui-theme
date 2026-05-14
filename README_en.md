# Jekyll mdui Theme

[![pages-build-deployment](https://github.com/SteveZMTstudios/jekyll-mdui-theme/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/SteveZMTstudios/jekyll-mdui-theme/actions/workflows/pages/pages-build-deployment)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/SteveZMTstudios/jekyll-mdui-theme?style=flat-square)](https://github.com/SteveZMTstudios/jekyll-mdui-theme/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](/LICENSE)

[简体中文](README.md) | English (US)

A Jekyll theme for GitHub Pages, built on mdui v2 components, supporting `remote_theme` for one-click integration.

*mdui is a modern Material Design component library. This theme is based on mdui v2 Web Components. You can [preview it here](https://stevezmt.top/jekyll-mdui-theme/), or [get started right away](#quick-start-github-pages).*

<img src="thumbnail.png" alt="thumbnail of jekyll-mdui-theme" style="height:192px;width:auto;border-radius:28px;" />

## Quick Start (GitHub Pages)

Add the following to your site's `_config.yml`:

```yml
remote_theme: SteveZMTstudios/jekyll-mdui-theme
plugins:
  - jekyll-remote-theme

title: Your Site Title
description: Your site description

show_downloads: true
theme_color: "#0b57d0"
url: "https://<username>.github.io"
baseurl: "" # leave empty for user/organization pages; for project pages use "/<repo>"
```

If you want to pin a specific version:

```yml
remote_theme: SteveZMTstudios/jekyll-mdui-theme@v1.0.0
```

### About assets (avoiding 404)

The theme's CSS/JS are located in the `assets/` directory of the theme repository.
In `remote_theme` + `jekyll-remote-theme` mode, these assets are used and output by Jekyll during the build phase – you do not need to copy an `assets` folder into your own repository.

If you see a 404, first check:

1. That `_config.yml` contains:
   - `remote_theme: SteveZMTstudios/jekyll-mdui-theme`
   - `plugins: [jekyll-remote-theme]`
2. That `baseurl` matches your deployment path (for project sites it's usually `/<repo>`).
3. That you haven't overridden these files with local ones (e.g., your own `assets/css/style.css`).

Alternatively, start from this template:

<a href="https://github.com/new?template_name=jekyll-mdui-theme&template_owner=SteveZMTstudios">
  <img alt="Use this template" src="https://img.shields.io/badge/Use%20this%20template-2ea44f?style=for-the-badge&logo=github&logoColor=white">
</a>

> [!WARNING]
> If you create a repository directly from this template, please remove example content (e.g., `test.md`, `THEME_SYNTAX.md`) as needed.

## Local preview (for sites using remote_theme)

Make sure your site's `Gemfile` contains:

```ruby
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
gem "jekyll-remote-theme", group: :jekyll_plugins
gem "webrick", "~> 1.8"
```

Then run:

```bash
bundle install
bundle exec jekyll serve
```

Visit: <http://127.0.0.1:4000>

## Theme features

- mdui v2 native components (Top App Bar, Navigation Drawer, List, Button, Fab)
- Material Design 3 style
- Auto-generated table of contents (H1/H2/H3)
- Code block copy button
- Print-optimized styles
- Encrypted documents for authorized access only
- Dynamic color scheme (generates Material colors based on `theme_color`)
- Built-in translation script (write in one language, auto-translate for global users)
- Light / Dark / Auto theme switching
- Responsive design (mobile, tablet, desktop)
- Sidebar article card (title + URL copy, Web Share, QR code)
- GitHub Pages style buttons (View on GitHub / Download .zip / Download .tar.gz)

## Encrypted documents

The theme includes frontend decryption logic, with companion scripts to encrypt or decrypt Markdown before building.

### 1) Declare encryption in Markdown

Add a `password` field to the Front Matter:

```yml
---
title: Page to encrypt
password: "your-password"
password_prompt: "Enter password to decrypt this page" # optional: custom prompt
---
```

> [!WARNING]
> 1. Encryption only protects the Markdown body. Page title, URL, images, and other resources remain visible.
>    If you need to protect images, consider embedding them via DataURL. See also [MDN DataURL](https://developer.mozilla.org/en-US/docs/Web/URI/Schemes/data).
> 2. Recommended password length is at least 20 characters, including uppercase/lowercase letters, numbers, and special characters.
> 3. Keep your password safe; the original content cannot be recovered if lost.

### 2) Run the encryption script

```bash
pip install cryptography
cd path/to/your/site
curl -s https://stevezmt.top/jekyll-mdui-theme/script/encrypt.py | python -
```

Or directly from GitHub:

```bash
curl -s https://raw.githubusercontent.com/SteveZMTstudios/jekyll-mdui-theme/main/script/encrypt.py | python3 -
```

### 3) Revert to plaintext

Use the decryption script to restore the original Markdown body (password required):

```bash
curl -s https://stevezmt.top/jekyll-mdui-theme/script/decrypt.py | python -
```

```bash
curl -s https://raw.githubusercontent.com/SteveZMTstudios/jekyll-mdui-theme/main/script/decrypt.py | python3 -
```

## Configuration options

The mdui theme respects the following variables (set in `_config.yml`):

```yml
title: [Your site title]
description: [Your site description]
```

Additionally, you can set these optional variables:

```yml
repository: [GitHub repository path, e.g., octocat/hello-world]
show_downloads: true  # whether to show download buttons, true or false (no quotes)
theme_color: "#0b57d0"  # theme seed color (Material Design color source)
google_analytics: [Your Google Analytics tracking ID]  # optional

# Optional: append custom buttons under hero-actions
links:
  - name: "Docs"
    url: "https://example.com/docs"
    icon: "description"   # optional, Material Icons name
    variant: "tonal"      # optional: elevated/filled/tonal/outlined/text (flat becomes text)
    _target: "_blank"     # optional, default _self
    rel: "noopener noreferrer" # optional, auto-added when _target=_blank if missing
```

For full configuration options, see [Wiki](https://github.com/SteveZMTstudios/jekyll-mdui-theme/wiki), [THEME_SYNTAX.md](THEME_SYNTAX.md), and [_config.yml](_config.yml).

### Overriding GitHub auto-generated URLs

The template usually relies on URLs provided by GitHub (e.g., links to your repository or download URLs). To override one or more of these URLs:

1. Check the [layout source code](https://github.com/SteveZMTstudios/jekyll-mdui-theme/blob/main/_layouts/default.html) to identify the variable names. They typically look like `{{ site.github.zip_url }}`.
2. In your site's `_config.yml`, specify the URLs you want to use. For example, if the variable is `site.github.zip_url`, add:
    ```yml
    github:
      zip_url: https://example.com/download.zip
      repository_url: https://example.com/your-repo
      tar_url: https://example.com/download.tar.gz
    ```
3. When your site is built, Jekyll will use your specified URLs instead of GitHub's defaults.

*Note: You must omit the `site.` prefix, and each variable name (under `github:`) should be indented with two spaces.*

### Custom CSS styles

To add your own custom styles:

1. Create a file in your site: `/assets/css/style.scss`
2. Add the following to the very top of the file, **exactly as shown**:
    ```scss
    ---
    ---

    @import "{{ site.theme }}";
    ```
3. Add any custom CSS (or Sass, including imports) immediately after the `@import` line.

*Note: If you want to change the theme's Sass variables, set the new values **before** the `@import` line in your stylesheet.*

### Overriding layouts

To change the theme's HTML layout:

#### Small changes

1. You can add custom files in your local `_includes` folder.
2. The theme's [default includes](https://github.com/SteveZMTstudios/jekyll-mdui-theme/tree/main/_includes) are a good starting point and are included by the [original layout template](https://github.com/SteveZMTstudios/jekyll-mdui-theme/blob/main/_layouts/default.html).

For example, to add custom Google Analytics:

1. Paste the latest Analytics code you obtained from Google into `_includes/head-custom-google-analytics.html`.
2. The theme will automatically include that file.

#### Major changes

0. Read the [Wiki](https://github.com/SteveZMTstudios/jekyll-mdui-theme/wiki) to confirm that the part you want to change cannot be achieved via parameters or includes.
1. [Copy the original template](https://github.com/SteveZMTstudios/jekyll-mdui-theme/blob/main/_layouts/default.html)
   (*Protip: click "raw" to copy more easily*)
2. Create a file in your site: `/_layouts/default.html`
3. Paste the copied layout content into it
4. Customize the layout as you wish

## Theme structure and compatibility

This repository follows the common structure of GitHub Pages themes. It can be used as a `remote_theme` remote theme and also has the directory layout of a standard Jekyll theme gem:

- `_layouts/default.html` - Main layout template
- `_includes/head-custom.html` - Customizable head entry point that can be overridden in your site
- `assets/css/*` and `assets/js/*` - Stylesheets and scripts
- `lib/jekyll-mdui-theme.rb` - Theme Ruby entry point
- `lib/jekyll-mdui-theme/version.rb` - Version definition
- `jekyll-mdui-theme.gemspec` - Gem specification file

### Browser compatibility strategy

- **Modern browsers**: Full mdui Web Components experience
- **IE11 and contemporaries**: Automatically enables a compatible reading mode, ensuring basic layout, link accessibility, image rendering, dark/light switching, and code copy functionality are available
- **IE6/older browsers and JavaScript-disabled scenarios**: Ensures page readability, image rendering, and hyperlink accessibility, but does not guarantee the full reading experience.

## Local development

To preview the theme locally (e.g., when proposing changes):

1. Clone this theme repository: `git clone https://github.com/SteveZMTstudios/jekyll-mdui-theme`
2. Enter the repository directory: `cd jekyll-mdui-theme`
3. Run `bundle install` to install necessary dependencies
4. Run `bundle exec jekyll serve` to start the preview server
5. Visit [`localhost:4000`](http://localhost:4000) in your browser to preview the theme

### Running tests

The theme includes a minimal test suite to ensure sites using the theme can build successfully:

```bash
bundle exec jekyll build
```

## Contributing

Interested in improving the mdui theme? We’d love your help. The mdui theme is an open source project, built one feature at a time by users like you.

If you find a bug or have a feature suggestion:

- Please open an issue on [GitHub Issues](https://github.com/SteveZMTstudios/jekyll-mdui-theme/issues)
- Pull requests are welcome

## License

[MIT License](LICENSE)