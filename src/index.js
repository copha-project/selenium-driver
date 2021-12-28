const path = require('path')
const { By, until, Key, Builder } = require('selenium-webdriver')
const webdriver = require('selenium-webdriver')
const proxy = require('selenium-webdriver/proxy')
const firefox = require('selenium-webdriver/firefox')
const chrome = require('selenium-webdriver/chrome')

const { Driver } = require('copha')
const browserDriver = require('browser-driver')
const Config = require('./config.json')

class Selenium extends Driver {
    DriverModule = webdriver
    constructor(conf) {
        super(conf)
    }
    static CONFIG = Config
    async init() {
        try {
            let driverBuilder = new Builder()
            this.setBrowser(driverBuilder)
            this.setDriverServer(driverBuilder)

            this.setOptions(driverBuilder)
            this.setPreference(driverBuilder)
            await this.setProxy(driverBuilder)
            this.driver = await driverBuilder.build()

            // if(this.conf.main.driver == 'chrome'){
            //     const service = chrome.getDefaultService()
            //     this.log.debug(`Chrome driverService on : ${await service.address()}`)
            // }

            await this.driver.manage().setTimeouts(
                {
                    pageLoad: this.appSettings?.Driver?.Time?.PageLoadTimeout || 10000,
                    implicit: 10000
                }
            )

            // TODO: connect a session existed
            // await this.driver.close()
            // this.driver.session_.then(e=>{e.id_='45464456981325fe775059d49db180ce'})

        } catch (error) {
            throw new Error(`Driver init failed : ${error.message}`)
        }
        this.log.info('web driver init end')
    }
    setBrowser(driverBuilder){
        driverBuilder.forBrowser(this.conf?.Browser)
    }
    setDriverServer(driverBuilder){
        if(this.conf?.RemoteServer){
            driverBuilder.usingServer(this.conf.RemoteServer)
            // SELENIUM_REMOTE_URL=http://127.0.0.1:50011
            return
        }
        switch (this.conf?.Browser) {
            case 'firefox':
                driverBuilder.setFirefoxService(new firefox.ServiceBuilder(browserDriver.firefox))
                break;
            case 'chrome':
                driverBuilder.setChromeService(new chrome.ServiceBuilder(browserDriver.chrome))
                break
            default:
                throw Error('not support driver!')
        }
    }
    setOptions(driverBuilder){
        let options = null
        switch (this.conf?.Browser) {
            case 'chrome':
                {
                    options = new chrome.Options()
                    if(this.conf?.BrowserProfile){
                        options.addArguments(`user-data-dir=${this.conf.BrowserProfile}`)
                    }
                    options.setUserPreferences({
                        'download.default_directory': path.resolve(this.projectConfig.main.dataPath,'download')
                    })

                    options.addArguments('disable-blink-features=AutomationControlled')

                    options.excludeSwitches('enable-automation')

                    driverBuilder.withCapabilities(webdriver.Capabilities.chrome())
                        .setChromeOptions(options)
                }
                break;
            default:
                {
                    options = new firefox.Options()
                    if(this.projectConfig.main.useProxy){
                        options.setPreference("network.proxy.socks_remote_dns", true)
                    }
                    driverBuilder.withCapabilities(webdriver.Capabilities.firefox())
                        .setFirefoxOptions(options)
                }
        }
        if(this.getEnv("COPHA_SHOW_HEADLESS_GUI")){

        }else{
            if (this.projectConfig.main.debug) {

            }else{
                options.headless()
            }
        }

    }
    async setProxy(driverBuilder){
        const _setProxy = async () => {
            const proxyInfo = await this.getProxy()
            const proxyString = `${proxyInfo.host}:${proxyInfo.port}`
            switch (proxyInfo.type) {
                case 'socks':
                    driverBuilder.setProxy(proxy.socks(proxyString, 5))
                    break;
                case 'http':
                case 'https':
                    driverBuilder.setProxy(proxy.manual({http:proxyString,https:proxyString}))
                    break
                default:
                    throw new Error('proxy type not support')
            }
            this.log.warn(`Task run with proxy: ${proxyString}`)
        }
        if(process.env['COPHA_USE_PROXY']){
            return _setProxy()
        }else{
            if (this.projectConfig.main.useProxy) {
                return _setProxy()
            }
        }
    }
    setPreference(driverBuilder){

    }
    async open(url, options = {ignoreErr:false, ignoreTimeout: false}) {
        if(!url) {
            throw Error(`open url can't be blank`)
        }
        // 3次重试
        const maxCount = 3
        let count = 1
        try {
            await this.driver.get(url)
        } catch (error) {
            if(error.message.includes('ERR_CONNECTION_RESET') && !options.ignoreErr) {
                throw Error('ERR_CONNECTION_RESET')
            }
            if(error.name === 'TimeoutError') {
                if(!options.ignoreTimeout){
                    throw Error('selenium module open(): TimeoutError')
                }
            }else{
                while (count <= maxCount) {
                    this.log.warn(`refresh it again ${count}/${maxCount}`)
                    try {
                        await this.driver.get(url)
                        break
                    } catch (error) {
                        this.log.err(`open url err: ${error}`)
                        count++
                    }
                }
            }

        }
    }

    async clear() {
        try {
            await this.driver?.quit?.()
        } catch (error) {
            this.log.err(`clear web driver err: ${error.message}`)
        } finally{
            this.driver = null
        }
    }

    async sleep(n) {
        return this.driver.sleep(n)
    }

    async reload(){
        return this.driver.navigate().refresh()
    }

    async refresh(){
        return this.driver.navigate().refresh()
    }

    async takeScreenshot(node, scroll=false){
        if(node){
            return node.takeScreenshot(scroll)
        }
        const body = await this.findElementByCss('body')
        return body.takeScreenshot(scroll)
    }

    async getAttribute(node, attr){
        return node.getAttribute(attr)
    }
    /**
     * for test
     */
    async getTitle(){
        return this.driver.getTitle()
    }

    getCurrentUrl(){
        return this.driver.getCurrentUrl()
    }

    buildSelector(k,v){
        return By[k](v)
    }
    getKey(name){
        return Key[name.toUpperCase()]
    }
    async findElements(v){
        return this.driver.findElements(v)
    }
    async findElement(v){
        return this.driver.findElement(v)
    }

    async waitTwoTab() {
        const maxCount = 30
        const waitTime = 1000
        let count = 1
        while (count <= maxCount) {
            await this.driver.sleep(waitTime)
            const whs = await this.driver.getAllWindowHandles()
            if (whs.length == 2) return
            if(whs.length>2){
                throw Error(`waitTwoTab error: tab nums ${whs.length}`)
            }
            count++
        }
        throw Error('waitTwoTab error: timeout')
    }
    async waitExecFunc(funcName) {
        const maxCount = 3
        const waitTime = 1000
        let count = 1
        while (count <= maxCount) {
            const funcExist = await this.driver.executeScript((f) => eval("typeof " + f), funcName)
            if (funcExist == 'function') return
            count++
            await this.driver.navigate().refresh()
            await this.driver.sleep(waitTime)
        }
        throw Error(`Not find the function: ${funcName}`)
    }
    async swithToNewTab(){
        const whs = await this.driver.getAllWindowHandles()
        await this.driver.switchTo().window(whs[1])
    }
    async closeCurrentTab() {
        const whs = await this.driver.getAllWindowHandles()
        await this.driver.close()
        await this.driver.switchTo().window(whs[0])
    }
    async clearTab(){
        const whs = await this.driver.getAllWindowHandles()
        for (let i = 1; i < whs.length; i++) {
            await this.driver.switchTo().window(whs[i])
            await this.driver.close()
        }
        await this.driver.switchTo().window(whs[0])
    }

    // method not need change, they has be implement by above method
    buildSelectorForId(v){
        return this.buildSelector('id', v)
    }
    buildSelectorForXpath(v){
        return this.buildSelector('xpath', v)
    }
    buildSelectorForCss(v){
        return this.buildSelector('css', v)
    }

    async findElementBy(k, v, target){
        if(target){
            return target.findElement(this.buildSelector(k,v))
        }
        return this.findElement(this.buildSelector(k,v))
    }
    async findElementByXpath(v, target){
        return this.findElementBy('xpath', v, target)
    }
    async findElementByCss(v, target){
        return this.findElementBy('css', v, target)
    }
    async findElementById(v, target){
        return this.findElementBy('id', v, target)
    }

    async findElementsBy(k, v, target){
        if(target){
            return target.findElements(this.buildSelector(k,v))
        }
        return this.findElements(this.buildSelector(k,v))
    }
    async findElementsByCss(v, target){
        return this.findElementsBy('css', v, target)
    }
    async findElementsByXpath(v, target){
        return this.findElementsBy('xpath', v, target)
    }
}

module.exports = Selenium
