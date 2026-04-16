# Jekyll Theme Syntax Quick Notes

This repository is configured as a minimal single-page markdown theme for GitHub Pages.

## 1) Core files Jekyll expects

- `_config.yml`: site config, markdown engine, defaults, permalink.
- `_layouts/default.html`: page skeleton. `{{ content }}` is required.
- `assets/css/style.css`: theme style.
- `assets/js/theme.js`: interactive behavior.

## 2) Front matter

A markdown file is rendered by Jekyll when it has front matter:

```yaml
---
layout: default
title: My Page
permalink: /my-page.html
---
```

Without front matter, markdown files are copied as static files.

## 3) Templating syntax (Liquid)

- Output variable: `{{ site.title }}`, `{{ page.title }}`
- Filter: `{{ '/assets/css/style.css' | relative_url }}`
- Logic:

```liquid
{% if page.title %}
  {{ page.title }}
{% endif %}
```

- Include markdown and render:

```liquid
{% capture raw_md %}
{% include_relative test.md %}
{% endcapture %}

{{ raw_md | markdownify }}
```

## 4) Markdown + highlight

In `_config.yml`:

```yaml
markdown: kramdown
highlighter: rouge
kramdown:
  input: GFM
  syntax_highlighter: rouge
```

Then fenced code blocks in markdown are highlighted automatically.

## 5) GitHub Pages compatible setup

Use `github-pages` gem in `Gemfile` for local parity with GitHub build:

```ruby
gem "github-pages", group: :jekyll_plugins
```

## 6) Local preview

```bash
bundle install
bundle exec jekyll serve
```

Open `http://127.0.0.1:4000/` and `/test-preview.html`.
