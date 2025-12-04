#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying VS Code Web AI Editor setup...\n');

let hasErrors = false;

// Check Node.js version
const nodeVersion = process.version;
console.log(`✓ Node.js version: ${nodeVersion}`);

// Check if node_modules exists
if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
  console.error('❌ node_modules not found. Run: npm install');
  hasErrors = true;
} else {
  console.log('✓ node_modules directory exists');
}

// Check critical dependencies
const criticalDeps = ['node-pty', 'express', 'ws', '@xterm/xterm', 'react', 'vite'];

console.log('\n📦 Checking critical dependencies...');
for (const dep of criticalDeps) {
  const depPath = path.join(__dirname, '..', 'node_modules', dep);
  if (fs.existsSync(depPath)) {
    console.log(`✓ ${dep}`);
  } else {
    console.error(`❌ ${dep} not found`);
    hasErrors = true;
  }
}

// Check if node-pty is properly built
console.log('\n🔧 Checking node-pty native module...');
const ptyPath = path.join(__dirname, '..', 'node_modules', 'node-pty', 'build', 'Release');
if (fs.existsSync(ptyPath)) {
  console.log('✓ node-pty native module is built');
} else {
  console.log('⚠️  node-pty needs to be rebuilt');
  console.log('   Running: npm rebuild node-pty');
  try {
    execSync('npm rebuild node-pty', { stdio: 'inherit' });
    console.log('✓ node-pty rebuilt successfully');
  } catch (error) {
    console.error('❌ Failed to rebuild node-pty');
    hasErrors = true;
  }
}

// Check .env file
console.log('\n⚙️  Checking configuration...');
if (!fs.existsSync(path.join(__dirname, '..', '.env'))) {
  console.log('⚠️  .env file not found - creating from .env.example...');
  try {
    fs.copyFileSync(
      path.join(__dirname, '..', '.env.example'),
      path.join(__dirname, '..', '.env')
    );
    console.log('✓ .env file created - please configure your API keys');
  } catch (error) {
    console.error('❌ Failed to create .env file');
    hasErrors = true;
  }
} else {
  console.log('✓ .env file exists');
}

// Check ports
console.log('\n🔌 Checking port availability...');

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

(async () => {
  const port3001 = await checkPort(3001);
  const port5173 = await checkPort(5173);

  console.log(port3001 ? '✓ Port 3001 (backend) is available' : '⚠️  Port 3001 is in use');
  console.log(port5173 ? '✓ Port 5173 (frontend) is available' : '⚠️  Port 5173 is in use');

  console.log('\n' + '='.repeat(60));
  if (hasErrors) {
    console.log('❌ Setup verification failed - please fix errors above');
    process.exit(1);
  } else {
    console.log('✅ Setup verification complete!');
    console.log('\n🚀 Start the application:');
    console.log('   npm start  - Start both backend and frontend');
  }
  console.log('='.repeat(60) + '\n');
})();
