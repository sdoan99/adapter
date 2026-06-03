# TradingView UDF Adapter & Datafeed API — Best Practices Checklist

Each item includes `[Context: line N]` referencing `/home/ubuntu/documentation/tradingview/charting-library-context.txt`. Items marked `[Supplementary]` are general best practices not prescribed by the TradingView docs.

---

## 1. Architecture Decision

### UDF Adapter (`Datafeeds.UDFCompatibleDatafeed`)
- [ ] Best for: quick prototyping, HTTP-only backends [Context: line 36461]
- [ ] No real-time streaming out of the box — REST polling via `updateFrequency` (default 10s) or extend `subscribeBars` [Context: line 36467-36509]
- [ ] Constructor: `new Datafeeds.UDFCompatibleDatafeed(url, updateFrequency?, limitedServerResponse?)` [Context: line 36501-36510]
- [ ] `limitedServerResponse = { maxResponseLength, expectedOrder }` for chunked responses [Context: line 36510]
- [ ] Fixed HTTP endpoints (`/config`, `/symbols`, `/history`, `/search`, `/time`, etc.) — no protocol flexibility [Context: line 36456, 36468]

### Custom Datafeed API
- [ ] Implement `IBasicDataFeed` / `IDatafeedChartApi` — full control, any transport (WebSocket, SSE, etc.) [Context: line 32885, 36991-36993]
- [ ] Pass to Widget constructor's `datafeed` property [Context: line 7464-7470]
- [ ] All callbacks must be **async** (`setTimeout(fn, 0)` if data ready synchronously) [Context: line 37286-37294]
- [ ] Reference implementation: TradingView's UDF adapter source [Context: line 37011]

---

## 2. Required Methods (Custom Datafeed API)

### `onReady(callback)`
- [ ] Return `DatafeedConfiguration`: `supported_resolutions`, `exchanges`, `symbols_types`, `supports_*` flags — called once at init, and again on `onResetCacheNeededCallback` [Context: line 15279, 37417-37447]

### `resolveSymbol(symbolName, onResolve, onError, extension?)`
- [ ] Return complete `LibrarySymbolInfo`: `name`, `ticker`, `description`, `type`, `session`, `exchange`, `timezone`, `minmov`, `pricescale`, `has_intraday`, `has_daily`, `has_weekly_and_monthly`, `supported_resolutions` [Context: line 33758-34178, 37496-37518]
- [ ] If name ≠ ticker, library resolves **twice** (by name, then ticker) [Context: line 37536-37546]
- [ ] `onError("unknown_symbol")` shows ghost icon on invalid symbols [Context: line 37548-37554]
- [ ] Handle `SymbolResolveExtension` for currency/unit conversion [Context: line 33640]

### `getBars(symbolInfo, resolution, periodParams, onHistory, onError)`
- [ ] Return bars **ascending** by time (milliseconds = Unix s * 1000) [Context: line 33344-33349, 37583]
- [ ] Daily bars: 00:00 UTC (trading day); monthly: first trading day [Context: line 36756-36757]
- [ ] Prices as numbers, not strings [Context: line 36758]
- [ ] `countBack` > `from` priority — return ALL existing data in range (never truncate) [Context: line 36704, 37603-37605]
- [ ] Return **≥ 2 bars** (single bar crashes on click) [Context: line 37602]
- [ ] `noData: true` when exhausted; use `nextTime` for sparse data [Context: line 36739-36752, 37606]
- [ ] Library caches historical bars automatically [Context: line 37577]

### `searchSymbols(userInput, exchange, symbolType, onResult)`
- [ ] Return `[{ symbol, full_name, description, exchange, ticker, type }]`; empty array if no matches [Context: line 37473-37490]
- [ ] For 1000+ symbols, implement `searchSymbolsPaginated` [Context: line 37070-37088]
- [ ] Adjust debounce via `symbol_search_request_delay` widget option [Context: line 37492]

### `subscribeBars(symbolInfo, resolution, onTick, listenerGuid, onResetCacheNeeded)`
- [ ] `onTick({ time, open, high, low, close, volume })` — matching time **replaces** bar, newer time **adds** bar [Context: line 37351-37352, 37722, 37735-37755]
- [ ] Cannot update historical bars — use `chart.resetData()` + `resetCache()` [Context: line 37728-37729]
- [ ] Pass copies of data objects (library may mutate) [Context: line 37296]

### `unsubscribeBars(listenerGuid)`
- [ ] Stop updates for this GUID; keep others alive. Library delays ~5s before calling this [Context: line 37365-37372, 37759-37761]

---

## 3. UDF Server-Side Endpoints

### `GET /config`
- [ ] Return `{ supports_search, supports_group_request, supported_resolutions, supports_marks, supports_timescale_marks, supports_time, exchanges, symbols_types }` [Context: line 36563-36580]
- [ ] One of `supports_search` or `supports_group_request` must be `true` [Context: line 36563-36564]
- [ ] Default fallback: `{ supported_resolutions: ["1","5","15","30","60","1D","1W","1M"], supports_group_request: true, supports_marks: false, supports_search: false, supports_timescale_marks: false }` [Context: line 36569-36581]

### `GET /symbol_info?group=<group>` (if `supports_group_request`)
- [ ] Response-as-a-table format: scalar = shared, array = per-symbol [Context: line 36590]
- [ ] Properties: `symbol`, `description`, `exchange_listed_name`, `minmovement`, `pricescale`, `has-intraday`, `has-daily`, `has-weekly-and-monthly`, `type`, `ticker`, `timezone`, `session-regular`, `supported-resolutions`, `intraday-multipliers`, `volume_precision`, `visible-plots-set` [Context: line 36603-36627]
- [ ] 404 for unknown groups; avoid if >100 symbols (use `supports_search` instead) [Context: line 36589, 36592]

### `GET /symbols?symbol=<s>` (if `supports_search`)
- [ ] Return full `LibrarySymbolInfo` JSON (response-as-a-table supported) [Context: line 36673-36686]

### `GET /search?query=<q>&type=<t>&exchange=<e>&limit=<n>` (if `supports_search`)
- [ ] Return `[{ symbol, full_name, description, exchange, ticker, type }]` filtered by type/exchange [Context: line 36656-36669]

### `GET /history?symbol=<s>&from=<t>&to=<t>&resolution=<r>&countback=<n>`
- [ ] Response: `{ s: "ok", t: [...], o: [...], h: [...], l: [...], c: [...], v: [...] }` — ascending order [Context: line 36710-36736]
- [ ] Or `{ s: "no_data", nextTime: <unix_s> }` / `{ s: "error", errmsg: "..." }` [Context: line 36718, 36723]
- [ ] Daily times = 00:00 UTC; monthly = first trading day [Context: line 36756-36757]
- [ ] Prices as numbers, min 2 bars, honor `countback` priority [Context: line 36704, 36758, 37602]

### `GET /time`
- [ ] Return plain Unix timestamp in **seconds** (not ms). Required if `supports_time: true` [Context: line 36834, 36844]

### Marks endpoints (optional)
- [ ] `GET /marks?symbol=<s>&from=<t>&to=<t>&resolution=<r>` — if `supports_marks` [Context: line 36763-36799]
- [ ] `GET /timescale_marks?symbol=<s>&from=<t>&to=<t>&resolution=<r>` — if `supports_timescale_marks` [Context: line 36803-36830]
- [ ] `GET /quotes?symbols=<s1>,<s2>,...` — Trading Platform only [Context: line 36849-36915]

---

## 4. WebSocket Streaming

### Connection Lifecycle
- [ ] Open WebSocket on first `subscribeBars` call [Supplementary]
- [ ] Reconnect with exponential backoff (1s → 2s → 4s → ... max 30s) [Supplementary]
- [ ] Heartbeat/ping-pong to detect stale connections [Supplementary]
- [ ] Authenticate WS connection (API key, JWT, or token) [Supplementary]
- [ ] Buffer updates during reconnection window, replay on reconnect [Supplementary]
- [ ] Close WS when last subscription is removed (with 5s grace) [Supplementary]

### Subscription Management
- [ ] Subscribe to symbol/resolution channel on WS; unsubscribe on `unsubscribeBars` [Supplementary]
- [ ] Fan one WS message to all matching `subscriberUID` via `onTick` [Supplementary]
- [ ] On reconnect: re-subscribe all active `listenerGuid` channels [Supplementary]

### UDF Adapter Modification Pattern
- [ ] Override `subscribeBars`/`unsubscribeBars` on the UDF adapter instance to wrap with WS, or wrap the UDF adapter in a custom datafeed that delegates REST to UDF and handles WS independently [Supplementary]
- [ ] Keep `updateFrequency` REST polling as fallback during WS disconnects [Supplementary]

```javascript
const df = new Datafeeds.UDFCompatibleDatafeed("https://api.example.com/udf");
const orig = df.subscribeBars.bind(df);
df.subscribeBars = (si, res, onTick, guid, onReset) => {
  orig(si, res, onTick, guid, onReset);
  if (!wsMap.has(guid)) {
    const ws = new WebSocket("wss://api.example.com/stream");
    ws.onmessage = (e) => {
      const t = JSON.parse(e.data);
      if (t.symbol === si.ticker) onTick({ time: t.t, open: t.o, high: t.h, low: t.l, close: t.c, volume: t.v });
    };
    wsMap.set(guid, ws);
  }
};
df.unsubscribeBars = (guid) => { wsMap.get(guid)?.close(); wsMap.delete(guid); };
```

- [ ] WebSocket is recommended for "really fast data updates" [Context: line 47995]

---

## 5. Widget Integration

- [ ] UDF: `new Datafeeds.UDFCompatibleDatafeed(url, updateFrequency?)` → Widget `datafeed` [Context: line 36501-36510, 7464-7470]
- [ ] Custom: pass `IBasicDataFeed` implementation [Context: line 7464-7470]
- [ ] Implement `DatafeedErrorCallback` for `resolveSymbol`, `getBars`, `searchSymbols` [Context: line 32780, 37518-37534]
- [ ] Handle non-OHLC data: `visible_plots_set: "c"` for close-only (line charts) [Context: line 37709-37714]
- [ ] `disabled_features` / `enabled_features` / `overrides` / `studies_overrides` — Widget constructor toggles [Context: line 35783-35803]
- [ ] `debug: true` during development only [Context: line 48011]

---

## 6. Production Hardening

- [ ] Own storage backend (not demo datafeed — unstable under load) [Context: line 34509, 48022-48024]
- [ ] CORS configured on library server [Context: line 34546-34551]
- [ ] HTTP/2, TLS 1.3, Gzip/Brotli compression [Context: line 48030-48035]
- [ ] Short cache expiry on `charting_library.js`; avoid Cloudflare Rocket Loader [Context: line 48040-48050]
- [ ] Rate-limit endpoints (`/symbols`, `/search`, `/history`) [Supplementary]
- [ ] Auth (API key / bearer) on datafeed endpoints [Supplementary]
- [ ] Health-check endpoint for monitoring [Supplementary]
- [ ] Log failed requests (symbol not found, invalid ranges) [Supplementary]
- [ ] Implement `getVolumeProfileResolutionForPeriod` if using Volume Profile [Context: line 37236-37240]
- [ ] Separate dev/staging/production environments and datafeed URLs [Supplementary]

---

## 7. Common Pitfalls

| Issue | Symptom | Fix | Source |
|-------|---------|-----|--------|
| Wrong bar timestamps | Shifted/no candles | Daily = 00:00 UTC; intraday = period start (ms) | [line 36756, 33344] |
| Missing `pricescale` | Too many decimals | `pricescale` = 10^decimal places | [line 33865] |
| No `noData` flag | Infinite spinner / retries | Return `{ s: "no_data", nextTime }` | [line 36005] |
| Single bar returned | Crash on click | Always return ≥ 2 bars | [line 37602] |
| String prices | Chart shows nothing | Prices must be numbers | [line 36758] |
| `supports_group_request` with 1000+ symbols | Slow load, high memory | Use `supports_search` | [line 36592] |
| Sync callbacks | Stack overflow | `setTimeout(fn, 0)` | [line 37286] |
| Bar time in seconds | No data shown | Must be **ms** (Unix s * 1000) | [line 33344] |
| `/time` returns ms | Countdown wrong | `/time` returns **seconds** | [line 36844] |
| Updating historical via subscribeBars | Time violation | Use `chart.resetData()` + `resetCache()` | [line 37727] |
| Stop updates during 5s unsubscribe delay | Flicker on switch | Keep sending until explicit `unsubscribeBars` | [line 37365] |
| Demo datafeed in production | Unstable / high-load failure | Implement own backend | [line 48022] |

---

## 8. Testing Checklist

- [ ] Chart loads with default symbol [Supplementary]
- [ ] Search returns matching symbols [Supplementary]
- [ ] Historical data loads for 1m, 5m, 1h, 1D, 1W, 1M [Supplementary]
- [ ] Scrolling past edge shows clean state (no infinite spinner) [Supplementary]
- [ ] Real-time updates flow (last bar refreshes, new bars appear) [Supplementary]
- [ ] WebSocket reconnect works (disconnect/reconnect cycle) [Supplementary]
- [ ] Symbol switching clean — no stale data, no flicker [Supplementary]
- [ ] No listener leaks on unsubscribe/resubscribe cycles [Supplementary]
- [ ] Multiple concurrent subscriptions deliver correct data [Supplementary]
- [ ] Server time countdown matches wall clock [Supplementary]
- [ ] Marks / timescale marks display correctly (if implemented) [Supplementary]
- [ ] Error states handled gracefully (no white screen, no infinite retries) [Supplementary]
- [ ] Cache reset path works: `chart.resetCache()` + `chart.resetData()` [Context: line 15277, 13754]
