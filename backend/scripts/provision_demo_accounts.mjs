import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config/env.js';
import { supabaseAdmin } from '../src/config/supabase.js';

// Must match the password pre-filled on the login page (frontend/src/pages/auth/LoginPage.jsx).
const PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || 'DemoPassword123!';

const ACCOUNTS = [
  { email: 'sarah.consumer@wattwise.ai', fullName: 'Sarah Jenkins', role: 'CONSUMER' },
  { email: 'marcus.industrial@wattwise.ai', fullName: 'Marcus Vance', role: 'INDUSTRIAL' },
  { email: 'admin.gov@wattwise.ai', fullName: 'Dr. Elena Rostova', role: 'GOVERNMENT_ADMIN' },
];

function fail(message) {
  console.error(`\nERROR: ${message}`);
  process.exit(1);
}

if (!supabaseAdmin) {
  fail('SUPABASE_SECRET_KEY is not configured in backend/.env; demo accounts need the service-role key.');
}

async function listAllUsers() {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) fail(`Could not list auth users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

async function upsertAuthUser(account, existing) {
  const attributes = {
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { ...(existing?.user_metadata || {}), full_name: account.fullName, role: account.role },
  };

  const { data, error } = existing
    ? await supabaseAdmin.auth.admin.updateUserById(existing.id, attributes)
    : await supabaseAdmin.auth.admin.createUser({ email: account.email, ...attributes });
  if (error) fail(`${account.email}: ${existing ? 'update' : 'create'} failed: ${error.message}`);
  return data.user;
}

async function upsertProfile(account, userId) {
  // The signup trigger can only assign CONSUMER or INDUSTRIAL, so the role is set here.
  const { error } = await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      email: account.email,
      full_name: account.fullName,
      role: account.role,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) fail(`${account.email}: profile upsert failed: ${error.message}`);
}

async function verifySignIn(account) {
  const client = createClient(config.supabase.url, config.supabase.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({ email: account.email, password: PASSWORD });
  if (error) fail(`${account.email}: sign-in failed: ${error.message}`);

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();
  const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
  if (signOutError) fail(`${account.email}: verification sign-out failed: ${signOutError.message}`);

  if (profileError) fail(`${account.email}: profile read under RLS failed: ${profileError.message}`);
  if (profile?.role !== account.role) {
    fail(`${account.email}: expected role ${account.role}, profile has ${profile?.role ?? 'no row'}.`);
  }
}

const users = await listAllUsers();

for (const account of ACCOUNTS) {
  const existing = users.find((user) => (user.email || '').toLowerCase() === account.email);
  const user = await upsertAuthUser(account, existing);
  await upsertProfile(account, user.id);
  await verifySignIn(account);
  console.log(`${existing ? 'Updated' : 'Created'} ${account.email} -> ${account.role} (sign-in and role verified)`);
}

console.log(
  `\nPassword: ${process.env.DEMO_ACCOUNT_PASSWORD ? 'value of DEMO_ACCOUNT_PASSWORD' : 'the login page demo password'}.`
);
