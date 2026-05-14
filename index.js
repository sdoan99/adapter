(function (factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  } else if (typeof define === "function" && define.amd) {
    define([
      "require",
      "exports",
      "./datafeed",
      "./streaming",
      "./requester",
      "./quotes-provider",
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
  exports.SymbolInfoProvider =
    exports.HistoryProvider =
    exports.QuotesProvider =
    exports.Requester =
    exports.StreamingDatafeed =
    exports.Datafeed =
      void 0;

  var datafeed_1 = require("./datafeed");
  Object.defineProperty(exports, "Datafeed", {
    enumerable: true,
    get: function () {
      return datafeed_1.Datafeed;
    },
  });

  var streaming_1 = require("./streaming");
  Object.defineProperty(exports, "StreamingDatafeed", {
    enumerable: true,
    get: function () {
      return streaming_1.StreamingDatafeed;
    },
  });

  var requester_1 = require("./requester");
  Object.defineProperty(exports, "Requester", {
    enumerable: true,
    get: function () {
      return requester_1.Requester;
    },
  });

  var quotes_provider_1 = require("./quotes-provider");
  Object.defineProperty(exports, "QuotesProvider", {
    enumerable: true,
    get: function () {
      return quotes_provider_1.QuotesProvider;
    },
  });

  var history_provider_1 = require("./history-provider");
  Object.defineProperty(exports, "HistoryProvider", {
    enumerable: true,
    get: function () {
      return history_provider_1.HistoryProvider;
    },
  });

  var symbol_info_provider_1 = require("./symbol-info-provider");
  Object.defineProperty(exports, "SymbolInfoProvider", {
    enumerable: true,
    get: function () {
      return symbol_info_provider_1.SymbolInfoProvider;
    },
  });

  if (typeof window !== "undefined") {
    window.Datafeed = datafeed_1.Datafeed;
  }
});
