const chalk = require('chalk')

const LOGGER = require('./logger')

class NOTIFY {

    info(data) {
        // console.log(chalk.magenta('BUY ITEM IN BAG:'))
        // console.table(data.bag)

        // console.log(chalk.magenta('BUY OUT HISTORY'))
        // console.table(data.buyHistory)

        // console.log(chalk.magenta('CURRENT SET SELL ITEM:'))
        // console.table(data.setSell)

        // console.log(chalk.magenta('SELL OUT HISTORY'))
        // console.table(data.sellHistory)

        const profit = 100 / (data.startBudget / (data.budget - data.startBudget))
        console.log(chalk.magenta('PROFIT: ', profit + '%'))

        console.log('-----------------------------------------------------------')

        // Log
        const msg = { 'timestamp': data.timestamp, 'bag_item': data.bag, 'buy_out': data.buyHistory, 'sell_out': data.sellHistory, 'current_sell': data.setSell, 'profit': parseFloat(profit), 'budget': data.budget }
        LOGGER.log(msg)

        // setSell.forEach(element => {
        //     budget += element['sell_rate'] * gap
        // })
        // const bestProfit = 100 / (500000 / (budget - startBudget))
        // console.log(chalk.cyan('BEST PROFIT: ', bestProfit + '%', '(IF SELL ALL IN STOCK)'))
    }

    profit(data) {
        const profit = 100 / (500000 / (data.budget - data.startBudget))
        console.log(chalk.magenta('PROFIT: ', profit + '%'))
    }
}

module.exports = new NOTIFY();