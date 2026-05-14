(function (factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define(["require", "exports"], factory);
  } else {
    factory(function (name) {
      if (name === "require" || name === "exports") return {};
      return window[name];
    }, window);
  }
})(function (require, exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamingDatafeed = void 0;
  var StreamingDatafeed = /** @class */ (function () {
    function StreamingDatafeed(wsUrl, tvToBackend, backendToTv) {
      this.ws = null;
      this.subscribers = new Map();
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 10;
      this.reconnectDelay = 1000;
      this.wsUrl = wsUrl;
      this.tvToBackend = tvToBackend;
      this.backendToTv = backendToTv;
      this.connect();
    }
    StreamingDatafeed.prototype.connect = function () {
      var _this = this;
      try {
        console.log("[streaming] Connecting to WebSocket:", this.wsUrl);
        this.ws = new WebSocket(this.wsUrl);
        this.ws.onopen = function () {
          console.log("[streaming] WebSocket connected");
          _this.reconnectAttempts = 0;
          _this.reconnectDelay = 1000;
          _this.resubscribeAll();
        };
        this.ws.onmessage = function (event) {
          try {
            var message = JSON.parse(event.data);
            _this.handleMessage(message);
          } catch (e) {
            console.error("[streaming] Failed to parse message:", e);
          }
        };
        this.ws.onclose = function (event) {
          console.log(
            "[streaming] WebSocket disconnected:",
            event.code,
            event.reason,
          );
          _this.reconnect();
        };
        this.ws.onerror = function (error) {
          console.error("[streaming] WebSocket error:", error);
        };
      } catch (error) {
        console.error("[streaming] Connection failed:", error);
        this.reconnect();
      }
    };
    StreamingDatafeed.prototype.reconnect = function () {
      var _this = this;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("[streaming] Max reconnection attempts reached");
        return;
      }
      setTimeout(function () {
        _this.reconnectAttempts++;
        _this.reconnectDelay = Math.min(_this.reconnectDelay * 2, 30000);
        console.log(
          "[streaming] Reconnecting (attempt ".concat(
            _this.reconnectAttempts,
            ")...",
          ),
        );
        _this.connect();
      }, this.reconnectDelay);
    };
    StreamingDatafeed.prototype.resubscribeAll = function () {
      var _this = this;
      this.subscribers.forEach(function (item) {
        _this.sendSubscription(
          item.symbol,
          item.resolution,
          item.subscriberUID,
        );
      });
    };
    StreamingDatafeed.prototype.subscribeBars = function (
      symbol,
      resolution,
      subscriberUID,
      onTick,
      onReady,
      onError,
    ) {
      var _a;
      var key = "".concat(symbol, "_").concat(resolution);
      if (!this.subscribers.has(key)) {
        this.subscribers.set(key, {
          symbol: symbol,
          resolution: resolution,
          subscriberUID: subscriberUID,
          handlers: new Map(),
        });
      }
      var subscriber = this.subscribers.get(key);
      subscriber.handlers.set(subscriberUID, onTick);
      if (
        ((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) ===
        WebSocket.OPEN
      ) {
        this.sendSubscription(symbol, resolution, subscriberUID);
      }
      onReady === null || onReady === void 0 ? void 0 : onReady();
    };
    StreamingDatafeed.prototype.sendSubscription = function (
      symbol,
      resolution,
      subscriberUID,
    ) {
      if (!this.ws) return;
      var backendResolution = this.tvToBackend.get(resolution) || resolution;
      var message = {
        action: "subscribe",
        channel: symbol,
        resolution: backendResolution,
        subscriberUID: subscriberUID,
      };
      console.log("[streaming] Sending subscription:", message);
      this.ws.send(JSON.stringify(message));
    };
    StreamingDatafeed.prototype.handleMessage = function (message) {
      if (message.type === "bar") {
        var tvResolution =
          this.backendToTv.get(message.resolution) || message.resolution;
        var key = "".concat(message.channel, "_").concat(tvResolution);
        var subscriber = this.subscribers.get(key);
        if (subscriber) {
          var bar_1 = {
            time: Math.floor(message.data.time / 1000),
            open: message.data.open,
            high: message.data.high,
            low: message.data.low,
            close: message.data.close,
            volume: message.data.volume,
          };
          subscriber.handlers.forEach(function (handler) {
            try {
              handler(bar_1);
            } catch (e) {
              console.error("[streaming] Handler error:", e);
            }
          });
        }
      } else if (message.type === "subscribed") {
        console.log("[streaming] Successfully subscribed to:", message.channel);
      } else if (message.type === "error") {
        console.error("[streaming] Server error:", message);
      } else if (message.type === "pong") {
      }
    };
    StreamingDatafeed.prototype.unsubscribeBars = function (subscriberUID) {
      var _this = this;
      this.subscribers.forEach(function (item, key) {
        var _a;
        if (item.handlers.has(subscriberUID)) {
          item.handlers.delete(subscriberUID);
          if (
            item.handlers.size === 0 &&
            ((_a = _this.ws) === null || _a === void 0
              ? void 0
              : _a.readyState) === WebSocket.OPEN
          ) {
            var message = {
              action: "unsubscribe",
              channel: item.symbol,
              subscriberUID: item.subscriberUID,
            };
            _this.ws.send(JSON.stringify(message));
            _this.subscribers.delete(key);
          }
        }
      });
    };
    StreamingDatafeed.prototype.disconnect = function () {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.subscribers.clear();
    };
    return StreamingDatafeed;
  })();
  exports.StreamingDatafeed = StreamingDatafeed;

  if (typeof window !== "undefined") {
    window.StreamingDatafeed = StreamingDatafeed;
  }
});
