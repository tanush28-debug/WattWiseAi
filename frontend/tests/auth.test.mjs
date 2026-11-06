import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

const source = await readFile(new URL('../src/services/authService.js', import.meta.url), 'utf8');

const setup = async (configured = true) => {
  const storage = new Map();
  const calls = {};
  const user = { id: 'auth-test-id', user_metadata: { role: 'GOVERNMENT_ADMIN', full_name: 'Editable Name' } };
  const state = {
    authUser: user,
    session: { access_token: 'test-session' },
    response: { success: true, user: { id: user.id, role: 'CONSUMER', fullName: 'Trusted Name', organizationId: null } },
    profileError: null,
    authError: null,
    logoutError: null,
    updateError: null,
  };
  const auth = {
    getUser: async () => ({ data: { user: state.authUser }, error: state.authError }),
    signInWithPassword: async (payload) => {
      calls.login = payload;
      return { data: { user, session: state.session }, error: state.authError };
    },
    signUp: async (payload) => {
      calls.signup = payload;
      return { data: { user: { ...user, identities: [{}] }, session: state.session }, error: state.authError };
    },
    signOut: async (payload) => { calls.logout = payload; return { error: state.logoutError }; },
    resetPasswordForEmail: async (email, options) => {
      calls.recovery = { email, options };
      return { error: state.authError };
    },
    updateUser: async (payload) => { calls.update = payload; return { error: state.updateError }; },
  };
  const apiClient = {
    get: async (path) => {
      calls.profile = path;
      if (state.profileError) throw state.profileError;
      return state.response;
    },
  };
  const context = createContext({
    window: { location: { origin: 'http://localhost:3001' } },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  });
  const dependencies = {
    './supabaseClient': { supabase: { auth }, isSupabaseConfigured: configured },
    './api': { apiClient },
    '../config/constants': { USER_ROLES: { CONSUMER: 'CONSUMER', INDUSTRIAL: 'INDUSTRIAL', GOVERNMENT: 'GOVERNMENT' } },
  };
  const module = new SourceTextModule(source, { context });
  await module.link((specifier) => {
    const exports = dependencies[specifier];
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
  });
  await module.evaluate();
  return { service: module.namespace.authService, state, calls, storage, user };
};

const credentials = { email: ' auth@example.test ', password: 'TestPassword123!' };

test('login uses trusted profile identity rather than metadata', async () => {
  const { service, calls } = await setup();
  const result = await service.login(credentials);
  assert.equal(result.user.role, 'CONSUMER');
  assert.equal(result.user.fullName, 'Trusted Name');
  assert.equal(result.user.isVerified, true);
  assert.equal(calls.login.email, 'auth@example.test');
});

test('government database role maps to government routing', async () => {
  const { service, state } = await setup();
  state.response.user.role = 'GOVERNMENT_ADMIN';
  assert.equal((await service.login(credentials)).user.role, 'GOVERNMENT');
});

test('login fails closed when the profile endpoint is unavailable', async () => {
  const { service, state } = await setup();
  state.profileError = new Error('Profile unavailable');
  await assert.rejects(service.login(credentials), /Profile unavailable/);
});

test('invalid profile roles and mismatched identities are rejected', async () => {
  const { service, state } = await setup();
  for (const role of ['GOVERNMENT', '__proto__', 'ADMIN']) {
    state.response.user.role = role;
    await assert.rejects(service.login(credentials), /Unable to verify/);
  }
  state.response.user.role = 'CONSUMER';
  state.response.user.id = 'another-user';
  await assert.rejects(service.login(credentials), /Unable to verify/);
});

test('session restoration surfaces profile verification failures', async () => {
  const { service, state } = await setup();
  state.profileError = new Error('Profile unavailable');
  await assert.rejects(service.getCurrentUser(), /Profile unavailable/);
});

test('session events can resolve a user without reentering Supabase auth', async () => {
  const { service, state, user } = await setup();
  state.authError = new Error('Auth must not be reentered');
  assert.equal((await service.getCurrentUser(user)).role, 'CONSUMER');
});

test('missing sessions restore as signed out', async () => {
  const { service, state, calls } = await setup();
  state.authUser = null;
  assert.equal(await service.getCurrentUser(), null);
  assert.equal(calls.profile, undefined);
});

test('immediate signup returns the normalized trusted profile', async () => {
  const { service, state, calls } = await setup();
  state.response.user.role = 'INDUSTRIAL';
  const result = await service.register({ ...credentials, fullName: ' Auth Test ', accountType: 'INDUSTRIAL' });
  assert.equal(result.user.role, 'INDUSTRIAL');
  assert.equal(result.user.fullName, 'Trusted Name');
  assert.equal(result.needsVerification, false);
  assert.equal(calls.signup.options.data.full_name, 'Auth Test');
  assert.equal(calls.signup.options.emailRedirectTo, 'http://localhost:3001/login?role=INDUSTRIAL');
});

test('signup requiring email confirmation does not authenticate a user', async () => {
  const { service, state, calls } = await setup();
  state.session = null;
  const result = await service.register({ ...credentials, fullName: 'Auth Test', accountType: 'CONSUMER' });
  assert.equal(result.user, null);
  assert.equal(result.needsVerification, true);
  assert.equal(calls.profile, undefined);
});

test('government self-registration is rejected before Supabase is called', async () => {
  const { service, calls } = await setup();
  await assert.rejects(service.register({ ...credentials, fullName: 'Auth Test', accountType: 'GOVERNMENT' }), /Self-registration/);
  assert.equal(calls.signup, undefined);
});

test('logout errors are not silently treated as success', async () => {
  const { service, state, storage } = await setup();
  storage.set('wattwise_active_user', 'existing-session');
  state.logoutError = new Error('Sign out failed');
  await assert.rejects(service.logout(), /Sign out failed/);
  assert.equal(storage.get('wattwise_active_user'), 'existing-session');
});

test('successful logout clears only this browser session', async () => {
  const { service, calls, storage } = await setup();
  storage.set('wattwise_active_user', 'existing-session');
  await service.logout();
  assert.equal(calls.logout.scope, 'local');
  assert.equal(storage.has('wattwise_active_user'), false);
});

test('password updates require a valid session', async () => {
  const { service, state, calls } = await setup();
  state.authUser = null;
  await assert.rejects(service.resetPassword('NewPassword123!'), /valid recovery session/);
  assert.equal(calls.update, undefined);
});

test('successful password updates end the recovery session', async () => {
  const { service, calls } = await setup();
  await service.resetPassword('NewPassword123!');
  assert.equal(calls.update.password, 'NewPassword123!');
  assert.equal(calls.logout.scope, 'local');
});

test('failed password updates do not report success or sign out', async () => {
  const { service, state, calls } = await setup();
  state.updateError = new Error('Password update failed');
  await assert.rejects(service.resetPassword('NewPassword123!'), /Password update failed/);
  assert.equal(calls.logout, undefined);
});

test('password recovery trims email and preserves the recovery route', async () => {
  const { service, calls } = await setup();
  await service.forgotPassword(' auth@example.test ');
  assert.equal(calls.recovery.email, 'auth@example.test');
  assert.equal(calls.recovery.options.redirectTo, 'http://localhost:3001/reset-password');
});

test('demo mode cannot pretend to send email or update passwords', async () => {
  const { service } = await setup(false);
  await assert.rejects(service.forgotPassword('auth@example.test'), /unavailable in demo mode/);
  await assert.rejects(service.resetPassword('NewPassword123!'), /unavailable in demo mode/);
});
