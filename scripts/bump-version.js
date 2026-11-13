#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = __dirname + '/..';
const PKG = path.join(ROOT, 'package.json');
const INDEX = path.join(ROOT, 'frontend/index.html');

const pkg = JSON.parse(fs.readFileSync(PKG, 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);
const type = process.argv[2] || 'patch';

let [newMajor, newMinor, newPatch] = [major, minor, patch];
if (type === 'major') { newMajor++; newMinor = 0; newPatch = 0; }
else if (type === 'minor') { newMinor++; newPatch = 0; }
else { newPatch++; }

const newVersion = `${newMajor}.${newMinor}.${newPatch}`;
pkg.version = newVersion;
fs.writeFileSync(PKG, JSON.stringify(pkg, null, 2) + '\n');

// Update index.html cache-busting
let html = fs.readFileSync(INDEX, 'utf8');
html = html.replace(/(\?v=)\d+/g, `$1${newVersion}`);
fs.writeFileSync(INDEX, html);

// Git commit + tag
const { execSync } = require('child_process');
try {
  execSync('git add package.json frontend/index.html', { cwd: ROOT, stdio: 'inherit' });
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, { cwd: ROOT, stdio: 'inherit' });
  execSync(`git tag -a v${newVersion} -m "Version ${newVersion}"`, { cwd: ROOT, stdio: 'inherit' });
  console.log(`✅ Version bumped to ${newVersion}`);
} catch (e) {
  console.log(`⚠️ Version updated to ${newVersion} (git commit failed - not a repo?)`);
}
