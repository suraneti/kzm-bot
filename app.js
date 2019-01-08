const DECISION = require('./services/decision')

var Queue = require('better-queue');

// BINANCE.COM
const BN = require('./exchanges/binance.com')
BN.realtime().subscribe(pair => {
    // const channel = `${BN.name}/${pair.name}`;

    // ETH/USDT
    if (pair.name === 'ETHUSDT') {
        var queue = new Queue(function (input, cb) {
            DECISION.decision(parseFloat(input)).then(() => {
                cb(null, result);
            })
        })

        queue.push(pair.rate)
    }
})
