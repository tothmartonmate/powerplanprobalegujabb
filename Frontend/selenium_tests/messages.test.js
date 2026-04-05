import {
  assert,
  buildDriver,
  By,
  clearAndType,
  click,
  clickSidebarSection,
  ensureLoggedIn,
  findMessageCardBySubject,
  waitForElementToDisappear,
  waitForToast,
  waitForVisible
} from './helpers.js';

export const suiteName = 'Messages';

const incomingUserTab = By.xpath("//div[contains(@class,'user-message-tabs')]//button[contains(., 'Beérkezett üzenetek')]");
const sentUserTab = By.xpath("//div[contains(@class,'user-message-tabs')]//button[contains(., 'Elküldött üzenetek')]");

async function waitForMessagesReady(driver) {
  await driver.wait(async () => {
    const loadingIndicators = await driver.findElements(By.xpath("//div[contains(@class,'loading-spinner') and contains(., 'Üzenetek betöltése')]"));
    if (loadingIndicators.length > 0 && await loadingIndicators[0].isDisplayed()) {
      return false;
    }

    const tabs = await driver.findElements(By.css('.user-message-tabs .admin-message-tab'));
    return tabs.length === 2;
  }, 30000, 'Az üzenetek felülete nem töltődött be időben.');
}

export async function runSuite(runCase, sharedDriver) {
  const driver = sharedDriver || await buildDriver();
  const ownsDriver = !sharedDriver;
  const uniqueSubject = `Selenium üzenet ${Date.now()}`;
  const uniqueBody = `Automata frontend teszt üzenet ${Date.now()}`;

  try {
    await ensureLoggedIn(driver);
    await clickSidebarSection(driver, 'Üzeneteim');
    await waitForMessagesReady(driver);

    await runCase('Az Üzeneteim oldal mutatja az új üzenet űrlapot', async () => {
      assert.ok(await waitForVisible(driver, By.xpath("//h3[contains(., 'Új üzenet az adminnak')]")));
      assert.ok(await waitForVisible(driver, By.css('.messages-compose-card input.form-control')));
      assert.ok(await waitForVisible(driver, By.css('.messages-compose-card textarea.form-control')));
    });

    await runCase('Üres üzenetküldés figyelmeztetést ad', async () => {
      await click(driver, By.css('.messages-compose-card button.btn.btn-primary'));
      await waitForToast(driver, 'A tárgy és az üzenet megadása kötelező.');
    });

    await runCase('A beérkezett és elküldött fülek egyszerre látszanak', async () => {
      await waitForMessagesReady(driver);
      assert.ok(await waitForVisible(driver, incomingUserTab));
      assert.ok(await waitForVisible(driver, sentUserTab));
    });

    await runCase('Az elküldött fül átváltható aktív állapotra', async () => {
      await waitForMessagesReady(driver);
      const sentTab = await waitForVisible(driver, sentUserTab);
      await sentTab.click();
      assert.ok((await sentTab.getAttribute('class')).includes('active'));
    });

    await runCase('A felhasználó tud új üzenetet küldeni az adminnak', async () => {
      await waitForMessagesReady(driver);
      const subjectInput = await waitForVisible(driver, By.css('.messages-compose-card input.form-control'));
      const messageInput = await waitForVisible(driver, By.css('.messages-compose-card textarea.form-control'));
      await clearAndType(subjectInput, uniqueSubject);
      await clearAndType(messageInput, uniqueBody);
      await click(driver, By.css('.messages-compose-card button.btn.btn-primary'));
      await waitForToast(driver, 'Üzenet elküldve az adminnak.');
      const sentTab = await waitForVisible(driver, sentUserTab);
      await sentTab.click();
      const card = await findMessageCardBySubject(driver, uniqueSubject);
      assert.ok((await card.getText()).includes(uniqueBody));
    });

    await runCase('A saját elküldött üzenet törölhető', async () => {
      await waitForMessagesReady(driver);
      const sentTab = await waitForVisible(driver, sentUserTab);
      await sentTab.click();
      const card = await findMessageCardBySubject(driver, uniqueSubject);
      const deleteButton = await card.findElement(By.xpath(".//button[contains(., 'Saját üzenet törlése')]"));
      await driver.executeScript("arguments[0].scrollIntoView({ block: 'center' });", deleteButton);
      await deleteButton.click();
      await waitForToast(driver, 'Üzenet törölve.');
      const locator = By.xpath(`//div[contains(@class,'user-message-thread')][.//h4[normalize-space(.)='${uniqueSubject}']]`);
      await waitForElementToDisappear(driver, locator, 20000);
      assert.equal((await driver.findElements(locator)).length, 0);
    });
  } finally {
    if (ownsDriver) {
      await driver.quit();
    }
  }
}