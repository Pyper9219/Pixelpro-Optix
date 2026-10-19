/* App bootstrap: auth state, hash router, member shell (topnav/bottomnav/bell). */

window.App = (() => {
  let user = null;
  let authChecked = false;
  let aviatorHandle = null;
  let bellRefreshTimer = null;

  const root = document.getElementById('app');

  /* ---------- theme ---------- */
  (function initTheme() {
    if (localStorage.getItem('riamxo_theme') === 'light') {
      document.documentElement.classList.add('light');
    }
  })();

  /* ---------- auth ---------- */
  async function checkAuth() {
    if (!API.getToken()) { authChecked = true; return null; }
    try {
      const res = await API.get('/api/auth/me');
      user = res.user;
    } catch {
      API.setToken(null);
      user = null;
    }
    authChecked = true;
    return user;
  }

  function logout() {
    API.setToken(null);
    user = null;
    toast('You have been logged out');
    location.hash = '#/';
    render();
  }

  /* ---------- router ---------- */
  const routes = {
    '': () => Pages.landing(user),
    '/': () => Pages.landing(user),
    '/auth': () => {
      if (user) { location.hash = '#/dashboard'; return h('div', {}); }
      return Pages.auth((u) => { user = u; location.hash = '#/dashboard'; render(); });
    },
    '/home': member(() => Pages.home(user)),
    '/dashboard': member(() => Pages.dashboard()),
    '/aviator': member(() => {
      const wrap = h('div', {});
      aviatorHandle = Aviator.mount(wrap);
      return wrap;
    }),
    '/withdraw': member(() => Pages.withdraw()),
    '/deposit': member(() => Pages.deposit()),
    '/settings': member(() => Pages.settings(user, {
      onLogout: logout,
      onAuthChange: (u) => { user = u; render(); },
    })),
    '/admin': member(() => Pages.admin(), true),
    '/faq': () => faqPage(),
  };

  function member(pageFn, adminOnly = false) {
    return () => {
      if (!user) {
        if (!authChecked) return h('div', { class: 'page' }, h('div', { class: 'spinner' }));
        location.hash = '#/auth';
        return h('div', { class: 'page' }, h('div', { class: 'spinner' }));
      }
      if (adminOnly && user.role !== 'admin') {
        return Pages.notFound();
      }
      return pageFn();
    };
  }

  function faqPage() {
    const items = [
      ['How much do I earn per view?', 'KES 100 for every verified view of the sponsor ad on your WhatsApp status.'],
      ['When can I withdraw?', 'Any time your available balance is at least KES 100. Requests are processed within 24 hours.'],
      ['How do I activate my account?', 'Pay your package fee to our M-Pesa paybill (0104074325) and submit the transaction code on the Deposit page.'],
      ['How does the 24-hour rule work?', 'Each ad must stay on your status for 24 hours, so view counts can only be submitted once per day.'],
      ['Is the Aviator game real money?', 'No — Aviator Spin is a free demo game for entertainment. No real money is involved.'],
    ];
    const page = h('div', { class: 'page page-pad', style: { maxWidth: '720px' } },
      h('h1', { class: 'page-title' }, 'Frequently Asked Questions'),
      h('p', { class: 'page-sub' }, 'Everything you need to know about earning with Riamxo Motors.'),
      h('div', { style: { marginTop: '20px', display: 'grid', gap: '12px' } },
        items.map(([q, a]) => h('div', { class: 'panel' },
          h('b', { style: { fontSize: '0.95rem' } }, q),
          h('p', { style: { color: 'var(--muted)', fontSize: '0.86rem', marginTop: '6px' } }, a)))));
    return page;
  }

  function currentRoute() {
    const hash = location.hash.replace(/^#/, '');
    return routes[hash] !== undefined ? hash : null;
  }

  /* ---------- shell ---------- */
  function shell(contentNode) {
    const route = currentRoute() || '/';

    const topnav = h('header', { class: 'topnav' },
      h('div', { class: 'topnav-inner' },
        h('a', { class: 'brand', href: '#/' },
          h('span', { class: 'brand-mark' }, 'R'),
          h('span', {}, 'Riamxo', h('small', {}, 'Motors Ltd'))),
        h('nav', { class: 'topnav-links' },
          navLink('/home', 'Home'),
          navLink('/dashboard', 'Dashboard'),
          navLink('/aviator', 'Aviator', true),
          navLink('/deposit', 'Deposit'),
          navLink('/withdraw', 'Withdraw', true),
          bell(),
          h('a', { href: '#/settings', class: 'tnl', title: 'Settings', style: { padding: '6px' } },
            h('span', { class: 'avatar', style: { width: '32px', height: '32px', fontSize: '0.85rem', boxShadow: 'none' } }, (user.full_name || '?')[0].toUpperCase())))));

    function navLink(path, label, hideMobile) {
      return h('a', { href: `#${path}`, class: `${route === path ? 'active ' : ''}${hideMobile ? 'hide-m' : ''}` }, label);
    }

    const bottomnav = h('nav', { class: 'bottomnav' },
      bnItem('/dashboard', 'Home', 'gauge'),
      bnItem('/home', 'Earn', 'zap'),
      h('a', { href: '#/aviator', class: 'bn-item bn-center' },
        h('span', { class: 'bn-circle' }, icon('plane', 26)),
        h('span', {}, 'AVIATOR')),
      bnItem('/deposit', 'Deposit', 'cash'),
      bnItem('/settings', 'Settings', 'settings'));

    function bnItem(path, label, ic) {
      return h('a', { href: `#${path}`, class: `bn-item ${route === path ? 'active' : ''}` }, icon(ic, 22), label);
    }

    return h('div', { class: 'app-shell' }, topnav, contentNode, bottomnav);
  }

  /* ---------- notification bell ---------- */
  function bell() {
    const wrap = h('div', { class: 'bell-wrap' });
    const badge = h('span', { class: 'bell-badge', style: { display: 'none' } });
    const btn = h('button', { class: 'bell-btn', 'aria-label': 'Notifications', onclick: toggle }, icon('bell', 20), badge);
    wrap.append(btn);
    let dropdown = null;

    async function refreshBadge() {
      if (!user) return;
      try {
        const { unread } = await API.get('/api/notifications');
        badge.style.display = unread > 0 ? 'grid' : 'none';
        badge.textContent = unread > 9 ? '9+' : unread;
      } catch { /* ignore */ }
    }

    async function toggle(e) {
      e.stopPropagation();
      if (dropdown) { close(); return; }
      dropdown = h('div', { class: 'bell-dropdown' }, h('div', { class: 'spinner' }));
      wrap.append(dropdown);
      document.addEventListener('click', onOutside);
      try {
        const { notifications, unread } = await API.get('/api/notifications');
        badge.style.display = unread > 0 ? 'grid' : 'none';
        badge.textContent = unread > 9 ? '9+' : unread;
        dropdown.innerHTML = '';
        dropdown.append(
          h('div', { class: 'bell-head' },
            h('span', {}, 'Notifications'),
            h('button', { onclick: markAll }, 'Mark all read')),
          notifications.length === 0
            ? h('div', { class: 'bell-empty' }, 'No notifications yet.')
            : h('div', { class: 'bell-list' }, notifications.map((n) =>
                h('button', {
                  class: `bell-item${n.read ? '' : ' unread'}`,
                  onclick: () => markOne(n),
                },
                  h('span', { class: 'bic' }, n.icon),
                  h('div', { style: { minWidth: 0 } }, h('b', {}, n.title), h('p', {}, n.body)),
                  h('time', {}, timeAgo(n.created_at))))));
      } catch {
        dropdown.innerHTML = '';
        dropdown.append(h('div', { class: 'bell-empty' }, 'Could not load notifications.'));
      }
    }

    async function markOne(n) {
      try { await API.post('/api/notifications/read', { id: n.id }); } catch { /* ignore */ }
      n.read = true;
      refreshBadge();
      close();
    }
    async function markAll(e) {
      e.stopPropagation();
      try { await API.post('/api/notifications/read-all'); } catch { /* ignore */ }
      badge.style.display = 'none';
      close();
    }
    function onOutside(e) {
      if (dropdown && !wrap.contains(e.target)) close();
    }
    function close() {
      dropdown?.remove();
      dropdown = null;
      document.removeEventListener('click', onOutside);
    }

    refreshBadge();
    clearInterval(bellRefreshTimer);
    bellRefreshTimer = setInterval(refreshBadge, 60000);
    return wrap;
  }

  /* ---------- render ---------- */
  function cleanup() {
    if (aviatorHandle) { aviatorHandle.destroy(); aviatorHandle = null; }
    closeOverlays();
  }

  function render() {
    cleanup();
    const hash = location.hash.replace(/^#/, '');
    const route = currentRoute();
    const isMemberArea = user && route !== null && !['', '/', '/auth', '/faq'].includes(route);

    let content;
    if (route === null) {
      content = Pages.notFound();
      document.body.classList.remove('app-mode');
    } else {
      content = routes[route]();
      document.body.classList.toggle('app-mode', isMemberArea);
    }

    root.innerHTML = '';
    if (isMemberArea && content) {
      root.append(shell(content));
    } else {
      root.append(content);
    }
    window.scrollTo(0, 0);
  }

  function rerender() { render(); }

  /* ---------- boot ---------- */
  window.addEventListener('hashchange', render);

  (async () => {
    render(); // immediate spinner-free first paint handled by landing
    await checkAuth();
    render();
  })();

  return { rerender, get user() { return user; } };
})();
