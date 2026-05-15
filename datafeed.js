(function (factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define([
      "require",
      "exports",
      "./requester",
      "./quotes-provider",
      "./streaming",
      "./history-provider",
      "./symbol-info-provider",
    ], factory);
  } else {
    factory(function (name) {
      if (name === "require" || name === "exports") return {};
      return window[name];
    }, window);
  }
})(function (require, exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Datafeed = void 0;
  var requester_1 = require("./requester");
  var quotes_provider_1 = require("./quotes-provider");
  var streaming_1 = require("./streaming");
  var history_provider_1 = require("./history-provider");
  var symbol_info_provider_1 = require("./symbol-info-provider");

  var Datafeed = /** @class */ (function () {
    function Datafeed(udfUrl, wsUrl) {
      this.tvToBackend = new Map([
        ["1", "1m"],
        ["3", "3m"],
        ["5", "5m"],
        ["15", "15m"],
        ["30", "30m"],
        ["60", "1h"],
        ["120", "2h"],
        ["180", "3h"],
        ["240", "4h"],
        ["360", "6h"],
        ["480", "8h"],
        ["720", "12h"],
        ["1D", "1d"],
        ["D", "1d"],
        ["3D", "3d"],
        ["1W", "1w"],
        ["W", "1w"],
        ["1M", "1M"],
        ["M", "1M"],
      ]);
      this.backendToTv = new Map([
        ["1m", "1"],
        ["3m", "3"],
        ["5m", "5"],
        ["15m", "15"],
        ["30m", "30"],
        ["1h", "60"],
        ["2h", "120"],
        ["3h", "180"],
        ["4h", "240"],
        ["6h", "360"],
        ["8h", "480"],
        ["12h", "720"],
        ["1d", "1D"],
        ["3d", "3D"],
        ["1w", "1W"],
        ["1M", "1M"],
      ]);
      this.udfUrl = udfUrl.replace(/\/$/, "");
      this.wsUrl = wsUrl;
      this.requester = new requester_1.Requester();
      this.quotesProvider = new quotes_provider_1.QuotesProvider(
        this.udfUrl,
        this.requester,
      );
      this.historyProvider = new history_provider_1.HistoryProvider(
        this.udfUrl,
        this.requester,
        this.tvToBackend,
        this.backendToTv,
      );
      this.symbolInfoProvider = new symbol_info_provider_1.SymbolInfoProvider(
        this.udfUrl,
        this.requester,
      );
      this.streaming = new streaming_1.StreamingDatafeed(
        wsUrl,
        this.tvToBackend,
        this.backendToTv,
      );
      console.log("📊 TradingView UDF Adapter initialized");
      console.log("   UDF Endpoint: ".concat(this.udfUrl));
      console.log("   WebSocket: ".concat(this.wsUrl));
      console.log(
        "   Supported Resolutions:",
        Array.from(this.tvToBackend.keys()),
      );
    }
    Datafeed.prototype.onReady = function (callback) {
      var _this = this;
      console.log("📡 onReady called");
      fetch("".concat(this.udfUrl, "/config"))
        .then(function (response) {
          return response.json();
        })
        .then(function (config) {
          // Server already returns resolutions in TV format — no mapping needed
          callback(config);
        })
        .catch(function (error) {
          console.error("Failed to fetch config:", error);

          callback({
            supports_search: true,
            supports_group_request: false,
            supported_resolutions: [
              "1",
              "5",
              "15",
              "30",
              "60",
              "240",
              "1D",
              "1W",
              "1M",
            ],
            supports_marks: false,
            supports_timescale_marks: false,
            supports_time: true,
            exchanges: [
              { value: "", name: "All Exchanges", desc: "" },
              { value: "NASDAQ", name: "NASDAQ", desc: "NASDAQ" },
              { value: "NYSE", name: "NYSE", desc: "NYSE" },
              { value: "CRYPTO", name: "Crypto", desc: "Cryptocurrency" },
            ],
            symbols_types: [
              { name: "All Types", value: "" },
              { name: "Stock", value: "stock" },
              { name: "Index", value: "index" },
              { name: "Crypto", value: "crypto" },
            ],
            intraday_multipliers: ["1", "5", "15", "30", "60"],
            has_intraday: true,
            has_daily: true,
            has_weekly_and_monthly: true,
            currency_codes: ["USD", "EUR", "GBP"],
          });
        });
    };
    Datafeed.prototype.searchSymbols = function (
      userInput,
      exchange,
      symbolType,
      onResult,
    ) {
      console.log('\uD83D\uDD0D Searching symbols: "'.concat(userInput, '"'));
      var url = new URL("".concat(this.udfUrl, "/search"));
      url.searchParams.append("query", userInput);
      if (exchange) url.searchParams.append("exchange", exchange);
      if (symbolType) url.searchParams.append("type", symbolType);
      url.searchParams.append("limit", "30");
      fetch(url.toString())
        .then(function (response) {
          return response.json();
        })
        .then(function (result) {
          return onResult(result);
        })
        .catch(function (error) {
          console.error("Search failed:", error);
          onResult([]);
        });
    };
    Datafeed.prototype.searchSymbolsPaginated = function (
      options,
      onResult,
    ) {
      console.log('\uD83D\uDD0D Paginated search: "'.concat(options.userInput, '" start=').concat(options.start));
      var url = new URL("".concat(this.udfUrl, "/search"));
      url.searchParams.append("query", options.userInput);
      if (options.exchange) url.searchParams.append("exchange", options.exchange);
      if (options.symbolType) url.searchParams.append("type", options.symbolType);
      url.searchParams.append("limit", "50");
      if (options.start) url.searchParams.append("start", String(options.start));
      fetch(url.toString())
        .then(function (response) {
          return response.json();
        })
        .then(function (result) {
          var items = result || [];
          // If fewer results returned than limit, no more pages
          var symbolsRemaining = items.length >= 50 ? 50 : 0;
          onResult(items, symbolsRemaining);
        })
        .catch(function (error) {
          console.error("Paginated search failed:", error);
          onResult([], 0);
        });
    };
    Datafeed.prototype.resolveSymbol = function (
      symbolName,
      onResolve,
      onError,
    ) {
      var _this = this;
      console.log('\uD83D\uDD0E Resolving symbol: "'.concat(symbolName, '"'));
      this.symbolInfoProvider
        .resolveSymbol(symbolName)
        .then(function (symbolInfo) {
          if (symbolInfo.supported_resolutions) {
            var seen = new Set();
            symbolInfo.supported_resolutions = symbolInfo.supported_resolutions
              // Server already returns TV-format resolutions — just deduplicate and validate
              .filter(function (res) {
                if (!/^(\d+[DWMST]?|[DWM])$/.test(res)) return false;
                if (seen.has(res)) return false;
                seen.add(res);
                return true;
              });
          }

          if (!symbolInfo.format) symbolInfo.format = "price";

          if (symbolInfo.timezone === "UTC") symbolInfo.timezone = "Etc/UTC";
          onResolve(symbolInfo);
        })
        .catch(function (error) {
          console.error("Symbol resolution failed:", error);
          onError("Symbol not found");
        });
    };

    Datafeed.prototype.getServerTime = function (callback) {
      fetch("".concat(this.udfUrl, "/time"))
        .then(function (response) { return response.text(); })
        .then(function (time) { return callback(parseInt(time, 10)); })
        .catch(function () {
          console.error("[datafeed] Failed to fetch server time, using local time");
          callback(Math.floor(Date.now() / 1000));
        });
    };

    Datafeed.prototype.getBars = function (
      symbolInfo,
      resolution,
      periodParams,
      onResult,
      onError,
    ) {
      var from = periodParams.from;
      var to = periodParams.to;
      var firstDataRequest = periodParams.firstDataRequest;
      var countBack = periodParams.countBack;

      console.log(
        "\uD83D\uDCCA Getting bars: "
          .concat(symbolInfo.name, " @ ")
          .concat(resolution, " from ")
          .concat(from, " to ")
          .concat(to),
      );

      this.historyProvider
        .getBars(symbolInfo, resolution, from, to, firstDataRequest, countBack)
        .then(function (result) {
          onResult(result.bars, {
            noData: result.noData,
            nextTime: result.nextTime,
          });
        })
        .catch(function (error) {
          console.error("Failed to get bars:", error);

          onResult([], { noData: true });
        });
    };

    Datafeed.prototype.subscribeBars = function (
      symbolInfo,
      resolution,
      onTick,
      listenerGuid,
      onResetCacheNeededCallback,
    ) {
      console.log("\uD83D\uDD04 Subscribing to bars: ".concat(listenerGuid));
      this.streaming.subscribeBars(
        symbolInfo.name,
        resolution,
        listenerGuid,
        onTick,
        onResetCacheNeededCallback,
      );
    };
    Datafeed.prototype.unsubscribeBars = function (subscriberUID) {
      console.log(
        "\uD83D\uDD04 Unsubscribing from bars: ".concat(subscriberUID),
      );
      this.streaming.unsubscribeBars(subscriberUID);
    };
    Datafeed.prototype.getQuotes = function (
      symbols,
      onDataCallback,
      onErrorCallback,
    ) {
      console.log(
        "\uD83D\uDCB1 Getting quotes for: ".concat(symbols.join(", ")),
      );
      this.quotesProvider
        .getQuotes(symbols)
        .then(function (quotes) {
          return onDataCallback(quotes);
        })
        .catch(function (error) {
          return onErrorCallback(error.message);
        });
    };
    Datafeed.prototype.disconnect = function () {
      console.log("🔌 Disconnecting datafeed");
      this.streaming.disconnect();
    };
    return Datafeed;
  })();
  exports.Datafeed = Datafeed;

  if (typeof window !== "undefined") {
    window.Datafeed = Datafeed;
  }
});
