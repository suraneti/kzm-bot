const Binance = require('node-binance-api');

// RxJS
const RxJS = require('rxjs');
const { Observable } = RxJS;

// API setting
const api = {
  key: 'IyYMZFZyZ5t6sD5OkbeLY3WQJHgU79W1qF5EtYaExFS8eupXPP5oJw1JTPLHsmP4',
  secret: 'BZCIK3s1x1OpidemXe8zotXe9acwqfYlFQ6CMQ3yT590xIrg8PrM6YPaCHACDV9q'
};

class BINANCE {
  constructor() {
    this.name = 'BNB';
    this.client = new Binance().options({
      APIKEY: api.key,
      APISECRET: api.secret,
      useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
      test: true // If you want to use sandbox mode where orders are simulated
    });
  }

  realtime() {
    return Observable.create(observer => {
      this.client.websockets.trades(['BTCUSDT', 'ETHUSDT', 'XLMUSDT'], trades => {
        let {
          e: eventType,
          E: eventTime,
          s: symbol,
          p: price,
          q: quantity,
          m: maker,
          a: tradeId
        } = trades;

        observer.next({
          name: symbol,
          rate: price
        });
      });
    });
  }
}

module.exports = new BINANCE();