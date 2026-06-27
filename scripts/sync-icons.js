const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const iconSource = path.join(root, 'apps/web/src/app/icon.svg');
const targets = [
  path.join(root, 'apps/web/src/app/apple-icon.svg'),
  path.join(root, 'apps/web/public/favicon.svg'),
  path.join(root, 'apps/web/public/apple-icon.svg'),
];

const source = fs.readFileSync(iconSource, 'utf8');

for (const target of targets) {
  if (fs.readFileSync(target, 'utf8') !== source) {
    fs.writeFileSync(target, source, 'utf8');
    console.log('synced', path.relative(root, target));
  }
}

console.log('icon sync complete');
