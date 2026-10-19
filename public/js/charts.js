/* Lightweight canvas charts — no dependencies. */

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, w: rect.width, h: rect.height };
}

const moneyShort = (v) =>
  v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${Math.round(v)}`;

/* 7-day stacked area chart: series = [{key,label,color}] over rows with numeric fields */
function renderStackedArea(canvas, rows, series) {
  const { ctx, w, h } = setupCanvas(canvas);
  const pad = { l: 42, r: 10, t: 12, b: 26 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const totals = rows.map((r) => series.reduce((s, x) => s + (r[x.key] || 0), 0));
  const max = Math.max(100, ...totals) * 1.15;

  ctx.clearRect(0, 0, w, h);
  ctx.font = '10px Inter, sans-serif';

  // gridlines
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + ih - (ih * i) / 4;
    ctx.strokeStyle = 'rgba(148,168,200,0.1)';
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(139,155,180,0.8)';
    ctx.textAlign = 'right';
    ctx.fillText(moneyShort((max * i) / 4), pad.l - 7, y + 3);
  }

  const xFor = (i) => pad.l + (iw * (i + 0.5)) / rows.length;

  // stacked areas (draw back-to-front)
  const layers = series.map(() => rows.map(() => 0));
  let acc = rows.map(() => 0);
  series.forEach((s, si) => {
    rows.forEach((r, i) => {
      layers[si][i] = { lo: acc[i], hi: acc[i] + (r[s.key] || 0) };
      acc[i] += r[s.key] || 0;
    });
  });

  [...series.keys()].reverse().forEach((si) => {
    const s = series[si];
    ctx.beginPath();
    rows.forEach((_, i) => {
      const x = xFor(i);
      const y = pad.t + ih - (layers[si][i].hi / max) * ih;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    for (let i = rows.length - 1; i >= 0; i--) {
      const x = xFor(i);
      const y = pad.t + ih - (layers[si][i].lo / max) * ih;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // x labels
  ctx.fillStyle = 'rgba(139,155,180,0.9)';
  ctx.textAlign = 'center';
  rows.forEach((r, i) => ctx.fillText(r.label, xFor(i), h - 8));

  // tooltip interaction
  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let idx = 0;
    let best = Infinity;
    rows.forEach((_, i) => {
      const d = Math.abs(xFor(i) - mx);
      if (d < best) { best = d; idx = i; }
    });
    renderStackedArea(canvas, rows, series);
    const x = xFor(idx);
    const tt = { x, row: rows[idx] };
    drawTooltip(canvas, ctx, w, h, pad, tt, series, max);
  };
  canvas.onmouseleave = () => renderStackedArea(canvas, rows, series);
}

function drawTooltip(canvas, ctx, w, h, pad, tt, series, max) {
  const { x, row } = tt;
  ctx.strokeStyle = 'rgba(212,160,23,0.6)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x, pad.t);
  ctx.lineTo(x, h - pad.b);
  ctx.stroke();
  ctx.setLineDash([]);

  const lines = series.map((s) => ({ label: s.label, color: s.color, val: row[s.key] || 0 }));
  const title = new Date(row.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
  const bw = 148;
  const bh = 26 + lines.length * 17;
  let bx = x + 12;
  if (bx + bw > w - 4) bx = x - bw - 12;
  ctx.fillStyle = 'rgba(10,22,40,0.95)';
  ctx.strokeStyle = 'rgba(148,168,200,0.3)';
  ctx.beginPath();
  ctx.roundRect(bx, pad.t + 4, bw, bh, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f4f6fb';
  ctx.textAlign = 'left';
  ctx.font = '700 10px Inter, sans-serif';
  ctx.fillText(title, bx + 11, pad.t + 20);
  ctx.font = '10px Inter, sans-serif';
  lines.forEach((l, i) => {
    const y = pad.t + 37 + i * 17;
    ctx.fillStyle = l.color;
    ctx.fillRect(bx + 11, y - 7, 8, 8);
    ctx.fillStyle = '#c4d0e3';
    ctx.fillText(`${l.label}  KES ${l.val.toLocaleString()}`, bx + 25, y);
  });
}

/* horizontal status bars */
function renderStatusBars(canvas, totals) {
  const { ctx, w, h } = setupCanvas(canvas);
  const entries = [
    { label: 'Approved', key: 'approved', color: '#22c55e' },
    { label: 'Pending', key: 'pending', color: '#d4a017' },
    { label: 'Rejected', key: 'rejected', color: '#ef4444' },
  ];
  const max = Math.max(100, ...entries.map((e) => totals[e.key] || 0));
  const barH = 16;
  const gap = (h - entries.length * barH) / (entries.length + 1);

  ctx.clearRect(0, 0, w, h);
  ctx.font = '10.5px Inter, sans-serif';
  entries.forEach((e, i) => {
    const y = gap + i * (barH + gap);
    const val = totals[e.key] || 0;
    const bw = Math.max(6, ((w - 120) * val) / max);
    ctx.fillStyle = 'rgba(148,168,200,0.12)';
    ctx.beginPath();
    ctx.roundRect(74, y, w - 74 - 70, barH, 8);
    ctx.fill();
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.roundRect(74, y, bw, barH, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(196,208,227,0.95)';
    ctx.textAlign = 'left';
    ctx.fillText(e.label, 0, y + barH - 4);
    ctx.textAlign = 'right';
    ctx.fillText(`KES ${val.toLocaleString()}`, w, y + barH - 4);
  });
}

window.Charts = { renderStackedArea, renderStatusBars };
