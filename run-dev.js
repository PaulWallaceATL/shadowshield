#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Path to the Next.js CLI
const nextBinPath = path.resolve(__dirname, 'node_modules/next/dist/bin/next');

// Run Next.js dev command
const nextProcess = spawn('node', [nextBinPath, 'dev'], {
  stdio: 'inherit',
  env: { ...process.env, FORCE_COLOR: '1' }
});

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});

nextProcess.on('close', (code) => {
  process.exit(code);
}); 