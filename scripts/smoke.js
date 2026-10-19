/* End-to-end smoke test — spawns its own server on PORT 3100 with an isolated
   data dir, runs the suite, then shuts down. Safe to run anytime. */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'riamxo-test-'));

let passed = 0;
let failed = 0;

function check(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; console.log(`FAIL  ${name} ${extra}`); }
}

function waitForServer(child, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(async () => {
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error('server did not start in time'));
      }
      try {
        const res = await fetch(`${BASE}/`);
        if (res.status === 200) { clearInterval(timer); resolve(); }
      } catch { /* not up yet */ }
    }, 200);
    child.on('exit', (code) => { clearInterval(timer); reject(new Error(`server exited early (${code})`)); });
  });
}

async function api(path, { method = 'GET', token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  return { status: res.status, data };
}

(async () => {
  const child = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: String(PORT), DATA_DIR: TMP },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));

  try {
    await waitForServer(child);
    await runSuite();
  } finally {
    child.kill();
    try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* ignore */ }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('SMOKE TEST CRASH', e); process.exit(1); });

async function runSuite() {
  // static assets
  for (const p of ['/', '/css/styles.css', '/js/app.js', '/js/pages.js', '/js/aviator.js', '/js/charts.js', '/js/ui.js', '/js/api.js']) {
    const res = await fetch(`${BASE}${p}`);
    check(`GET ${p}`, res.status === 200);
  }

  // auth
  const admin = await api('/api/auth/register', { method: 'POST', body: { full_name: 'Test Admin', email: `admin${Date.now()}@t.co`, password: 'secret123' } });
  check('register admin (first user gets role=admin)', admin.status === 201 && admin.data.user.role === 'admin');
  const adminToken = admin.data.token;

  const email = `user${Date.now()}@t.co`;
  const user = await api('/api/auth/register', { method: 'POST', body: { full_name: 'Test User', email, password: 'secret123', phone: '0712000000' } });
  check('register member', user.status === 201 && user.data.user.role === 'user');
  const userToken = user.data.token;

  const badLogin = await api('/api/auth/login', { method: 'POST', body: { email, password: 'wrong' } });
  check('login with wrong password rejected', badLogin.status === 401);

  const dup = await api('/api/auth/register', { method: 'POST', body: { full_name: 'Dup User', email, password: 'secret123' } });
  check('duplicate email rejected', dup.status === 409);

  const me = await api('/api/auth/me', { token: userToken });
  check('GET /me', me.status === 200 && me.data.user.email === email);
  check('password hash not leaked', me.data.user.password_hash === undefined);

  const profile = await api('/api/auth/me', { method: 'PUT', token: userToken, body: { phone: '0733111222', bio: 'Hello' } });
  check('PUT /me updates profile', profile.status === 200 && profile.data.user.phone === '0733111222');

  // submissions
  const noAuth = await api('/api/submissions');
  check('submissions require auth', noAuth.status === 401);

  const png = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000' + '1f15c4890000000d49444154789c626001000000ffff030000060005', 'hex');
  const form = new FormData();
  form.append('phone_number', '0733111222');
  form.append('views', '120');
  form.append('screenshot', new Blob([png], { type: 'image/png' }), 'proof.png');
  const sub = await api('/api/submissions', { method: 'POST', token: userToken, form });
  check('submit views (120 x 100 = 12000)', sub.status === 201 && sub.data.submission.earnings === 12000, JSON.stringify(sub.data));

  const form2 = new FormData();
  form2.append('phone_number', '0733111222');
  form2.append('views', '10');
  form2.append('screenshot', new Blob([png], { type: 'image/png' }), 'p.png');
  const sub2 = await api('/api/submissions', { method: 'POST', token: userToken, form: form2 });
  check('24h cooldown enforced (429)', sub2.status === 429);

  const list = await api('/api/submissions', { token: userToken });
  check('GET submissions + cooldown_ms present', list.status === 200 && list.data.cooldown_ms > 0 && list.data.submissions.length === 1);

  // uploaded image is publicly served
  const imgRes = await fetch(`${BASE}${sub.data.submission.image_url}`);
  check('uploaded screenshot served', imgRes.status === 200);

  // stats
  const stats = await api('/api/stats/dashboard', { token: userToken });
  check('stats available balance = 12000', stats.status === 200 && stats.data.summary.available_balance === 12000);
  check('stats trend has 7 days', stats.data.trend.length === 7);

  // withdrawals
  const wdFail = await api('/api/withdrawals', { method: 'POST', token: userToken, body: { amount: 99999, phone_number: '0733111222', method: 'M-Pesa' } });
  check('over-balance withdrawal rejected', wdFail.status === 400);

  const wd = await api('/api/withdrawals', { method: 'POST', token: userToken, body: { amount: 4000, phone_number: '0733111222', method: 'M-Pesa', notes: 'test' } });
  check('withdrawal created (pending)', wd.status === 201 && wd.data.withdrawal.status === 'pending');

  const stats2 = await api('/api/stats/dashboard', { token: userToken });
  check('pending deducted from available', stats2.data.summary.available_balance === 8000 && stats2.data.summary.withdrawn_pending === 4000);

  // deposit activation
  const dep = await api('/api/deposits', { method: 'POST', token: userToken, body: { transaction_code: `TK${Date.now()}`, amount: 800 } });
  check('deposit activation request created', dep.status === 201);
  const depDup = await api('/api/deposits', { method: 'POST', token: userToken, body: { transaction_code: dep.data.deposit.transaction_code, amount: 800 } });
  check('duplicate transaction code rejected', depDup.status === 409);

  // admin
  const guard = await api('/api/admin/pending', { token: userToken });
  check('member blocked from admin API (403)', guard.status === 403);

  const memberAct = await api(`/api/admin/withdrawals/${wd.data.withdrawal.id}/approve`, { method: 'POST', token: userToken });
  check('member cannot approve withdrawals (403)', memberAct.status === 403);

  const pending = await api('/api/admin/pending', { token: adminToken });
  check('admin sees pending items', pending.status === 200 && pending.data.withdrawals.length >= 1 && pending.data.deposits.length >= 1);

  const apWd = await api(`/api/admin/withdrawals/${wd.data.withdrawal.id}/approve`, { method: 'POST', token: adminToken });
  check('admin approves withdrawal', apWd.status === 200 && apWd.data.withdrawal.status === 'approved');
  check('approval records reviewer + timestamp', !!(apWd.data.withdrawal.reviewed_by && apWd.data.withdrawal.reviewed_at));

  const apDep = await api(`/api/admin/deposits/${dep.data.deposit.id}/approve`, { method: 'POST', token: adminToken });
  check('admin approves activation', apDep.status === 200 && apDep.data.deposit.status === 'approved');

  const stats3 = await api('/api/stats/dashboard', { token: userToken });
  check('post-approval balance = 8000', stats3.data.summary.available_balance === 8000);
  check('membership package now Gold Agent', stats3.data.membership.current_package === 'Gold Agent');

  // rejection: funds must return to available balance
  const wd2 = await api('/api/withdrawals', { method: 'POST', token: userToken, body: { amount: 1000, phone_number: '0733111222', method: 'M-Pesa' } });
  check('second withdrawal created (pending)', wd2.status === 201 && wd2.data.withdrawal.status === 'pending');
  const stats4 = await api('/api/stats/dashboard', { token: userToken });
  check('pending deducted again (available 7000)', stats4.data.summary.available_balance === 7000);
  const rjWd = await api(`/api/admin/withdrawals/${wd2.data.withdrawal.id}/reject`, { method: 'POST', token: adminToken });
  check('admin rejects withdrawal', rjWd.status === 200 && rjWd.data.withdrawal.status === 'rejected');
  const stats5 = await api('/api/stats/dashboard', { token: userToken });
  check('rejected funds return to available (8000)', stats5.data.summary.available_balance === 8000);

  // notifications
  const notifs = await api('/api/notifications', { token: userToken });
  check('notifications generated', notifs.status === 200 && notifs.data.unread >= 3, `unread=${notifs.data.unread}`);
  const readAll = await api('/api/notifications/read-all', { method: 'POST', token: userToken });
  check('mark all read', readAll.status === 200);
  const notifs2 = await api('/api/notifications', { token: userToken });
  check('unread cleared', notifs2.data.unread === 0);

  // data isolation between users
  const otherStats = await api('/api/stats/dashboard', { token: adminToken });
  check('member data isolated from other users', otherStats.data.summary.whatsapp_earned === 0);

  // sponsor ads: admin publishes a creative, every member can read it
  const adForm = new FormData();
  adForm.append('title', 'Riamxo Motors — Festive Sale');
  adForm.append('caption', 'Book a test drive this week and save 20%.');
  adForm.append('image', new Blob([png], { type: 'image/png' }), 'ad.png');
  const memberPublish = await api('/api/sponsor-ads', { method: 'POST', token: userToken, form: adForm });
  check('member cannot publish sponsor ads (403)', memberPublish.status === 403);

  const textOnly = new FormData();
  textOnly.append('title', 'No image');
  const adNoFile = await api('/api/sponsor-ads', { method: 'POST', token: adminToken, form: textOnly });
  check('sponsor ad without image rejected', adNoFile.status === 400);

  const ad = await api('/api/sponsor-ads', { method: 'POST', token: adminToken, form: adForm });
  check('admin publishes sponsor ad', ad.status === 201 && ad.data.ad.title === 'Riamxo Motors — Festive Sale', JSON.stringify(ad.data));

  const memberAds = await api('/api/sponsor-ads', { token: userToken });
  check('member sees the live creative', memberAds.status === 200 && memberAds.data.ads.length === 1, JSON.stringify(memberAds.data));
  check('creative is readable inline (data URL)', String(memberAds.data.ads[0].image_url).startsWith('data:image/png'));

  const anonAds = await api('/api/sponsor-ads');
  check('sponsor ads require auth', anonAds.status === 401);

  const hide = await api(`/api/sponsor-ads/${ad.data.ad.id}/toggle`, { method: 'POST', token: adminToken });
  check('admin hides the ad', hide.status === 200 && hide.data.ad.active === false);
  const afterHide = await api('/api/sponsor-ads', { token: userToken });
  check('hidden ad is withdrawn from members', afterHide.data.ads.length === 0);

  const show = await api(`/api/sponsor-ads/${ad.data.ad.id}/toggle`, { method: 'POST', token: adminToken });
  check('admin re-publishes the ad', show.status === 200 && show.data.ad.active === true);

  const adNotif = await api('/api/notifications', { token: userToken });
  check('members notified about the new ad', adNotif.data.notifications.some((n) => n.title === 'New sponsor ad is live'));

  const del = await api(`/api/sponsor-ads/${ad.data.ad.id}/delete`, { method: 'POST', token: adminToken });
  check('admin deletes the ad', del.status === 200 && del.data.removed === true);
  const allAfterDelete = await api('/api/sponsor-ads/all', { token: adminToken });
  check('ad list empty after delete', allAfterDelete.status === 200 && allAfterDelete.data.ads.length === 0);

  const memberAll = await api('/api/sponsor-ads/all', { token: userToken });
  check('member cannot list all ads (403)', memberAll.status === 403);
}
