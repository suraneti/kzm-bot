const chalk = require('chalk')
const fs = require('fs')

const ceilingPrice = 3000                       // Ceiling price
const floorPrice = 2900                         // Floor price
const gap = (ceilingPrice - floorPrice) / 10    // Gap price

const buyHistory = []                           // Buy history 
const sellHistory = []                          // Sell history

var initData = false                            // For init data first time
var budget = 500000                             // Budget
var buyStack = 0                                // Limit of buy times not more than 10 times
var lastRate = 0                                // Last rate of buy or sell action
var bag = []                                    // Bag that store item prepared for selling
var setSell = []                                // Current selling list of item

function initialData() {
    return new Promise((resolve, reject) => {
        fs.readFile('mockup.json', function (err, data) {
            mockupData = JSON.parse(data)
            console.log(chalk.red('TOTAL TEST TRANSACTION :', mockupData.length))
            resolve(mockupData)
        })
    })
}

function buy(rate) {
    return new Promise((resolve, reject) => {
        if (budget - (rate * gap) > 0) {
            buyObject = { 'buy_rate': rate, 'sell_rate': rate + gap, 'unit': gap }
            bag.push(buyObject)
            buyHistory.push(buyObject)
            budget -= rate * gap
            buyStack += 1
            if (initData) lastRate = rate
            console.log(chalk.green("CURRENT BUDGET: " + budget), chalk.yellow('BUY ' + (rate * gap)))
            resolve(true)
        } else {
            console.log(chalk.yellow("NOT ENOUGHT MONEY TO BUY"))
        }
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
            budget += rate * gap
            lastRate = rate
            console.log(chalk.green("CURRENT BUDGET: " + budget), chalk.cyan('SELL OUT ' + (rate * gap)))

            // Find closest rate of incoming rate for sell out
        } else {
            if (setSell.length) {
                const result = []
                setSell.forEach(element => {
                    result.push(Math.abs(element['sell_rate'] - rate))
                })

                const closestRate = result.reduce(function (prev, curr) {
                    return (Math.abs(curr - 0) < Math.abs(prev - 0) ? curr : prev)
                })

                const findClosestRateIndex = result.findIndex(value => value === closestRate)

                sellHistory.push(setSell[findClosestRateIndex])
                setSell = removeFromArray(setSell, setSell[findClosestRateIndex])
                buyStack -= 1
                budget += rate * gap
                lastRate = rate
                console.log(chalk.green("CURRENT BUDGET: " + budget), chalk.cyan('SELL OUT ' + (rate * gap)))
            }
        }

        // have item in bag for set sell 
    } else {
        setSell.push(bag[findIndex])
        if (initData) lastRate = rate
        bag = removeFromArray(bag, bag[findIndex])
        console.log(chalk.green("CURRENT BUDGET: " + budget), chalk.blue('SET SELL ' + (rate * gap)))
    }
}

function makeDecision(rate) {
    // Different value of ceiling price and incoming rate base on gap 
    const diffValue = Math.round((ceilingPrice - rate) / gap)

    // Ininital first buy and set first sell 
    return new Promise((resolve, reject) => {
        // Init data on first buyStack
        if (buyStack === 0) {

            // Buy item until reach ceilingPrice limit and set sell for each buying
            for (let i = 0; i <= diffValue; i++) {
                if (i === 0) {
                    buy(rate).then(() => {
                        sell(rate + gap)
                    })
                } else {
                    buy(rate + (i * 10)).then(() => {
                        sell(rate + (i * 10) + gap)
                    })
                }
            }
            lastRate = rate
            resolve({ 'first_init': true })

        } else {
            resolve({ 'first_init': false })
        }

    }).then((resp) => {
        // first init data do nothing
        if (resp['first_init']) initData = true

        // do something when first init is set
        else {
            // Do action when reach gap limit
            if (Math.abs(lastRate - rate).toFixed(2) >= gap) {

                // lastRate more than incoming rate then buy and set sell
                if (lastRate > rate) {

                    // buyStack must not more than 10     
                    if (buyStack <= 10) {
                        // Check this rate already set to sell
                        const findIndex = setSell.findIndex(obj => obj['buy_rate'] === rate)
                        if (findIndex === -1) {
                            buy(rate)
                            sell(rate + gap)
                        }
                    }

                    // lastRate less than incoming rate then set sell
                } else {
                    sell(rate)
                }

                // lastRate equal incoming rate
            } else if (lastRate - rate === 0) {
                sell(rate)

                // different value less than gap
            } else {
                console.log(chalk.yellow('DIFF VALUE LESS THAN GAP'), chalk.blue('LAST RATE:', lastRate), chalk.magenta('LATEST RATE:', rate), chalk.red('GAP:', Math.abs(lastRate - rate).toFixed(10)))
            }
        }
    })
}

function notify() {
    console.log(chalk.red("BUDGET BALANCE ON FINISH TEST: " + budget))

    console.log(chalk.magenta('BUY ITEM IN BAG:'))
    console.table(bag)

    console.log(chalk.magenta('BUY OUT HISTORY'))
    console.table(buyHistory)

    console.log(chalk.magenta('CURRENT SET SELL ITEM:'))
    console.table(setSell)

    console.log(chalk.magenta('SELL OUT HISTORY'))
    console.table(sellHistory)

    const profit = 100 / (500000 / (budget - 500000))
    console.log(chalk.magenta('PROFIT: ', profit + '%'))

    setSell.forEach(element => {
        budget += element['sell_rate'] * gap
    })
    const bestProfit = 100 / (500000 / (budget - 500000))
    console.log(chalk.cyan('BEST PROFIT: ', bestProfit + '%', '(IF SELL ALL IN STOCK)'))
}

function removeFromArray(array, value) {
    const idx = array.indexOf(value)
    if (idx !== -1) array.splice(idx, 1)
    return array
}

initialData().then((mockupData) => {
    return new Promise((resolve, reject) => {
        mockupData.forEach(element => {
            makeDecision(element[0])
        })
        resolve()

    }).then(() => {
        notify()
    })
})

