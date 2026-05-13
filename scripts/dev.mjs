import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const processes = [
  spawn(npm, ['run', 'dev', '--prefix', 'server'], {
    stdio: 'inherit',
    shell: false,
  }),
  spawn(npm, ['run', 'dev', '--prefix', 'client'], {
    stdio: 'inherit',
    shell: false,
  }),
];

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of processes) {
    if (!child.killed) child.kill(signal);
  }
}

for (const child of processes) {
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;

    shutdown(signal || 'SIGTERM');
    process.exitCode = code || 0;
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
