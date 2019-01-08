const WS = require('ws');

class SOCKET {
  constructor(socket) {
    this.socket = socket;
  }

  connect() {
    let _pingTimeoutHnd = false;
    let client = new WebSocket(this.socket);

    const reConnect = () => {
      clearTimeout(_pingTimeoutHnd);
      if (!client) {
        return;
      }
      try {
        clearInterval(client.timer);
        client.terminate();
        client = null;
      } catch (e) {}

      let countDown = 3;
      let hnd = setInterval(() => {
        if (countDown < 1) {
          clearInterval(hnd);
          this.connect();
        } else {
          Debug.warn(`WS_RE_CONNECT_IN_${countDown}`);
        }
        countDown--;
      }, 1000);
    };

    const ack = () => {
      clearTimeout(_pingTimeoutHnd);
      _pingTimeoutHnd = setTimeout(function() {
        Debug.log('ON_PING Timeout');
        reConnect();
      }, 5000);
    };

    // open connection
    client.on('open', function() {
      Debug.log('ON_WS_OPEN');
      resolve();
      ack();
    });

    client.on('ping', function() {
      Debug.log('ON_WS_PING');
      ack();
    });

    // Receive message
    client.on('message', data => {
      Debug.log('ON_WS_MESSAGE');
      ack();
      const json = JSON.parse(data);
      const trades = json.trades;
      Debug.log(data.toString());

      // Shift last rate from trade stack
      const last = Array.from(trades).shift();
      const rate = +last.rate;

      // Execute trade
      queuing
        .push({
          id: last.trade_id,
          rate: rate
        })
        .on('finish', rate => {
          Debug.print(`LAST RATE ON QUEUE: ${rate}`);
        })
        .on('failed', error => {
          console.error('QUEUE ERROR:', error);
        });
    });

    client.on('error', e => {
      Debug.err('ON_WS_ERROR');
      Debug.err('SOCKET HAS PROBLEM, RECONNECTING!!');
      if (Debug.enable) {
        console.log(e);
      }
      reConnect();
    });

    client.on('close', function() {
      Debug.log('ON_WS_CLOSE');
      Debug.err('SOCKET HAS PROBLEM, RECONNECTING!!');
      reConnect();
    });
  }
}

module.exports = SOCKET;