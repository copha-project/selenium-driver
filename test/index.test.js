const Driver = require('../index')
const TaskTestConfig = require('./task.test.conf.json')
const pkg = require('../package')

TaskTestConfig.main.driver = 'selenium'
TaskTestConfig.Driver = Driver.CONFIG

;(async ()=>{
    const driver = new Driver(TaskTestConfig)
    await driver.init()
    await driver.open(pkg.repository)
    console.log(await driver.getTitle())
})()
