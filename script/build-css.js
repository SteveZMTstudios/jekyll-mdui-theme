const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const postcssPresetEnv = require('postcss-preset-env');
const esbuild = require('esbuild');

const CSS_DIR = path.join(__dirname, '..', 'assets', 'css');

async function buildCSS() {
  console.log('[Build CSS] Compiling modern and legacy CSS assets...');

  // 1. Modern style.src.css -> style.css & style.min.css (Preserve 100% original modern layout)
  const styleSrcPath = path.join(CSS_DIR, 'style.src.css');
  const styleOutPath = path.join(CSS_DIR, 'style.css');
  const styleMinPath = path.join(CSS_DIR, 'style.min.css');

  if (fs.existsSync(styleSrcPath)) {
    const cssContent = fs.readFileSync(styleSrcPath, 'utf-8');
    fs.writeFileSync(styleOutPath, cssContent, 'utf-8');
    console.log(`[Build CSS] Copied style.src.css -> style.css`);

    const minified = esbuild.transformSync(cssContent, { loader: 'css', minify: true });
    fs.writeFileSync(styleMinPath, minified.code, 'utf-8');
    console.log(`[Build CSS] Minified style.css -> style.min.css`);
  }

  // 2. Legacy CSS processor for IE9, Safari 5, iOS 5, Android 4.0
  const legacyProcessor = postcss([
    postcssPresetEnv({
      browsers: [
        'safari >= 5',
        'iOS >= 5',
        'Android >= 4.0',
        'ie >= 9'
      ],
      stage: 2,
      autoprefixer: {
        flexbox: 'no-2009',
        grid: 'autoplace'
      }
    })
  ]);

  const legacyFiles = [
    { src: 'theme-legacy.src.css', out: 'theme-legacy.css' },
    { src: 'crypt-utils.src.css', out: 'crypt-utils.css' },
    { src: 'print.src.css', out: 'print.css' }
  ];

  for (const item of legacyFiles) {
    const srcPath = path.join(CSS_DIR, item.src);
    const outPath = path.join(CSS_DIR, item.out);

    if (!fs.existsSync(srcPath)) {
      console.warn(`[Build CSS] Source file missing: ${srcPath}`);
      continue;
    }

    const cssContent = fs.readFileSync(srcPath, 'utf-8');
    const result = await legacyProcessor.process(cssContent, { from: srcPath, to: outPath });
    fs.writeFileSync(outPath, result.css, 'utf-8');
    console.log(`[Build CSS] Compiled ${item.src} -> ${item.out}`);
  }

  console.log('[Build CSS] Done!');
}

if (require.main === module) {
  buildCSS().catch(err => {
    console.error('[Build CSS] Error:', err);
    process.exit(1);
  });
}

module.exports = buildCSS;
