import assert from 'node:assert/strict';
import { Builder, Browser, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';
import chromedriver from 'chromedriver';

export const config = {
  baseUrl: process.env.POWERPLAN_BASE_URL || 'http://127.0.0.1:5173',
  email: process.env.POWERPLAN_TEST_EMAIL || 'sramli@gmail.com',
  password: process.env.POWERPLAN_TEST_PASSWORD || 'teszt123',
  browser: process.env.SELENIUM_BROWSER || 'chrome',
  headless: process.env.SELENIUM_HEADLESS === 'true',
  actionDelayMs: Number(process.env.SELENIUM_ACTION_DELAY_MS || 350),
  typingDelayMs: Number(process.env.SELENIUM_TYPING_DELAY_MS || 70)
};

const DEFAULT_TIMEOUT = 15000;

export async function pause(ms = config.actionDelayMs) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function toXPathLiteral(value) {
  if (!value.includes("'")) {
    return `'${value}'`;
  }

  if (!value.includes('"')) {
    return `"${value}"`;
  }

  return `concat('${value.split("'").join(`', "'", '`)}')`;
}

export function buttonByText(text) {
  return By.xpath(`//button[contains(normalize-space(.), ${toXPathLiteral(text)})]`);
}

export function linkByText(text) {
  return By.xpath(`//a[contains(normalize-space(.), ${toXPathLiteral(text)})]`);
}

export function sidebarItemByText(text) {
  return By.xpath(`//div[contains(@class,'nav-item')][.//span[normalize-space(.)=${toXPathLiteral(text)}]]`);
}

export function headingByText(level, text) {
  return By.xpath(`//${level}[contains(normalize-space(.), ${toXPathLiteral(text)})]`);
}

export async function buildDriver() {
  const browser = config.browser.toLowerCase();

  if (browser === 'edge') {
    const options = new edge.Options().addArguments('--window-size=1440,1200');
    if (config.headless) {
      options.addArguments('--headless=new', '--disable-gpu');
    }

    const driver = await new Builder()
      .forBrowser(Browser.EDGE)
      .setEdgeOptions(options)
      .build();

    await driver.manage().window().setRect({ width: 1440, height: 1200 });
    await pause(500);
    return driver;
  }

  const options = new chrome.Options().addArguments('--window-size=1440,1200');
  if (config.headless) {
    options.addArguments('--headless=new', '--disable-gpu');
  }

  const driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(options)
    .setChromeService(new chrome.ServiceBuilder(chromedriver.path))
    .build();

  await driver.manage().window().setRect({ width: 1440, height: 1200 });
  await pause(500);
  return driver;
}

export async function waitForVisible(driver, locator, timeout = DEFAULT_TIMEOUT) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

export async function waitForInvisible(driver, locator, timeout = DEFAULT_TIMEOUT) {
  await driver.wait(async () => {
    const elements = await driver.findElements(locator);
    if (elements.length === 0) {
      return true;
    }

    return !(await elements[0].isDisplayed());
  }, timeout);
}

export async function click(driver, locator, timeout = DEFAULT_TIMEOUT) {
  const element = await waitForVisible(driver, locator, timeout);
  await driver.executeScript("arguments[0].scrollIntoView({ block: 'center' });", element);
  await driver.wait(until.elementIsEnabled(element), timeout);
  await pause();
  await element.click();
  await pause();
  return element;
}

export async function clearAndType(element, value) {
  await element.clear();
  await pause();
  for (const character of String(value)) {
    await element.sendKeys(character);
    await pause(config.typingDelayMs);
  }
  await pause();
}

export async function openApp(driver) {
  await driver.get(config.baseUrl);
  await waitForVisible(driver, By.css('body'));
  await pause(500);
}

export async function resetApp(driver) {
  await openApp(driver);
  await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
  await driver.manage().deleteAllCookies();
  await driver.navigate().refresh();
  await waitForVisible(driver, By.css('body'));
}

export async function navigateToLogin(driver) {
  await click(driver, linkByText('BEJELENTKEZÉS'));
  await waitForVisible(driver, By.css('.bejelentkezes-container'));
}

export async function loginWithDefaultUser(driver) {
  const existingDashboard = await driver.findElements(By.css('.dashboard-container'));
  if (existingDashboard.length > 0 && await existingDashboard[0].isDisplayed()) {
    return;
  }

  await resetApp(driver);
  await navigateToLogin(driver);
  await clearAndType(await waitForVisible(driver, By.id('email')), config.email);
  await clearAndType(await waitForVisible(driver, By.id('password')), config.password);
  await click(driver, By.css('button.submit-button'));
  await waitForVisible(driver, By.css('.dashboard-container'), 20000);
  await waitForTitle(driver, 'Dashboard');
}

export async function ensureLoggedIn(driver) {
  const dashboardContainers = await driver.findElements(By.css('.dashboard-container'));
  if (dashboardContainers.length > 0) {
    return;
  }

  await loginWithDefaultUser(driver);
}

export async function waitForToast(driver, text, timeout = DEFAULT_TIMEOUT) {
  const locator = By.css('.toast-notification');
  await waitForVisible(driver, locator, timeout);
  await driver.wait(async () => {
    const toast = await driver.findElement(locator);
    const toastText = await toast.getText();
    return toastText.includes(text);
  }, timeout, `A(z) ${text} toast nem jelent meg.`);
}

export async function waitForTitle(driver, text, timeout = DEFAULT_TIMEOUT) {
  const locator = By.css('.page-title h1 span');
  await waitForVisible(driver, locator, timeout);
  await driver.wait(async () => {
    const title = await driver.findElement(locator);
    return (await title.getText()).trim() === text;
  }, timeout, `A cím nem váltott erre: ${text}`);
}

export async function clickSidebarSection(driver, text) {
  await click(driver, sidebarItemByText(text));
  await waitForTitle(driver, text === 'Edzésterv' ? 'Edzésterv' : text);
}

export async function getBodyClass(driver) {
  const body = await waitForVisible(driver, By.css('body'));
  return body.getAttribute('class');
}

export async function isElementPresent(driver, locator) {
  const elements = await driver.findElements(locator);
  return elements.length > 0;
}

export async function countVisibleElements(driver, locator) {
  const elements = await driver.findElements(locator);
  let visibleCount = 0;

  for (const element of elements) {
    if (await element.isDisplayed()) {
      visibleCount += 1;
    }
  }

  return visibleCount;
}

export async function assertTextIncludes(driver, locator, expectedText) {
  const element = await waitForVisible(driver, locator);
  const text = await element.getText();
  assert.ok(
    text.includes(expectedText),
    `A várt szöveg nem található. Várt részlet: ${expectedText}, kapott: ${text}`
  );
}

export async function waitForElementCount(driver, locator, minimumCount, timeout = DEFAULT_TIMEOUT) {
  await driver.wait(async () => {
    const count = await countVisibleElements(driver, locator);
    return count >= minimumCount;
  }, timeout, `Nem lett meg a minimum ${minimumCount} elem.`);
}

export async function findMessageCardBySubject(driver, subject) {
  const locator = By.xpath(`//div[contains(@class,'user-message-thread')][.//h4[normalize-space(.)=${toXPathLiteral(subject)}]]`);
  return waitForVisible(driver, locator, 20000);
}

export async function waitForElementToDisappear(driver, locator, timeout = DEFAULT_TIMEOUT) {
  await driver.wait(async () => (await driver.findElements(locator)).length === 0, timeout);
}

export async function readInputType(driver, locator) {
  const element = await waitForVisible(driver, locator);
  return element.getAttribute('type');
}

export { By, assert, DEFAULT_TIMEOUT };