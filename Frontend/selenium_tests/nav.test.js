import {
  assert,
  buildDriver,
  By,
  click,
  clickSidebarSection,
  countVisibleElements,
  ensureLoggedIn,
  getBodyClass,
  sidebarItemByText,
  waitForInvisible,
  waitForTitle,
  waitForVisible
} from './helpers.js';

export const suiteName = 'Navigation';

export async function runSuite(runCase, sharedDriver) {
  const driver = sharedDriver || await buildDriver();
  const ownsDriver = !sharedDriver;

  try {
    await ensureLoggedIn(driver);

    await runCase('Az oldalsáv tartalmazza a fő felhasználói szekciókat', async () => {
      for (const label of ['Dashboard', 'Edzésterv', 'Táplálkozás', 'Üzeneteim', 'Profil']) {
        assert.ok(await waitForVisible(driver, sidebarItemByText(label)));
      }
    });

    await runCase('Az Edzőtermek menüpont megnyitja a térképes nézetet', async () => {
      await clickSidebarSection(driver, 'Edzőtermek');
      assert.ok(await waitForVisible(driver, By.css('.gym-map-frame[aria-label="Magyarországi edzőtermek térképe"]'), 20000));
    });

    await runCase('A Gyakorlatok menüpont videókat jelenít meg', async () => {
      await clickSidebarSection(driver, 'Gyakorlatok');
      assert.ok(await waitForVisible(driver, By.css('.exercise-category')));
      assert.ok((await countVisibleElements(driver, By.css('.exercise-video-card iframe'))) > 0);
    });

    await runCase('A témaváltó kapcsolja a dark mode osztályt', async () => {
      const before = await getBodyClass(driver);
      await click(driver, By.css('.top-actions .theme-toggle-btn'));
      const afterToggle = await getBodyClass(driver);
      assert.notEqual(afterToggle.includes('dark-mode'), before.includes('dark-mode'));
      await click(driver, By.css('.top-actions .theme-toggle-btn'));
      const reverted = await getBodyClass(driver);
      assert.equal(reverted.includes('dark-mode'), before.includes('dark-mode'));
    });

    await runCase('Az Üzeneteim menüpont frissíti az oldal címét', async () => {
      await clickSidebarSection(driver, 'Üzeneteim');
      await waitForTitle(driver, 'Üzeneteim');
      assert.ok(await waitForVisible(driver, By.css('.messages-layout')));
    });

    await runCase('A kijelentkezés gomb megnyitja, majd a Mégse bezárja a modalt', async () => {
      await click(driver, By.css('.logout-btn'));
      assert.ok(await waitForVisible(driver, By.css('.logout-modal')));
      await click(driver, By.css('.confirm-cancel-btn'));
      await waitForInvisible(driver, By.css('.logout-modal'));
      await waitForVisible(driver, By.css('.dashboard-container'));
    });
  } finally {
    if (ownsDriver) {
      await driver.quit();
    }
  }
}