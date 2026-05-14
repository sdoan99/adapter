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
  exports.SymbolInfoProvider = void 0;
  var SymbolInfoProvider = /** @class */ (function () {
    function SymbolInfoProvider(url, requester) {
      this.cache = new Map();
      this.url = url;
      this.requester = requester;
    }
    SymbolInfoProvider.prototype.resolveSymbol = function (symbolName) {
      return __awaiter(this, void 0, void 0, function () {
        var response, symbolInfo, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
          switch (_c.label) {
            case 0:
              _c.trys.push([0, 2, , 3]);

              if (this.cache.has(symbolName)) {
                return [2 /*return*/, this.cache.get(symbolName)];
              }
              return [
                4 /*yield*/,
                this.requester.sendRequest("".concat(this.url, "/symbols"), {
                  symbol: symbolName,
                }),
              ];
            case 1:
              response = _c.sent();
              symbolInfo = {
                name: response.name || symbolName,
                ticker: response.ticker || symbolName,
                description: response.description || symbolName,
                type: response.type || "stock",
                session: response.session || "24x7",
                exchange: response.exchange || "DEFAULT",
                listed_exchange:
                  response.listed_exchange || response.exchange || "DEFAULT",
                timezone: response.timezone || "Etc/UTC",
                format: "price",
                minmov: response.minmov || 1,
                pricescale: response.pricescale || 100,
                minmov2: response.minmov2 || 0,
                fractional: response.fractional || false,
                has_intraday:
                  (_a = response.has_intraday) !== null && _a !== void 0
                    ? _a
                    : true,
                has_daily: true,
                has_weekly_and_monthly: true,
                visible_plots_set: response.visible_plots_set || "ohlcv",
                volume_precision:
                  (_b = response.volume_precision) !== null && _b !== void 0
                    ? _b
                    : 0,
                supported_resolutions: response.supported_resolutions || [
                  "1",
                  "5",
                  "15",
                  "30",
                  "60",
                  "1D",
                  "1W",
                  "1M",
                ],
                intraday_multipliers: response.intraday_multipliers || [
                  "1",
                  "5",
                  "15",
                  "30",
                  "60",
                ],
              };

              this.cache.set(symbolName, symbolInfo);
              return [2 /*return*/, symbolInfo];
            case 2:
              error_1 = _c.sent();
              console.error("SymbolInfoProvider error:", error_1);
              throw error_1;
            case 3:
              return [2 /*return*/];
          }
        });
      });
    };
    return SymbolInfoProvider;
  })();
  exports.SymbolInfoProvider = SymbolInfoProvider;

  if (typeof window !== "undefined") {
    window.SymbolInfoProvider = SymbolInfoProvider;
  }
});
