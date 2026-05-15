var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
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
  exports.HistoryProvider = void 0;
  var HistoryProvider = /** @class */ (function () {
    function HistoryProvider(url, requester, tvToBackend, backendToTv) {
      this.url = url;
      this.requester = requester;
      this.tvToBackend = tvToBackend;
      this.backendToTv = backendToTv;
      this.barCache = new Map();
      this.barCacheTTL = 30000;
    }
    HistoryProvider.prototype.getBars = function (
      symbolInfo,
      resolution,
      from,
      to,
      firstDataRequest,
      countBack,
    ) {
      return __awaiter(this, void 0, void 0, function () {
        var backendResolution,
          fromNum,
          toNum,
          validFrom,
          validTo,
          params,
          response,
          bars,
          i,
          error_1;
        var _a;
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              _b.trys.push([0, 2, , 3]);
              backendResolution =
                this.tvToBackend.get(resolution) || resolution;

              fromNum =
                typeof from === "number" ? from : parseInt(String(from), 10);
              toNum = typeof to === "number" ? to : parseInt(String(to), 10);

              validFrom = isNaN(fromNum)
                ? Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
                : fromNum;
              validTo = isNaN(toNum) ? Math.floor(Date.now() / 1000) : toNum;

              params = {
                symbol: symbolInfo.ticker || symbolInfo.name,
                resolution: backendResolution,
                from: validFrom,
                to: validTo,
              };
              if (countBack) params.countback = countBack;

              // Check cache before making a request
              var cacheKey = "".concat(params.symbol, "_").concat(params.resolution, "_").concat(params.from, "_").concat(params.to);
              var cached = this.barCache.get(cacheKey);
              if (cached && Date.now() - cached.timestamp < this.barCacheTTL) {
                return [2 /*return*/, cached.data];
              }

              return [
                4 /*yield*/,
                this.requester.sendRequest(
                  "".concat(this.url, "/history"),
                  params,
                ),
              ];
            case 1:
              response = _b.sent();
              if (response.s === "error") {
                throw new Error(response.errmsg || "Unknown error");
              }
              if (
                response.s === "no_data" ||
                !response.t ||
                response.t.length === 0
              ) {
                var noDataResult = {
                  bars: [],
                  noData: true,
                  nextTime: response.nextTime
                    ? response.nextTime * 1000
                    : undefined,
                };
                this.barCache.set(cacheKey, { data: noDataResult, timestamp: Date.now() });
                return [2 /*return*/, noDataResult];
              }
              bars = [];
              for (i = 0; i < response.t.length; i++) {
                bars.push({
                  time: response.t[i] * 1000,
                  open: response.o[i],
                  high: response.h[i],
                  low: response.l[i],
                  close: response.c[i],
                  volume:
                    (_a = response.v) === null || _a === void 0
                      ? void 0
                      : _a[i],
                });
              }
              this.barCache.set(cacheKey, { data: { bars: bars }, timestamp: Date.now() });
              // Evict old entries if cache grows too large
              if (this.barCache.size > 50) {
                var oldestKey = this.barCache.keys().next().value;
                this.barCache.delete(oldestKey);
              }
              return [2 /*return*/, { bars: bars }];
            case 2:
              error_1 = _b.sent();
              console.error("HistoryProvider error:", error_1);
              throw error_1;
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    return HistoryProvider;
  })();
  exports.HistoryProvider = HistoryProvider;

  if (typeof window !== "undefined") {
    window.HistoryProvider = HistoryProvider;
  }
});
