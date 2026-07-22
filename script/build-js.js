const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const JS_DIR = path.join(__dirname, '..', 'assets', 'js');

async function buildJS() {
  console.log('[Build JS] Compiling JS assets...');

  // 1. Copy theme.src.js -> theme.js & crypto.src.js -> crypto.js
  const modernFiles = [
    { src: 'theme.src.js', out: 'theme.js' },
    { src: 'crypto.src.js', out: 'crypto.js' }
  ];

  for (const item of modernFiles) {
    const srcPath = path.join(JS_DIR, item.src);
    const outPath = path.join(JS_DIR, item.out);
    if (fs.existsSync(srcPath)) {
      const code = fs.readFileSync(srcPath, 'utf-8');
      fs.writeFileSync(outPath, code, 'utf-8');
      console.log(`[Build JS] Copied ${item.src} -> ${item.out}`);
    }
  }

  // 2. Transpile theme-legacy.src.js -> theme-legacy.js targeting IE9+, Safari 5+, iOS 5+, Android 4.0+
  const legacySrcPath = path.join(JS_DIR, 'theme-legacy.src.js');
  const legacyOutPath = path.join(JS_DIR, 'theme-legacy.js');

  if (fs.existsSync(legacySrcPath)) {
    const code = fs.readFileSync(legacySrcPath, 'utf-8');
    const result = babel.transformSync(code, {
      configFile: false,
      babelrc: false,
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: [
                'safari >= 5',
                'iOS >= 5',
                'Android >= 4.0',
                'ie >= 9'
              ]
            },
            modules: false
          }
        ]
      ]
    });

    fs.writeFileSync(legacyOutPath, result.code, 'utf-8');
    console.log(`[Build JS] Transpiled ${legacySrcPath} -> theme-legacy.js`);
  }

  console.log('[Build JS] Done!');
}

if (require.main === module) {
  buildJS().catch(err => {
    console.error('[Build JS] Error:', err);
    process.exit(1);
  });
}

module.exports = buildJS;
