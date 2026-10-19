/* Page renderers. Each returns a DOM node; app.js mounts them. */

window.Pages = (() => {

  /* ================= LANDING ================= */
  function landing(user) {
    const name = user ? user.full_name.split(' ')[0] : 'Amos';

    const tickerItems = [
      'KES 100 PER VIEW', 'INSTANT M-PESA PAYOUTS', 'JOIN 12,000+ EARNERS',
      'POST ON WHATSAPP STATUS', 'GET PAID DAILY', 'RIAMXO MOTORS LIMITED',
    ];
    const tickerTrack = h('div', { class: 'ticker-track' },
      [...tickerItems, ...tickerItems].map((t) => h('span', {}, `★ ${t}`)));

    const nav = h('header', { class: 'l-navbar' },
      h('div', { class: 'container' },
        brand(),
        h('nav', { class: 'l-navlinks' },
          h('a', { class: 'hide-m', href: '#how' }, 'How It Works'),
          h('a', { class: 'hide-m', href: '#packages' }, 'Packages'),
          h('a', { class: 'hide-m', href: '#about' }, 'About'),
          user
            ? h('a', { class: 'btn btn-gold', href: '#/dashboard' }, 'Open Dashboard')
            : h('a', { class: 'btn btn-gold btn-shimmer', href: '#/auth' }, 'Get Started'))));

    const hero = h('section', { class: 'hero' },
      h('div', { class: 'container' },
        h('div', {},
          h('div', { class: 'hero-badge' }, h('span', { class: 'dot' }), 'LIVE — 1,248 members earned today'),
          h('h1', {}, `Hi ${name}, turn your `, h('span', { class: 'gold' }, 'WhatsApp Status'), ' into a salary.'),
          h('p', { class: 'lead' },
            'Post sponsor ads on your WhatsApp status and earn KES 100 for every view. Withdraw straight to M-Pesa — no stories, no delays.'),
          h('div', { class: 'hero-cta' },
            h('a', { class: 'btn btn-gold btn-shimmer', href: user ? '#/home' : '#/auth' }, icon('zap', 18), ' Start Earning Now'),
            h('a', { class: 'btn btn-ghost', href: '#how' }, 'See how it works')),
          h('div', { class: 'hero-stats' },
            stat('12,400+', 'Active members'),
            stat('KES 8.2M', 'Paid out via M-Pesa'),
            stat('100', 'KES per view'))),
        h('div', { class: 'hero-phone' },
          h('div', { class: 'phone-frame' },
            h('div', { class: 'phone-screen' },
              h('div', { class: 'ps-brand' }, h('span', { class: 'brand-mark', style: { width: '26px', height: '26px', fontSize: '0.8rem', borderRadius: '8px' } }, 'R'), 'Riamxo Motors'),
              h('div', { class: 'ps-balance' }, h('small', {}, 'Available balance'), h('b', {}, 'KES 24,500'), h('small', { style: { color: 'var(--lime)', textTransform: 'none', letterSpacing: 0 } }, '▲ +3,200 this week')),
              h('div', { class: 'ps-row' },
                h('div', { class: 'ps-chip' }, 'Views today', h('b', {}, '32')),
                h('div', { class: 'ps-chip' }, 'Earned today', h('b', {}, 'KES 3,200'))),
              h('div', { class: 'ps-ad' },
                h('div', {},
                  h('b', {}, 'SPONSOR AD — RIAMXO MOTORS'),
                  h('small', {}, 'Post this on your status. Earn per view.'))),
              h('div', { class: 'ps-btn' }, 'SUBMIT VIEWS →'))))));

    function stat(b, s) { return h('div', { class: 'hero-stat' }, h('b', {}, b), h('span', {}, s)); }

    const statsBar = h('section', { class: 'stats-bar' },
      h('div', { class: 'container' },
        statCell('4.8M+', 'Status views tracked'),
        statCell('156', 'Brands advertising'),
        statCell('98.4%', 'Payout success rate'),
        statCell('< 24h', 'Withdrawal processing')));

    function statCell(b, s) { return h('div', { class: 'stat-cell' }, h('b', {}, b), h('span', {}, s)); }

    const steps = h('section', { class: 'section', id: 'how' },
      h('div', { class: 'container' },
        h('div', { class: 'section-head reveal' },
          h('div', { class: 'eyebrow' }, 'How it works'),
          h('h2', {}, 'Earn in three simple steps'),
          h('p', {}, 'No experience needed. If you have WhatsApp, you can earn.')),
        h('div', { class: 'steps' },
          step('01', 'user', 'Create your account', 'Register with your name, email and M-Pesa number. Activation is quick via M-Pesa.'),
          step('02', 'upload', 'Post the sponsor ad', 'Each day you get a sponsor ad. Post it on your WhatsApp status for 24 hours.'),
          step('03', 'cash', 'Submit views & withdraw', 'Screenshot your view count, submit it, and earn KES 100 per view. Cash out to M-Pesa.'))));

    function step(num, ic, title, body) {
      return h('div', { class: 'card step-card reveal' },
        h('span', { class: 'step-num' }, num),
        h('div', { class: 'step-icon' }, icon(ic, 24)),
        h('h3', {}, title),
        h('p', {}, body));
    }

    const promo = h('section', { class: 'section', style: { paddingTop: 0 } },
      h('div', { class: 'container' },
        h('div', { class: 'promo reveal' },
          h('div', {},
            h('h2', {}, 'Launch bonus: ', h('span', { class: 'gold' }, 'KES 500'), ' free for every new agent'),
            h('p', {}, 'Sign up this week and we top up your wallet with a KES 500 welcome bonus — no deposit needed to start submitting views.'),
            h('a', { class: 'btn btn-gold btn-shimmer', href: user ? '#/home' : '#/auth' }, 'Claim Your Bonus')),
          h('div', { class: 'promo-side' },
            h('div', { class: 'big' }, 'KES 500'),
            h('small', {}, 'Welcome bonus')))));

    const packages = h('section', { class: 'section', id: 'packages', style: { paddingTop: 0 } },
      h('div', { class: 'container' },
        h('div', { class: 'section-head reveal' },
          h('div', { class: 'eyebrow' }, 'Activation packages'),
          h('h2', {}, 'Choose your earning package'),
          h('p', {}, 'Activate once via M-Pesa and start earning immediately. Higher packages unlock more daily views.')),
        h('div', { class: 'pricing' },
          priceCard('Starter', '300', ['Up to 20 views per day', 'KES 100 per view', 'M-Pesa withdrawals', 'Standard support'], false),
          priceCard('Gold Agent', '800', ['Up to 50 views per day', 'KES 100 per view', 'Priority M-Pesa payouts', 'Weekly bonus draws', 'Dedicated support'], true),
          priceCard('Platinum', '2,000', ['Unlimited daily views', 'KES 100 per view', 'Instant payouts', 'Team leader commissions', 'Account manager'], false)),
        h('p', { style: { textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '18px' } },
          'Activation fee is a one-off. Earnings are lifetime.')));

    function priceCard(title, amount, features, featured) {
      return h('div', { class: `card price-card reveal${featured ? ' featured' : ''}` },
        featured ? h('span', { class: 'price-tag' }, 'MOST POPULAR') : null,
        h('h3', {}, title),
        h('div', { class: 'amount' }, `KES ${amount}`, h('small', {}, ' one-off')),
        h('ul', {}, features.map((f) => h('li', {}, icon('check', 15, 2.5), f))),
        h('a', { class: `btn ${featured ? 'btn-gold btn-shimmer' : 'btn-ghost'} btn-block`, href: user ? '#/deposit' : '#/auth' },
          featured ? 'Activate Now' : 'Choose Package'));
    }

    const partners = h('section', { class: 'section', style: { paddingTop: 0 } },
      h('div', { class: 'container' },
        h('div', { class: 'section-head reveal' },
          h('div', { class: 'eyebrow' }, 'Trusted by'),
          h('h2', {}, 'Our advertising partners')),
        h('div', { class: 'partners reveal' },
          ['Safaricom Deals', 'Jumia Kenya', 'M-Kopa Solar', 'Glovo Nairobi', 'SportPesa', 'Copia'].map((p) =>
            h('div', { class: 'partner-chip' }, icon('briefcase', 16), p)))));

    const about = h('section', { class: 'section', id: 'about', style: { paddingTop: 0 } },
      h('div', { class: 'container about-grid' },
        h('div', { class: 'reveal' },
          h('div', { class: 'eyebrow' }, 'About Riamxo Motors'),
          h('h2', { style: { fontSize: 'clamp(1.5rem,3vw,2.1rem)', fontWeight: '900', margin: '8px 0 16px', letterSpacing: '-0.02em' } },
            'Kenya’s status-to-cash advertising network'),
          h('p', {}, 'Riamxo Motors Limited connects everyday Kenyans with brands that want real eyeballs. Instead of paying big platforms, our partners pay you directly to carry their message on your WhatsApp status.'),
          h('p', {}, 'Every view is verified, every shilling is tracked, and payouts land in your M-Pesa within 24 hours of approval.'),
          h('a', { class: 'btn btn-gold', href: user ? '#/dashboard' : '#/auth', style: { marginTop: '8px' } }, 'Join the network')),
        h('div', { class: 'about-visual reveal' },
          h('div', { class: 'row' }, h('div', { class: 'ic' }, icon('shield', 20)), h('div', {}, h('b', {}, 'Verified payouts'), h('small', {}, 'Every withdrawal reviewed and confirmed'))),
          h('div', { class: 'row' }, h('div', { class: 'ic' }, icon('zap', 20)), h('div', {}, h('b', {}, '24h processing'), h('small', {}, 'M-Pesa straight to your phone'))),
          h('div', { class: 'row' }, h('div', { class: 'ic' }, icon('users', 20)), h('div', {}, h('b', {}, '12,400+ agents'), h('small', {}, 'Earning across all 47 counties'))))));

    const footer = h('footer', { class: 'footer' },
      h('div', { class: 'container' },
        h('div', { class: 'footer-grid' },
          h('div', {},
            brand(),
            h('p', { style: { color: 'var(--muted)', fontSize: '0.84rem', marginTop: '12px', maxWidth: '260px' } },
              'The advertising revenue platform that pays Kenyans for their WhatsApp status reach.')),
          h('div', {}, h('h4', {}, 'Platform'),
            h('a', { href: '#how' }, 'How it works'), h('a', { href: '#packages' }, 'Packages'), h('a', { href: '#/auth' }, 'Register'), h('a', { href: '#/auth' }, 'Login')),
          h('div', {}, h('h4', {}, 'Company'),
            h('a', { href: '#about' }, 'About us'), h('a', { href: '#partners' }, 'Partners'), h('a', { href: '#packages' }, 'Pricing')),
          h('div', {}, h('h4', {}, 'Support'),
            h('a', { href: '#/faq' }, 'FAQs'), h('a', { href: 'mailto:support@riamxo.co.ke' }, 'support@riamxo.co.ke'), h('a', { href: 'tel:+254104074325' }, '0104 074 325'))),
        h('div', { class: 'copy' }, `© ${new Date().getFullYear()} Riamxo Motors Limited. All rights reserved.`)));

    const page = h('div', { class: 'landing' },
      nav,
      h('div', { class: 'ticker' }, tickerTrack),
      hero, statsBar, steps, promo, packages, partners, about, footer);

    // scroll reveal
    setTimeout(() => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('in'));
      }, { threshold: 0.12 });
      page.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    }, 30);

    return page;
  }

  function brand() {
    return h('a', { class: 'brand', href: '#/' },
      h('span', { class: 'brand-mark' }, 'R'),
      h('span', {}, 'Riamxo Motors', h('small', {}, 'Limited')));
  }

  /* ================= AUTH ================= */
  function auth(onSuccess) {
    let mode = 'register';

    const card = h('div', { class: 'card auth-card' });
    const wrap = h('div', { class: 'auth-wrap' }, card);

    function render() {
      const isReg = mode === 'register';
      const nameInput = isReg ? field('Full name', h('input', { class: 'input', id: 'au-name', placeholder: 'e.g. Amos Kiptoo' })) : null;
      const phoneInput = isReg ? field('M-Pesa phone number', h('input', { class: 'input', id: 'au-phone', placeholder: '07XX XXX XXX', inputmode: 'tel' })) : null;

      card.innerHTML = '';
      card.append(
        h('div', { style: { display: 'flex', justifyContent: 'center', marginBottom: '18px' } },
          h('span', { class: 'brand-mark', style: { width: '52px', height: '52px', fontSize: '1.5rem', borderRadius: '16px' } }, 'R')),
        h('h2', { style: { textAlign: 'center' } }, isReg ? 'Create your account' : 'Welcome back'),
        h('p', { class: 'sub', style: { textAlign: 'center' } },
          isReg ? 'Start earning KES 100 per WhatsApp status view.' : 'Log in to your Riamxo Motors account.'),
        nameInput, phoneInput,
        field('Email address', h('input', { class: 'input', id: 'au-email', type: 'email', placeholder: 'you@example.com' })),
        field('Password', h('input', { class: 'input', id: 'au-pass', type: 'password', placeholder: isReg ? 'At least 6 characters' : 'Your password' })),
        h('div', { class: 'error-text', id: 'au-err', style: { display: 'none', marginBottom: '12px' } }),
        h('button', {
          class: 'btn btn-gold btn-block btn-shimmer', id: 'au-btn',
          onclick: submit,
        }, isReg ? 'Create Account' : 'Log In'),
        h('p', { class: 'auth-toggle' },
          isReg ? 'Already have an account? ' : 'New to Riamxo? ',
          h('button', { onclick: () => { mode = isReg ? 'login' : 'register'; render(); } },
            isReg ? 'Log in' : 'Create account')));
    }

    function field(label, input) {
      return h('div', { class: 'field' }, h('label', {}, label), input);
    }

    async function submit() {
      const err = card.querySelector('#au-err');
      const btn = card.querySelector('#au-btn');
      const val = (id) => card.querySelector(id)?.value.trim();
      err.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Please wait…';
      try {
        const body = mode === 'register'
          ? { full_name: val('#au-name'), phone: val('#au-phone'), email: val('#au-email'), password: val('#au-pass') }
          : { email: val('#au-email'), password: val('#au-pass') };
        const res = await API.post(`/api/auth/${mode}`, body);
        API.setToken(res.token);
        toast(`Welcome${mode === 'register' ? '' : ' back'}, ${res.user.full_name.split(' ')[0]}!`);
        onSuccess(res.user);
      } catch (e) {
        err.textContent = e.message;
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = mode === 'register' ? 'Create Account' : 'Log In';
      }
    }

    render();
    return wrap;
  }

  /* ================= HOME / SUBMIT VIEWS ================= */
  function home(user) {
    const page = h('div', { class: 'page page-pad' },
      h('h1', { class: 'page-title' }, `Earning Center`),
      h('p', { class: 'page-sub' }, `Post today's sponsor ad on your WhatsApp status, then submit your view count below.`),
      h('div', { id: 'home-body', style: { marginTop: '18px' } }, h('div', { class: 'spinner' })));

    const body = page.querySelector('#home-body');

    API.get('/api/submissions').then(({ submissions, rate_per_view, cooldown_ms }) => {
      body.innerHTML = '';

      const banner = h('div', { class: 'balance-hero', style: { marginBottom: '18px' } },
        h('small', {}, 'Today\'s sponsor ad'),
        h('div', { style: { display: 'flex', gap: '14px', alignItems: 'center', marginTop: '10px' } },
          h('div', { style: { width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg,var(--yellow),var(--gold))', display: 'grid', placeItems: 'center', color: '#161616', flex: 'none' } }, icon('briefcase', 26)),
          h('div', {},
            h('b', { style: { fontSize: '1.05rem' } }, 'Riamxo Motors — Festive Sale Campaign'),
            h('div', { class: 'sub' }, 'Keep it on your status for 24 hours, then screenshot the views.'))));

      if (cooldown_ms > 0) {
        const hrs = cooldown_ms / 3600000;
        body.append(banner,
          h('div', { class: 'cooldown-banner' }, icon('clock', 20),
            h('span', {}, `Next submission available in ${hrs.toFixed(1)} hours. Your last submission is being processed.`)));
      } else {
        body.append(banner, buildForm(rate_per_view));
      }

      body.append(h('div', { class: 'panel', style: { marginTop: '18px' } },
        h('h3', {}, 'My submissions', h('small', {}, `${submissions.length} total`)),
        submissions.length === 0
          ? emptyState('image', 'No submissions yet', 'Post the sponsor ad and submit your first view count.')
          : submissions.map((s) => h('div', { class: 'submission-item' },
              h('img', { src: s.image_url, alt: 'Proof screenshot' }),
              h('div', {},
                h('b', {}, `${s.views.toLocaleString()} views`),
                h('small', {}, `${s.phone_number} · ${fmtDate(s.created_at)}`)),
              h('span', { class: 'earnings' }, `+${fmtKES(s.earnings)}`)))));
    }).catch((e) => {
      body.innerHTML = '';
      body.append(emptyState('alert', e.message, ''));
    });

    function buildForm(rate) {
      let file = null;
      const preview = h('div', {});
      const dz = h('div', { class: 'dropzone' },
        h('div', { class: 'dz-ic' }, icon('upload', 22)),
        h('b', { style: { fontSize: '0.88rem' } }, 'Tap to upload screenshot proof'),
        h('div', { style: { fontSize: '0.74rem', marginTop: '3px' } }, 'PNG or JPG, max 5MB'),
        preview);
      const input = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
      dz.append(input);
      dz.addEventListener('click', () => input.click());
      dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
      dz.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.classList.remove('drag');
        if (e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]);
      });
      input.addEventListener('change', () => input.files[0] && pick(input.files[0]));

      function pick(f) {
        if (!f.type.startsWith('image/')) return toast('Please choose an image file', 'error');
        if (f.size > 5 * 1024 * 1024) return toast('Image must be under 5MB', 'error');
        file = f;
        preview.innerHTML = '';
        preview.append(h('img', { src: URL.createObjectURL(f), alt: 'preview' }));
      }

      const viewsInput = h('input', { class: 'input', id: 'sv-views', type: 'number', min: 1, max: 10000, placeholder: 'e.g. 250' });
      const phoneInput = h('input', { class: 'input', id: 'sv-phone', inputmode: 'tel', placeholder: '07XX XXX XXX', value: user.phone || '' });
      const earningsPreview = h('b', { style: { color: 'var(--lime)' } }, 'KES 0');
      viewsInput.addEventListener('input', () => {
        const v = Math.max(0, parseInt(viewsInput.value || '0', 10));
        earningsPreview.textContent = fmtKES(v * rate);
      });

      const err = h('div', { class: 'error-text', style: { display: 'none' } });

      const btn = h('button', {
        class: 'btn btn-gold btn-block', style: { marginTop: '6px' },
        onclick: async () => {
          err.style.display = 'none';
          if (!file) { err.textContent = 'Please attach your screenshot proof.'; err.style.display = 'block'; return; }
          const fd = new FormData();
          fd.append('phone_number', phoneInput.value.trim());
          fd.append('views', viewsInput.value);
          fd.append('screenshot', file);
          btn.disabled = true;
          btn.textContent = 'Submitting…';
          try {
            await API.post('/api/submissions', fd);
            toast('Views submitted! Earnings added to your balance.');
            App.rerender();
          } catch (e) {
            err.textContent = e.message;
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Submit Views';
          }
        },
      }, `Submit Views — earn KES ${rate}/view`);

      return h('div', { class: 'form-panel' },
        h('h3', {}, 'Submit your views'),
        h('div', { class: 'field' }, h('label', {}, 'WhatsApp phone number'), phoneInput),
        h('div', { class: 'field' },
          h('label', {}, 'Number of views'), viewsInput,
          h('div', { class: 'hint' }, 'You will earn: ', earningsPreview)),
        h('div', { class: 'field' }, h('label', {}, 'Screenshot proof'), dz),
        err, btn);
    }

    return page;
  }

  /* ================= DASHBOARD ================= */
  function dashboard() {
    const page = h('div', { class: 'page page-pad' },
      h('h1', { class: 'page-title' }, 'Dashboard'),
      h('p', { class: 'page-sub' }, 'Your earnings, wallets and activity at a glance.'),
      h('div', { id: 'dash-body' }, h('div', { class: 'spinner' })));

    const body = page.querySelector('#dash-body');

    API.get('/api/stats/dashboard').then((stats) => {
      body.innerHTML = '';
      const s = stats.summary;

      body.append(
        h('div', { class: 'balance-hero', style: { marginTop: '18px' } },
          h('small', {}, 'Available balance'),
          h('div', { class: 'amt' }, fmtKES(s.available_balance)),
          h('div', { class: 'sub' }, `Package: ${stats.membership.current_package} · Account ${stats.membership.deposit_status}`),
          h('div', { style: { display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' } },
            h('a', { class: 'btn btn-gold', href: '#/withdraw', style: { padding: '10px 20px', fontSize: '0.84rem' } }, icon('download', 16), 'Withdraw'),
            h('a', { class: 'btn btn-ghost', href: '#/deposit', style: { padding: '10px 20px', fontSize: '0.84rem' } }, icon('cash', 16), 'Deposit'))),

        h('div', { class: 'summary-grid' },
          sumCard('gold', 'eye', fmtKES(s.whatsapp_earned), `WhatsApp earnings (${s.total_views.toLocaleString()} views)`),
          sumCard('green', 'check', fmtKES(s.withdrawn_approved), 'Total withdrawn'),
          sumCard('blue', 'clock', fmtKES(s.withdrawn_pending), 'Pending withdrawals'),
          sumCard('red', 'x', fmtKES(s.withdrawn_rejected), 'Rejected')),

        h('h3', { style: { fontWeight: '900', margin: '26px 0 14px', fontSize: '1.02rem' } }, 'My wallets'),
        h('div', { class: 'wallet-grid' },
          walletCard('https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800&q=60&auto=format&fit=crop', 'WhatsApp Wallet', s.whatsapp_earned, [['Withdraw', '#/withdraw', false], ['History', '#/withdraw', true]]),
          walletCard('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=60&auto=format&fit=crop', 'Cashback Wallet', Math.round(s.whatsapp_earned * 0.02), [['Claim', '', false]]),
          walletCard('https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=60&auto=format&fit=crop', 'Current Package', stats.membership.current_package, [['Upgrade', '#/deposit', false]]),
          walletCard('https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=60&auto=format&fit=crop', 'Agent Loans', 'Apply', [['Apply', '', true]]),
          walletCard('https://images.unsplash.com/photo-1605792657660-596af9009e82?w=800&q=60&auto=format&fit=crop', 'Deposit Wallet', 0, [['Top Up', '#/deposit', false]]),
          walletCard('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=60&auto=format&fit=crop', 'Spin & Win', 'Aviator', [['Play', '#/aviator', false]])),
        h('button', { class: 'w-close', onclick: () => toast('Wallet closure request sent to support.') }, 'CLOSE MY WALLET'),

        h('div', { class: 'dash-grid' },
          h('div', { class: 'panel' },
            h('h3', {}, 'Withdrawals — last 7 days', h('small', {}, 'approved / pending / rejected')),
            h('div', { class: 'chart-legend' },
              legendDot('#22c55e', 'Approved'), legendDot('#d4a017', 'Pending'), legendDot('#ef4444', 'Rejected')),
            canvasPanel('dash-trend')),
          h('div', { class: 'panel' },
            h('h3', {}, 'Withdrawal status totals'),
            canvasPanel('dash-status'),
            h('h3', { style: { marginTop: '22px' } }, 'Recent activity'),
            stats.activity.length === 0
              ? h('p', { style: { color: 'var(--muted)', fontSize: '0.84rem' } }, 'No withdrawal activity yet.')
              : stats.activity.map((a) => h('div', { class: 'act-item' },
                  h('div', { class: `aic ${a.status === 'approved' ? 'sic-green' : a.status === 'pending' ? 'sic-gold' : 'sic-red'}` },
                    icon(a.status === 'approved' ? 'check' : a.status === 'pending' ? 'clock' : 'x', 17)),
                  h('div', {}, h('b', {}, `${a.method} withdrawal`), h('small', {}, timeAgo(a.created_at))),
                  h('div', { class: 'act-amt' }, h('b', {}, fmtKES(a.amount)), statusPill(a.status, { approved: 'Successful' })))))));

      Charts.renderStackedArea(page.querySelector('#dash-trend'), stats.trend, [
        { key: 'approved', label: 'Approved', color: '#22c55e' },
        { key: 'pending', label: 'Pending', color: '#d4a017' },
        { key: 'rejected', label: 'Rejected', color: '#ef4444' },
      ]);
      Charts.renderStatusBars(page.querySelector('#dash-status'), stats.status_totals);
    }).catch((e) => {
      body.innerHTML = '';
      body.append(emptyState('alert', e.message, ''));
    });

    function sumCard(color, ic, value, label) {
      return h('div', { class: 'sum-card' },
        h('div', { class: `sic sic-${color}` }, icon(ic, 18)),
        h('b', {}, value), h('span', {}, label));
    }
    function legendDot(color, label) {
      return h('span', {}, h('i', { style: { background: color } }), label);
    }
    function canvasPanel(id) {
      return h('canvas', { id, style: { width: '100%', height: '230px', display: 'block' } });
    }
    function walletCard(bg, title, value, actions) {
      return h('div', { class: 'wallet-card' },
        h('div', { class: 'wb', style: { backgroundImage: `url(${bg})` } }),
        h('small', {}, title),
        h('b', {}, typeof value === 'number' ? fmtKES(value) : value),
        h('div', { class: 'w-actions' },
          actions.map(([label, href, alt]) => href
            ? h('a', { class: `w-btn${alt ? ' alt' : ''}`, href }, label)
            : h('button', { class: `w-btn${alt ? ' alt' : ''}`, onclick: () => toast(`${label} request sent to support.`) }, label))));
    }

    return page;
  }

  /* ================= WITHDRAW ================= */
  function withdraw() {
    const page = h('div', { class: 'page page-pad' },
      h('h1', { class: 'page-title' }, 'Withdraw Funds'),
      h('p', { class: 'page-sub' }, 'Cash out your earnings to M-Pesa or bank. Every request must be approved by an admin before it is successful.'),
      h('div', { id: 'wd-body', style: { marginTop: '18px' } }, h('div', { class: 'spinner' })));

    const body = page.querySelector('#wd-body');

    Promise.all([API.get('/api/stats/dashboard'), API.get('/api/withdrawals')]).then(([stats, { withdrawals }]) => {
      body.innerHTML = '';
      const available = stats.summary.available_balance;

      body.append(
        h('div', { class: 'balance-hero' },
          h('small', {}, 'Available for withdrawal'),
          h('div', { class: 'amt' }, fmtKES(available)),
          h('div', { class: 'sub' }, `Pending: ${fmtKES(stats.summary.withdrawn_pending)} · Earned: ${fmtKES(stats.summary.whatsapp_earned)}`)),

        h('div', { class: 'form-panel', style: { marginTop: '18px' } },
          h('h3', {}, 'New withdrawal request'),
          h('p', { style: { color: 'var(--muted)', fontSize: '0.8rem', margin: '0 0 12px' } },
            'Your request is held as "Awaiting Approval" and deducted from your available balance. An admin reviews it, and only approved withdrawals are marked Successful and paid out.'),
          buildWithdrawForm(available)),

        h('div', { class: 'panel', style: { marginTop: '18px' } },
          h('h3', {}, 'Withdrawal history', h('small', {}, 'last 50')),
          withdrawals.length === 0
            ? emptyState('file', 'No withdrawals yet', 'Your cash-out requests will appear here.')
            : h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
                h('thead', {}, h('tr', {},
                  h('th', {}, 'ID'), h('th', {}, 'Amount'), h('th', {}, 'Phone'), h('th', {}, 'Method'), h('th', {}, 'Date'), h('th', {}, 'Status'))),
                h('tbody', {}, withdrawals.map((w) => h('tr', {},
                  h('td', {}, h('span', { class: 'mono' }, w.id.slice(0, 8))),
                  h('td', {}, h('b', {}, fmtKES(w.amount))),
                  h('td', {}, w.phone_number),
                  h('td', {}, w.method),
                  h('td', {}, fmtDate(w.created_at)),
                  h('td', {}, statusPill(w.status, { approved: 'Successful' })))))))));

      function buildWithdrawForm(maxAmount) {
        const err = h('div', { class: 'error-text', style: { display: 'none' } });
        const amount = h('input', { class: 'input', id: 'wd-amount', type: 'number', min: 100, placeholder: 'Min KES 100' });
        const phone = h('input', { class: 'input', id: 'wd-phone', inputmode: 'tel', placeholder: '07XX XXX XXX' });
        const method = h('select', { class: 'input', id: 'wd-method' },
          h('option', { value: 'M-Pesa' }, 'M-Pesa'), h('option', { value: 'Bank Transfer' }, 'Bank Transfer'));
        const notes = h('textarea', { class: 'input', id: 'wd-notes', placeholder: 'Optional notes for the reviewer' });

        const btn = h('button', {
          class: 'btn btn-gold btn-block', style: { marginTop: '6px' },
          onclick: async () => {
            err.style.display = 'none';
            btn.disabled = true;
            btn.textContent = 'Submitting…';
            try {
              await API.post('/api/withdrawals', {
                amount: Number(amount.value),
                phone_number: phone.value.trim(),
                method: method.value,
                notes: notes.value.trim(),
              });
              toast('Withdrawal submitted — it now awaits admin approval.');
              App.rerender();
            } catch (e) {
              err.textContent = e.message;
              err.style.display = 'block';
              btn.disabled = false;
              btn.textContent = 'Request Withdrawal';
            }
          },
        }, 'Request Withdrawal');

        return h('div', {},
          h('div', { class: 'field' }, h('label', {}, 'Amount (KES)'), amount,
            h('div', { class: 'hint' }, `Available: ${fmtKES(maxAmount)}`)),
          h('div', { class: 'field' }, h('label', {}, 'M-Pesa / phone number'), phone),
          h('div', { class: 'field' }, h('label', {}, 'Method'), method),
          h('div', { class: 'field' }, h('label', {}, 'Notes'), notes),
          err, btn);
      }
    }).catch((e) => {
      body.innerHTML = '';
      body.append(emptyState('alert', e.message, ''));
    });

    return page;
  }

  /* ================= DEPOSIT ================= */
  function deposit() {
    const page = h('div', { class: 'page page-pad' },
      h('h1', { class: 'page-title' }, 'Activate Account'),
      h('p', { class: 'page-sub' }, 'Send your activation fee via M-Pesa, then enter the transaction code below.'),
      h('div', { id: 'dep-body', style: { marginTop: '18px' } }, h('div', { class: 'spinner' })));

    const body = page.querySelector('#dep-body');

    API.get('/api/deposits/mine').then(({ deposits, mpesa_number }) => {
      body.innerHTML = '';
      const err = h('div', { class: 'error-text', style: { display: 'none' } });
      const amount = h('input', { class: 'input', id: 'dep-amount', type: 'number', min: 1, placeholder: 'e.g. 800' });
      const code = h('input', { class: 'input', id: 'dep-code', placeholder: 'e.g. QK12AB34CD', style: { textTransform: 'uppercase' } });

      body.append(
        h('div', { class: 'form-panel' },
          h('h3', {}, 'Pay via M-Pesa'),
          h('div', { class: 'deposit-steps' },
            h('div', { class: 'dep-step' }, h('span', { class: 'n' }, '1'), h('div', {}, h('b', {}, 'Go to M-Pesa menu'), h('small', {}, 'Lipa na M-Pesa → Pay Bill'))),
            h('div', { class: 'dep-step' }, h('span', { class: 'n' }, '2'), h('div', {}, h('b', {}, 'Enter business number'), h('small', {}, `${mpesa_number} — Riamxo Motors Limited`))),
            h('div', { class: 'dep-step' }, h('span', { class: 'n' }, '3'), h('div', {}, h('b', {}, 'Pay your package amount'), h('small', {}, 'KES 300 (Starter), 800 (Gold) or 2,000 (Platinum)'))),
            h('div', { class: 'dep-step' }, h('span', { class: 'n' }, '4'), h('div', {}, h('b', {}, 'Copy the transaction code'), h('small', {}, 'e.g. QK12AB34CD — you will need it below')))),
          h('div', { class: 'mpesa-num' },
            h('b', {}, mpesa_number),
            h('button', { onclick: () => copyText(mpesa_number, 'M-Pesa number copied') }, 'COPY')),
          h('h3', { style: { marginTop: '22px' } }, 'Confirm activation'),
          h('div', { class: 'field' }, h('label', {}, 'Amount sent (KES)'), amount),
          h('div', { class: 'field' }, h('label', {}, 'M-Pesa transaction code'), code),
          err,
          h('button', {
            class: 'btn btn-green btn-block', style: { marginTop: '6px' },
            onclick: async (e) => {
              err.style.display = 'none';
              const btn = e.currentTarget;
              btn.disabled = true;
              btn.textContent = 'Confirming…';
              try {
                await API.post('/api/deposits', { transaction_code: code.value.trim(), amount: amount.value });
                toast('Activation request received. We will confirm shortly.');
                App.rerender();
              } catch (ex) {
                err.textContent = ex.message;
                err.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Confirm Activation';
              }
            },
          }, 'Confirm Activation')),
        h('div', { class: 'panel', style: { marginTop: '18px' } },
          h('h3', {}, 'My activation requests'),
          deposits.length === 0
            ? emptyState('cash', 'No activation requests yet', 'Your M-Pesa confirmations will appear here.')
            : deposits.map((d) => h('div', { class: 'submission-item', style: { alignItems: 'center' } },
                h('div', { class: 'aic sic-green', style: { width: '44px', height: '44px', borderRadius: '12px', display: 'grid', placeItems: 'center' } }, icon('cash', 19)),
                h('div', {}, h('b', {}, d.transaction_code), h('small', {}, `${d.amount ? fmtKES(d.amount) : 'Amount unlisted'} · ${fmtDate(d.created_at)}`)),
                h('span', { style: { marginLeft: 'auto' } }, statusPill(d.status))))));
    }).catch((e) => {
      body.innerHTML = '';
      body.append(emptyState('alert', e.message, ''));
    });

    return page;
  }

  /* ================= SETTINGS ================= */
  function settings(user, { onLogout, onAuthChange }) {
    const page = h('div', { class: 'page page-pad' },
      h('h1', { class: 'page-title' }, 'Settings'),
      h('p', { class: 'page-sub' }, 'Manage your profile, funds and preferences.'));

    const profileCard = h('div', { style: { display: 'flex', alignItems: 'center', gap: '16px', margin: '20px 0' } },
      h('div', { class: 'avatar' }, (user.full_name || '?')[0].toUpperCase()),
      h('div', {},
        h('b', { style: { fontSize: '1.1rem', fontWeight: '900' } }, user.full_name),
        h('div', { style: { color: 'var(--muted)', fontSize: '0.82rem' } }, user.email),
        h('div', { style: { marginTop: '8px' } },
          h('button', { class: 'btn btn-ghost', style: { padding: '8px 16px', fontSize: '0.78rem' }, onclick: () => openProfileEditor(user, onAuthChange) },
            icon('user', 15), ' Edit Profile'))));

    page.append(profileCard);

    // group helper
    function group(title, rows) {
      return h('div', { class: 'settings-group' }, h('h4', {}, title), rows);
    }
    function row(ic, color, title, sub, right, onclick) {
      return h('button', { class: 'set-row', onclick },
        h('span', { class: `sic sic-${color}` }, icon(ic, 18)),
        h('div', {}, h('b', {}, title), sub ? h('small', {}, sub) : null),
        right || icon('chevRight', 17));
    }

    const emailPrefs = JSON.parse(localStorage.getItem('riamxo_email_prefs') || '{"activity":true,"payouts":true,"promos":false}');
    function savePrefs() {
      localStorage.setItem('riamxo_email_prefs', JSON.stringify(emailPrefs));
      toast('Email preferences saved');
    }
    function prefToggle(key) {
      const sw = h('span', { class: `switch${emailPrefs[key] ? ' on' : ''}` });
      sw.addEventListener('click', (e) => {
        e.stopPropagation();
        emailPrefs[key] = !emailPrefs[key];
        sw.classList.toggle('on', emailPrefs[key]);
        savePrefs();
      });
      return sw;
    }

    page.append(
      group('Account', [
        row('user', 'gold', 'Profile', 'Name, phone and bio', null, () => openProfileEditor(user, onAuthChange)),
        row('cash', 'green', 'My Funds', 'Deposits and balances', null, () => { location.hash = '#/deposit'; }),
        row('briefcase', 'blue', 'Be an Ad Agent', 'Earn team commissions', null, () => toast('Agent programme opening soon. Watch your notifications!')),
      ]),
      group('User Authentication', [
        row('shield', 'green', 'Login & Security', 'Password managed at login', null, () => toast('Use Log out to end your session on this device.')),
        row('mail', 'blue', 'Email Notifications', 'Choose what we send you', null, () => openEmailPanel()),
      ]),
      group('Email Preferences', [
        row('zap', 'gold', 'Activity alerts', 'Submissions and approvals', prefToggle('activity')),
        row('cash', 'green', 'Payout notifications', 'Withdrawal status changes', prefToggle('payouts')),
        row('gift', 'blue', 'Promos & bonuses', 'Offers and bonus draws', prefToggle('promos')),
      ]),
      group('Financials', [
        row('file', 'gold', 'M-Pesa Report', 'View withdrawal history', null, () => { location.hash = '#/withdraw'; }),
        row('download', 'blue', 'Wallet Transfer', 'Move funds between wallets', null, () => { location.hash = '#/deposit'; }),
      ]),
      group('Support & Info', [
        row('help', 'gold', 'FAQs', 'Common questions', null, openFaq),
        row('info', 'blue', 'About', 'Riamxo Motors Limited', null, openAbout),
      ]),
      group('Preferences', [
        row('moon', 'gold', 'Dark Mode', 'Easier on the eyes', buildDarkToggle()),
      ]),
      group('Session', [
        row('logout', 'red', 'Log Out', 'End this session', null, onLogout),
      ]));

    if (user.role === 'admin') {
      page.append(group('Administration', [
        row('shield', 'gold', 'Admin Panel', 'Approve withdrawals & activations', null, () => { location.hash = '#/admin'; }),
      ]));
    }

    function buildDarkToggle() {
      const dark = () => !document.documentElement.classList.contains('light');
      const sw = h('span', { class: `switch${dark() ? ' on' : ''}` });
      sw.addEventListener('click', (e) => {
        e.stopPropagation();
        document.documentElement.classList.toggle('light');
        localStorage.setItem('riamxo_theme', dark() ? 'dark' : 'light');
        sw.classList.toggle('on', dark());
      });
      return sw;
    }

    function openEmailPanel() {
      const body = h('div', {},
        h('p', { style: { color: 'var(--muted)', fontSize: '0.86rem', marginBottom: '16px' } },
          'We will send a confirmation email to ', h('b', {}, user.email), ' with your current preferences.'),
        h('button', {
          class: 'btn btn-gold btn-block',
          onclick: async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = 'Sending…';
            await new Promise((r) => setTimeout(r, 700));
            toast(`Confirmation sent to ${user.email}`);
            closeOverlays();
          },
        }, 'Send Test Email'));
      openModal('Email Notifications', body);
    }

    function openFaq() {
      const faqs = [
        ['How much do I earn per view?', 'KES 100 for every verified view of the sponsor ad on your WhatsApp status.'],
        ['When can I withdraw?', 'Any time your available balance is at least KES 100. Requests are approved by our admin team, usually within 24 hours.'],
        ['How do I activate my account?', 'Pay your package fee to our M-Pesa paybill (0104074325) and submit the transaction code on the Deposit page.'],
        ['Why is there a 24-hour rule on submissions?', 'Each ad must stay on your status for 24 hours, so view counts can only be submitted once per day.'],
      ];
      openModal('FAQs', h('div', {}, faqs.map(([q, a]) =>
        h('div', { style: { marginBottom: '16px' } },
          h('b', { style: { fontSize: '0.92rem' } }, q),
          h('p', { style: { color: 'var(--muted)', fontSize: '0.84rem', marginTop: '4px' } }, a)))));
    }

    function openAbout() {
      openModal('About', h('div', {},
        h('div', { style: { display: 'flex', justifyContent: 'center', marginBottom: '14px' } },
          h('span', { class: 'brand-mark', style: { width: '54px', height: '54px', fontSize: '1.5rem', borderRadius: '16px' } }, 'R')),
        h('p', { style: { color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center' } },
          'Riamxo Motors Limited — Kenya’s status-to-cash advertising network. Post sponsor ads, earn KES 100 per view, withdraw to M-Pesa.'),
        h('p', { style: { color: 'var(--muted)', fontSize: '0.76rem', textAlign: 'center', marginTop: '10px' } },
          'Version 1.0.0 · Nairobi, Kenya')));
    }

    return page;
  }

  function openProfileEditor(user, onAuthChange) {
    const phone = h('input', { class: 'input', id: 'pe-phone', value: user.phone || '', placeholder: '07XX XXX XXX' });
    const bio = h('textarea', { class: 'input', id: 'pe-bio', placeholder: 'Tell us a little about yourself' }, user.bio || '');
    const saveBtn = h('button', {
      class: 'btn btn-gold btn-block',
      onclick: async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.textContent = 'Saving…';
        try {
          const res = await API.put('/api/auth/me', { phone: phone.value.trim(), bio: bio.value.trim() });
          toast('Profile saved');
          closeOverlays();
          onAuthChange && onAuthChange(res.user);
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false;
          btn.textContent = 'Save Changes';
        }
      },
    }, 'Save Changes');

    const content = h('div', {},
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' } },
        h('div', { class: 'avatar', style: { width: '54px', height: '54px', fontSize: '1.2rem' } }, (user.full_name || '?')[0].toUpperCase()),
        h('div', {},
          h('b', {}, user.full_name),
          h('div', { style: { color: 'var(--muted)', fontSize: '0.8rem' } }, user.email))),
      h('div', { class: 'field' }, h('label', {}, 'Full name'), h('input', { class: 'input', value: user.full_name, readonly: true, style: { opacity: 0.6 } })),
      h('div', { class: 'field' }, h('label', {}, 'Phone number'), phone),
      h('div', { class: 'field' }, h('label', {}, 'Bio'), bio),
      saveBtn);
    openSheet('Edit Profile', content);
  }

  /* ================= ADMIN ================= */
  function admin() {
    const page = h('div', { class: 'page page-pad' },
      h('h1', { class: 'page-title' }, 'Admin Panel'),
      h('p', { class: 'page-sub' }, 'Approve or reject pending withdrawal and activation requests.'),
      h('div', { id: 'ad-body', style: { marginTop: '18px' } }, h('div', { class: 'spinner' })));

    function load() {
      const body = page.querySelector('#ad-body');
      body.innerHTML = '';
      body.append(h('div', { class: 'spinner' }));
      API.get('/api/admin/pending').then(({ withdrawals, deposits }) => {
        body.innerHTML = '';

        body.append(
          h('div', { class: 'panel' },
            h('h3', {}, `Pending withdrawals`, h('small', {}, `${withdrawals.length} waiting`)),
            withdrawals.length === 0
              ? h('p', { style: { color: 'var(--muted)', fontSize: '0.85rem' } }, 'No pending withdrawals. All caught up.')
              : withdrawals.map((w) => h('div', { class: 'admin-item' },
                  h('div', {},
                    h('b', {}, fmtKES(w.amount), ' — ', w.method),
                    h('small', {}, `${w.user ? w.user.full_name : 'Unknown'} · ${w.phone_number} · ${timeAgo(w.created_at)}${w.notes ? ' · "' + w.notes + '"' : ''}`)),
                  h('div', { class: 'a-actions' },
                    h('button', { class: 'a-btn ok', onclick: () => act('withdrawals', w.id, 'approve') }, 'Approve'),
                    h('button', { class: 'a-btn no', onclick: () => act('withdrawals', w.id, 'reject') }, 'Reject'))))),
          h('div', { class: 'panel', style: { marginTop: '16px' } },
            h('h3', {}, 'Pending activation requests', h('small', {}, `${deposits.length} waiting`)),
            deposits.length === 0
              ? h('p', { style: { color: 'var(--muted)', fontSize: '0.85rem' } }, 'No pending activations.')
              : deposits.map((d) => h('div', { class: 'admin-item' },
                  h('div', {},
                    h('b', {}, d.transaction_code),
                    h('small', {}, `${d.user ? d.user.full_name : 'Unknown'} · ${d.amount ? fmtKES(d.amount) : 'amount unlisted'} · ${timeAgo(d.created_at)}`)),
                  h('div', { class: 'a-actions' },
                    h('button', { class: 'a-btn ok', onclick: () => act('deposits', d.id, 'approve') }, 'Approve'),
                    h('button', { class: 'a-btn no', onclick: () => act('deposits', d.id, 'reject') }, 'Reject'))))));
      }).catch((e) => {
        body.innerHTML = '';
        body.append(emptyState('shield', e.message, 'Admin access only.'));
      });
    }

    async function act(kind, id, action) {
      try {
        await API.post(`/api/admin/${kind}/${id}/${action}`);
        toast(`${kind === 'withdrawals' ? 'Withdrawal' : 'Activation'} ${action}d.`);
        load();
      } catch (e) {
        toast(e.message, 'error');
      }
    }

    load();
    return page;
  }

  /* ================= 404 ================= */
  function notFound() {
    return h('div', { class: 'page notfound' },
      h('div', {},
        h('div', { class: 'code' }, '404'),
        h('p', {}, 'This page flew away like the Aviator plane.'),
        h('a', { class: 'btn btn-gold', href: '#/' }, 'Back to Home')));
  }

  function emptyState(ic, title, sub) {
    return h('div', { class: 'empty-state' },
      h('div', { class: 'es-ic' }, icon(ic, 26)),
      h('b', {}, title),
      sub ? h('p', {}, sub) : null);
  }

  return { landing, auth, home, dashboard, withdraw, deposit, settings, admin, notFound };
})();
