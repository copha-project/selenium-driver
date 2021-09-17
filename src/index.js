const { Driver } = require('copha')

class MyDriver extends Driver {
    constructor(conf) {
        super(conf)
        // you can get value use this.conf.Driver
    }
    async init() {
        // default this.driver = this
    }

    async open(url) {
    }

    async clear() {

    }

    async sleep(n) {

    }

    buildSelector(k,v){

    }
    getKey(name){

    }

    async findElements(v){

    }
    async findElement(v){

    }
}

module.exports = MyDriver
