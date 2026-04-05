import { spawn } from 'node:child_process';
import process from 'node:process';

import { buildDriver, config } from './helpers.js';
import { runSuite as runAuthSuite, suiteName as authSuiteName } from './auth.test.js';
import { runSuite as runNavSuite, suiteName as navSuiteName } from './nav.test.js';
import { runSuite as runWorkoutsSuite, suiteName as workoutsSuiteName } from './workouts.test.js';
import { runSuite as runNutritionSuite, suiteName as nutritionSuiteName } from './nutrition.test.js';
import { runSuite as runMessagesSuite, suiteName as messagesSuiteName } from './messages.test.js';

const suites = [
  { name: authSuiteName, runSuite: runAuthSuite },
  { name: navSuiteName, runSuite: runNavSuite },
  { name: workoutsSuiteName, runSuite: runWorkoutsSuite },
  { name: nutritionSuiteName, runSuite: runNutritionSuite },
  { name: messagesSuiteName, runSuite: runMessagesSuite }
];

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
    await sleep(1000);
  }

  return false;
}

function startFrontendServer() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return spawn(npmCommand, ['run', 'start', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
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