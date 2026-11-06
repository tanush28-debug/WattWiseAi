import express from 'express';
import app from '../src/app.js';
import { uploadBillMiddleware } from '../src/middleware/uploadMiddleware.js';
import { authenticateUser, optionalAuth } from '../src/middleware/authMiddleware.js';
import { requireRole } from '../src/middleware/roleMiddleware.js';
import { supabase } from '../src/config/supabase.js';

const results = [];
const check = (name, cond) => {
  results.push({ name, pass: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
};

// 1. Unauthenticated bill routes must be rejected with 401
const server = app.listen(0);
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;

for (const [method, path] of [
  ['GET', '/api/v1/bills'],
  ['POST', '/api/v1/bills/upload'],
  ['PATCH', '/api/v1/bills/00000000-0000-0000-0000-000000000000/confirm'],
  ['DELETE', '/api/v1/bills/00000000-0000-0000-0000-000000000000'],
]) {
  const res = await fetch(base + path, { method });
  check(`${method} ${path} unauthenticated → 401`, res.status === 401);
}
await new Promise((r) => server.close(r));

const originalGetUser = supabase.auth.getUser;
const originalFetch = globalThis.fetch;
const identity = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'auth-test@example.test',
  user_metadata: { role: 'GOVERNMENT_ADMIN' },
};
let profile = { id: identity.id, role: 'CONSUMER', full_name: 'Auth Test', is_active: true };
let profileFailure = false;
let authFailure = null;
let tokenChecks = 0;

const runAuthentication = async (authorization, middleware = authenticateUser) => {
  const req = { headers: authorization === undefined ? {} : { authorization } };
  const result = { status: null, body: null, next: false, req };
  const res = {
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; },
  };
  await middleware(req, res, () => { result.next = true; });
  return result;
};

try {
  supabase.auth.getUser = async (token) => {
    ++tokenChecks;
    const error = token === 'demo-jwt-token' ? { status: 400, message: 'untrusted-detail' } : authFailure;
    return { data: { user: error ? null : identity }, error };
  };
  globalThis.fetch = async () => new Response(
    JSON.stringify(profileFailure ? { message: 'private-database-detail' } : profile ? [profile] : []),
    { status: profileFailure ? 400 : 200, headers: { 'Content-Type': 'application/json' } },
  );

  for (const header of [undefined, '', 'Basic token', 'Bearer ', 'Bearer token extra']) {
    const before = tokenChecks;
    const result = await runAuthentication(header);
    check(`Malformed auth header ${JSON.stringify(header)} rejected before token lookup`, result.status === 401 && tokenChecks === before);
  }
  let result = await runAuthentication('Bearer demo-jwt-token');
  check('Static demo token cannot authenticate', result.status === 401 && !result.req.user);
  check('Provider error details are not exposed', !JSON.stringify(result.body).includes('untrusted-detail'));

  result = await runAuthentication('bearer verified-token');
  check('Verified profile overrides editable metadata', result.next && result.req.user.role === 'CONSUMER');
  check('Trusted profile name is used', result.req.user.fullName === 'Auth Test');

  profile = null;
  result = await runAuthentication('Bearer verified-token');
  check('Missing profile cannot fall back to metadata', result.status === 403 && !result.req.user);

  profile = { role: 'INDUSTRIAL', is_active: false };
  result = await runAuthentication('Bearer verified-token');
  check('Inactive accounts are denied', result.status === 403 && !result.req.user);

  profile = { role: 'GOVERNMENT', is_active: true };
  result = await runAuthentication('Bearer verified-token');
  check('Unknown profile roles are denied', result.status === 403 && !result.req.user);

  profileFailure = true;
  result = await runAuthentication('Bearer verified-token');
  check('Profile query failure denies authentication with 503', result.status === 503 && !result.req.user);
  check('Database errors are not exposed', !JSON.stringify(result.body).includes('private-database-detail'));

  profileFailure = false;
  authFailure = { status: 503 };
  result = await runAuthentication('Bearer verified-token');
  check('Auth provider outages return 503', result.status === 503);
  authFailure = { status: 401 };
  result = await runAuthentication('Bearer verified-token');
  check('Expired sessions return 401', result.status === 401);

  result = await runAuthentication(undefined, optionalAuth);
  check('Optional auth permits requests without credentials', result.next && result.req.user === null);
  result = await runAuthentication('Basic token', optionalAuth);
  check('Optional auth rejects malformed supplied credentials', result.status === 401);

  for (const [role, expected] of [['GOVERNMENT_ADMIN', true], ['GOVERNMENT', false], ['CONSUMER', false]]) {
    let permitted = false;
    let deniedStatus;
    requireRole('GOVERNMENT_ADMIN')(
      { user: { role } },
      { status(code) { deniedStatus = code; return this; }, json() {} },
      () => { permitted = true; },
    );
    check(`Government route role ${role}`, permitted === expected && (expected || deniedStatus === 403));
  }
} finally {
  supabase.auth.getUser = originalGetUser;
  globalThis.fetch = originalFetch;
}

// 2. Magic-byte validation in isolation (auth is checked before multer on real routes)
const isolated = express();
isolated.post('/upload', uploadBillMiddleware, (req, res) => {
  res.json({ ok: true, mimetype: req.file?.mimetype, size: req.file?.size });
});
const isoServer = isolated.listen(0);
await new Promise((r) => isoServer.once('listening', r));
const isoBase = `http://127.0.0.1:${isoServer.address().port}`;

const sendFile = async (bytes, fileName, type) => {
  const fd = new FormData();
  fd.append('file', new Blob([bytes], { type }), fileName);
  return fetch(`${isoBase}/upload`, { method: 'POST', body: fd });
};

let res = await sendFile(Buffer.from('this is definitely not a document'), 'fake.pdf', 'application/pdf');
check('Fake PDF content rejected with 400', res.status === 400);

const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
res = await sendFile(pngBytes, 'photo.jpg', 'image/jpeg');
check('PNG content renamed .jpg rejected with 400', res.status === 400);

res = await sendFile(Buffer.from('%PDF-1.7\n'), 'bill.pdf', 'application/pdf');
check('Valid PDF accepted and MIME trusted', res.status === 200);

res = await sendFile(pngBytes, 'bill.png', 'image/png');
check('Valid PNG accepted', res.status === 200);

await new Promise((r) => isoServer.close(r));

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exitCode = failed.length ? 1 : 0;
