import type { Badge } from './api';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function coverDraw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const ratio = Math.max(w / img.width, h / img.height);
  const nw = img.width * ratio;
  const nh = img.height * ratio;
  const x = (w - nw) / 2;
  const y = (h - nh) / 2;
  ctx.drawImage(img, x, y, nw, nh);
}

export async function generateBadgeShareImage(opts: {
  photoSrc: string;
  userName: string;
  badge: Badge;
}): Promise<string> {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const { photoSrc, userName, badge } = opts;
  const emoji = badge.emoji || '🏆';
  const color = badge.color || '#0d4429';

  const img = await loadImage(photoSrc);
  coverDraw(ctx, img, W, H);

  const grad = ctx.createLinearGradient(0, H * 0.45, 0, H);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.55, 'rgba(13,68,41,0.75)');
  grad.addColorStop(1, 'rgba(13,68,41,0.95)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.62, 72, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.font = '72px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, W / 2, H * 0.62);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(badge.name, W / 2, H * 0.76);

  ctx.font = '28px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(badge.desc, W / 2, H * 0.82, W - 80);

  ctx.font = 'bold 36px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#d8f3dc';
  ctx.fillText(userName, W / 2, H * 0.9);

  ctx.font = '22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('Shubham Sunny DSA Sheet', W / 2, H * 0.955);

  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function copyImageToClipboard(dataUrl: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}

export function getShareLink() {
  return typeof window !== 'undefined' ? window.location.origin : 'https://sheetstack.app';
}

export function getShareText(userName: string, badge: Badge) {
  return `${userName} earned the ${badge.emoji || ''} ${badge.name} badge on Shubham Sunny DSA Sheet! ${badge.desc}\n${getShareLink()}`;
}
