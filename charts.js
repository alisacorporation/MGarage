/**
 * MGarage — charts.js
 * Lightweight canvas chart rendering. No dependencies.
 */

function setupCanvasHiDPI(canvas, cssHeight, fixedWidth = null) {
  const dpr = window.devicePixelRatio || 1;
  let cssWidth;
  if (fixedWidth) {
    cssWidth = fixedWidth;
  } else {
    const parent = canvas.parentElement;
    const parentStyle = window.getComputedStyle(parent);
    const paddingLeft = parseFloat(parentStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(parentStyle.paddingRight) || 0;
    cssWidth = parent.clientWidth - paddingLeft - paddingRight;
  }
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, width: cssWidth, height: cssHeight };
}

function drawBarChart(canvas, labels, values, opts = {}) {
  const {
    color = '#81C4FF',
    colorDim = 'rgba(129,196,255,0.18)',
    height = 180,
    valueFormatter = (v) => Math.round(v).toString(),
  } = opts;

  const { ctx, width } = setupCanvasHiDPI(canvas, height);
  ctx.clearRect(0, 0, width, height);

  const padTop = 26;
  const padBottom = 26;
  const chartH = height - padTop - padBottom;
  const max = Math.max(...values, 1);
  const n = values.length;
  const gap = 10;
  const barW = (width - gap * (n + 1)) / n;

  ctx.font = '600 11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';

  values.forEach((v, i) => {
    const barH = Math.max((v / max) * chartH, v > 0 ? 4 : 0);
    const x = gap + i * (barW + gap);
    const y = padTop + (chartH - barH);

    const grad = ctx.createLinearGradient(0, y, 0, y + barH);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(22,88,142,0.5)');

    ctx.fillStyle = colorDim;
    roundRect(ctx, x, padTop, barW, chartH, 6);
    ctx.fill();

    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, barH, 6);
    ctx.fill();

    if (v > 0) {
      ctx.fillStyle = '#F5F7FA';
      ctx.fillText(valueFormatter(v), x + barW / 2, y - 8);
    }

    ctx.fillStyle = '#5C6779';
    ctx.fillText(labels[i], x + barW / 2, height - 6);
  });
}

function drawLineChart(canvas, labels, values, opts = {}) {
  const { color = '#81C4FF', height = 180 } = opts;
  const { ctx, width } = setupCanvasHiDPI(canvas, height);
  ctx.clearRect(0, 0, width, height);

  const padTop = 20;
  const padBottom = 24;
  const padX = 10;
  const chartH = height - padTop - padBottom;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const n = values.length;
  const stepX = n > 1 ? (width - padX * 2) / (n - 1) : 0;

  const points = values.map((v, i) => ({
    x: padX + i * stepX,
    y: padTop + chartH - ((v - min) / range) * chartH,
  }));

  // area fill
  ctx.beginPath();
  ctx.moveTo(points[0].x, padTop + chartH);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, padTop + chartH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
  grad.addColorStop(0, 'rgba(129,196,255,0.28)');
  grad.addColorStop(1, 'rgba(129,196,255,0.0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // line
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // dots
  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#0E1116';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
  });

  // labels
  ctx.font = '600 10.5px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#5C6779';
  ctx.textAlign = 'center';
  const labelStep = Math.max(1, Math.floor(n / 6));
  labels.forEach((l, i) => {
    if (i % labelStep === 0 || i === n - 1) {
      ctx.fillText(l, points[i].x, height - 6);
    }
  });
}

function drawDonutChart(canvas, segments, opts = {}) {
  // segments: [{ label, value, color }]
  const { height = 200, width: fixedWidth = height } = opts;
  const { ctx, width } = setupCanvasHiDPI(canvas, height, fixedWidth);
  ctx.clearRect(0, 0, width, height);

  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 10;
  const inner = radius * 0.62;

  let start = -Math.PI / 2;
  segments.forEach((seg) => {
    const angle = (seg.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, start + angle);
    ctx.arc(cx, cy, inner, start + angle, start, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    start += angle;
  });

  ctx.fillStyle = '#F5F7FA';
  ctx.font = '700 20px Rajdhani, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(segments.length.toString(), cx, cy - 6);
  ctx.font = '600 9.5px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#93A0B4';
  ctx.fillText('МАРОК', cx, cy + 12);
}

function roundRect(ctx, x, y, w, h, r) {
  if (h <= 0) return;
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

window.Charts = { drawBarChart, drawLineChart, drawDonutChart };
