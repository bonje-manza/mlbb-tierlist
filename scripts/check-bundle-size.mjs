import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const distAssetsDir = path.resolve('dist/assets');

if (!fs.existsSync(distAssetsDir)) {
  console.error('[Error] dist/assets directory not found. Please run "npm run build" first.');
  process.exit(1);
}

const files = fs.readdirSync(distAssetsDir);
const appJsFiles = files.filter(f => f.startsWith('index-') && f.endsWith('.js'));

if (appJsFiles.length === 0) {
  console.error('[Error] No initial application bundle (index-*.js) found in dist/assets.');
  process.exit(1);
}

let allPassed = true;
const GZIP_LIMIT_BYTES = 50 * 1024; // 50 KB

for (const file of appJsFiles) {
  const filePath = path.join(distAssetsDir, file);
  const content = fs.readFileSync(filePath);
  const gzipSize = zlib.gzipSync(content).length;
  const gzipKb = (gzipSize / 1024).toFixed(2);

  console.log(`Bundle check [${file}]: ${gzipKb} KB gzip (limit: 50.00 KB)`);

  if (gzipSize > GZIP_LIMIT_BYTES) {
    console.error(`[FAIL] Bundle ${file} exceeded 50KB gzip limit: ${gzipKb} KB`);
    allPassed = false;
  } else {
    console.log(`[PASS] Bundle ${file} is within the 50KB gzip performance budget.`);
  }
}

if (!allPassed) {
  process.exit(1);
}
