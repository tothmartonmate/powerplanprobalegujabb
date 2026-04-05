import {
  assert,
  buildDriver,
  By,
  clickSidebarSection,
  ensureLoggedIn,
  waitForVisible
} from './helpers.js';

export const suiteName = 'Nutrition';

export async function runSuite(runCase, sharedDriver) {
  const driver = sharedDriver || await buildDriver();
  const ownsDriver = !sharedDriver;

  try {
    await ensureLoggedIn(driver);
    await clickSidebarSection(driver, 'Táplálkozás');

    await runCase('A Táplálkozás oldal címe helyesen jelenik meg', async () => {
      assert.ok(await waitForVisible(driver, By.xpath("//h3[contains(., 'Ajánlott napi étrend')]")));
    });

    await runCase('Az ajánlott napi étrend panel megjeleníti a dátumot', async () => {
      assert.ok(await waitForVisible(driver, By.css('.nutrition-recommendation-date')));
    });

    await runCase('Az ajánlási összesítő kártyák tartalmazzák a napi keretet és az étkezések számát', async () => {
      assert.ok(await waitForVisible(driver, By.xpath("//span[contains(., 'Ajánlott napi keret')]")));
      assert.ok(await waitForVisible(driver, By.xpath("//span[contains(., 'Ajánlott étkezések')]")));
    });

    await runCase('A napi étkezések blokknál elérhető az Étkezés gomb', async () => {
      assert.ok(await waitForVisible(driver, By.xpath("//h3[contains(., 'Napi étkezések')]")));
      assert.ok(await waitForVisible(driver, By.xpath("//button[contains(., 'Étkezés')]")));
    });

    await runCase('A heti kalóriatérkép panel betöltődik', async () => {
      assert.ok(await waitForVisible(driver, By.xpath("//h3[contains(., 'Heti kalóriatérkép')]")));
      assert.ok(await waitForVisible(driver, By.css('.nutrition-radar-wrap canvas')));
    });

    await runCase('A jobb oldali összesítő tartalmazza a kiválasztott nap és hátralévő keret kártyát', async () => {
      assert.ok(await waitForVisible(driver, By.xpath("//span[contains(., 'Kiválasztott nap')]")));
      assert.ok(await waitForVisible(driver, By.xpath("//span[contains(., 'Hátralévő keret')]")));
    });
  } finally {
    if (ownsDriver) {
      await driver.quit();
    }
  }
}