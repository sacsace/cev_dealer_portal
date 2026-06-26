'use strict';

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const webRoot = path.join(__dirname, '..');
const repoRoot = path.join(webRoot, '..', '..');
const logPrefix = '[native-css]';

function platformTriple() {
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

  return parts.join('-');
}

function readPackageVersion(packageName) {
  for (const base of [webRoot, repoRoot]) {
    try {
      const pkgJsonPath = require.resolve(`${packageName}/package.json`, { paths: [base] });
      return require(pkgJsonPath).version;
    } catch {
      // try next base
    }
  }
  return null;
}

function resolveModule(moduleName) {
  return require.resolve(moduleName, { paths: [webRoot, repoRoot] });
}

function canRequire(moduleName) {
  try {
    require(resolveModule(moduleName));
    return true;
  } catch {
    return false;
  }
}

function installNative(moduleName, version) {
  console.log(`${logPrefix} Installing ${moduleName}@${version}`);

  execSync(
    `npm install "${moduleName}@${version}" -w web --no-save --include=optional --no-audit --no-fund --ignore-scripts`,
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        npm_config_omit: '',
        npm_config_include: 'optional',
      },
    },
  );
}

function linkOxideBinary(triple) {
  const nodeFileName = `tailwindcss-oxide.${triple}.node`;
  const oxideDir = path.dirname(resolveModule('@tailwindcss/oxide/package.json'));
  const target = path.join(oxideDir, nodeFileName);

  if (fs.existsSync(target)) {
    return;
  }

  const bindingPkg = `@tailwindcss/oxide-${triple}`;
  if (!canRequire(bindingPkg)) {
    return;
  }

  const bindingDir = path.dirname(resolveModule(`${bindingPkg}/package.json`));
  const source = path.join(bindingDir, nodeFileName);

  if (!fs.existsSync(source)) {
    return;
  }

  fs.copyFileSync(source, target);
  console.log(`${logPrefix} Copied ${nodeFileName} into @tailwindcss/oxide`);
}

function ensureNative(moduleName, version) {
  if (canRequire(moduleName)) {
    console.log(`${logPrefix} ${moduleName} ready`);
    return;
  }

  installNative(moduleName, version);

  if (!canRequire(moduleName)) {
    throw new Error(`${logPrefix} Failed to install native binding: ${moduleName}`);
  }

  console.log(`${logPrefix} ${moduleName} ready`);
}

const triple = platformTriple();
const bindings = [
  {
    moduleName: `lightningcss-${triple}`,
    version: readPackageVersion('lightningcss') ?? '1.32.0',
  },
  {
    moduleName: `@tailwindcss/oxide-${triple}`,
    version: readPackageVersion('@tailwindcss/oxide') ?? readPackageVersion('tailwindcss') ?? '4.3.1',
  },
];

for (const binding of bindings) {
  ensureNative(binding.moduleName, binding.version);
}

linkOxideBinary(triple);

require(resolveModule('@tailwindcss/oxide'));
console.log(`${logPrefix} Native CSS bindings verified`);
