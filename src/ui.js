const FONT_STACK = '"GameFont", "Helvetica Neue", Arial, sans-serif';

export function drawText(ctx, text, x, y, { size = 20, color = "#fff", align = "center", weight = "bold" } = {}) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawTextOutlined(ctx, text, x, y, opts = {}) {
  const { size = 20, color = "#fff", strokeColor = "#000", strokeWidth = 4, align = "center", weight = "bold" } = opts;
  ctx.save();
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = strokeColor;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawStar(ctx, cx, cy, outerR, innerR, points, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawRoundedPanel(ctx, x, y, w, h, radius, fillStyle, strokeStyle, lineWidth) {
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius);
  else ctx.rect(x, y, w, h);
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth || 2;
    ctx.stroke();
  }
  ctx.restore();
}
