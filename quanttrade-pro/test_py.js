import { execSync } from 'child_process';
try {
  const out = execSync('python3 --version');
  console.log('Python version:', out.toString());
} catch (e) {
  console.log('Python not found:', e.message);
}
try {
  const pipOut = execSync('pip3 --version');
  console.log('Pip version:', pipOut.toString());
} catch (e) {
  console.log('Pip not found:', e.message);
}
