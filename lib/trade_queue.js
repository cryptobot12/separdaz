(function() {
  var TradeQueue, amqp, exports;

  amqp = require("amqp");

  TradeQueue = (function() {
    TradeQueue.prototype.connectionData = null;

    TradeQueue.prototype.openOrdersQueueName = null;

    TradeQueue.prototype.completedOrdersQueueName = null;

    TradeQueue.prototype.connection = null;

    TradeQueue.prototype.exchange = null;

    TradeQueue.prototype.exchangeOptions = {
      type: "direct",
      passive: false,
      durable: true,
      autoDelete: false
    };

    TradeQueue.prototype.queueOptions = {
      pasive: false,
      durable: true,
      exclusive: false,
      autoDelete: false
    };

    function TradeQueue(options) {
      this.connectionData = options.connection;
      this.openOrdersQueueName = options.openOrdersQueueName;
      this.completedOrdersQueueName = options.completedOrdersQueueName;
      this.onConnect = options.onConnect;
      this.onComplete = options.onComplete;
    }

    TradeQueue.prototype.connect = function() {
      var _this = this;
      this.connection = amqp.createConnection(this.connectionData);
      this.connection.on("ready", function() {
        console.log("queue connected");
        _this.exchange = _this.connection.exchange("coinx_exchange", _this.exchangeOptions);
        return _this.connection.queue(_this.openOrdersQueueName, _this.queueOptions, function(openOrdersQueue) {
          openOrdersQueue.bind(_this.exchange, "coinx_pending_indata");
          return _this.connection.queue(_this.completedOrdersQueueName, _this.queueOptions, function(completedOrdersQueue) {
            completedOrdersQueue.bind(_this.exchange, "coinx_pending_outdata");
            completedOrdersQueue.subscribe(_this.onComplete);
            if (_this.onConnect) {
              return _this.onConnect(_this);
            }
          });
        });
      });
      return this.connection.on("error", function() {
        return console.error("queue error ", arguments);
      });
    };

    TradeQueue.prototype.publishOrder = function(body, callback) {
      console.log("Publishing to queue ", body);
      return this.exchange.publish("coinx_pending_indata", body, null, callback);
    };

    return TradeQueue;

  })();

  exports = module.exports = TradeQueue;

}).call(this);