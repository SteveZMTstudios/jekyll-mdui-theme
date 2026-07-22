const buildCSS = require('./build-css');
const buildJS = require('./build-js');

async function main() {
  console.log('====================================================');
  console.log('Building Assets for target browsers:');
  console.log('Safari >= 5, iOS >= 5, Android >= 4.0, IE >= 9');
  console.log('====================================================');

  await buildCSS();
  await buildJS();

  console.log('====================================================');
  console.log('Build completed successfully!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
