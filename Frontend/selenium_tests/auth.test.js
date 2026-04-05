import {
  assert,
  buildDriver,
  By,
  clearAndType,
  click,
  config,
  linkByText,
  navigateToLogin,
  readInputType,
  resetApp,
  waitForTitle,
  waitForToast,
  waitForVisible
} from './helpers.js';

export const suiteName = 'Auth';

export async function runSuite(runCase, sharedDriver) {
  const driver = sharedDriver || await buildDriver();
  const ownsDriver = !sharedDriver;

  try {
    await resetApp(driver);

    await runCase('Megjelenik a nyitó hero cím', async () => {
      const heroTitle = await waitForVisible(driver, By.css('.hero h1'));
      assert.equal(await heroTitle.getText(), 'Éld át a változást!');
    });

    await runCase('Vendégként látszik a regisztráció és bejelentkezés link', async () => {
      assert.ok(await waitForVisible(driver, linkByText('REGISZTRÁCIÓ')));
      assert.ok(await waitForVisible(driver, linkByText('BEJELENTKEZÉS')));
    });

    await runCase('A bejelentkezési űrlap email és jelszó mezőt mutat', async () => {
      await navigateToLogin(driver);
      assert.ok(await waitForVisible(driver, By.id('email')));
      assert.ok(await waitForVisible(driver, By.id('password')));
    });

    await runCase('Üres beküldésnél kliens oldali validáció jelenik meg', async () => {
      await click(driver, By.css('button.submit-button'));
      await waitForVisible(driver, By.xpath("//span[contains(@class,'error-message') and contains(., 'Az email cím megadása kötelező')]"));
      await waitForVisible(driver, By.xpath("//span[contains(@class,'error-message') and contains(., 'A jelszó megadása kötelező')]"));
    });

    await runCase('A jelszó megjelenítés kapcsoló váltja az input típusát', async () => {
      await clearAndType(await waitForVisible(driver, By.id('password')), config.password);
      assert.equal(await readInputType(driver, By.id('password')), 'password');
      await click(driver, By.css('.password-toggle-btn'));
      assert.equal(await readInputType(driver, By.id('password')), 'text');
      await click(driver, By.css('.password-toggle-btn'));
      assert.equal(await readInputType(driver, By.id('password')), 'password');
    });

    await runCase('A megadott felhasználóval sikeres a bejelentkezés', async () => {
      await clearAndType(await waitForVisible(driver, By.id('email')), config.email);
      await clearAndType(await waitForVisible(driver, By.id('password')), config.password);
      await click(driver, By.css('button.submit-button'));
      await waitForToast(driver, 'Sikeres bejelentkezés', 12000);
      await waitForVisible(driver, By.css('.dashboard-container'), 20000);
      await waitForTitle(driver, 'Dashboard');
      assert.ok(await waitForVisible(driver, By.css('.logout-btn')));
    });
  } finally {
    if (ownsDriver) {
      await driver.quit();
    }
  }
}