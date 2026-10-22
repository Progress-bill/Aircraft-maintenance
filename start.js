import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════');
console.log('\x1b[36m%s\x1b[0m', '  ✈️  NERO AERO AIRCRAFT MAINTENANCE SYSTEM LAUNCHER  ✈️ ');
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════');
console.log('Starting Express API Server and Vite Frontend Client...\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Start Server
const server = spawn(npmCmd, ['start'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'pipe',
  shell: true
});

server.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[35m[SERVER]\x1b[0m ${data}`);
});

server.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[SERVER ERR]\x1b[0m ${data}`);
});

// Start Client
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'pipe',
  shell: true
});

client.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[34m[CLIENT]\x1b[0m ${data}`);
});

client.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[33m[CLIENT WARN]\x1b[0m ${data}`);
});

function cleanup() {
  console.log('\nShutting down Nero Aero services...');
  server.kill();
  client.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
