import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { buildDriver, config } from './helpers.js';
import { runSuite as runAuthSuite, suiteName as authSuiteName } from './auth.test.js';
import { runSuite as runDashboardSuite, suiteName as dashboardSuiteName } from './dashboard.test.js';
import { runSuite as runNavSuite, suiteName as navSuiteName } from './nav.test.js';
import { runSuite as runWorkoutsSuite, suiteName as workoutsSuiteName } from './workouts.test.js';
import { runSuite as runNutritionSuite, suiteName as nutritionSuiteName } from './nutrition.test.js';
import { runSuite as runMessagesSuite, suiteName as messagesSuiteName } from './messages.test.js';
import { runSuite as runSearchSuite, suiteName as searchSuiteName } from './search.test.js';

const suites = [
  { name: authSuiteName, runSuite: runAuthSuite },
  { name: dashboardSuiteName, runSuite: runDashboardSuite },
  { name: navSuiteName, runSuite: runNavSuite },
  { name: workoutsSuiteName, runSuite: runWorkoutsSuite },
  { name: nutritionSuiteName, runSuite: runNutritionSuite },
  { name: messagesSuiteName, runSuite: runMessagesSuite },
  { name: searchSuiteName, runSuite: runSearchSuite }
];

const FRONTEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = path.resolve(FRONTEND_ROOT, '..');
const BACKEND_URL = process.env.POWERPLAN_API_URL || 'http://127.0.0.1:5001/api/register/check-email?email=selenium%40example.com';
const SELENIUM_PASSWORD_HASH = '$2b$10$U41g6WpAFvGaKT3Jq4LMFODK.1kgMakwvDSSdRC5cjBXZo6.FALj6';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isUrlReachable(url) {
  try {
    const response = await fetch(url, { method: 'GET' });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForUrl(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isUrlReachable(url)) {
      return true;
    }
    await sleep(500);
  }

  return false;
}

function startFrontendServer() {
  if (process.platform === 'win32') {
    return spawn('cmd.exe', ['/d', '/s', '/c', 'npm run start -- --host 127.0.0.1 --port 5173 --strictPort'], {
      cwd: FRONTEND_ROOT,
      stdio: 'inherit'
    });
  }

  return spawn('npm', ['run', 'start', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: FRONTEND_ROOT,
    stdio: 'inherit'
  });
}

function runCommand(command, args, cwd, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...extraEnv
      }
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} hibával állt le (${code}).`));
    });
  });
}

async function startBackendServices() {
  if (process.platform === 'win32') {
    await runCommand('cmd.exe', ['/d', '/s', '/c', 'docker compose up -d db backend'], REPO_ROOT);
    return;
  }

  await runCommand('docker', ['compose', 'up', '-d', 'db', 'backend'], REPO_ROOT);
}

async function ensureBackendAvailable() {
  if (await isUrlReachable(BACKEND_URL)) {
    return;
  }

  await startBackendServices();

  const isReady = await waitForUrl(BACKEND_URL, 60000);
  if (!isReady) {
    throw new Error(`A backend nem indult el ezen a címen: ${BACKEND_URL}`);
  }
}

async function resetSeleniumUserPassword() {
  const sql = `UPDATE users SET password_hash='${SELENIUM_PASSWORD_HASH}' WHERE email='${config.email}';`;
  await runCommand(
    'docker',
    ['exec', '-e', 'MYSQL_PWD=root', 'powerplan_db', 'mysql', '-uroot', 'powerplan', '-e', sql],
    REPO_ROOT
  );
}

async function stopFrontendServer(childProcess) {
  if (!childProcess) {
    return;
  }

  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(childProcess.pid), '/t', '/f'], {
        stdio: 'ignore'
      });
      killer.on('exit', resolve);
      killer.on('error', resolve);
    });
    return;
  }

  childProcess.kill('SIGTERM');
}

async function ensureFrontendAvailable() {
  if (await isUrlReachable(config.baseUrl)) {
    return null;
  }

  const serverProcess = startFrontendServer();
  const isReady = await waitForUrl(config.baseUrl, 45000);

  if (!isReady) {
    await stopFrontendServer(serverProcess);
    throw new Error(`A frontend nem indult el ezen a címen: ${config.baseUrl}`);
  }

  return serverProcess;
}

async function main() {
  let total = 0;
  let passed = 0;
  let failed = 0;
  const failures = [];

  await ensureBackendAvailable();
  await resetSeleniumUserPassword();
  const serverProcess = await ensureFrontendAvailable();
  const sharedDriver = await buildDriver();

  try {
    for (const suite of suites) {
      console.log(`\n=== ${suite.name} suite ===`);
      await suite.runSuite(async (name, testFn) => {
        total += 1;
        try {
          await testFn();
          passed += 1;
          console.log(`PASS ${suite.name}: ${name}`);
        } catch (error) {
          failed += 1;
          failures.push(`${suite.name}: ${name}`);
          console.error(`FAIL ${suite.name}: ${name}`);
          console.error(error?.stack || error?.message || error);
        }
      }, sharedDriver);
    }
  } finally {
    await sharedDriver.quit();
    await stopFrontendServer(serverProcess);
  }

  console.log(`\nÖsszesen: ${total} teszt, sikeres: ${passed}, hibás: ${failed}`);

  if (failures.length > 0) {
    console.error('Sikertelen tesztek:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});