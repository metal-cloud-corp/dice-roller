import * as THREE from 'three';

export function makeFaceTexture(num: number, bg: string, fg = '#fff'): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = fg;
  ctx.font = 'bold 140px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = String(num);
  ctx.fillText(label, size / 2, size / 2 + 4);
  // underline for 6/9
  if (num === 6 || num === 9) {
    ctx.fillRect(size / 2 - 40, size / 2 + 60, 80, 6);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}
