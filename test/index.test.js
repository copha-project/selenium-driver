const Driver = require('../index')

const diver = new Driver({})

driver.open('https://copha.com').then(res=>{
    console.log(driver.getTitle())
})
