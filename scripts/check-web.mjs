import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const htmlPath = path.join(repoRoot, 'web', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const matches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
const inlineScripts = matches
  .map((match) => match[1])
  .map((script) => script.trim())
  .filter(Boolean);

if (!inlineScripts.length) {
  console.error('未找到内联 <script>，无法做语法校验');
  process.exit(1);
}

const tempPath = path.join(os.tmpdir(), 'passive_income_lab_web_check.js');
fs.writeFileSync(tempPath, inlineScripts.join('\n\n'), 'utf8');
execFileSync('node', ['--check', tempPath], { stdio: 'inherit' });
console.log(`Web inline script 语法校验通过: ${tempPath}`);
