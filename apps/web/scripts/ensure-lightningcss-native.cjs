'use strict';

const { execSync } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..');

function nativePackageName() {
  const parts = [process.platform, process.arch];

  if (process.platform === 'linux') {
    try {
      const { MUSL, familySync } = require('detect-libc');
      const family = familySync();
      if (family === MUSL) {
        parts.push('musl');
      } else if (process.arch === 'arm') {
        parts.push('gnueabihf');
      } else {
        parts.push('gnu');
      }
    } catch {
      parts.push('gnu');
    }
  } else if (process.platform === 'win32') {
    parts.push('msvc');
  }

  return `lightningcss-${parts.join('-')}`;
}

const pkg = nativePackageName();

try {
  require(pkg);
  return;
} catch {
  // Fall through to install.
}

console.log(`[prebuild] Installing native CSS binding: ${pkg}`);

execSync(`npm install ${pkg}@1.32.0 --no-save --include=optional --no-audit --no-fund`, {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    npm_config_production: 'false',
    NPM_CONFIG_PRODUCTION: 'false',
  },
});

require(pkg);
console.log(`[prebuild] ${pkg} ready`);
