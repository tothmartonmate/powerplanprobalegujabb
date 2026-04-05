import {
  assert,
  buildDriver,
  By,
  buttonByText,
  click,
  clickSidebarSection,
  ensureLoggedIn,
  waitForVisible
} from './helpers.js';

export const suiteName = 'Workouts';

export async function runSuite(runCase, sharedDriver) {
  const driver = sharedDriver || await buildDriver();
  const ownsDriver = !sharedDriver;

  try {
    await ensureLoggedIn(driver);
    await clickSidebarSection(driver, 'Edzésterv');

    await runCase('A heti edzésterv kártyák mind a hét napot megjelenítik', async () => {
      for (const day of ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap']) {
        assert.ok(await waitForVisible(driver, By.xpath(`//h3[normalize-space(.)='${day}']`)));
      }
    });

    await runCase('Az Új Edzés gomb megnyitja a workout modalt', async () => {
      await click(driver, buttonByText('Új Edzés'));
      assert.ok(await waitForVisible(driver, By.xpath("//h2[contains(., 'Új edzés')]")));
    });

    await runCase('Az új edzés modal nap és típus választót is tartalmaz', async () => {
      const selects = await driver.findElements(By.css('.modal.active select.form-control'));
      assert.ok(selects.length >= 2);
    });

    await runCase('A workout modal a Mégse gombbal bezárható', async () => {
      await click(driver, By.css('.modal.active .modal-buttons button.btn.btn-secondary'));
      await driver.wait(async () => (await driver.findElements(By.css('.modal.active'))).length === 0, 10000);
      assert.equal((await driver.findElements(By.css('.modal.active'))).length, 0);
    });

    await runCase('A gyakorlat kategória lenyitható és visszanyitható', async () => {
      await clickSidebarSection(driver, 'Gyakorlatok');
      const header = await waitForVisible(driver, By.css('.exercise-category h3'));
      const content = await waitForVisible(driver, By.css('.exercise-category-content'));
      await driver.executeScript("arguments[0].scrollIntoView({ block: 'center' });", header);
      await header.click();
      await driver.wait(async () => (await content.getCssValue('display')) === 'none', 10000);
      await header.click();
      await driver.wait(async () => (await content.getCssValue('display')) === 'grid', 10000);
    });

    await runCase('A Stopper nézet megjeleníti az időzítőt és a vezérlőket', async () => {
      await clickSidebarSection(driver, 'Stopper');
      assert.ok(await waitForVisible(driver, By.css('.workout-timer')));
      assert.equal((await driver.findElements(By.css('.workout-controls .control-btn'))).length, 2);
      assert.ok(await waitForVisible(driver, buttonByText('Befejezés')));
    });
  } finally {
    if (ownsDriver) {
      await driver.quit();
    }
  }
}