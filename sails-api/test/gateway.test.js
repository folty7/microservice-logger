const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const { redact } = require('../api/middlewares/requests-logger.js');
const createRateLimiter = require('../api/utils/rate-limiter.js');
const { proxyTo } = require('../api/utils/forward-request.js');

// Minimal stand-ins for the Express response and the Sails global the code relies on
const fakeRes = () => {
  const res = {
    statusCode: null,
    body: undefined,
    headers: {},
    listeners: [],
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
    json(body) { this.body = body; return this; },
    set(name, value) { this.headers[name] = value; return this; },
    on(event, fn) { this.listeners.push([event, fn]); },
    finish(statusCode) {
      this.statusCode = statusCode;
      this.listeners.filter(([event]) => event === 'finish').forEach(([, fn]) => fn());
    }
  };
  return res;
};

global.sails = { log: { info() {}, debug() {}, error() {} }, config: { services: {} } };

test('redact masks sensitive fields at any depth and case', () => {
  const input = {
    email: 'user@example.com',
    password: 'secret',
    Authorization: 'Bearer abc',
    nested: { list: [{ accessToken: 'abc' }], keep: 'visible' }
  };

  assert.deepStrictEqual(redact(input), {
    email: 'user@example.com',
    password: '***REDACTED***',
    Authorization: '***REDACTED***',
    nested: { list: [{ accessToken: '***REDACTED***' }], keep: 'visible' }
  });
});

test('redact passes through non-objects and stops at the depth limit', () => {
  assert.strictEqual(redact(undefined), undefined);
  assert.strictEqual(redact('plain'), 'plain');

  let deep = { value: 'bottom' };
  for (let i = 0; i < 12; i++) {
    deep = { deep };
  }
  assert.ok(JSON.stringify(redact(deep)).includes('[Truncated]'));
});

test('rate limiter blocks with 429 and Retry-After once the limit is reached', () => {
  const limit = createRateLimiter({ windowMs: 60000, max: 2 });
  const req = { ip: '10.0.0.1' };
  let allowed = 0;
  const proceed = () => allowed++;

  limit(req, fakeRes(), proceed);
  limit(req, fakeRes(), proceed);
  const blocked = fakeRes();
  limit(req, blocked, proceed);

  assert.strictEqual(allowed, 2);
  assert.strictEqual(blocked.statusCode, 429);
  assert.ok(blocked.headers['Retry-After']);
  assert.strictEqual(blocked.body.code, 429);
});

test('rate limiter keys on the client IP', () => {
  const limit = createRateLimiter({ windowMs: 60000, max: 1 });
  let allowed = 0;
  const proceed = () => allowed++;

  limit({ ip: '10.0.0.1' }, fakeRes(), proceed);
  limit({ ip: '10.0.0.2' }, fakeRes(), proceed);

  assert.strictEqual(allowed, 2);
});

test('countFailedOnly only counts responses that failed', () => {
  const limit = createRateLimiter({ windowMs: 60000, max: 1, countFailedOnly: true });
  const req = { ip: '10.0.0.3' };
  let allowed = 0;
  const proceed = () => allowed++;

  const ok = fakeRes();
  limit(req, ok, proceed);
  ok.finish(200);

  const second = fakeRes();
  limit(req, second, proceed);
  second.finish(401);

  const third = fakeRes();
  limit(req, third, proceed);

  assert.strictEqual(allowed, 2, 'the successful response did not consume the budget');
  assert.strictEqual(third.statusCode, 429, 'the failed response did');
});

test('proxyTo relays the upstream status and body', async () => {
  const upstream = http.createServer((req, res) => {
    res.writeHead(401, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ name: 'NotAuthenticated', message: 'Invalid login' }));
  });
  await new Promise((resolve) => upstream.listen(0, resolve));
  global.sails.config.services.users = { url: `http://127.0.0.1:${upstream.address().port}` };

  const res = fakeRes();
  await proxyTo('users', { method: 'POST', path: '/auth', body: {}, query: {}, headers: {}, ip: '10.0.0.1' }, res);
  upstream.close();

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.message, 'Invalid login');
});

test('proxyTo answers 502 when the service is unreachable', async () => {
  // Port 1 is not listening, so the connection is refused immediately
  global.sails.config.services.logs = { url: 'http://127.0.0.1:1' };

  const res = fakeRes();
  await proxyTo('logs', { method: 'GET', path: '/logs', query: {}, headers: {}, ip: '10.0.0.1' }, res);

  assert.strictEqual(res.statusCode, 502);
  assert.strictEqual(res.body.name, 'BadGateway');
});

test('proxyTo answers 504 when the service does not respond in time', async () => {
  const upstream = http.createServer(() => {}); // never answers
  await new Promise((resolve) => upstream.listen(0, resolve));
  global.sails.config.services.slow = { url: `http://127.0.0.1:${upstream.address().port}` };

  const res = fakeRes();
  const request = { method: 'GET', path: '/logs', query: {}, headers: {}, ip: '10.0.0.1' };
  await proxyTo('slow', request, res, { timeoutMs: 200 });
  upstream.close();

  assert.strictEqual(res.statusCode, 504);
  assert.strictEqual(res.body.name, 'GatewayTimeout');
});
