import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('🚀 Running production build for Nero Aero MRO System...\n');

try {
  console.log('📦 Installing server dependencies...');
  execSync(`${npmCmd} install`, { cwd: path.join(__dirname, 'server'), stdio: 'inherit' });

  console.log('\n📦 Installing client dependencies...');
  execSync(`${npmCmd} install`, { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });

  console.log('\n⚡ Building frontend assets with Vite...');
  execSync(`${npmCmd} run build`, { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });

  console.log('\n✅ Production build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
