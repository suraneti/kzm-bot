const chalk = require('chalk')
const moment = require('moment');

// Notify
const NOTIFY = require('../services/notify')

// Debug
const DEBUG = true

const buyUnit = 10                              // Buy unit
const gap = 0.1                                 // Gap price
const startBudget = 10000                       // Start budget

const buyHistory = []                           // Buy history 
const sellHistory = []                          // Sell history

var initData = false                            // For init data first time
var budget = startBudget                        // Budget
var ceilingPrice = 0                            // Ceiling price
var floorPrice = 0                              // Floor price
var buyStack = 0                                // Limit of buy times not more than 10 times
var lastRate = 0                                // Last rate of buy or sell action
var bag = []                                    // Bag that store item prepared for selling
var setSell = []                                // Current selling list of item


function buy(rate) {
    return new Promise((resolve, reject) => {
        // Have enought budget to buy
        if (budget - (rate * buyUnit) > 0) {
            buyObject = { 'buy_rate': rate, 'sell_rate': rate + gap, 'unit': buyUnit }
            bag.push(buyObject)
            buyHistory.push(buyObject)
            budget -= rate * buyUnit
            buyStack += 1

            if (initData) lastRate = rate

            if (DEBUG) console.log(chalk.blueBright('[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']'), chalk.green("CURRENT BUDGET: " + budget), chalk.yellow('BUY ' + (rate * buyUnit)))

            // show current profit
            if (initData) {
                const payload = {
                    timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                    budget: budget,
                    bag: bag,
                    buyHistory: buyHistory,
                    setSell: setSell,
                    sellHistory: sellHistory,
                    startBudget: startBudget
                }

                NOTIFY.info(payload)
            }


            // Dont Have enought budget to buy
        } else {
            if (DEBUG) console.log(chalk.blueBright('[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']'), chalk.red("NOT ENOUGHT MONEY TO BUY"), chalk.blue('RATE:', rate))
        }

        resolve()
    })
}

function sell(rate) {
    let findIndex = bag.findIndex(obj => obj['sell_rate'] === rate)

    // No item in bag for set sell
    if (findIndex === -1) {
        // Find item in setSell for sell out
        findIndex = setSell.findIndex(obj => obj['sell_rate'] === rate)

        // Found item in setSell then sell out
        if (findIndex !== -1) {
            sellHistory.push(setSell[findIndex])
            setSell = removeFromArray(setSell, setSell[findIndex])
            buyStack -= 1
            budget += rate * buyUnit
            lastRate = rate

            console.log(chalk.blueBright('[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']'), chalk.green('FOUND ITEM IN setSell'))
            if (DEBUG) console.log(chalk.blueBright('[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']'), chalk.green("CURRENT BUDGET: " + budget), chalk.cyan('SELL OUT ' + (rate * buyUnit)))

            // Find closest rate of incoming rate for sell out
        } else {
            if (setSell.length) {
                const result = []
                setSell.forEach(element => {
                    result.push(Math.abs(element['sell_rate'] - rate))
                })

                // Find closest rate of incoming rate
                const closestRate = result.reduce(function (prev, curr) {
                    return (Math.abs(curr - 0) < Math.abs(prev - 0) ? curr : prev)
                })
                const findClosestRateIndex = result.findIndex(value => value === closestRate)

                // Closest rate must less than incoming rate
                if (setSell[findClosestRateIndex]['sell_rate'] <= rate) {
                    buyStack -= 1
                    budget += rate * buyUnit
                    lastRate = rate

                    console.log(chalk.blueBright('[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']'), chalk.green('FIND CLOSEST ITEM IN setSell'), chalk.blue('INCOMING RATE:', rate), chalk.yellow('CLOSEST RATE:', setSell[findClosestRateIndex]['sell_rate']))
                    if (DEBUG) console.log(chalk.blueBright('[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']'), chalk.green("CURRENT BUDGET: " + budget), chalk.cyan('SELL OUT ' + (setSell[findClosestRateIndex]['sell_rate'] * buyUnit)))

                    sellHistory.push(setSell[findClosestRateIndex])
                    setSell = removeFromArray(setSell, setSell[findClosestRateIndex])

                    // show current profit
                    if (initData) {
                        const payload = {
                            timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                            budget: budget,
                            bag: bag,
                            buyHistory: buyHistory,
                            setSell: setSell,
                            sellHistory: sellHistory,
                            startBudget: startBudget
                        }

                        NOTIFY.info(payload)
                    }
                }
            }
        }

        // have item in bag for set sell 
    } else {
        setSell.push(bag[findIndex])
        if (initData) lastRate = rate

        if (DEBUG) console.log(chalk.blueBright('[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']'), chalk.green("CURRENT BUDGET: " + budget), chalk.blue('SET SELL ' + (rate * buyUnit)))

        bag = removeFromArray(bag, bag[findIndex])

        // show current profit
        if (initData) {
            const payload = {
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                budget: budget,
                bag: bag,
                buyHistory: buyHistory,
                setSell: setSell,
                sellHistory: sellHistory,
                startBudget: startBudget
            }

            NOTIFY.info(payload)
        }
    }

}

function makeDecision(rate) {
    return new Promise((resolve, reject) => {
        // Ininital first buy and set first sell 
        if (buyStack === 0 && initData === false) {
            initialData(rate).then(() => {
                resolve()
            })
        } else {
            calculateGap(rate).then(() => {
                resolve()
            })
        }
    })
}

function initialData(rate) {
    return new Promise((resolve, reject) => {
        // Init ceilingPrice and floorPrice
        ceilingPrice = rate + 0.5
        floorPrice = rate - 0.5
        if (DEBUG) console.log(chalk.blueBright('[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']'), chalk.yellow('CEILING PRICE:', ceilingPrice), chalk.red('FLOOR PRICE:', floorPrice), 'Enter price:', rate)

        // Different value of ceiling price and incoming rate base on gap 
        const diffValue = Math.round((ceilingPrice - rate) / gap)

        // Buy item until reach ceilingPrice limit and set sell for each buying
        for (let i = 0; i <= diffValue; i++) {
            if (i === 0) {
                buy(rate)
                sell(rate + gap)
            } else {
                buy(rate + (i * gap))
                sell(rate + (i * gap) + gap)
            }
        }

        lastRate = rate
        initData = true
        resolve()
    })
}

function calculateGap(rate) {
    return new Promise((resolve, reject) => {
        // Do action when reach gap limit
        if (Math.abs(lastRate - rate).toFixed(2) >= gap) {

            // lastRate more than incoming rate then buy and set sell
            if (lastRate > rate) {

                // buyStack must not more than 10     
                if (buyStack <= 10) {
                    // Check this rate already set to sell
                    const findIndex = setSell.findIndex(obj => obj['buy_rate'] === rate)
                    if (findIndex === -1) {
                        buy(rate).then(() => {
                            sell(rate + gap)
                        })
                    }
                }

                // lastRate less than incoming rate then set sell
            } else {
                sell(rate)
            }

        } else if (lastRate === rate) {
            resolve()

            // different value less than gap
        } else {
            if (DEBUG) console.log(chalk.blueBright('[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']'), chalk.yellow('DIFF VALUE LESS THAN GAP'), chalk.blue('LAST RATE:', lastRate), chalk.magenta('LATEST RATE:', rate), chalk.red('GAP:', Math.abs(lastRate - rate).toFixed(10)))
        }

        resolve()
    })
}

function removeFromArray(array, value) {
    const idx = array.indexOf(value)
    if (idx !== -1) array.splice(idx, 1)
    return array
}

module.exports = {

    decision(rate) {
        makeDecision(rate)
    }

}
