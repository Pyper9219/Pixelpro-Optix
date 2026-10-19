/* Aviator crash game — cockpit layout. Fully client-side simulation, no real money. */

window.Aviator = (() => {
  const NAMES = ['Brian', 'Kevin', 'Mercy', 'Faith', 'Dennis', 'Cynthia', 'Kelvin', 'Sharon', 'Collins', 'Esther', 'Victor', 'Nancy', 'Erick', 'Alice', 'Amos', 'Grace', 'Samuel', 'Linda', 'Peter', 'Jane', 'Wanjiru', 'Kamau', 'Achieng', 'Mutua'];

  const PLANE_SVG = `<svg class="av-plane-svg" viewBox="0 0 180 60" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M 12 36 L 50 36 L 68 28 L 138 28 L 148 20 L 158 20 L 152 28 L 160 30 L 160 33 L 140 37 L 70 38 L 45 46 L 15 48 Z"></path>
    <path d="M 65 28 L 85 8 L 120 18 L 82 28 Z" fill="#b3092b"></path>
    <ellipse cx="162" cy="31" fill="#e5133c" rx="3.5" ry="18"></ellipse>
    <circle cx="162" cy="31" fill="#fff" r="2.5"></circle>
  </svg>`;

  function randomCrashPoint() {
    // biased toward low multipliers, clamped to [1.1, 15]
    return 1.1 + Math.pow(Math.random(), 2.2) * 13.9;
  }

  function fmtNum(n) {
    return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function pillClass(v) {
    if (v < 2) return 'av-hpill-blue';
    if (v < 10) return 'av-hpill-purple';
    if (v < 50) return 'av-hpill-yellow';
    return 'av-hpill-red';
  }

  function hex4() {
    return Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  }

  function mount(root) {
    const round2 = (v) => Math.round(v * 100) / 100;
    const randomName = () => NAMES[Math.floor(Math.random() * NAMES.length)];
    const clampBet = (v) => {
      if (!Number.isFinite(v) || v < 10) return 10;
      return Math.min(100000, Math.round(v));
    };

    let phase = 'waiting';
    let multiplier = 1;
    let crashPoint = randomCrashPoint();
    let flyStart = 0;
    let phaseTimer = null;
    let raf = null;
    let progress = 0;
    let history = seedHistory();
    let feed = [];
    let destroyed = false;
    let roundNo = 849200 + Math.floor(Math.random() * 700);
    let fairHash = `${hex4()}..${hex4()}`;

    /* ---------- DOM ---------- */
    const canvas = h('canvas');
    const overlayVal = h('div', { class: 'val waiting' }, `ROUND #${roundNo}`);
    const overlayCap = h('div', { class: 'cap neutral' }, 'PLACE YOUR BETS');
    const roundChipLabel = h('span', {}, `ROUND #${roundNo}`);
    const superChip = h('span', { class: 'super-chip hidden' }, 'SUPER MULTIPLIER');
    const historyBar = h('div', { class: 'av-history' }, h('span', { class: 'av-history-label' }, 'History'));
    const fairHashEl = h('span', {}, `SHA-256 Fair: ${fairHash}`);
    const feedList = h('div', { class: 'cf-list' });

    const marqueeGroup = h('div', { class: 'av-marquee-group' },
      Array.from({ length: 4 }, () => { const d = document.createElement('div'); d.innerHTML = PLANE_SVG; return d.firstChild; }));

    const panels = [makePanel('#B1-KES'), makePanel('#B2-KES')];

    const el = h('div', { class: 'page aviator-page' },
      h('div', { class: 'av-header' },
        h('div', { class: 'av-header-row' },
          h('div', { class: 'av-brand' }, h('span', { class: 'ping' }), h('b', {}, 'AVIATOR')),
          h('span', { class: 'av-live' }, 'RIAMXO LIVE')),
        h('div', { class: 'av-marquee' },
          h('div', { class: 'av-marquee-track' }, marqueeGroup, marqueeGroup.cloneNode(true)))),
      historyBar,
      h('div', { class: 'aviator-stage' },
        h('div', { class: 'sunburst-bg' }),
        h('div', { class: 'stage-badges' },
          h('span', { class: 'round-chip' }, h('span', { class: 'dot' }), roundChipLabel),
          superChip),
        canvas,
        h('div', { class: 'mult-overlay' }, overlayVal, overlayCap),
        h('div', { class: 'axis-y' }, Array.from({ length: 6 }, () => h('i'))),
        h('div', { class: 'axis-x' }, Array.from({ length: 7 }, () => h('i')))),
      h('div', { class: 'bet-consoles' }, panels.map((p) => p.el)),
      h('div', { class: 'fair-strip' },
        h('div', { class: 'fair-left' }, h('span', { class: 'dot' }), fairHashEl),
        h('span', { class: 'fair-right' }, '18+ Play Responsibly · Demo')),
      h('div', { class: 'cashout-feed' },
        h('h4', {}, h('span', { class: 'dot' }), 'LIVE CASHOUTS'),
        feedList));

    root.append(el);
    renderHistory();
    for (let i = 0; i < 6; i++) pushFeed(randomName(), (10 + Math.random() * 900) * (1 + Math.random() * 2));

    function seedHistory() {
      const arr = [];
      for (let i = 0; i < 14; i++) arr.push(round2(1.1 + Math.pow(Math.random(), 2.2) * 13.9));
      return arr;
    }

    /* ---------- history bar ---------- */
    function renderHistory() {
      historyBar.innerHTML = '';
      historyBar.append(h('span', { class: 'av-history-label' }, 'History'));
      if (phase === 'flying') historyBar.append(h('span', { class: 'av-hpill av-hpill-active' }, 'ACTIVE'));
      history.slice(-12).reverse().forEach((v) =>
        historyBar.append(h('span', { class: `av-hpill ${pillClass(v)}` }, `${v.toFixed(2)}x`)));
    }

    /* ---------- feed ---------- */
    function pushFeed(name, amount, mult) {
      feed.unshift({ name, amount: round2(amount), mult: mult ? round2(mult) : null });
      feed = feed.slice(0, 30);
      feedList.innerHTML = '';
      feed.forEach((f) => feedList.append(
        h('div', { class: 'cf-item' },
          h('span', { class: 'cf-dot' }),
          h('span', { class: 'cf-name' }, f.name),
          f.mult ? h('span', { class: 'cf-mult' }, `cashed out @ ${f.mult}x`) : null,
          h('b', {}, `+${fmtKES(f.amount)}`))));
    }

    /* ---------- bet consoles ---------- */
    function makePanel(idLabel) {
      const state = { bet: 100, auto: '', autoBet: false, armed: false, live: false, cashedOut: false, win: 0, cashedMult: 0, tab: 'bet' };
      const el = h('div', { class: 'bet-panel' });
      let btn = null;

      function build() {
        el.innerHTML = '';
        el.classList.toggle('won', state.cashedOut);

        // top bar with tabs
        const tabBet = h('button', { class: state.tab === 'bet' ? 'on' : '', onclick: () => { state.tab = 'bet'; build(); } }, 'Bet');
        const tabAuto = h('button', { class: state.tab === 'auto' ? 'on' : '', onclick: () => { state.tab = 'auto'; build(); } }, 'Auto');
        if (state.cashedOut) el.append(h('div', { class: 'won-banner' }, `WON @ ${state.cashedMult}x`));
        el.append(
          h('div', { class: 'bp-topbar' },
            h('div', { class: 'bp-tabs' }, tabBet, tabAuto),
            h('span', { class: 'bp-id' }, idLabel)));

        if (state.cashedOut) {
          el.append(h('div', { class: 'bp-grid' },
            h('div', { class: 'bp-left' },
              h('div', { style: { fontSize: '0.6rem', color: '#71717a', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' } }, 'Locked Bet'),
              h('div', { style: { color: '#fff', fontFamily: 'ui-monospace, Consolas, monospace', fontWeight: '700', fontSize: '0.88rem' } }, fmtKES(state.bet)),
              h('div', { class: 'credited' }, h('span', { class: 'dot' }), 'Instant Payout Credited')),
            h('div', { class: 'cashed-box' },
              h('span', { class: 'cb-sm' }, 'CASHED OUT'),
              h('span', { class: 'cb-lg' }, fmtKES(state.win)))));
          btn = null;
          return;
        }

        if (state.tab === 'auto') {
          const autoInput = h('input', { type: 'text', inputmode: 'decimal', placeholder: '2.00', value: state.auto || '' });
          autoInput.addEventListener('input', () => {
            const v = parseFloat(autoInput.value);
            state.auto = Number.isFinite(v) && v > 1 ? v : '';
          });
          const autoSw = h('span', { class: `switch${state.autoBet ? ' on' : ''}` });
          autoSw.addEventListener('click', () => {
            state.autoBet = !state.autoBet;
            if (state.autoBet && phase === 'waiting') state.armed = true;
            autoSw.classList.toggle('on', state.autoBet);
            syncBtn();
          });
          el.append(
            h('div', { class: 'bp-grid' },
              h('div', { class: 'auto-body' },
                h('div', { class: 'auto-field' }, h('label', {}, 'Auto cashout at'), autoInput),
                h('div', { class: 'auto-toggle' }, h('b', {}, 'Auto Bet'), autoSw))),
            (btn = h('button', { class: 'bet-btn bet', onclick: onBtn })));
          btn.append(h('span', { class: 'bb-sm' }), h('span', { class: 'bb-lg' }), h('span', { class: 'bb-xs' }));
        } else {
          const betInput = h('input', { type: 'text', inputmode: 'numeric', value: fmtNum(state.bet) });
          betInput.addEventListener('input', () => {
            const raw = betInput.value.replace(/[^0-9]/g, '');
            state.bet = clampBet(parseInt(raw || '0', 10));
          });
          betInput.addEventListener('blur', () => { betInput.value = fmtNum(state.bet); });
          el.append(
            h('div', { class: 'bp-grid' },
              h('div', { class: 'bp-left' },
                h('div', { class: 'stepper' },
                  h('button', { onclick: () => { state.bet = clampBet(state.bet - 10); betInput.value = fmtNum(state.bet); syncBtn(); } }, '−'),
                  betInput,
                  h('button', { onclick: () => { state.bet = clampBet(state.bet + 10); betInput.value = fmtNum(state.bet); syncBtn(); } }, '+')),
                h('div', { class: 'quick-presets' },
                  [100, 500, 1000, 3000].map((v) => h('button', { onclick: () => { state.bet = v; betInput.value = fmtNum(v); syncBtn(); } }, v >= 1000 ? `${v / 1000}k` : v)))),
              (btn = h('button', { class: 'bet-btn bet', onclick: onBtn }))));
          btn.append(h('span', { class: 'bb-sm' }), h('span', { class: 'bb-lg' }), h('span', { class: 'bb-xs' }));
        }
        syncBtn();
      }

      function onBtn() {
        if (phase === 'waiting') {
          state.armed = !state.armed;
          if (!state.armed) state.autoBet = false;
          syncBtn();
        } else if (phase === 'flying' && state.live && !state.cashedOut) {
          cashOut(state);
        }
      }

      function cashOut(st) {
        st.cashedOut = true;
        st.cashedMult = round2(multiplier);
        st.win = round2(st.bet * multiplier);
        pushFeed('You', st.win, multiplier);
        build();
      }

      function syncBtn() {
        if (!btn) return;
        const [sm, lg, xs] = btn.querySelectorAll('.bb-sm, .bb-lg, .bb-xs');
        btn.className = 'bet-btn';
        btn.disabled = false;
        if (phase === 'waiting') {
          if (state.armed || state.autoBet) {
            btn.classList.add('armed');
            sm.textContent = 'PLACED';
            lg.textContent = `KES ${fmtNum(state.bet)}`;
            xs.textContent = state.autoBet ? 'AUTO BET ON' : 'TAP TO CANCEL';
          } else {
            btn.classList.add('bet');
            sm.textContent = 'BET';
            lg.textContent = `KES ${fmtNum(state.bet)}`;
            xs.textContent = 'MIN 10';
          }
        } else if (phase === 'flying') {
          if (state.live && !state.cashedOut) {
            btn.classList.add('cashout');
            sm.textContent = 'CASH OUT';
            lg.textContent = fmtNum(Math.floor(state.bet * multiplier));
            xs.textContent = 'KES';
          } else {
            btn.classList.add('bet');
            btn.disabled = true;
            sm.textContent = 'BET';
            lg.textContent = `KES ${fmtNum(state.bet)}`;
            xs.textContent = 'NEXT ROUND';
          }
        } else {
          btn.classList.add(state.cashedOut ? 'armed' : 'lost');
          btn.disabled = true;
          sm.textContent = state.cashedOut ? 'WON' : 'FLEW AWAY';
          lg.textContent = state.cashedOut ? fmtKES(state.win) : `KES ${fmtNum(state.bet)}`;
          xs.textContent = state.cashedOut ? `@${state.cashedMult}x` : 'LOST';
        }
      }

      build();
      return { state, el, syncBtn, cashOut, rebuild: build };
    }

    /* ---------- round engine ---------- */
    function setWaiting() {
      phase = 'waiting';
      progress = 0;
      roundNo += 1;
      fairHash = `${hex4()}..${hex4()}`;
      fairHashEl.textContent = `SHA-256 Fair: ${fairHash}`;
      roundChipLabel.textContent = `ROUND #${roundNo}`;
      overlayVal.className = 'val waiting';
      overlayVal.textContent = `ROUND #${roundNo}`;
      overlayCap.className = 'cap neutral';
      overlayCap.textContent = 'PLACE YOUR BETS';
      panels.forEach((p) => {
        const st = p.state;
        st.live = false;
        st.cashedOut = false;
        st.win = 0;
        st.armed = st.autoBet;
        p.rebuild();
      });
      renderHistory();
      tickWaiting();
    }

    function tickWaiting() {
      if (destroyed || phase !== 'waiting') return;
      progress += 0.02;
      draw();
      if (progress >= 1) startFlying();
      else phaseTimer = setTimeout(tickWaiting, 60);
    }

    function startFlying() {
      phase = 'flying';
      multiplier = 1;
      flyStart = performance.now();
      panels.forEach((p) => {
        const st = p.state;
        st.live = st.armed || st.autoBet;
        st.cashedOut = false;
        st.win = 0;
        if (st.cashedOut || !st.live) p.rebuild(); else p.syncBtn();
      });
      renderHistory();
      scheduleFakeCashouts();
      raf = requestAnimationFrame(flyFrame);
    }

    function flyFrame(now) {
      if (destroyed || phase !== 'flying') return;
      const elapsed = (now - flyStart) / 1000;
      multiplier = Math.exp(0.22 * elapsed);
      if (multiplier >= crashPoint) {
        crash();
        return;
      }
      panels.forEach((p) => {
        const st = p.state;
        if (st.live && !st.cashedOut && st.auto && multiplier >= st.auto) p.cashOut(st);
      });
      const anyLive = panels.some((p) => p.state.live && !p.state.cashedOut);
      if (anyLive) panels.forEach((p) => p.syncBtn());
      overlayVal.className = 'val flying';
      overlayVal.textContent = `${multiplier.toFixed(2)}x`;
      if (multiplier >= 10) {
        overlayCap.className = 'cap gold';
        overlayCap.textContent = 'MEGA WIN CONFIRMED';
        superChip.classList.remove('hidden');
      } else {
        overlayCap.className = 'cap neutral';
        overlayCap.textContent = 'IN FLIGHT';
      }
      draw(now);
      raf = requestAnimationFrame(flyFrame);
    }

    function crash() {
      phase = 'crashed';
      multiplier = crashPoint;
      overlayVal.className = 'val crashed';
      overlayVal.textContent = `${crashPoint.toFixed(2)}x`;
      overlayCap.className = 'cap';
      overlayCap.textContent = 'FLEW AWAY!';
      superChip.classList.add('hidden');
      history.push(round2(crashPoint));
      panels.forEach((p) => (p.state.cashedOut ? null : p.syncBtn()));
      draw();
      phaseTimer = setTimeout(() => {
        if (destroyed) return;
        crashPoint = randomCrashPoint();
        setWaiting();
      }, 3200);
    }

    let fakeTimers = [];
    function scheduleFakeCashouts() {
      fakeTimers.forEach(clearTimeout);
      fakeTimers = [];
      const n = 3 + Math.floor(Math.random() * 6);
      for (let i = 0; i < n; i++) {
        const at = 600 + Math.random() * 5000;
        fakeTimers.push(setTimeout(() => {
          if (phase !== 'flying') return;
          const m = multiplier;
          if (m < crashPoint) pushFeed(randomName(), (10 + Math.random() * 1200) * m, m);
        }, at));
      }
    }

    /* ---------- canvas ---------- */
    function draw(now) {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth || canvas.parentElement.clientWidth;
      const ht = canvas.clientHeight || canvas.parentElement.clientHeight;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(ht * dpr); }
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, ht);

      if (phase === 'waiting') drawWaiting(ctx, w, ht);
      else drawFlight(ctx, w, ht, now);
    }

    function drawWaiting(ctx, w, ht) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(212,212,216,0.9)';
      ctx.font = '700 12px Inter, sans-serif';
      ctx.fillText('RIAMXO  |  SPRIBE', w / 2, ht / 2 - 40);
      ctx.fillStyle = 'rgba(229,19,60,0.9)';
      ctx.font = '800 10px Inter, sans-serif';
      ctx.fillText('OFFICIAL PARTNERS', w / 2, ht / 2 - 22);

      const bw = Math.min(300, w * 0.62);
      const bx = (w - bw) / 2;
      const by = ht / 2 + 8;
      ctx.fillStyle = 'rgba(63,63,70,0.5)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, 8, 4);
      ctx.fill();
      const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      grad.addColorStop(0, '#e5133c');
      grad.addColorStop(1, '#ff6200');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw * Math.min(progress, 1), 8, 4);
      ctx.fill();
    }

    function curvePoint(t, w, ht) {
      const startX = 26;
      const startY = ht - 30;
      const targetX = w * 0.78;
      const targetY = ht * 0.2;
      return {
        x: startX + (targetX - startX) * Math.pow(t, 0.95),
        y: startY - (startY - targetY) * Math.pow(t, 2.2),
      };
    }

    function drawFlight(ctx, w, ht, now) {
      const t = Math.min(1, Math.log(Math.max(multiplier, 1)) / Math.log(15));
      const tip = curvePoint(t, w, ht);
      const startX = 26;
      const baseline = ht - 30;
      const steps = 60;

      // solid crimson wedge with vertical cut to baseline
      ctx.beginPath();
      ctx.moveTo(startX, baseline);
      for (let i = 0; i <= steps; i++) {
        const pt = curvePoint((i / steps) * t, w, ht);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.lineTo(tip.x, baseline);
      ctx.closePath();
      ctx.fillStyle = 'rgba(179,9,43,0.9)';
      ctx.fill();

      // glowing trajectory stroke
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const pt = curvePoint((i / steps) * t, w, ht);
        i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = '#e5133c';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(229,19,60,0.8)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (phase === 'crashed') {
        ctx.strokeStyle = 'rgba(248,113,113,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 14 + (Date.now() % 900) / 26, 0, Math.PI * 2);
        ctx.stroke();
      }

      // tangent pitch
      const next = curvePoint(Math.min(t + 0.012, 1), w, ht);
      const angle = Math.atan2(next.y - tip.y, next.x - tip.x) * 0.45;
      const bob = phase === 'flying' ? Math.sin((now || Date.now()) / 190) * 2.5 : 0;
      ctx.save();
      ctx.translate(tip.x, tip.y - 8 + bob);
      ctx.rotate(angle);
      drawStuntPlane(ctx, phase === 'crashed' ? 0.55 : 1, now || Date.now());
      ctx.restore();
    }

    function drawStuntPlane(ctx, alpha, timestamp) {
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.scale(0.58, 0.58);
      ctx.shadowColor = '#ff1144';
      ctx.shadowBlur = 18;

      // fuselage + cockpit
      ctx.fillStyle = '#e5133c';
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-60, 10);
      ctx.lineTo(-20, 10);
      ctx.lineTo(2, 2);
      ctx.lineTo(65, 2);
      ctx.lineTo(76, -8);
      ctx.lineTo(84, -8);
      ctx.lineTo(80, 2);
      ctx.lineTo(86, 4);
      ctx.lineTo(86, 7);
      ctx.lineTo(68, 12);
      ctx.lineTo(-10, 13);
      ctx.lineTo(-35, 22);
      ctx.lineTo(-58, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // upper angled wing
      ctx.fillStyle = '#b50c2e';
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(22, -22);
      ctx.lineTo(58, -12);
      ctx.lineTo(16, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // tail fin
      ctx.fillStyle = '#e5133c';
      ctx.beginPath();
      ctx.moveTo(-50, 10);
      ctx.lineTo(-65, -8);
      ctx.lineTo(-52, -8);
      ctx.lineTo(-38, 10);
      ctx.closePath();
      ctx.fill();

      // propeller hub
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(88, 5, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // spinning propeller
      ctx.save();
      ctx.translate(88, 5);
      ctx.rotate((timestamp * 0.04) % (Math.PI * 2));
      ctx.fillStyle = '#ff2b58';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    /* ---------- lifecycle ---------- */
    setWaiting();
    const onResize = () => draw();
    window.addEventListener('resize', onResize);

    return {
      destroy() {
        destroyed = true;
        clearTimeout(phaseTimer);
        fakeTimers.forEach(clearTimeout);
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
      },
    };
  }

  return { mount };
})();
