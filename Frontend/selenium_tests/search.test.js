import {
  assert,
  buildDriver,
  By,
  clearAndType,
  clickSidebarSection,
  ensureLoggedIn,
  waitForVisible
} from './helpers.js';

export const suiteName = 'Search';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function stubWindowOpen(driver) {
  await driver.executeScript(`
    window.__nativeWindowOpen = window.open;
    window.__lastOpenedUrl = null;
    window.open = (url) => {
      window.__lastOpenedUrl = url;
      return null;
    };
  `);
}

async function readStubbedWindowOpen(driver) {
  return driver.executeScript('return window.__lastOpenedUrl;');
}

async function restoreWindowOpen(driver) {
  await driver.executeScript(`
    if (window.__nativeWindowOpen) {
      window.open = window.__nativeWindowOpen;
      delete window.__nativeWindowOpen;
    }
  `);
}

async function ensureMainWindow(driver, mainHandle) {
  const handles = await driver.getAllWindowHandles();

  for (const handle of handles) {
    if (handle !== mainHandle) {
      await driver.switchTo().window(handle);
      await driver.close();
    }
  }

  const remainingHandles = await driver.getAllWindowHandles();
  const targetHandle = remainingHandles.includes(mainHandle) ? mainHandle : remainingHandles[0];
  await driver.switchTo().window(targetHandle);
}

export async function runSuite(runCase, sharedDriver) {
  const driver = sharedDriver || await buildDriver();
  const ownsDriver = !sharedDriver;
  let exerciseDriver = null;

  const getExerciseDriver = async () => {
    if (!exerciseDriver) {
      exerciseDriver = await buildDriver();
      await ensureLoggedIn(exerciseDriver);
    }

    return exerciseDriver;
  };

  try {
    await ensureLoggedIn(driver);

    await runCase('Az edzőterem városkereső mező megjelenik', async () => {
      await clickSidebarSection(driver, 'Edzőtermek');
      assert.ok(await waitForVisible(driver, By.id('gym-city-search')));
    });

    await runCase('A városkereső Pécsre szűri a városkártyákat', async () => {
      await clickSidebarSection(driver, 'Edzőtermek');
      const citySearch = await waitForVisible(driver, By.id('gym-city-search'));
      await clearAndType(citySearch, 'Pécs');
      const cityCards = await driver.findElements(By.css('.gym-city-card h5'));
      assert.ok(cityCards.length >= 1);
      for (const card of cityCards) {
        assert.equal(normalizeText(await card.getText()), 'pecs');
      }
    });

    await runCase('A városkereső ékezet nélkül is megtalálja Pécset', async () => {
      await clickSidebarSection(driver, 'Edzőtermek');
      const citySearch = await waitForVisible(driver, By.id('gym-city-search'));
      await clearAndType(citySearch, 'pecs');
      const firstCard = await waitForVisible(driver, By.css('.gym-city-card h5'));
      assert.equal(normalizeText(await firstCard.getText()), 'pecs');
    });

    await runCase('A városkereső üres állapotot mutat ismeretlen városra', async () => {
      await clickSidebarSection(driver, 'Edzőtermek');
      const citySearch = await waitForVisible(driver, By.id('gym-city-search'));
      await clearAndType(citySearch, 'nincsilyenváros');
      const emptyState = await waitForVisible(driver, By.css('.gym-city-empty-state'));
      assert.ok((await emptyState.getText()).includes('Nincs találat'));
    });

    await runCase('A városkártya Google Maps linkje a kiválasztott városra zoomol', async () => {
      await clickSidebarSection(driver, 'Edzőtermek');
      const mainHandle = await driver.getWindowHandle();

      try {
        await stubWindowOpen(driver);
        const citySearch = await waitForVisible(driver, By.id('gym-city-search'));
        await clearAndType(citySearch, 'Pécs');
        const cityButton = await waitForVisible(driver, By.css('.gym-city-open-btn'));
        await cityButton.click();
        const openedUrl = await readStubbedWindowOpen(driver);
        assert.ok(openedUrl.includes('google.com/maps/search'));
        assert.ok(openedUrl.includes('P%C3%A9cs') || openedUrl.includes('pecs'));
        assert.ok(openedUrl.includes('@46.0727,18.2323,13z'));
      } finally {
        await restoreWindowOpen(driver);
        await ensureMainWindow(driver, mainHandle);
      }
    });

    await runCase('Az országos Google Maps gomb országos keresést nyit', async () => {
      await clickSidebarSection(driver, 'Edzőtermek');
      const mainHandle = await driver.getWindowHandle();

      try {
        await stubWindowOpen(driver);
        const openButton = await waitForVisible(driver, By.css('.gym-expand-btn'));
        await openButton.click();
        const openedUrl = await readStubbedWindowOpen(driver);
        assert.ok(openedUrl.includes('edz%C5%91terem%20Magyarorsz%C3%A1g'));
        assert.ok(openedUrl.includes('@47.1625,19.5033,7z'));
      } finally {
        await restoreWindowOpen(driver);
        await ensureMainWindow(driver, mainHandle);
      }
    });

    await runCase('A gyakorlat keresőmező megjelenik', async () => {
      const activeDriver = await getExerciseDriver();
      await clickSidebarSection(activeDriver, 'Gyakorlatok');
      assert.ok(await waitForVisible(activeDriver, By.id('exercise-search')));
    });

    await runCase('A gyakorlat kereső a bicepsz kategóriára szűr', async () => {
      const activeDriver = await getExerciseDriver();
      await clickSidebarSection(activeDriver, 'Gyakorlatok');
      const exerciseSearch = await waitForVisible(activeDriver, By.id('exercise-search'));
      await clearAndType(exerciseSearch, 'bicepsz');
      const categoryHeaders = await activeDriver.findElements(By.css('.exercise-category h3'));
      assert.ok(categoryHeaders.length >= 1);
      for (const header of categoryHeaders) {
        assert.ok(normalizeText(await header.getText()).includes('bicepsz'));
      }
    });

    await runCase('A gyakorlat kereső név alapján szűri a találatokat', async () => {
      const activeDriver = await getExerciseDriver();
      await clickSidebarSection(activeDriver, 'Gyakorlatok');
      const exerciseSearch = await waitForVisible(activeDriver, By.id('exercise-search'));
      await clearAndType(exerciseSearch, 'guggolas');
      const visibleCards = await activeDriver.findElements(By.css('.exercise-video-card h4'));
      assert.ok(visibleCards.length >= 1);
      for (const card of visibleCards) {
        assert.ok(normalizeText(await card.getText()).includes('guggolas'));
      }
    });

    await runCase('A gyakorlat kereső üres állapotot mutat ismeretlen kifejezésre', async () => {
      const activeDriver = await getExerciseDriver();
      await clickSidebarSection(activeDriver, 'Gyakorlatok');
      const exerciseSearch = await waitForVisible(activeDriver, By.id('exercise-search'));
      await clearAndType(exerciseSearch, 'nincsgyakorlat');
      const emptyState = await waitForVisible(activeDriver, By.css('.exercise-empty-state'));
      assert.ok((await emptyState.getText()).includes('Nincs találat'));
    });
  } finally {
    if (exerciseDriver) {
      await exerciseDriver.quit();
    }

    if (ownsDriver) {
      await driver.quit();
    }
  }
}
