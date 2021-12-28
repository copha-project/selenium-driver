const {Builder, By, Key, until} = require('selenium-webdriver');
const uni = require('uni-utils')
const browserDriver = require('browser-driver')
const chrome = require('selenium-webdriver/chrome')

;(async function example() {
  let driverBuilder = new Builder()
  driverBuilder.setChromeService(new chrome.ServiceBuilder(browserDriver.chrome))

  let driver = await driverBuilder
  .forBrowser('chrome')
  .build();
  try {
    await driver.get('https://google.com');
    // await driver.findElement(By.name('q'));.sendKeys('webdriver', Key.RETURN);
    // await driver.wait(until.titleIs('webdriver - Google Search'), 1000);
    await uni.countdown(10)
  } finally {
    await driver.quit();
  }
})();
