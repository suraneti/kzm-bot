const fs = require('fs')

class LOGGER {

    log(msg) {
        msg = JSON.stringify(msg, null, 4)
        fs.writeFile("trade.json", msg, function (err) {
            if (err) {
                return console.log(err)
            }
        })
    }
}

module.exports = new LOGGER()