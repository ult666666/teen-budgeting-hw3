const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
for (const file of ['index.html', 'app.js', 'core.js', 'styles.css']) {
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', path.join(root, file)]);
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}
for (const file of ['api/budget.js', 'lib/budget.cjs']) {
  if (fs.existsSync(path.join(root, file))) execFileSync(process.execPath, ['--check', path.join(root, file)]);
}
console.log('BUILD PASS: browser assets copied to dist; JavaScript syntax checks passed.');
